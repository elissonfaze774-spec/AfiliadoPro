import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type JsonRecord = Record<string, unknown>

type ManageBody = {
  action:
    | 'delete_structure'
    | 'update_admin_credentials'
    | 'add_access_days'
    | 'set_auto_renew'
  storeId: string
  adminEmail?: string
  adminPassword?: string
  daysToAdd?: number
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

async function getAdminByStore(adminClient: any, storeId: string) {
  const { data: adminData, error: adminError } = await adminClient
    .from('admins')
    .select('id, user_id, store_id, email')
    .eq('store_id', storeId)
    .maybeSingle()

  if (adminError) {
    throw new StepError(
      'admin-fetch',
      getErrorMessage(adminError, 'Não foi possível localizar o admin da estrutura.'),
      500,
    )
  }

  const { data: storeData, error: storeError } = await adminClient
    .from('stores')
    .select('id, owner_user_id')
    .eq('id', storeId)
    .maybeSingle()

  if (storeError) {
    throw new StepError(
      'store-fetch-owner',
      getErrorMessage(storeError, 'Não foi possível localizar o dono da estrutura.'),
      500,
    )
  }

  const authUserId =
    cleanText(adminData?.user_id) ||
    cleanText(storeData?.owner_user_id) ||
    cleanText(adminData?.id)

  if (!authUserId) {
    throw new StepError(
      'admin-missing-auth-user',
      'Nenhum usuário Auth válido foi encontrado para esta estrutura.',
      404,
    )
  }

  return {
    authUserId,
    email: cleanText(adminData?.email),
  }
}

serve(async (req: Request) => {
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
      .select('id, role')
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

    if (!requesterProfile || !isSuperAdminRole(requesterProfile.role)) {
      return json(
        {
          success: false,
          step: 'requester-role',
          message: 'Apenas super admin pode executar esta ação.',
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

    const body: ManageBody = {
      action: String(bodyRaw.action ?? '') as ManageBody['action'],
      storeId: cleanText(bodyRaw.storeId),
      adminEmail: normalizeEmail(bodyRaw.adminEmail),
      adminPassword: cleanText(bodyRaw.adminPassword),
      daysToAdd: Number(bodyRaw.daysToAdd ?? 0),
      autoRenew: Boolean(bodyRaw.autoRenew),
    }

    if (!body.action || !body.storeId) {
      return json(
        {
          success: false,
          step: 'body-validation',
          message: 'Ação e storeId são obrigatórios.',
        },
        400,
      )
    }

    if (body.action === 'update_admin_credentials') {
      const adminRow = await getAdminByStore(adminClient, body.storeId)

      const nextEmail = body.adminEmail
      const nextPassword = body.adminPassword

      if (!nextEmail && !nextPassword) {
        return json(
          {
            success: false,
            step: 'credentials-validation',
            message: 'Informe ao menos um novo email ou uma nova senha.',
          },
          400,
        )
      }

      if (nextPassword && nextPassword.length < 6) {
        return json(
          {
            success: false,
            step: 'password-validation',
            message: 'A nova senha precisa ter pelo menos 6 caracteres.',
          },
          400,
        )
      }

      const authPayload: Record<string, unknown> = {}

      if (nextEmail && nextEmail !== adminRow.email.toLowerCase()) {
        authPayload.email = nextEmail
      }

      if (nextPassword) {
        authPayload.password = nextPassword
      }

      if (Object.keys(authPayload).length === 0) {
        return json(
          {
            success: false,
            step: 'credentials-nochange',
            message: 'Nenhuma alteração válida foi informada.',
          },
          400,
        )
      }

      const { error: updateAuthError } = await adminClient.auth.admin.updateUserById(
        adminRow.authUserId,
        authPayload,
      )

      if (updateAuthError) {
        throw new StepError(
          'auth-update',
          getErrorMessage(updateAuthError, 'Não foi possível atualizar o usuário no Auth.'),
          400,
        )
      }

      if (nextEmail) {
        const { error: profileEmailError } = await adminClient
          .from('profiles')
          .update({ email: nextEmail })
          .eq('id', adminRow.authUserId)

        if (profileEmailError) {
          throw new StepError(
            'profile-email-update',
            getErrorMessage(profileEmailError, 'Não foi possível atualizar o email no perfil.'),
            500,
          )
        }

        const { error: adminEmailError } = await adminClient
          .from('admins')
          .update({ email: nextEmail })
          .eq('store_id', body.storeId)

        if (adminEmailError) {
          throw new StepError(
            'admin-email-update',
            getErrorMessage(adminEmailError, 'Não foi possível atualizar o email no vínculo do admin.'),
            500,
          )
        }
      }

      return json({
        success: true,
        step: 'credentials-updated',
        message: 'Credenciais do admin atualizadas com sucesso.',
      })
    }

    if (body.action === 'add_access_days') {
      if (!Number.isFinite(body.daysToAdd) || Number(body.daysToAdd) <= 0) {
        return json(
          {
            success: false,
            step: 'access-days-validation',
            message: 'Informe uma quantidade válida de dias.',
          },
          400,
        )
      }

      const { data: store, error: storeError } = await adminClient
        .from('stores')
        .select('id, access_expires_at, access_granted_days')
        .eq('id', body.storeId)
        .maybeSingle()

      if (storeError || !store) {
        throw new StepError(
          'store-fetch',
          getErrorMessage(storeError, 'Não foi possível localizar a estrutura.'),
          404,
        )
      }

      const now = new Date()
      const currentExpiry = store.access_expires_at ? new Date(store.access_expires_at) : null
      const baseDate =
        currentExpiry && !Number.isNaN(currentExpiry.getTime()) && currentExpiry.getTime() > now.getTime()
          ? currentExpiry
          : now

      const nextExpiry = new Date(
        baseDate.getTime() + Number(body.daysToAdd) * 24 * 60 * 60 * 1000,
      ).toISOString()

      const { error: updateStoreError } = await adminClient
        .from('stores')
        .update({
          access_expires_at: nextExpiry,
          access_granted_days: Number(store.access_granted_days ?? 0) + Number(body.daysToAdd),
          access_updated_at: new Date().toISOString(),
        })
        .eq('id', body.storeId)

      if (updateStoreError) {
        throw new StepError(
          'store-access-update',
          getErrorMessage(updateStoreError, 'Não foi possível atualizar os dias de acesso.'),
          500,
        )
      }

      return json({
        success: true,
        step: 'access-days-updated',
        message: `${body.daysToAdd} dia(s) adicionados com sucesso.`,
      })
    }

    if (body.action === 'set_auto_renew') {
      const { error: updateStoreError } = await adminClient
        .from('stores')
        .update({
          auto_renew: body.autoRenew,
          access_updated_at: new Date().toISOString(),
        })
        .eq('id', body.storeId)

      if (updateStoreError) {
        throw new StepError(
          'store-auto-renew-update',
          getErrorMessage(updateStoreError, 'Não foi possível atualizar a renovação automática.'),
          500,
        )
      }

      return json({
        success: true,
        step: 'auto-renew-updated',
        message: body.autoRenew
          ? 'Renovação automática ativada com sucesso.'
          : 'Renovação automática desativada com sucesso.',
      })
    }

    if (body.action === 'delete_structure') {
      const adminRow = await getAdminByStore(adminClient, body.storeId)

      await adminClient.from('orders').delete().eq('store_id', body.storeId)
      await adminClient.from('products').delete().eq('store_id', body.storeId)
      await adminClient.from('categories').delete().eq('store_id', body.storeId)
      await adminClient.from('coupons').delete().eq('store_id', body.storeId)

      const { error: deleteAdminsError } = await adminClient
        .from('admins')
        .delete()
        .eq('store_id', body.storeId)

      if (deleteAdminsError) {
        throw new StepError(
          'delete-admin-link',
          getErrorMessage(deleteAdminsError, 'Não foi possível remover o vínculo do admin.'),
          500,
        )
      }

      const { error: deleteStoreError } = await adminClient
        .from('stores')
        .delete()
        .eq('id', body.storeId)

      if (deleteStoreError) {
        throw new StepError(
          'delete-store',
          getErrorMessage(deleteStoreError, 'Não foi possível remover a estrutura.'),
          500,
        )
      }

      await adminClient.from('profiles').delete().eq('id', adminRow.authUserId)
      await adminClient.auth.admin.deleteUser(adminRow.authUserId)

      return json({
        success: true,
        step: 'deleted',
        message: 'Estrutura excluída com sucesso.',
      })
    }

    return json(
      {
        success: false,
        step: 'invalid-action',
        message: 'Ação inválida.',
      },
      400,
    )
  } catch (error) {
    const step = error instanceof StepError ? error.step : 'catch'
    const status = error instanceof StepError ? error.status : 500
    const message = getErrorMessage(error, 'Erro interno ao processar a ação.')

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