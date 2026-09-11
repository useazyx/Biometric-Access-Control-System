/**
 * AuthContext.tsx - Quem está logado, e o que o resto do sistema sabe sobre isso
 * # Pra que serve?
 * - Guardar a sessão (token e perfil) e restaurá-la quando a página recarrega
 * - Entregar o unit_code do usuário, que TODA listagem exige como parâmetro
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 3.0.0
 * Data: 2026-09-10
 * Alterações:
 * - v1.0.0 (2025-08-10): Login, logout e persistência no localStorage
 * - v2.0.0 (2026-09-09): Passou a buscar /me depois do login pra saber o unit_code
 * - v3.0.0 (2026-09-10): Reescrito pro painel novo. A sessão salva agora é validada
 *                        contra o /me antes de liberar a tela, então token vencido não
 *                        deixa mais o painel abrir vazio e só quebrar na primeira lista.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { api, apiErrorMessage, STORAGE_KEYS } from "@/lib/api"
import type { LoginResponse, Me, PersonType } from "@/types/api"

/** O recorte do perfil que a interface precisa ter sempre à mão. */
export interface SessionUser {
  id: number
  full_name: string
  email: string
  cpf: string
  type: PersonType
  /** Sai de /me → registration_unit.unit_code. Sem ele, nenhuma listagem funciona. */
  unit_code: string | null
  unit_name: string | null
}

interface AuthContextValue {
  user: SessionUser | null
  /** true enquanto a sessão salva ainda está sendo conferida com a API. */
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  /** Recarrega o perfil, pra tela de conta refletir uma alteração na hora. */
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

/** Transforma a resposta do /me no recorte que a interface usa. */
function toSessionUser(me: Me): SessionUser {
  return {
    id: me.id,
    full_name: me.full_name,
    email: me.email,
    cpf: me.cpf,
    type: me.type,
    unit_code: me.registration_unit?.unit_code ?? null,
    unit_name: me.registration_unit?.name ?? null,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)

  /** Apaga tudo que identifica a sessão. */
  const clearSession = useCallback(() => {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key))
    setUser(null)
  }, [])

  /** Busca o perfil completo. É daqui que vem o unit_code, que o /login não manda. */
  const loadProfile = useCallback(async () => {
    const { data } = await api.get<Me>("/me")
    const profile = toSessionUser(data)

    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(profile))
    setUser(profile)

    return profile
  }, [])

  // Ao abrir o sistema: se tem token salvo, confirma com a API antes de liberar a tela.
  // Confirmar aqui evita o painel abrir "logado" com um token vencido e só descobrir
  // isso quando a primeira listagem falhar.
  useEffect(() => {
    let cancelled = false

    async function restoreSession() {
      const token = localStorage.getItem(STORAGE_KEYS.token)

      if (!token) {
        if (!cancelled) setLoading(false)
        return
      }

      try {
        await loadProfile()
      } catch {
        // O interceptor do api.ts já avisou a pessoa e limpou o que precisava
        if (!cancelled) clearSession()
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    restoreSession()

    return () => {
      cancelled = true
    }
  }, [clearSession, loadProfile])

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { data } = await api.post<LoginResponse>("/login", { email, password })

      if (!data.token) throw new Error("A API não devolveu token de acesso")

      localStorage.setItem(STORAGE_KEYS.token, data.token)

      // Guardado pra conseguir fechar a sessão no logout (a API pede o id do registro)
      if (data.access_log_id) {
        localStorage.setItem(STORAGE_KEYS.accessLogId, String(data.access_log_id))
      }

      try {
        await loadProfile()
      } catch (error) {
        // Logou mas não deu pra ler o perfil: melhor derrubar a sessão do que
        // deixar a pessoa num painel sem unidade, onde nada carrega.
        clearSession()
        throw new Error(apiErrorMessage(error, "Entrei, mas não consegui carregar seu perfil."))
      }
    },
    [clearSession, loadProfile],
  )

  const signOut = useCallback(async () => {
    const accessLogId = localStorage.getItem(STORAGE_KEYS.accessLogId)

    // Avisa a API pra fechar o registro de sessão. Se falhar, sai do mesmo jeito:
    // prender a pessoa numa sessão que ela pediu pra encerrar seria pior.
    if (accessLogId) {
      try {
        await api.post("/logout", { access_log_id: Number(accessLogId) })
      } catch {
        // silêncio proposital: o logout local acontece de qualquer jeito
      }
    }

    clearSession()
  }, [clearSession])

  const refresh = useCallback(async () => {
    await loadProfile()
  }, [loadProfile])

  const value = useMemo(
    () => ({ user, loading, signIn, signOut, refresh }),
    [user, loading, signIn, signOut, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) throw new Error("useAuth precisa estar dentro de um AuthProvider")
  return context
}

/**
 * Atalho pro código da unidade do usuário. Quase toda listagem precisa dele,
 * e nenhuma deve buscar antes de ele existir.
 */
export function useUnitCode(): string | null {
  return useAuth().user?.unit_code ?? null
}
