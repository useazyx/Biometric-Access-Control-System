/**
 * AuthContext.tsx - Guarda quem está logado e cuida de entrar e sair do sistema
 * # Pra que serve?
 * - Manter os dados do usuário logado disponíveis pra toda a aplicação
 * - Fazer login, buscar o perfil completo e fazer logout registrando a saída
 * - Entregar o unit_code do usuário, que quase toda listagem precisa
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 2.0.0
 * Data: 2026-09-09
 * Alterações:
 * - v1.0.0 (2025-08-10): Login, logout e persistência no localStorage
 * - v2.0.0 (2026-09-09): Passou a buscar /me depois do login pra saber o unit_code do
 *                        usuário. Antes as telas chumbavam "ETE001" na mão, e por isso
 *                        o sistema só funcionava numa unidade só.
 */

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import { api } from "@/services/api"

// O que a gente sabe sobre quem está logado
export interface User {
  id: number
  email: string
  full_name: string
  type?: string
  cpf?: string
  unit_id?: number
  // Código da unidade (ex: ETE001). É o filtro que todas as listagens usam.
  unit_code?: string
  unit_name?: string
}

interface AuthContextData {
  signed: boolean
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  // Recarrega o perfil a partir da API (útil depois de editar os próprios dados)
  refreshUser: () => Promise<void>
}

// As chaves que a gente guarda no localStorage, num lugar só pra não errar o nome
const STORAGE_KEYS = {
  token: "access_token",
  refreshToken: "refresh_token",
  user: "user",
  accessLogId: "access_log_id",
} as const

const AuthContext = createContext<AuthContextData>({} as AuthContextData)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Apaga tudo que identifica a sessão (usado no logout e quando o token é inválido)
  const clearSession = useCallback(() => {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key))
    setUser(null)
  }, [])

  // Busca o perfil completo na API. É daqui que vem o unit_code, que o /login não manda.
  const fetchProfile = useCallback(async (): Promise<User | null> => {
    try {
      const { data } = await api.get("/me")

      const profile: User = {
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        type: data.type,
        cpf: data.cpf,
        unit_id: data.registration_unit?.id,
        unit_code: data.registration_unit?.unit_code,
        unit_name: data.registration_unit?.name,
      }

      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(profile))
      setUser(profile)
      return profile
    } catch (error) {
      // Token velho ou usuário apagado: o interceptor do axios já manda pro login
      console.error("Não deu pra carregar o perfil:", error)
      return null
    }
  }, [])

  // Quando o app abre, tenta recuperar a sessão que já estava salva
  useEffect(() => {
    async function loadStoragedData() {
      const storagedToken = localStorage.getItem(STORAGE_KEYS.token)
      const storagedUser = localStorage.getItem(STORAGE_KEYS.user)

      if (!storagedToken) {
        setLoading(false)
        return
      }

      // Mostra na hora o que estava salvo, pra tela não piscar vazia
      if (storagedUser) {
        try {
          setUser(JSON.parse(storagedUser) as User)
        } catch {
          // Se o JSON estiver corrompido, melhor começar de novo
          clearSession()
          setLoading(false)
          return
        }
      }

      // E confirma com a API, que também traz o unit_code atualizado
      await fetchProfile()
      setLoading(false)
    }

    loadStoragedData()
  }, [clearSession, fetchProfile])

  async function signIn(email: string, password: string) {
    try {
      const { data } = await api.post("/login", { email, password })
      const { token, person, access_log_id } = data

      if (!token) {
        throw new Error("Token não recebido do servidor")
      }

      localStorage.setItem(STORAGE_KEYS.token, token)

      // Guarda o ID do log de acesso: é ele que o logout usa pra fechar a sessão
      if (access_log_id) {
        localStorage.setItem(STORAGE_KEYS.accessLogId, String(access_log_id))
      }

      // O /login devolve só o básico, então já salva ele pra não ficar sem nada na tela
      const basicUser: User = {
        id: person.id,
        email: person.email,
        full_name: person.full_name,
        type: person.type,
        unit_id: person.unit_id,
      }
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(basicUser))
      setUser(basicUser)

      // Agora busca o perfil completo, que é o que traz o unit_code
      await fetchProfile()
    } catch (error: any) {
      // Se veio uma lista de campos inválidos, mostra o primeiro (é o mais útil)
      const details = error.response?.data?.details
      const firstDetail = Array.isArray(details) && details.length > 0 ? details[0].message : null

      throw new Error(
        firstDetail || error.response?.data?.message || error.response?.data?.error || "Erro ao fazer login",
      )
    }
  }

  async function signOut() {
    const accessLogId = localStorage.getItem(STORAGE_KEYS.accessLogId)

    // Avisa a API que a sessão terminou, pra ela calcular a duração no histórico
    if (accessLogId) {
      try {
        await api.post("/logout", { access_log_id: Number(accessLogId) })
      } catch (error) {
        // Se a API falhar, o logout local acontece de qualquer jeito:
        // é pior deixar o usuário preso logado do que perder o registro de saída
        console.error("Não deu pra registrar a saída na API:", error)
      }
    }

    clearSession()
  }

  return (
    <AuthContext.Provider
      value={{
        signed: !!user,
        user,
        loading,
        signIn,
        signOut,
        refreshUser: async () => {
          await fetchProfile()
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider")
  }

  return context
}

/**
 * Atalho pra pegar o código da unidade do usuário logado.
 * Quase toda listagem precisa dele, então fica num hook só pra não repetir a lógica
 * (e pra ninguém voltar a chumbar "ETE001" na tela).
 */
export function useUnitCode(): string | undefined {
  const { user } = useAuth()
  return user?.unit_code
}
