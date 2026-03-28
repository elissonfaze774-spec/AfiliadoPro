import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function ensureUrl(value: string) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function cleanText(value: unknown) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .trim()
}

function decodeHtmlEntities(value: string) {
  return String(value ?? '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function stripHtml(value: string) {
  return cleanText(decodeHtmlEntities(String(value ?? '').replace(/<[^>]+>/g, ' ')))
}

function normalizePrice(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value

  const raw = String(value ?? '').trim()
  if (!raw) return 0

  const cleaned = raw.replace(/[^\d,.-]/g, '')
  if (!cleaned) return 0

  const hasComma = cleaned.includes(',')
  const hasDot = cleaned.includes('.')

  let normalized = cleaned

  if (hasComma && hasDot) {
    if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
      normalized = cleaned.replace(/\./g, '').replace(',', '.')
    } else {
      normalized = cleaned.replace(/,/g, '')
    }
  } else if (hasComma) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.')
  }

  const number = Number(normalized)
  return Number.isFinite(number) ? number : 0
}

function formatMoney(value: number) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((item) => cleanText(item)).filter(Boolean)))
}

function toAbsoluteUrl(value: string, baseUrl: string) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed || trimmed.startsWith('data:')) return ''

  try {
    return new URL(trimmed, baseUrl).toString()
  } catch {
    return ''
  }
}

function getHostLabel(url: string) {
  try {
    const host = new URL(url).hostname.replace(/^www\./i, '')
    const first = host.split('.')[0] ?? 'Loja'
    return first.charAt(0).toUpperCase() + first.slice(1)
  } catch {
    return 'Loja'
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function extractFirstMatch(html: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match?.[1]) {
      return cleanText(decodeHtmlEntities(match[1]))
    }
  }
  return ''
}

function extractTitle(html: string) {
  return extractFirstMatch(html, [/<title[^>]*>([\s\S]*?)<\/title>/i])
}

function extractMetaContent(html: string, keys: string[]) {
  for (const key of keys) {
    const escaped = escapeRegExp(key)

    const patterns = [
      new RegExp(
        `<meta[^>]+(?:property|name|itemprop)=["']${escaped}["'][^>]+content=["']([\\s\\S]*?)["'][^>]*>`,
        'i',
      ),
      new RegExp(
        `<meta[^>]+content=["']([\\s\\S]*?)["'][^>]+(?:property|name|itemprop)=["']${escaped}["'][^>]*>`,
        'i',
      ),
    ]

    const content = extractFirstMatch(html, patterns)
    if (content) return content
  }

  return ''
}

function tryParseJson(value: string): unknown {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function flattenJsonLd(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    return value.flatMap(flattenJsonLd)
  }

  if (isRecord(value)) {
    const current: Record<string, unknown>[] = [value]
    const graph = value['@graph']

    if (Array.isArray(graph)) {
      return [...current, ...graph.flatMap(flattenJsonLd)]
    }

    return current
  }

  return []
}

function isProductType(value: unknown) {
  if (!value) return false

  if (Array.isArray(value)) {
    return value.some(isProductType)
  }

  const type = String(value).toLowerCase()
  return type.includes('product')
}

function findProductJsonLd(html: string): Record<string, unknown> | null {
  const matches = [
    ...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi),
  ]

  for (const match of matches) {
    const parsed = tryParseJson(match[1] ?? '')
    const flattened = flattenJsonLd(parsed)

    for (const item of flattened) {
      if (isProductType(item['@type'])) {
        return item
      }
    }
  }

  return null
}

function getString(record: Record<string, unknown> | null, key: string) {
  if (!record) return ''

  const value = record[key]

  if (typeof value === 'string') return cleanText(decodeHtmlEntities(value))
  if (typeof value === 'number') return String(value)

  return ''
}

function getNestedRecord(
  record: Record<string, unknown> | null,
  key: string,
): Record<string, unknown> | null {
  if (!record) return null

  const value = record[key]

  if (isRecord(value)) return value

  if (Array.isArray(value)) {
    const firstRecord = value.find((item) => isRecord(item))
    return isRecord(firstRecord) ? firstRecord : null
  }

  return null
}

function extractImagesFromProduct(record: Record<string, unknown> | null) {
  if (!record) return []

  const value = record['image']
  const images: string[] = []

  if (typeof value === 'string') {
    images.push(value)
  } else if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === 'string') {
        images.push(item)
      } else if (isRecord(item)) {
        const url = getString(item, 'url')
        if (url) images.push(url)
      }
    }
  } else if (isRecord(value)) {
    const url = getString(value, 'url')
    if (url) images.push(url)
  }

  return uniqueStrings(images)
}

