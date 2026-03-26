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

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

async function safeDeleteByEq(
  admin: { from: (table: string) => any },
  table: string,
  column: string,
  value: string,
): Promise<void | null> {
  try {
    await admin.from(table).delete().eq(column, value)
  } catch {
    return null
  }
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
      .select('id, role, email')
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

    if (requesterRole !== 'super-admin') {
      return json(
        {
          success: false,
          message: 'Apenas super admin pode criar admins e estruturas.',
        },
        403,
      )
    }

    const body = await req.json().catch(() => null)

    const adminName = String(body?.adminName || '').trim()
    const adminEmail = String(body?.adminEmail || '').trim().toLowerCase()
    const adminPassword = String(body?.adminPassword || '').trim()
    const storeName = String(body?.storeName || '').trim()
    const rawStoreSlug = String(body?.storeSlug || '').trim()

    if (!adminName || !adminEmail || !adminPassword || !storeName) {
      return json(
        {
          success: false,
          message: 'Campos obrigatórios: adminName, adminEmail, adminPassword e storeName.',
        },
        400,
      )
    }

    if (adminPassword.length < 6) {
      return json(
        {
          success: false,
          message: 'A senha deve ter pelo menos 6 caracteres.',
        },
        400,
      )
    }

    let baseSlug = slugify(rawStoreSlug || storeName)

    if (!baseSlug) {
      baseSlug = `estrutura-${Date.now()}`
    }

    const { data: existingProfile, error: existingProfileError } = await admin
      .from('profiles')
      .select('id, email')
      .eq('email', adminEmail)
      .maybeSingle()

    if (existingProfileError) {
      return json(
        {
          success: false,
          message: 'Erro ao verificar email existente.',
        },
        500,
      )
    }

    if (existingProfile?.id) {
      return json(
        {
          success: false,
          message: 'Já existe um usuário com este email.',
        },
        409,
      )
    }

    let finalSlug = baseSlug
    let counter = 1

    while (true) {
      const { data: existingStore, error: slugError } = await admin
        .from('stores')
        .select('id')
        .eq('slug', finalSlug)
        .maybeSingle()

      if (slugError) {
        return json(
          {
            success: false,
            message: `Erro ao validar link da estrutura: ${slugError.message}`,
          },
          500,
        )
      }

      if (!existingStore) break

      counter += 1
      finalSlug = `${baseSlug}-${counter}`
    }

    const { data: createdUserData, error: createUserError } = await admin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        name: adminName,
        role: 'admin',
      },
    })

    if (createUserError || !createdUserData.user) {
      return json(
        {
          success: false,
          message: createUserError?.message || 'Não foi possível criar o usuário admin.',
        },
        500,
      )
    }

    const newUserId = createdUserData.user.id

    const rollbackUser = async () => {
      try {
        await admin.auth.admin.deleteUser(newUserId)
      } catch {
        return null
      }
    }

    const { error: profileInsertError } = await admin.from('profiles').upsert(
      {
        id: newUserId,
        name: adminName,
        email: adminEmail,
        role: 'admin',
      },
      {
        onConflict: 'id',
      },
    )

    if (profileInsertError) {
      await rollbackUser()
      return json(
        {
          success: false,
          message: `Erro ao criar perfil do admin: ${profileInsertError.message}`,
        },
        500,
      )
    }

    const DEFAULT_LOGO =
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300&q=80&auto=format&fit=crop'

    const DEFAULT_BANNER =
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1400&q=80&auto=format&fit=crop'

    const { data: createdStore, error: storeError } = await admin
      .from('stores')
      .insert({
        owner_user_id: newUserId,
        store_name: storeName,
        slug: finalSlug,
        whatsapp_number: '',
        address: '',
        phone: '',
        opening_hours: '',
        status: 'active',
        active: true,
        suspended: false,
        plan: 'iniciante',
        logo_url: DEFAULT_LOGO,
        banner_url: DEFAULT_BANNER,
        description: 'Loja pronta para personalização e vendas.',
      })
      .select('id, slug')
      .single()

    if (storeError || !createdStore) {
      await safeDeleteByEq(admin, 'profiles', 'id', newUserId)
      await rollbackUser()

      return json(
        {
          success: false,
          message: storeError?.message || 'Erro ao criar a estrutura.',
        },
        500,
      )
    }

    const storeId = createdStore.id

    const { error: adminLinkError } = await admin.from('admins').insert({
      user_id: newUserId,
      email: adminEmail,
      store_id: storeId,
      role: 'admin',
    })

    if (adminLinkError) {
      await safeDeleteByEq(admin, 'stores', 'id', storeId)
      await safeDeleteByEq(admin, 'profiles', 'id', newUserId)
      await rollbackUser()

      return json(
        {
          success: false,
          message: `Erro ao vincular admin à estrutura: ${adminLinkError.message}`,
        },
        500,
      )
    }

    const { data: createdCategories, error: categoriesError } = await admin
      .from('categories')
      .insert([
        { store_id: storeId, name: 'Mais vendidos', sort_order: 0 },
        { store_id: storeId, name: 'Destaques', sort_order: 1 },
        { store_id: storeId, name: 'Ofertas', sort_order: 2 },
      ])
      .select('id, name')

    if (categoriesError) {
      await safeDeleteByEq(admin, 'admins', 'user_id', newUserId)
      await safeDeleteByEq(admin, 'stores', 'id', storeId)
      await safeDeleteByEq(admin, 'profiles', 'id', newUserId)
      await rollbackUser()

      return json(
        {
          success: false,
          message: `Erro ao criar categorias iniciais: ${categoriesError.message}`,
        },
        500,
      )
    }

    const categoryMaisVendidos =
      createdCategories?.find((item: { name: string; id: string }) => item.name === 'Mais vendidos')
        ?.id ?? null

    const categoryDestaques =
      createdCategories?.find((item: { name: string; id: string }) => item.name === 'Destaques')
        ?.id ?? null

    const categoryOfertas =
      createdCategories?.find((item: { name: string; id: string }) => item.name === 'Ofertas')
        ?.id ?? null

    const sampleProducts = [
      {
        store_id: storeId,
        category_id: categoryMaisVendidos,
        name: 'Relógio Inteligente Premium',
        description: 'Smartwatch moderno com monitoramento de saúde e notificações.',
        price: 149.9,
        image:
          'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&q=80&auto=format&fit=crop',
        affiliate_link: 'https://exemplo.com/produto/relogio-inteligente',
      },
      {
        store_id: storeId,
        category_id: categoryMaisVendidos,
        name: 'Fone Bluetooth Pro',
        description: 'Som limpo, conexão rápida e bateria de longa duração.',
        price: 89.9,
        image:
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80&auto=format&fit=crop',
        affiliate_link: 'https://exemplo.com/produto/fone-bluetooth',
      },
      {
        store_id: storeId,
        category_id: categoryDestaques,
        name: 'Luminária LED Inteligente',
        description: 'Ideal para quarto, escritório e decoração moderna.',
        price: 59.9,
        image:
          'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80&auto=format&fit=crop',
        affiliate_link: 'https://exemplo.com/produto/luminaria-led',
      },
      {
        store_id: storeId,
        category_id: categoryDestaques,
        name: 'Câmera de Segurança Wi-Fi',
        description: 'Monitoramento remoto com imagem nítida e instalação simples.',
        price: 199.9,
        image:
          'https://images.unsplash.com/photo-1557324232-b8917d3c3dcb?w=800&q=80&auto=format&fit=crop',
        affiliate_link: 'https://exemplo.com/produto/camera-wifi',
      },
      {
        store_id: storeId,
        category_id: categoryOfertas,
        name: 'Suporte Veicular para Celular',
        description: 'Praticidade e segurança para usar no carro.',
        price: 29.9,
        image:
          'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80&auto=format&fit=crop',
        affiliate_link: 'https://exemplo.com/produto/suporte-celular',
      },
      {
        store_id: storeId,
        category_id: categoryOfertas,
        name: 'Carregador Turbo USB',
        description: 'Mais velocidade para carregar seus dispositivos.',
        price: 39.9,
        image:
          'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&q=80&auto=format&fit=crop',
        affiliate_link: 'https://exemplo.com/produto/carregador-turbo',
      },
    ]

    const { error: productsError } = await admin.from('products').insert(sampleProducts)

    if (productsError) {
      await safeDeleteByEq(admin, 'categories', 'store_id', storeId)
      await safeDeleteByEq(admin, 'admins', 'user_id', newUserId)
      await safeDeleteByEq(admin, 'stores', 'id', storeId)
      await safeDeleteByEq(admin, 'profiles', 'id', newUserId)
      await rollbackUser()

      return json(
        {
          success: false,
          message: `Erro ao criar produtos iniciais: ${productsError.message}`,
        },
        500,
      )
    }

    return json({
      success: true,
      message: 'Admin e estrutura criados com sucesso.',
      adminUserId: newUserId,
      storeId,
      slug: createdStore.slug,
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