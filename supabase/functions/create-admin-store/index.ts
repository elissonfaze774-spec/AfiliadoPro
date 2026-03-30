import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type JsonRecord = Record<string, unknown>

type CreateAdminBody = {
  adminName: string
  adminEmail: string
  adminPassword: string
  storeName: string
  storeSlug: string
  planName?: string
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

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function cleanText(value: unknown) {
  return String(value ?? '').trim().replace(/\s+/g, ' ')
}

function normalizeEmail(value: unknown) {
  return cleanText(value).toLowerCase()
}

function slugify(value: unknown) {
  return cleanText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizePlan(value: unknown) {
  const plan = cleanText(value).toLowerCase()
  if (plan === 'premium') return 'premium'
  if (plan === 'pro') return 'pro'
  return 'iniciante'
}

function normalizeRole(value: unknown) {
  return cleanText(value).toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_')
}

function isSuperAdminRole(value: unknown) {
  const role = normalizeRole(value)
  return role === 'super_admin' || role === 'superadmin'
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message

  if (isRecord(error)) {
    const message = cleanText(error.message)
    if (message) return message
  }

  return fallback
}

async function createStore(
  adminClient: any,
  params: {
    userId: string
    storeName: string
    storeSlug: string
    planName: string
  },
) {
  const attempts = [
    {
      store_name: params.storeName,
      slug: params.storeSlug,
      status: 'active',
      plan: params.planName,
      owner_id: params.userId,
      is_active: true,
    },
    {
      store_name: params.storeName,
      slug: params.storeSlug,
      status: 'active',
      plan: params.planName,
      owner_id: params.userId,
    },
    {
      store_name: params.storeName,
      slug: params.storeSlug,
      status: 'active',
      plan: params.planName,
    },
    {
      name: params.storeName,
      slug: params.storeSlug,
      status: 'active',
      plan_name: params.planName,
      owner_id: params.userId,
      is_active: true,
    },
    {
      name: params.storeName,
      slug: params.storeSlug,
      status: 'active',
      plan_name: params.planName,
      owner_id: params.userId,
    },
    {
      name: params.storeName,
      slug: params.storeSlug,
      status: 'active',
      plan_name: params.planName,
    },
  ]

  let lastError: unknown = null

  for (const payload of attempts) {
    const { data, error } = await adminClient
      .from('stores')
      .insert(payload)
      .select('id, slug')
      .single()

    if (!error && data?.id) {
      return data
    }

    lastError = error
  }

  throw new Error(getErrorMessage(lastError, 'Falha ao criar a estrutura na tabela stores.'))
}

async function createAdminLink(
  adminClient: any,
  params: {
    userId: string
    storeId: string
    adminName: string
    adminEmail: string
  },
) {
  const attempts = [
    {
      user_id: params.userId,
      store_id: params.storeId,
      email: params.adminEmail,
      name: params.adminName,
    },
    {
      id: params.userId,
      store_id: params.storeId,
      email: params.adminEmail,
      name: params.adminName,
    },
    {
      user_id: params.userId,
      store_id: params.storeId,
      email: params.adminEmail,
    },
    {
      id: params.userId,
      store_id: params.storeId,
      email: params.adminEmail,
    },
    {
      store_id: params.storeId,
      email: params.adminEmail,
      name: params.adminName,
    },
    {
      store_id: params.storeId,
      email: params.adminEmail,
    },
  ]

  let lastError: unknown = null

  for (const payload of attempts) {
    const { error } = await adminClient.from('admins').insert(payload)

    if (!error) return

    lastError = error
  }

  throw new Error(getErrorMessage(lastError, 'Falha ao vincular o admin na tabela admins.'))
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let createdUserId = ''
  let createdStoreId = ''

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const anonKey =
      Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json(
        {
          success: false,
          step: 'env',
          message:
            'Variáveis SUPABASE_URL, SUPABASE_ANON_KEY/PUBLISHABLE_KEY e SUPABASE_SERVICE_ROLE_KEY precisam estar configuradas.',
        },
        500,
      )
    }

    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace('Bearer ', '').trim()

    const userClient: any = createClient(supabaseUrl, anonKey, {
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

    const adminClient: any = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    if (!token) {
      return json(
        {
          success: false,
          step: 'auth-header',
          message: 'Sessão inválida ou ausente. Faça login novamente.',
        },
        401,
      )
    }

    const {
      data: { user: requesterUser },
      error: requesterAuthError,
    } = await userClient.auth.getUser()

    if (requesterAuthError || !requesterUser) {
      return json(
        {
          success: false,
          step: 'auth-user',
          message: getErrorMessage(
            requesterAuthError,
            'Não foi possível validar o usuário autenticado.',
          ),
        },
        401,
      )
    }

    const { data: requesterProfile, error: requesterProfileError } = await adminClient
      .from('profiles')
      .select('id, role, email, name')
      .eq('id', requesterUser.id)
      .maybeSingle()

    if (requesterProfileError) {
      return json(
        {
          success: false,
          step: 'requester-profile',
          message: getErrorMessage(requesterProfileError, 'Erro ao validar perfil do solicitante.'),
        },
        500,
      )
    }

    if (!requesterProfile) {
      return json(
        {
          success: false,
          step: 'requester-profile-missing',
          message: 'Seu usuário logado não possui registro na tabela profiles.',
        },
        500,
      )
    }

    if (!isSuperAdminRole(requesterProfile.role)) {
      return json(
        {
          success: false,
          step: 'requester-role',
          message: `Seu perfil não é super admin. Role atual: ${String(requesterProfile.role ?? 'vazio')}`,
        },
        403,
      )
    }

    const bodyRaw = await req.json().catch(() => null)

    if (!isRecord(bodyRaw)) {
      return json(
        {
          success: false,
          step: 'body',
          message: 'Corpo da requisição inválido.',
        },
        400,
      )
    }

    const body: CreateAdminBody = {
      adminName: cleanText(bodyRaw.adminName),
      adminEmail: normalizeEmail(bodyRaw.adminEmail),
      adminPassword: cleanText(bodyRaw.adminPassword),
      storeName: cleanText(bodyRaw.storeName),
      storeSlug: slugify(bodyRaw.storeSlug || bodyRaw.storeName),
      planName: normalizePlan(bodyRaw.planName),
    }

    if (
      !body.adminName ||
      !body.adminEmail ||
      !body.adminPassword ||
      !body.storeName ||
      !body.storeSlug
    ) {
      return json(
        {
          success: false,
          step: 'body-validation',
          message: 'Preencha nome, email, senha e nome da estrutura.',
        },
        400,
      )
    }

    if (body.adminPassword.length < 6) {
      return json(
        {
          success: false,
          step: 'password-validation',
          message: 'A senha precisa ter pelo menos 6 caracteres.',
        },
        400,
      )
    }

    const { data: existingStore, error: existingStoreError } = await adminClient
      .from('stores')
      .select('id')
      .eq('slug', body.storeSlug)
      .maybeSingle()

    if (existingStoreError) {
      return json(
        {
          success: false,
          step: 'store-slug-check',
          message: getErrorMessage(existingStoreError, 'Não foi possível validar o link da estrutura.'),
        },
        500,
      )
    }

    if (existingStore?.id) {
      return json(
        {
          success: false,
          step: 'store-slug-exists',
          message: 'Esse link da estrutura já está em uso. Escolha outro.',
        },
        409,
      )
    }

    const { data: createdUser, error: createUserError } = await adminClient.auth.admin.createUser({
      email: body.adminEmail,
      password: body.adminPassword,
      email_confirm: true,
      user_metadata: {
        name: body.adminName,
      },
    })

    if (createUserError || !createdUser?.user) {
      return json(
        {
          success: false,
          step: 'auth-create-user',
          message: getErrorMessage(createUserError, 'Não foi possível criar o usuário no Auth.'),
        },
        400,
      )
    }

    createdUserId = createdUser.user.id

    const { error: profileError } = await adminClient
  .from('profiles')
  .upsert(
    {
      id: createdUserId,
      name: body.adminName,
      email: body.adminEmail,
      role: 'admin',
    },
    {
      onConflict: 'id',
    },
  )

if (profileError) {
  return json(
    {
      success: false,
      step: 'profile-upsert',
      message: getErrorMessage(profileError, 'Não foi possível salvar o perfil do admin.'),
    },
    500,
  )
}

    const store = await createStore(adminClient, {
      userId: createdUserId,
      storeName: body.storeName,
      storeSlug: body.storeSlug,
      planName: body.planName || 'iniciante',
    })

    createdStoreId = String(store.id)

    await createAdminLink(adminClient, {
      userId: createdUserId,
      storeId: createdStoreId,
      adminName: body.adminName,
      adminEmail: body.adminEmail,
    })

    return json({
      success: true,
      step: 'done',
      message: 'Admin e estrutura criados com sucesso.',
      adminUserId: createdUserId,
      storeId: createdStoreId,
      slug: body.storeSlug,
    })
  } catch (error) {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (supabaseUrl && serviceRoleKey) {
      const adminClient: any = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })

      if (createdStoreId) {
        await adminClient.from('stores').delete().eq('id', createdStoreId)
      }

      if (createdUserId) {
        await adminClient.from('profiles').delete().eq('id', createdUserId)
        await adminClient.from('admins').delete().eq('store_id', createdStoreId)
        await adminClient.auth.admin.deleteUser(createdUserId)
      }
    }

    return json(
      {
        success: false,
        step: 'catch',
        message: getErrorMessage(error, 'Erro interno ao criar admin e estrutura.'),
      },
      500,
    )
  }
})