/**
 * App.tsx - Monta a aplicação: provedores, tema e o mapa de rotas
 * # Pra que serve?
 * - Ligar os provedores que toda a aplicação usa (tema, autenticação, tooltip, toasts)
 * - Definir qual componente responde por cada endereço
 * - Carregar cada tela só quando a pessoa entra nela, pra abrir o app mais rápido
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 2.0.0
 * Data: 2026-09-09
 * Alterações:
 * - v1.0.0 (2025-08-10): Rotas com importação direta de todas as telas
 * - v2.0.0 (2026-09-09): Telas passaram a ser carregadas por demanda (lazy + Suspense):
 *                        antes tudo vinha num arquivo único de 1 MB no primeiro acesso.
 *                        O QueryClient também saiu com configuração explícita, porque no
 *                        padrão ele refaz toda requisição quando a janela recebe foco.
 */

import { lazy, Suspense } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthProvider } from "./contexts/AuthContext"
import { AppLayout } from "./components/layout/AppLayout"
import { PageFallback } from "./components/layout/PageFallback"

// Login vem no primeiro carregamento: é a tela que todo mundo vê antes de qualquer outra
import Login from "./pages/Login"

// O resto é carregado só quando a pessoa navega pra lá.
// Isso quebra o bundle em pedaços por tela, em vez de um arquivo gigante.
const Dashboard = lazy(() => import("./pages/Dashboard"))
const NotFound = lazy(() => import("./pages/NotFound"))

const PeopleList = lazy(() => import("./pages/people/PeopleList"))
const CreatePerson = lazy(() => import("./pages/people/CreatePerson"))
const StudentsList = lazy(() => import("./pages/students/StudentsList"))
const CreateStudent = lazy(() => import("./pages/students/CreateStudent"))
const EmployeesList = lazy(() => import("./pages/employees/EmployeesList"))
const CreateEmployee = lazy(() => import("./pages/employees/CreateEmployee"))
const TeachersList = lazy(() => import("./pages/teachers/TeachersList"))
const VisitorsList = lazy(() => import("./pages/visitors/VisitorsList"))
const CreateVisitor = lazy(() => import("./pages/visitors/CreateVisitor"))
const BiometricsList = lazy(() => import("./pages/biometrics/BiometricsList"))
const BiometricRegistration = lazy(() => import("./pages/biometrics/BiometricRegistration"))
const WebAccessLogs = lazy(() => import("./pages/logs/WebAccessLogs"))
const BiometricAccessLogs = lazy(() => import("./pages/logs/BiometricAccessLogs"))
const UnitsList = lazy(() => import("./pages/units/UnitsList"))
const CreateUnit = lazy(() => import("./pages/units/CreateUnit"))
const Settings = lazy(() => import("./pages/settings/Settings"))
const Profile = lazy(() => import("./pages/profile/Profile"))

const About = lazy(() => import("./pages/marketing/About"))
const Features = lazy(() => import("./pages/marketing/Features"))
const FAQ = lazy(() => import("./pages/marketing/FAQ"))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Dado de cadastro não muda a cada segundo: 30s de "fresco" evita
      // refazer a mesma consulta a cada troca de tela
      staleTime: 30_000,
      // O padrão é refazer tudo quando a janela volta a receber foco, o que
      // dispara uma enxurrada de requisições ao alternar de aba
      refetchOnWindowFocus: false,
      // Erro de validação ou de permissão não melhora tentando de novo
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                {/* Única rota aberta: sem token, é aqui que a pessoa cai */}
                <Route path="/login" element={<Login />} />

                {/* Tudo abaixo exige login (o AppLayout é quem confere) */}
                <Route path="/" element={<AppLayout />}>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route
                    path="dashboard"
                    element={
                      <Suspense fallback={<PageFallback />}>
                        <Dashboard />
                      </Suspense>
                    }
                  />

                  {/* Pessoas e os perfis que derivam delas */}
                  <Route path="people" element={<LazyPage element={<PeopleList />} />} />
                  <Route path="people/create" element={<LazyPage element={<CreatePerson />} />} />
                  <Route path="students" element={<LazyPage element={<StudentsList />} />} />
                  <Route path="students/create" element={<LazyPage element={<CreateStudent />} />} />
                  <Route path="employees" element={<LazyPage element={<EmployeesList />} />} />
                  <Route path="employees/create" element={<LazyPage element={<CreateEmployee />} />} />
                  <Route path="teachers" element={<LazyPage element={<TeachersList />} />} />
                  <Route path="visitors" element={<LazyPage element={<VisitorsList />} />} />
                  <Route path="visitors/create" element={<LazyPage element={<CreateVisitor />} />} />

                  {/* Biometria */}
                  <Route path="biometrics" element={<LazyPage element={<BiometricsList />} />} />
                  <Route path="biometrics/register" element={<LazyPage element={<BiometricRegistration />} />} />

                  {/* Histórico de acesso */}
                  <Route path="logs/web" element={<LazyPage element={<WebAccessLogs />} />} />
                  <Route path="logs/biometric" element={<LazyPage element={<BiometricAccessLogs />} />} />

                  {/* Unidades */}
                  <Route path="units" element={<LazyPage element={<UnitsList />} />} />
                  <Route path="units/create" element={<LazyPage element={<CreateUnit />} />} />

                  {/* Conta */}
                  <Route path="settings" element={<LazyPage element={<Settings />} />} />
                  <Route path="profile" element={<LazyPage element={<Profile />} />} />

                  {/* Páginas informativas sobre o projeto */}
                  <Route path="about" element={<LazyPage element={<About />} />} />
                  <Route path="features" element={<LazyPage element={<Features />} />} />
                  <Route path="faq" element={<LazyPage element={<FAQ />} />} />
                </Route>

                {/* Endereço que não existe */}
                <Route path="*" element={<LazyPage element={<NotFound />} />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>

          {/* Os dois sistemas de aviso: o toaster do shadcn e o sonner */}
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

/**
 * Envolve a tela no Suspense com o mesmo esqueleto de carregamento.
 * Existe só pra não repetir <Suspense fallback={...}> em vinte rotas.
 */
function LazyPage({ element }: { element: React.ReactNode }) {
  return <Suspense fallback={<PageFallback />}>{element}</Suspense>
}