function extractPriceFromOffers(offers: unknown): number {
  if (!offers) return 0

  if (Array.isArray(offers)) {
    for (const item of offers) {
      const price = extractPriceFromOffers(item)
      if (price > 0) return price
    }
    return 0
  }

  if (!isRecord(offers)) return 0

  const directCandidates = [offers['price'], offers['lowPrice'], offers['highPrice']]

  for (const candidate of directCandidates) {
    const price = normalizePrice(candidate)
    if (price > 0) return price
  }

  const priceSpecification = offers['priceSpecification']

  if (Array.isArray(priceSpecification)) {
    for (const item of priceSpecification) {
      const price = extractPriceFromOffers(item)
      if (price > 0) return price
    }
  } else if (isRecord(priceSpecification)) {
    const price = extractPriceFromOffers(priceSpecification)
    if (price > 0) return price
  }

  return 0
}

function extractFallbackImagesFromHtml(html: string, baseUrl: string) {
  const matches = [...html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)]

  return uniqueStrings(
    matches
      .map((match) => toAbsoluteUrl(match[1] ?? '', baseUrl))
      .filter(Boolean),
  )
    .filter((item) => !/logo|icon|sprite|avatar|thumb/i.test(item))
    .slice(0, 8)
}

function extractFallbackPrice(html: string) {
  const patterns = [
    /"price"\s*:\s*"([^"]+)"/i,
    /"salePrice"\s*:\s*"([^"]+)"/i,
    /"price"\s*:\s*([0-9.,]+)/i,
    /R\$\s?([0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2})/i,
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match?.[1]) {
      const price = normalizePrice(match[1])
      if (price > 0) return price
    }
  }

  return 0
}

function sanitizeTitle(value: string, siteName?: string) {
  let title = cleanText(decodeHtmlEntities(value))

  if (!title) return ''

  const separators = [' | ', ' - ', ' — ', ' :: ']

  for (const separator of separators) {
    if (title.includes(separator)) {
      const parts = title
        .split(separator)
        .map((item) => cleanText(item))
        .filter(Boolean)

      if (parts.length > 0) {
        const candidate = parts.sort((a, b) => b.length - a.length)[0]
        if (candidate) {
          title = candidate
          break
        }
      }
    }
  }

  if (siteName) {
    const escaped = escapeRegExp(siteName)
    title = cleanText(title.replace(new RegExp(escaped, 'ig'), ''))
  }

  return title.replace(/\s{2,}/g, ' ').trim()
}

function buildCommercialName(rawName: string) {
  const base = sanitizeTitle(rawName)

  if (!base) return ''

  const words = base.split(' ').filter(Boolean)

  if (words.length <= 2) {
    return `${base} Premium`
  }

  return base
}

function buildGeneratedDescription(params: {
  productName: string
  rawDescription: string
  priceValue: number
}) {
  const { productName, rawDescription, priceValue } = params

  const cleanDescription = stripHtml(rawDescription)
  const firstSentence =
    cleanDescription
      .split(/(?<=[.!?])\s+/)
      .map((item) => cleanText(item))
      .filter(Boolean)[0] ?? ''

  const intro = `Conheça o ${productName}, uma opção com forte potencial de conversão para vitrine e divulgação.`
  const benefit = firstSentence
    ? firstSentence
    : 'Ideal para destacar benefícios, despertar interesse e aumentar cliques na oferta.'
  const valueText =
    priceValue > 0
      ? `Faixa de valor identificada: ${formatMoney(priceValue)}.`
      : 'Preço sujeito à variação conforme a plataforma de origem.'

  return cleanText(`${intro} ${benefit} ${valueText}`)
}

function buildShortCopy(productName: string) {
  return cleanText(
    `${productName} com apresentação forte, visual atrativo e ótima proposta para chamar atenção rápida.`,
  )
}

