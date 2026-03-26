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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? ''
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
      await admin.auth.admin.deleteUser(newUserId).catch(() => null)
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
      })
      .select('id, slug')
      .single()

    if (storeError || !createdStore) {
      await admin.from('profiles').delete().eq('id', newUserId).catch(() => null)
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
      await admin.from('stores').delete().eq('id', storeId).catch(() => null)
      await admin.from('profiles').delete().eq('id', newUserId).catch(() => null)
      await rollbackUser()

      return json(
        {
          success: false,
          message: `Erro ao vincular admin à estrutura: ${adminLinkError.message}`,
        },
        500,
      )
    }

    const { error: categoriesError } = await admin.from('categories').insert([
      { store_id: storeId, name: 'Mais pedidos', sort_order: 0 },
      { store_id: storeId, name: 'Lanches', sort_order: 1 },
      { store_id: storeId, name: 'Bebidas', sort_order: 2 },
    ])

    if (categoriesError) {
      console.error('Erro ao criar categorias iniciais:', categoriesError.message)
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