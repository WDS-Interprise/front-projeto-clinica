import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import AppShell from "@/components/layout/AppShell"
import Login from "@/pages/Login"
import Register from "@/pages/Register"
import Patients from "@/pages/Patients"
import Doctors from "@/pages/Doctors"
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
import AgendaConfigPage from "@/pages/configuracoes/AgendaConfigPage"
import ConvitesConfigPage from "@/pages/configuracoes/ConvitesConfigPage"
import AcceptInvitePage from "@/pages/AcceptInvitePage"
import AparenciaPage from "@/pages/configuracoes/AparenciaPage"
import MinhaContaPage from "@/pages/configuracoes/MinhaContaPage"
import WhatsappPage from "@/pages/configuracoes/WhatsappPage"
import MensagensPage from "@/pages/mensagens/MensagensPage"
import BulasPage from "@/pages/outros/BulasPage"
import BulaDetailPage from "@/pages/outros/BulaDetailPage"
import Cid10Page from "@/pages/outros/Cid10Page"
import Cid11Page from "@/pages/outros/Cid11Page"
import ContatosPage from "@/pages/outros/ContatosPage"
import LogsPage from "@/pages/outros/LogsPage"
import { getBackofficeToken } from "@/services/backoffice-api"
import { ToastProvider } from "@/context/ToastContext"
import { ThemeProvider } from "@/context/ThemeContext"
import { AuthProvider } from "@/context/AuthContext"
import { UserAvatarProvider } from "@/context/UserAvatarContext"
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

function RootRedirect() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
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
      <UserAvatarProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/convite/:token" element={<AcceptInvitePage />} />

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
                <Navigate to="/dashboard" replace />
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
            <Route path="outros" element={<Navigate to="/outros/bulas" replace />} />
            <Route
              path="outros/bulas"
              element={
                <PermissionRoute permission="records:view" fallback="/agenda">
                  <BulasPage />
                </PermissionRoute>
              }
            />
            <Route
              path="outros/bulas/:bulaId"
              element={
                <PermissionRoute permission="records:view" fallback="/agenda">
                  <BulaDetailPage />
                </PermissionRoute>
              }
            />
            <Route
              path="outros/contatos"
              element={
                <PermissionRoute permission="patients:view" fallback="/agenda">
                  <ContatosPage />
                </PermissionRoute>
              }
            />
            <Route
              path="outros/cid-10"
              element={
                <PermissionRoute permission="records:view" fallback="/agenda">
                  <Cid10Page />
                </PermissionRoute>
              }
            />
            <Route
              path="outros/cid-11"
              element={
                <PermissionRoute permission="records:view" fallback="/agenda">
                  <Cid11Page />
                </PermissionRoute>
              }
            />
            <Route
              path="outros/logs"
              element={
                <PermissionRoute permission="users:manage" fallback="/agenda">
                  <LogsPage />
                </PermissionRoute>
              }
            />
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
              path="configuracoes/agenda"
              element={
                <PermissionRoute permission="clinics:manage">
                  <AgendaConfigPage />
                </PermissionRoute>
              }
            />
            <Route
              path="configuracoes/convites"
              element={
                <PermissionRoute permission="clinics:manage">
                  <ConvitesConfigPage />
                </PermissionRoute>
              }
            />
            <Route path="configuracoes/aparencia" element={<AparenciaPage />} />
            <Route path="configuracoes/conta" element={<MinhaContaPage />} />
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
            <Route path="records" element={<Navigate to="/pacientes" replace />} />
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
      </UserAvatarProvider>
      </AuthProvider>
    </ToastProvider>
    </ThemeProvider>
  )
}
