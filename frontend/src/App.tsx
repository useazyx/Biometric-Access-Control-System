/**
 * App.tsx - Onde tudo se junta: rotas, cache de dados e avisos
 * # Pra que serve?
 * - Montar os provedores que o sistema inteiro depende
 * - Declarar o mapa de rotas, com as telas carregadas sob demanda
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 3.0.0
 * Data: 2026-09-10
 * Alterações:
 * - v1.0.0 (2025-08-10): Primeira versão do roteamento
 * - v2.0.0 (2026-09-09): Carregamento sob demanda das telas
 * - v3.0.0 (2026-09-10): Reescrito pro painel novo. Saíram as telas de marketing
 *                        (sobre, recursos, FAQ), que não pertencem a um painel
 *                        administrativo, e entrou o cadastro de professor, que faltava.
 */

import { lazy, Suspense } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AuthProvider } from "@/contexts/AuthContext"
import { AppShell } from "@/components/layout/AppShell"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { InlineLoading } from "@/components/data/DataTable"

// O login é a única tela que não entra no carregamento sob demanda: ela é a
// primeira coisa que a maioria vê, e um piscar aqui é a pior primeira impressão.
import Login from "@/pages/Login"

const Dashboard = lazy(() => import("@/pages/Dashboard"))
const PeopleList = lazy(() => import("@/pages/people/PeopleList"))
const CreatePerson = lazy(() => import("@/pages/people/CreatePerson"))
const StudentsList = lazy(() => import("@/pages/students/StudentsList"))
const CreateStudent = lazy(() => import("@/pages/students/CreateStudent"))
const TeachersList = lazy(() => import("@/pages/teachers/TeachersList"))
const CreateTeacher = lazy(() => import("@/pages/teachers/CreateTeacher"))
const EmployeesList = lazy(() => import("@/pages/employees/EmployeesList"))
const CreateEmployee = lazy(() => import("@/pages/employees/CreateEmployee"))
const VisitorsList = lazy(() => import("@/pages/visitors/VisitorsList"))
const CreateVisitor = lazy(() => import("@/pages/visitors/CreateVisitor"))
const BiometricsList = lazy(() => import("@/pages/biometrics/BiometricsList"))
const BiometricRegistration = lazy(() => import("@/pages/biometrics/BiometricRegistration"))
const BiometricAccessLogs = lazy(() => import("@/pages/logs/BiometricAccessLogs"))
const WebAccessLogs = lazy(() => import("@/pages/logs/WebAccessLogs"))
const UnitsList = lazy(() => import("@/pages/units/UnitsList"))
const CreateUnit = lazy(() => import("@/pages/units/CreateUnit"))
const Profile = lazy(() => import("@/pages/Profile"))
const NotFound = lazy(() => import("@/pages/NotFound"))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // O cadastro escolar muda devagar: recarregar a cada foco na janela só
      // gasta requisição e faz a tabela piscar sem motivo.
      refetchOnWindowFocus: false,
      staleTime: 30_000,
      // O interceptor já trata 401 e 4xx; repetir só faz sentido em falha de rede
      retry: (failureCount, error) => {
        const status = (error as { response?: { status?: number } })?.response?.status
        if (status && status < 500) return false
        return failureCount < 2
      },
    },
  },
})

/** Enquanto o pedaço da tela ainda está baixando. */
function PageFallback() {
  return (
    <div className="grid min-h-[40vh] place-items-center">
      <InlineLoading label="Carregando a tela..." />
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={300}>
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route path="/login" element={<Login />} />

                {/* Tudo aqui dentro exige sessão: o AppShell barra quem não tem */}
                <Route element={<AppShell />}>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />

                  <Route path="/people" element={<PeopleList />} />
                  <Route path="/people/create" element={<CreatePerson />} />

                  <Route path="/students" element={<StudentsList />} />
                  <Route path="/students/create" element={<CreateStudent />} />

                  <Route path="/teachers" element={<TeachersList />} />
                  <Route path="/teachers/create" element={<CreateTeacher />} />

                  <Route path="/employees" element={<EmployeesList />} />
                  <Route path="/employees/create" element={<CreateEmployee />} />

                  <Route path="/visitors" element={<VisitorsList />} />
                  <Route path="/visitors/create" element={<CreateVisitor />} />

                  <Route path="/biometrics" element={<BiometricsList />} />
                  <Route path="/biometrics/register" element={<BiometricRegistration />} />

                  <Route path="/logs/biometric" element={<BiometricAccessLogs />} />
                  <Route path="/logs/web" element={<WebAccessLogs />} />

                  <Route path="/units" element={<UnitsList />} />
                  <Route path="/units/create" element={<CreateUnit />} />

                  <Route path="/profile" element={<Profile />} />

                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </Suspense>

            <Toaster />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  )
}
