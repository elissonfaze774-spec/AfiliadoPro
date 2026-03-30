import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type JsonRecord = Record<string, unknown>

type ManageBody = {
  action: 'delete_structure' | 'update_admin_credentials'
  storeId: string
  adminEmail?: string
  adminPassword?: string
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

async function getAdminByStore(adminClient: any, storeId: string) {
  const { data, error } = await adminClient
    .from('admins')
    .select('id, store_id, email')
    .eq('store_id', storeId)
    .maybeSingle()

  if (error) {
    throw new StepError(
      'admin-fetch',
      getErrorMessage(error, 'Não foi possível localizar o admin da estrutura.'),
      500,
    )
  }

  if (!data?.id) {
    throw new StepError('admin-missing', 'Nenhum admin vinculado a esta estrutura.', 404)
  }

  return data
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

      if (nextEmail && nextEmail !== String(adminRow.email ?? '').toLowerCase()) {
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
        adminRow.id,
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
          .eq('id', adminRow.id)

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
          .eq('id', adminRow.id)

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

    if (body.action === 'delete_structure') {
      const adminRow = await getAdminByStore(adminClient, body.storeId)

      const deleteOrders = await adminClient.from('orders').delete().eq('store_id', body.storeId)
      if (deleteOrders.error) {
        throw new StepError(
          'delete-orders',
          getErrorMessage(deleteOrders.error, 'Não foi possível excluir os pedidos.'),
          500,
        )
      }

      const deleteCoupons = await adminClient.from('coupons').delete().eq('store_id', body.storeId)
      if (deleteCoupons.error) {
        throw new StepError(
          'delete-coupons',
          getErrorMessage(deleteCoupons.error, 'Não foi possível excluir os cupons.'),
          500,
        )
      }

      const deleteProducts = await adminClient.from('products').delete().eq('store_id', body.storeId)
      if (deleteProducts.error) {
        throw new StepError(
          'delete-products',
          getErrorMessage(deleteProducts.error, 'Não foi possível excluir os produtos.'),
          500,
        )
      }

      const deleteCategories = await adminClient.from('categories').delete().eq('store_id', body.storeId)
      if (deleteCategories.error) {
        throw new StepError(
          'delete-categories',
          getErrorMessage(deleteCategories.error, 'Não foi possível excluir as categorias.'),
          500,
        )
      }

      const deleteAdmins = await adminClient.from('admins').delete().eq('store_id', body.storeId)
      if (deleteAdmins.error) {
        throw new StepError(
          'delete-admin-link',
          getErrorMessage(deleteAdmins.error, 'Não foi possível excluir o vínculo do admin.'),
          500,
        )
      }

      const deleteStore = await adminClient.from('stores').delete().eq('id', body.storeId)
      if (deleteStore.error) {
        throw new StepError(
          'delete-store',
          getErrorMessage(deleteStore.error, 'Não foi possível excluir a estrutura.'),
          500,
        )
      }

      const deleteProfile = await adminClient.from('profiles').delete().eq('id', adminRow.id)
      if (deleteProfile.error) {
        throw new StepError(
          'delete-profile',
          getErrorMessage(deleteProfile.error, 'Não foi possível excluir o perfil do admin.'),
          500,
        )
      }

      const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(adminRow.id)
      if (deleteUserError) {
        throw new StepError(
          'delete-auth-user',
          getErrorMessage(deleteUserError, 'Não foi possível excluir o usuário do Auth.'),
          500,
        )
      }

      return json({
        success: true,
        step: 'structure-deleted',
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

    return json(
      {
        success: false,
        step,
        message: getErrorMessage(error, 'Erro interno ao gerenciar a estrutura.'),
      },
      status,
    )
  }
})