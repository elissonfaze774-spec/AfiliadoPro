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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    if (!supabaseUrl || !serviceRoleKey) {
      return json(
        {
          success: false,
          message: 'Variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY não configuradas.',
        },
        500,
      )
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

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
      baseSlug = `loja-${Date.now()}`
    }

    const { data: existingProfile } = await admin
      .from('profiles')
      .select('id')
      .eq('email', adminEmail)
      .maybeSingle()

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
            message: `Erro ao validar slug: ${slugError.message}`,
          },
          500,
        )
      }

      if (!existingStore) break

      counter += 1
      finalSlug = `${baseSlug}-${counter}`
    }

    const { data: createdUser, error: createUserError } = await admin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        name: adminName,
        role: 'admin',
      },
    })

    if (createUserError || !createdUser.user) {
      return json(
        {
          success: false,
          message: createUserError?.message || 'Não foi possível criar o usuário.',
        },
        500,
      )
    }

    const userId = createdUser.user.id

    const { error: storeError, data: createdStore } = await admin
      .from('stores')
      .insert({
        owner_user_id: userId,
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
      await admin.auth.admin.deleteUser(userId)

      return json(
        {
          success: false,
          message: storeError?.message || 'Erro ao criar loja.',
        },
        500,
      )
    }

    const storeId = createdStore.id

    const { error: adminLinkError } = await admin.from('admins').insert({
      user_id: userId,
      email: adminEmail,
      store_id: storeId,
      role: 'admin',
    })

    if (adminLinkError) {
      await admin.from('stores').delete().eq('id', storeId)
      await admin.auth.admin.deleteUser(userId)

      return json(
        {
          success: false,
          message: adminLinkError.message,
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
      message: 'Admin e loja criados com sucesso.',
      adminUserId: userId,
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