function buildCta(productName: string) {
  return cleanText(`Clique agora e confira a oferta de ${productName}.`)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const anonKey =
      Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json(
        {
          success: false,
          message:
            'Variáveis SUPABASE_URL, SUPABASE_ANON_KEY/PUBLISHABLE_KEY e SUPABASE_SERVICE_ROLE_KEY precisam estar configuradas.',
        },
        500,
      )
    }

    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace('Bearer ', '').trim()

    if (!token) {
      return json(
        {
          success: false,
          message: 'Sessão inválida ou ausente. Faça login novamente.',
        },
        401,
      )
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const {
      data: { user: requesterUser },
      error: requesterAuthError,
    } = await userClient.auth.getUser()

    if (requesterAuthError || !requesterUser) {
      return json(
        {
          success: false,
          message: 'Não foi possível validar o usuário autenticado.',
        },
        401,
      )
    }

    const { data: requesterProfile, error: requesterProfileError } = await admin
      .from('profiles')
      .select('id, role')
      .eq('id', requesterUser.id)
      .maybeSingle()

    if (requesterProfileError) {
      return json(
        {
          success: false,
          message: 'Erro ao validar permissões do usuário.',
        },
        500,
      )
    }

    const requesterRole = String(requesterProfile?.role ?? '').trim().toLowerCase()

    if (!['admin', 'super-admin'].includes(requesterRole)) {
      return json(
        {
          success: false,
          message: 'Apenas admin ou super admin podem importar produtos.',
        },
        403,
      )
    }

    const body = await req.json().catch(() => null)
    const sourceUrl = ensureUrl(String(isRecord(body) ? body.url ?? '' : ''))

    if (!sourceUrl) {
      return json(
        {
          success: false,
          message: 'Informe um link válido para importar o produto.',
        },
        400,
      )
    }

    const response = await fetch(sourceUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36',
        accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'accept-language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        pragma: 'no-cache',
        'cache-control': 'no-cache',
      },
      signal: AbortSignal.timeout(15000),
    })

    if (!response.ok) {
      return json(
        {
          success: false,
          message: `Não foi possível abrir o link informado. Status: ${response.status}.`,
        },
        400,
      )
    }

    const finalUrl = response.url || sourceUrl
    const html = await response.text()

    if (!html || html.length < 100) {
      return json(
        {
          success: false,
          message: 'A página retornou conteúdo insuficiente para importar o produto.',
        },
        400,
      )
    }

    const productJsonLd = findProductJsonLd(html)

    const siteName =
      extractMetaContent(html, ['og:site_name', 'application-name']) || getHostLabel(finalUrl)

    const rawTitle =
      getString(productJsonLd, 'name') ||
      extractMetaContent(html, ['og:title', 'twitter:title']) ||
      extractTitle(html) ||
      ''

    const rawDescription =
      getString(productJsonLd, 'description') ||
      extractMetaContent(html, ['og:description', 'twitter:description', 'description']) ||
      ''

    const offersRecord = getNestedRecord(productJsonLd, 'offers')
    const productImages = extractImagesFromProduct(productJsonLd)

    const rawImages = uniqueStrings([
      ...productImages,
      extractMetaContent(html, ['og:image', 'twitter:image']),
      ...extractFallbackImagesFromHtml(html, finalUrl),
    ])
      .map((item) => toAbsoluteUrl(item, finalUrl))
      .filter(Boolean)
      .slice(0, 8)

    const priceValue =
      extractPriceFromOffers(offersRecord) ||
      normalizePrice(extractMetaContent(html, ['product:price:amount', 'og:price:amount', 'price'])) ||
      extractFallbackPrice(html)

    const sanitizedName = sanitizeTitle(rawTitle, siteName)
    const generatedName = buildCommercialName(sanitizedName)
    const finalName = generatedName || sanitizedName || 'Produto importado'

    const generatedDescription = buildGeneratedDescription({
      productName: finalName,
      rawDescription,
      priceValue,
    })

    if (!finalName && !rawImages.length && !priceValue) {
      return json(
        {
          success: false,
          message:
            'Não consegui extrair dados suficientes desse link. Tente outro produto ou preencha manualmente.',
        },
        400,
      )
    }

    return json({
      success: true,
      data: {
        sourceUrl,
        finalUrl,
        siteName,
        rawName: sanitizedName,
        generatedName: finalName,
        priceValue,
        priceFormatted: formatMoney(priceValue),
        image: rawImages[0] ?? '',
        images: rawImages,
        rawDescription: stripHtml(rawDescription),
        generatedDescription,
        shortCopy: buildShortCopy(finalName),
        cta: buildCta(finalName),
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno inesperado.'

    return json(
      {
        success: false,
        message,
      },
      500,
    )
  }
})