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
  accessDays?: number
  autoRenew?: boolean
}

class StepError extends Error {
  step: string
  status: number

  constructor(step: string, message: string, status = 500) {
    super(message)
    this.step = step
    this.status = status
  }
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
  return role === 'super_admin' || role === 'superadmin' || role === 'super-admin'
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message

  if (isRecord(error)) {
    const message = cleanText(error.message)
    if (message) return message
  }

  return fallback
}

async function linkAdminToStore(
  adminClient: any,
  params: {
    userId: string
    storeId: string
    adminEmail: string
  },
) {
  const { data: existing, error: existingError } = await adminClient
    .from('admins')
    .select('id, user_id, store_id')
    .eq('store_id', params.storeId)
    .maybeSingle()

  if (existingError) {
    throw new StepError(
      'admin-link-fetch',
      getErrorMessage(existingError, 'Não foi possível localizar o vínculo do admin.'),
      500,
    )
  }

  if (existing?.id) {
    const { error: updateError } = await adminClient
      .from('admins')
      .update({
        user_id: params.userId,
        email: params.adminEmail,
        role: 'admin',
      })
      .eq('id', existing.id)

    if (updateError) {
      throw new StepError(
        'admin-link-update',
        getErrorMessage(updateError, 'Não foi possível atualizar o vínculo do admin.'),
        500,
      )
    }

    return
  }

  const { error: insertError } = await adminClient.from('admins').insert({
    user_id: params.userId,
    store_id: params.storeId,
    email: params.adminEmail,
    role: 'admin',
  })

  if (insertError) {
    throw new StepError(
      'admin-link-insert',
      getErrorMessage(insertError, 'Não foi possível vincular o admin à estrutura.'),
      500,
    )
  }
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
      accessDays: Number(bodyRaw.accessDays ?? 30),
      autoRenew: Boolean(bodyRaw.autoRenew),
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

    if (!Number.isFinite(body.accessDays) || Number(body.accessDays) <= 0) {
      return json(
        {
          success: false,
          step: 'access-days-validation',
          message: 'A quantidade de dias de acesso é inválida.',
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
      throw new StepError(
        'profile-upsert',
        getErrorMessage(profileError, 'Não foi possível salvar o perfil do admin.'),
        500,
      )
    }

    const expiresAt = new Date(
      Date.now() + Number(body.accessDays) * 24 * 60 * 60 * 1000,
    ).toISOString()

    const { data: createdStore, error: createdStoreError } = await adminClient
      .from('stores')
      .insert({
        store_name: body.storeName,
        slug: body.storeSlug,
        status: 'active',
        plan: body.planName || 'iniciante',
        owner_user_id: createdUserId,
        active: true,
        suspended: false,
        access_expires_at: expiresAt,
        auto_renew: Boolean(body.autoRenew),
        access_granted_days: Number(body.accessDays),
        access_updated_at: new Date().toISOString(),
      })
      .select('id, slug')
      .single()

    if (createdStoreError || !createdStore?.id) {
      throw new StepError(
        'store-insert',
        getErrorMessage(createdStoreError, 'Não foi possível criar a estrutura.'),
        500,
      )
    }

    createdStoreId = String(createdStore.id)

    await linkAdminToStore(adminClient, {
      userId: createdUserId,
      storeId: createdStoreId,
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
        await adminClient.from('admins').delete().or(`id.eq.${createdUserId},user_id.eq.${createdUserId}`)
        await adminClient.from('profiles').delete().eq('id', createdUserId)
        await adminClient.auth.admin.deleteUser(createdUserId)
      }
    }

    const step = error instanceof StepError ? error.step : 'catch'
    const status = error instanceof StepError ? error.status : 500
    const message = getErrorMessage(error, 'Erro interno ao criar admin e estrutura.')

    return json(
      {
        success: false,
        step,
        message,
      },
      status,
    )
  }
})