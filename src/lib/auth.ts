import 'server-only'
import { getSession, SessionPayload } from '@/lib/session'

export async function getAuthSession(): Promise<SessionPayload> {
  const session = await getSession()
  if (!session) {
    throw new Error('No autenticado. Inicia sesión.')
  }
  return session
}
