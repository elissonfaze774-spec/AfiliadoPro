import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type ImportedProductPreview = {
  tempId: string
  sourceUrl: string
  finalUrl: string
  siteName: string
  rawName: string
  generatedName: string
  priceValue: number
  priceFormatted: string
  image: string
  images: string[]
  rawDescription: string
  generatedDescription: string
  shortCopy: string
  cta: string
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
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizePrice(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value

  const raw = String(value ?? '').trim()
  if (!raw) return 0

  const cleaned = raw.replace(/[^\d,.-]/g, '')
  if (!cleaned) return 0

  let normalized = cleaned

  if (cleaned.includes(',') && cleaned.includes('.')) {
    if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
      normalized = cleaned.replace(/\./g, '').replace(',', '.')
    } else {
      normalized = cleaned.replace(/,/g, '')
    }
  } else if (cleaned.includes(',')) {
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

function extractTitle(html: string) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return cleanText(match?.[1] ?? '')
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

    for (const pattern of patterns) {
      const match = html.match(pattern)
      if (match?.[1]) return cleanText(match[1])
    }
  }

  return ''
}

async function readHtmlPreview(response: Response, maxChars = 900_000) {
  if (!response.body) {
    return await response.text()
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let html = ''

  while (html.length < maxChars) {
    const { done, value } = await reader.read()
    if (done) break
    html += decoder.decode(value, { stream: true })
    if (html.length >= maxChars) break
  }

  try {
    await reader.cancel()
  } catch {
    // ignore
  }

  html += decoder.decode()
  return html.slice(0, maxChars)
}

function extractJsonLdBlocks(html: string) {
  const scriptMatches = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .slice(0, 20)

  const results: unknown[] = []

  for (const match of scriptMatches) {
    const content = match[1] ?? ''
    if (!content.trim()) continue

    try {
      results.push(JSON.parse(content))
    } catch {
      try {
        const normalized = content
          .replace(/^\s*<!\[CDATA\[/, '')
          .replace(/\]\]>\s*$/, '')
          .trim()
        results.push(JSON.parse(normalized))
      } catch {
        // ignore broken block
      }
    }
  }

  return results
}

function normalizeImageList(value: unknown, baseUrl: string) {
  const items = Array.isArray(value)
    ? value.filter((entry) => typeof entry === 'string')
    : typeof value === 'string'
      ? [value]
      : []

  return uniqueStrings(items)
    .map((item) => toAbsoluteUrl(item, baseUrl))
    .filter(Boolean)
}

function sanitizeTitle(value: string, siteName?: string) {
  let title = cleanText(value)
  if (!title) return ''

  for (const separator of [' | ', ' - ', ' — ', ' :: ']) {
    if (!title.includes(separator)) continue
    const parts = title.split(separator).map((item) => cleanText(item)).filter(Boolean)
    if (parts.length) {
      title = parts.sort((a, b) => b.length - a.length)[0]
      break
    }
  }

  if (siteName) {
    const escaped = escapeRegExp(siteName)
    title = cleanText(title.replace(new RegExp(escaped, 'ig'), ''))
  }

  return title
}

function buildCommercialName(rawName: string) {
  const base = sanitizeTitle(rawName)
  if (!base) return ''
  const words = base.split(' ').filter(Boolean)
  return words.length <= 2 ? `${base} Premium` : base
}

function buildGeneratedDescription(productName: string, rawDescription: string, priceValue: number) {
  const cleanDescription = cleanText(rawDescription)
  const firstSentence =
    cleanDescription
      .split(/(?<=[.!?])\s+/)
      .map((item) => cleanText(item))
      .filter(Boolean)[0] ?? ''

  const intro = `Conheça o ${productName}, uma opção com forte potencial de conversão para vitrine e divulgação.`
  const benefit =
    firstSentence || 'Ideal para destacar benefícios, despertar interesse e aumentar cliques na oferta.'
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

function buildPreview(candidate: {
  sourceUrl: string
  finalUrl: string
  siteName: string
  rawName: string
  rawDescription?: string
  images?: string[]
  priceValue?: number
}): ImportedProductPreview | null {
  const rawName = sanitizeTitle(candidate.rawName, candidate.siteName)
  const priceValue = Number(candidate.priceValue || 0)
  const rawDescription = cleanText(candidate.rawDescription || '')
  const images = uniqueStrings(candidate.images || []).filter(Boolean).slice(0, 5)
  const finalName = buildCommercialName(rawName) || rawName || 'Produto importado'

  if (!finalName && images.length === 0 && priceValue <= 0) {
    return null
  }

  return {
    tempId: crypto.randomUUID(),
    sourceUrl: candidate.sourceUrl,
    finalUrl: candidate.finalUrl,
    siteName: candidate.siteName,
    rawName,
    generatedName: finalName,
    priceValue,
    priceFormatted: formatMoney(priceValue),
    image: images[0] ?? '',
    images,
    rawDescription,
    generatedDescription: buildGeneratedDescription(finalName, rawDescription, priceValue),
    shortCopy: buildShortCopy(finalName),
    cta: buildCta(finalName),
  }
}

function flattenJsonLd(input: unknown): Record<string, unknown>[] {
  const results: Record<string, unknown>[] = []

  const walk = (value: unknown) => {
    if (Array.isArray(value)) {
      for (const entry of value) walk(entry)
      return
    }

    if (!isRecord(value)) return

    results.push(value)

    if (Array.isArray(value['@graph'])) {
      walk(value['@graph'])
    }

    if (Array.isArray(value.itemListElement)) {
      walk(value.itemListElement)
    }
  }

  walk(input)
  return results
}

function extractJsonLdProductPreviews(html: string, finalUrl: string, sourceUrl: string, siteName: string) {
  const blocks = extractJsonLdBlocks(html)
  const previews: ImportedProductPreview[] = []

  for (const block of blocks) {
    const records = flattenJsonLd(block)

    for (const record of records) {
      const typeValue = String(record['@type'] ?? '').toLowerCase()

      if (typeValue.includes('product')) {
        const offers = record.offers
        const priceValue = isRecord(offers)
          ? normalizePrice(offers.price ?? offers.lowPrice ?? offers.highPrice)
          : 0

        const preview = buildPreview({
          sourceUrl,
          finalUrl,
          siteName,
          rawName: cleanText(record.name ?? ''),
          rawDescription: cleanText(record.description ?? ''),
          images: normalizeImageList(record.image, finalUrl),
          priceValue,
        })

        if (preview) previews.push(preview)
      }

      if (typeValue.includes('itemlist') && Array.isArray(record.itemListElement)) {
        for (const entry of record.itemListElement) {
          if (!isRecord(entry)) continue

          const itemRecord = isRecord(entry.item) ? entry.item : entry
          const offers = itemRecord.offers
          const priceValue = isRecord(offers)
            ? normalizePrice(offers.price ?? offers.lowPrice ?? offers.highPrice)
            : 0

          const preview = buildPreview({
            sourceUrl,
            finalUrl: ensureUrl(String(itemRecord.url ?? '')) || finalUrl,
            siteName,
            rawName: cleanText(itemRecord.name ?? ''),
            rawDescription: cleanText(itemRecord.description ?? ''),
            images: normalizeImageList(itemRecord.image, finalUrl),
            priceValue,
          })

          if (preview) previews.push(preview)
        }
      }
    }
  }

  const deduped = new Map<string, ImportedProductPreview>()

  for (const preview of previews) {
    const key = `${preview.finalUrl}::${preview.generatedName.toLowerCase()}`
    if (!deduped.has(key)) {
      deduped.set(key, preview)
    }
  }

  return Array.from(deduped.values())
}

function extractFallbackPrice(html: string) {
  const patterns = [
    /R\$\s?([0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2})/i,
    /"price"\s*:\s*"([^\"]+)"/i,
    /"price"\s*:\s*([0-9.,]+)/i,
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (!match?.[1]) continue
    const price = normalizePrice(match[1])
    if (price > 0) return price
  }

  return 0
}

function extractMercadoItemIds(text: string) {
  const matches = text.match(/\bM[A-Z]{2}\d{6,}\b/g) ?? []
  return Array.from(new Set(matches))
}

function getMercadoSiteName(finalUrl: string) {
  try {
    const host = new URL(finalUrl).hostname.toLowerCase()
    if (host.includes('mercadolivre.com.br')) return 'Mercado Livre'
    if (host.includes('mercadolibre.com')) return 'Mercado Libre'
    return 'Mercado Livre'
  } catch {
    return 'Mercado Livre'
  }
}

function isMercadoHost(url: string) {
  try {
    const host = new URL(url).hostname.toLowerCase()
    return (
      host.includes('mercadolivre.com') ||
      host.includes('mercadolibre.com') ||
      host.includes('mercadolivre.com.br')
    )
  } catch {
    return false
  }
}

function extractMercadoItemIdFromUrl(url: string) {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname
    const direct = path.match(/\b(M[A-Z]{2}\d{6,})\b/i)
    if (direct?.[1]) return direct[1].toUpperCase()
    return ''
  } catch {
    return ''
  }
}

async function fetchMercadoItemPreview(itemId: string, sourceUrl: string): Promise<ImportedProductPreview | null> {
  try {
    const itemResponse = await fetch(`https://api.mercadolibre.com/items/${itemId}`, {
      headers: {
        accept: 'application/json',
      },
      signal: AbortSignal.timeout(8000),
    })

    if (!itemResponse.ok) return null

    const itemData = await itemResponse.json().catch(() => null)
    if (!isRecord(itemData)) return null

    const descriptionResponse = await fetch(`https://api.mercadolibre.com/items/${itemId}/description`, {
      headers: {
        accept: 'application/json',
      },
      signal: AbortSignal.timeout(8000),
    }).catch(() => null)

    let plainText = ''
    if (descriptionResponse?.ok) {
      const descriptionData = await descriptionResponse.json().catch(() => null)
      if (isRecord(descriptionData)) {
        plainText = cleanText(descriptionData.plain_text ?? descriptionData.text ?? '')
      }
    }

    const pictures = Array.isArray(itemData.pictures)
      ? itemData.pictures
          .map((picture) => (isRecord(picture) ? String(picture.secure_url ?? picture.url ?? '') : ''))
          .filter(Boolean)
      : []

    const secureThumbnail = String(itemData.secure_thumbnail ?? itemData.thumbnail ?? itemData.thumbnail_id ?? '')
    const images = uniqueStrings([...pictures, secureThumbnail]).filter(Boolean)

    return buildPreview({
      sourceUrl,
      finalUrl: ensureUrl(String(itemData.permalink ?? sourceUrl)),
      siteName: getMercadoSiteName(String(itemData.permalink ?? sourceUrl)),
      rawName: cleanText(itemData.title ?? ''),
      rawDescription: plainText,
      images,
      priceValue: normalizePrice(itemData.price),
    })
  } catch {
    return null
  }
}

async function fetchMercadoListPreviews(itemIds: string[], sourceUrl: string) {
  const limitedIds = Array.from(new Set(itemIds)).slice(0, 24)
  const settled = await Promise.allSettled(limitedIds.map((id) => fetchMercadoItemPreview(id, sourceUrl)))

  return settled
    .map((result) => (result.status === 'fulfilled' ? result.value : null))
    .filter((item): item is ImportedProductPreview => Boolean(item))
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json({ success: false, message: 'Configuração do Supabase incompleta.' }, 500)
    }

    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace(/^Bearer\s+/i, '').trim()

    if (!token) {
      return json({ success: false, message: 'Sessão inválida ou ausente. Faça login novamente.' }, 401)
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
      return json({ success: false, message: 'Não foi possível validar o usuário autenticado.' }, 401)
    }

    const { data: requesterProfile, error: requesterProfileError } = await admin
      .from('profiles')
      .select('id, role')
      .eq('id', requesterUser.id)
      .maybeSingle()

    if (requesterProfileError) {
      return json({ success: false, message: 'Erro ao validar permissões do usuário.' }, 500)
    }

    const requesterRole = String(requesterProfile?.role ?? '').trim().toLowerCase()

    if (!['admin', 'super-admin'].includes(requesterRole)) {
      return json({ success: false, message: 'Apenas admin ou super admin podem importar produtos.' }, 403)
    }

    const body = await req.json().catch(() => null)
    const sourceUrl = ensureUrl(String(isRecord(body) ? body.url ?? '' : ''))

    if (!sourceUrl) {
      return json({ success: false, message: 'Informe um link válido para importar.' }, 400)
    }

    const response = await fetch(sourceUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        pragma: 'no-cache',
        'cache-control': 'no-cache',
      },
      signal: AbortSignal.timeout(12000),
    })

    if (!response.ok) {
      return json(
        { success: false, message: `Não foi possível abrir o link informado. Status: ${response.status}.` },
        400,
      )
    }

    const finalUrl = response.url || sourceUrl
    const html = await readHtmlPreview(response, 900_000)

    if (!html || html.length < 100) {
      return json(
        { success: false, message: 'A página retornou conteúdo insuficiente para importar.' },
        200,
      )
    }

    if (/captcha|access denied|just a moment|security check|verify you are human|forbidden/i.test(html)) {
      return json(
        {
          success: false,
          message:
            'Esse site bloqueou a leitura automática no servidor. Tente um link direto do produto ou preencha manualmente.',
        },
        200,
      )
    }

    const siteName =
      extractMetaContent(html, ['og:site_name', 'application-name']) || getHostLabel(finalUrl)

    const isMercado = isMercadoHost(finalUrl) || isMercadoHost(sourceUrl)
    const mercadoUrlId = extractMercadoItemIdFromUrl(finalUrl) || extractMercadoItemIdFromUrl(sourceUrl)

    if (isMercado && mercadoUrlId) {
      const preview = await fetchMercadoItemPreview(mercadoUrlId, sourceUrl)

      if (preview) {
        return json({
          success: true,
          data: {
            mode: 'single',
            product: preview,
          },
        })
      }
    }

    if (isMercado) {
      const mercadoIds = extractMercadoItemIds(`${finalUrl}\n${html}`)

      if (mercadoIds.length >= 2) {
        const items = await fetchMercadoListPreviews(mercadoIds, sourceUrl)

        if (items.length > 0) {
          return json({
            success: true,
            data: {
              mode: 'page',
              sourceUrl,
              finalUrl,
              siteName: getMercadoSiteName(finalUrl),
              pageTitle: sanitizeTitle(extractTitle(html), getMercadoSiteName(finalUrl)) || 'Página importada',
              count: items.length,
              items,
            },
          })
        }
      }
    }

    const jsonLdProducts = extractJsonLdProductPreviews(html, finalUrl, sourceUrl, siteName)

    if (jsonLdProducts.length >= 2) {
      return json({
        success: true,
        data: {
          mode: 'page',
          sourceUrl,
          finalUrl,
          siteName,
          pageTitle: sanitizeTitle(extractTitle(html), siteName) || 'Página importada',
          count: jsonLdProducts.length,
          items: jsonLdProducts.slice(0, 24),
        },
      })
    }

    const firstJsonLdProduct = jsonLdProducts[0] ?? null
    if (firstJsonLdProduct) {
      return json({
        success: true,
        data: {
          mode: 'single',
          product: firstJsonLdProduct,
        },
      })
    }

    const rawTitle =
      extractMetaContent(html, ['og:title', 'twitter:title']) ||
      extractTitle(html) ||
      ''

    const rawDescription =
      extractMetaContent(html, ['og:description', 'twitter:description', 'description']) ||
      ''

    const rawImages = uniqueStrings([
      extractMetaContent(html, ['og:image', 'twitter:image']),
    ])
      .map((item) => toAbsoluteUrl(item, finalUrl))
      .filter(Boolean)
      .slice(0, 5)

    const priceValue =
      normalizePrice(extractMetaContent(html, ['product:price:amount', 'og:price:amount', 'price'])) ||
      extractFallbackPrice(html)

    const genericPreview = buildPreview({
      sourceUrl,
      finalUrl,
      siteName,
      rawName: rawTitle,
      rawDescription,
      images: rawImages,
      priceValue,
    })

    if (genericPreview) {
      return json({
        success: true,
        data: {
          mode: 'single',
          product: genericPreview,
        },
      })
    }

    return json(
      {
        success: false,
        message:
          'Não consegui extrair dados suficientes desse link. Tente um link direto do produto ou preencha manualmente.',
      },
      200,
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno inesperado.'
    console.error('import-affiliate-product error:', message)
    return json({ success: false, message }, 500)
  }
})