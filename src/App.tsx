import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import AppShell from "@/components/layout/AppShell"
import Login from "@/pages/Login"
import Register from "@/pages/Register"
import Patients from "@/pages/Patients"
import Doctors from "@/pages/Doctors"
import Records from "@/pages/Records"
import BackofficeLogin from "@/pages/backoffice/BackofficeLogin"
import BackofficeDashboard from "@/pages/backoffice/BackofficeDashboard"
import BackofficeClinicsPage from "@/pages/backoffice/BackofficeClinicsPage"
import BackofficeUsersPage from "@/pages/backoffice/BackofficeUsersPage"
import BackofficeUserFormPage from "@/pages/backoffice/BackofficeUserFormPage"
import BackofficePatientsPage from "@/pages/backoffice/BackofficePatientsPage"
import BackofficePlatformPage from "@/pages/backoffice/BackofficePlatformPage"
import BackofficeLayout from "@/components/layout/BackofficeLayout"
import PainelPage from "@/pages/painel/PainelPage"
import AgendaPage from "@/pages/agenda/AgendaPage"
import ProntuarioPage from "@/pages/prontuario/ProntuarioPage"
import AtendimentoPage from "@/pages/atendimento/AtendimentoPage"
import PrescricoesPage from "@/pages/prescricoes/PrescricoesPage"
import UsuariosPage from "@/pages/configuracoes/UsuariosPage"
import UsuarioFormPage from "@/pages/configuracoes/UsuarioFormPage"
import ClinicasPage from "@/pages/configuracoes/ClinicasPage"
import WhatsappPage from "@/pages/configuracoes/WhatsappPage"
import MensagensPage from "@/pages/mensagens/MensagensPage"
import OnboardingPage from "@/pages/onboarding/OnboardingPage"
import { getBackofficeToken } from "@/services/backoffice-api"
import { ToastProvider } from "@/context/ToastContext"
import { ThemeProvider } from "@/context/ThemeContext"
import { AuthProvider } from "@/context/AuthContext"
import PermissionRoute from "@/components/PermissionRoute"
import ProfissionalFormPage from "@/pages/configuracoes/ProfissionalFormPage"
import { getAuthHome } from "@/lib/onboarding"
import { useAuth } from "@/context/AuthContext"

function isAuthenticated() {
  return !!localStorage.getItem("token")
}

function DashboardRoute({ children }: { children: React.ReactNode }) {
  const { loading, hasPermission } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-text-secondary">
        Carregando...
      </div>
    )
  }

  if (hasPermission("dashboard:view")) return <>{children}</>
  if (getAuthHome() === "/dashboard") return <>{children}</>

  return <Navigate to="/agenda" replace />
}

function HomeRedirect() {
  return <Navigate to={getAuthHome()} replace />
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

function BackofficeProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!getBackofficeToken()) {
    return <Navigate to="/backoffice/login" replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <ThemeProvider>
    <ToastProvider>
      <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/backoffice/login" element={<BackofficeLogin />} />
          <Route
            path="/backoffice"
            element={
              <BackofficeProtectedRoute>
                <BackofficeLayout />
              </BackofficeProtectedRoute>
            }
          >
            <Route index element={<BackofficeDashboard />} />
            <Route path="clinicas" element={<BackofficeClinicsPage />} />
            <Route path="usuarios" element={<BackofficeUsersPage />} />
            <Route path="usuarios/novo" element={<BackofficeUserFormPage />} />
            <Route path="usuarios/:id" element={<BackofficeUserFormPage />} />
            <Route path="pacientes" element={<BackofficePatientsPage />} />
            <Route path="plataforma" element={<BackofficePlatformPage />} />
          </Route>

          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />

          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<HomeRedirect />} />
            <Route
              path="dashboard"
              element={
                <DashboardRoute>
                  <PainelPage />
                </DashboardRoute>
              }
            />
            <Route path="agenda" element={<AgendaPage />} />
            <Route
              path="mensagens"
              element={
                <PermissionRoute permission="whatsapp:send">
                  <MensagensPage />
                </PermissionRoute>
              }
            />
            <Route path="pacientes" element={<Patients />} />
            <Route path="pacientes/:id" element={<Patients />} />
            <Route path="prontuario/:pacienteId" element={<ProntuarioPage />} />
            <Route path="atendimento/:id" element={<AtendimentoPage />} />
            <Route path="prescricoes/:atendimentoId" element={<PrescricoesPage />} />
            <Route
              path="configuracoes/usuarios"
              element={
                <PermissionRoute permission="users:manage">
                  <UsuariosPage />
                </PermissionRoute>
              }
            />
            <Route
              path="configuracoes/usuarios/novo"
              element={
                <PermissionRoute permission="users:manage">
                  <UsuarioFormPage />
                </PermissionRoute>
              }
            />
            <Route
              path="configuracoes/usuarios/profissional/novo"
              element={
                <PermissionRoute permission="users:manage">
                  <ProfissionalFormPage />
                </PermissionRoute>
              }
            />
            <Route
              path="configuracoes/usuarios/:id"
              element={
                <PermissionRoute permission="users:manage">
                  <UsuarioFormPage />
                </PermissionRoute>
              }
            />
            <Route
              path="configuracoes/clinicas"
              element={
                <PermissionRoute permission="clinics:manage">
                  <ClinicasPage />
                </PermissionRoute>
              }
            />
            <Route
              path="configuracoes/whatsapp"
              element={
                <PermissionRoute permission="clinics:manage">
                  <WhatsappPage />
                </PermissionRoute>
              }
            />
            {/* Rotas legadas — redirecionam para a nova estrutura */}
            <Route path="patients" element={<Navigate to="/pacientes" replace />} />
            <Route path="appointments" element={<Navigate to="/agenda" replace />} />
            <Route path="doctors" element={<Doctors />} />
            <Route path="records" element={<Records />} />
            <Route
              path="settings"
              element={
                <PermissionRoute permission="clinics:manage" fallback="/agenda">
                  <Navigate to="/configuracoes/clinicas" replace />
                </PermissionRoute>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
    </ThemeProvider>
  )
}
