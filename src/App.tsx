import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import AppShell from "@/components/layout/AppShell"
import Login from "@/pages/Login"
import Register from "@/pages/Register"
import GoogleCallbackPage from "@/pages/auth/GoogleCallbackPage"
import ModuleUnavailablePage from "@/pages/ModuleUnavailablePage"
import LegacyRouteRedirect from "@/components/routing/LegacyRouteRedirect"
import Patients from "@/pages/Patients"
import Doctors from "@/pages/Doctors"
import BackofficeLogin from "@/pages/backoffice/BackofficeLogin"
import BackofficeDashboard from "@/pages/backoffice/BackofficeDashboard"
import BackofficeClinicsPage from "@/pages/backoffice/BackofficeClinicsPage"
import BackofficeUsersPage from "@/pages/backoffice/BackofficeUsersPage"
import BackofficeUserFormPage from "@/pages/backoffice/BackofficeUserFormPage"
import BackofficePatientsPage from "@/pages/backoffice/BackofficePatientsPage"
import BackofficePlatformPage from "@/pages/backoffice/BackofficePlatformPage"
import BackofficeAssinaturasPage from "@/pages/backoffice/BackofficeAssinaturasPage"
import BackofficeCobrancasPage from "@/pages/backoffice/BackofficeCobrancasPage"
import BackofficePlanosPage from "@/pages/backoffice/BackofficePlanosPage"
import BackofficeClinicDetailPage from "@/pages/backoffice/BackofficeClinicDetailPage"
import BackofficeIntegracoesPage from "@/pages/backoffice/BackofficeIntegracoesPage"
import BackofficeIaPage from "@/pages/backoffice/BackofficeIaPage"
import BackofficeRelatoriosPage from "@/pages/backoffice/BackofficeRelatoriosPage"
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
import AguardandoAcessoPage from "@/pages/AguardandoAcessoPage"
import AparenciaPage from "@/pages/configuracoes/AparenciaPage"
import MinhaContaPage from "@/pages/configuracoes/MinhaContaPage"
import WhatsappPage from "@/pages/configuracoes/WhatsappPage"
import InteligenciaArtificialPage from "@/pages/configuracoes/InteligenciaArtificialPage"
import CargosPage from "@/pages/configuracoes/CargosPage"
import PlanoAssinaturaPage from "@/pages/configuracoes/PlanoAssinaturaPage"
import MensagensPage from "@/pages/mensagens/MensagensPage"
import BulasPage from "@/pages/outros/BulasPage"
import BulaDetailPage from "@/pages/outros/BulaDetailPage"
import Cid10Page from "@/pages/outros/Cid10Page"
import Cid11Page from "@/pages/outros/Cid11Page"
import ContatosPage from "@/pages/outros/ContatosPage"
import LogsPage from "@/pages/outros/LogsPage"
import FinancasPage from "@/pages/gestao/FinancasPage"
import ExtratoPage from "@/pages/gestao/ExtratoPage"
import RelatoriosPage from "@/pages/gestao/RelatoriosPage"
import FluxoCaixaPage from "@/pages/gestao/FluxoCaixaPage"
import FinanceConfigPage from "@/pages/configuracoes/FinanceConfigPage"
import EstoquePage from "@/pages/gestao/EstoquePage"
import TissPage from "@/pages/gestao/TissPage"
import PesquisaSatisfacaoPage from "@/pages/gestao/PesquisaSatisfacaoPage"
import { getBackofficeToken } from "@/services/backoffice-api"
import { ToastProvider } from "@/context/ToastContext"
import { ThemeProvider } from "@/context/ThemeContext"
import { AuthProvider } from "@/context/AuthContext"
import { UserAvatarProvider } from "@/context/UserAvatarContext"
import PlanFeatureRoute from "@/components/routing/PlanFeatureRoute"
import PermissionRoute from "@/components/PermissionRoute"
import ProfissionalFormPage from "@/pages/configuracoes/ProfissionalFormPage"
import LandingPage from "@/pages/LandingPage"
import { defaultHomePath } from "@/lib/permissions"
import { getAuthHome } from "@/lib/onboarding"
import { useAuth } from "@/context/AuthContext"

function isAuthenticated() {
  return !!localStorage.getItem("token")
}

function DashboardRoute({ children }: { children: React.ReactNode }) {
  const { loading, hasPermission, user } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-text-secondary">
        Carregando...
      </div>
    )
  }

  if (hasPermission("dashboard:view")) return <>{children}</>
  return <Navigate to={defaultHomePath(user?.role)} replace />
}

function RootRoute() {
  if (isAuthenticated()) {
    return <Navigate to={getAuthHome()} replace />
  }
  return <LandingPage />
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
          <Route path="/" element={<RootRoute />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
          <Route path="/convite/:token" element={<AcceptInvitePage />} />
          <Route
            path="/aguardando-acesso"
            element={
              <ProtectedRoute>
                <AguardandoAcessoPage />
              </ProtectedRoute>
            }
          />

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
            <Route path="clinicas/:id" element={<BackofficeClinicDetailPage />} />
            <Route path="planos" element={<BackofficePlanosPage />} />
            <Route path="assinaturas" element={<BackofficeAssinaturasPage />} />
            <Route path="cobrancas" element={<BackofficeCobrancasPage />} />
            <Route path="usuarios" element={<BackofficeUsersPage />} />
            <Route path="usuarios/novo" element={<BackofficeUserFormPage />} />
            <Route path="usuarios/:id" element={<BackofficeUserFormPage />} />
            <Route path="integracoes" element={<BackofficeIntegracoesPage />} />
            <Route path="ia-automacao" element={<BackofficeIaPage />} />
            <Route path="relatorios" element={<BackofficeRelatoriosPage />} />
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
            <Route
              path="agenda"
              element={
                <PermissionRoute permission="agenda:view">
                  <AgendaPage />
                </PermissionRoute>
              }
            />
            <Route
              path="mensagens"
              element={
                <PermissionRoute permission="whatsapp:send">
                  <PlanFeatureRoute feature="WHATSAPP">
                    <MensagensPage />
                  </PlanFeatureRoute>
                </PermissionRoute>
              }
            />
            <Route
              path="pacientes"
              element={
                <PermissionRoute permission="patients:view">
                  <Patients />
                </PermissionRoute>
              }
            />
            <Route
              path="pacientes/:id"
              element={
                <PermissionRoute permission="patients:view">
                  <Patients />
                </PermissionRoute>
              }
            />
            <Route
              path="prontuario/:pacienteId"
              element={
                <PermissionRoute permission="records:view">
                  <ProntuarioPage />
                </PermissionRoute>
              }
            />
            <Route
              path="atendimento/:id"
              element={
                <PermissionRoute permission="records:write">
                  <AtendimentoPage />
                </PermissionRoute>
              }
            />
            <Route
              path="prescricoes/:atendimentoId"
              element={
                <PermissionRoute permission="prescriptions:write">
                  <PrescricoesPage />
                </PermissionRoute>
              }
            />
            <Route path="outros" element={<Navigate to="/outros/contatos" replace />} />
            <Route
              path="outros/bulas"
              element={
                <PermissionRoute permission="clinical_tools:view">
                  <PlanFeatureRoute feature="CLINICAL_TOOLS">
                    <BulasPage />
                  </PlanFeatureRoute>
                </PermissionRoute>
              }
            />
            <Route
              path="outros/bulas/:bulaId"
              element={
                <PermissionRoute permission="clinical_tools:view">
                  <PlanFeatureRoute feature="CLINICAL_TOOLS">
                    <BulaDetailPage />
                  </PlanFeatureRoute>
                </PermissionRoute>
              }
            />
            <Route
              path="outros/contatos"
              element={
                <PermissionRoute permission="patients:view" >
                  <ContatosPage />
                </PermissionRoute>
              }
            />
            <Route
              path="outros/cid-10"
              element={
                <PermissionRoute permission="clinical_tools:view">
                  <PlanFeatureRoute feature="CLINICAL_TOOLS">
                    <Cid10Page />
                  </PlanFeatureRoute>
                </PermissionRoute>
              }
            />
            <Route
              path="outros/cid-11"
              element={
                <PermissionRoute permission="clinical_tools:view">
                  <PlanFeatureRoute feature="CLINICAL_TOOLS">
                    <Cid11Page />
                  </PlanFeatureRoute>
                </PermissionRoute>
              }
            />
            <Route
              path="outros/logs"
              element={
                <PermissionRoute permission="users:manage" >
                  <LogsPage />
                </PermissionRoute>
              }
            />
            <Route
              path="gestao/financas"
              element={
                <PermissionRoute permission="finance:view" >
                  <PlanFeatureRoute feature="FINANCE">
                    <FinancasPage />
                  </PlanFeatureRoute>
                </PermissionRoute>
              }
            />
            <Route
              path="gestao/financas/extrato"
              element={
                <PermissionRoute permission="finance:view" >
                  <PlanFeatureRoute feature="FINANCE">
                    <ExtratoPage />
                  </PlanFeatureRoute>
                </PermissionRoute>
              }
            />
            <Route
              path="gestao/financas/receitas"
              element={
                <PermissionRoute permission="finance:view" >
                  <PlanFeatureRoute feature="FINANCE">
                    <ExtratoPage fixedType="INCOME" pageTitle="Receitas" pageDescription="Lançamentos de receita da clínica." />
                  </PlanFeatureRoute>
                </PermissionRoute>
              }
            />
            <Route
              path="gestao/financas/despesas"
              element={
                <PermissionRoute permission="finance:view" >
                  <PlanFeatureRoute feature="FINANCE">
                    <ExtratoPage fixedType="EXPENSE" pageTitle="Despesas" pageDescription="Lançamentos de despesa da clínica." />
                  </PlanFeatureRoute>
                </PermissionRoute>
              }
            />
            <Route
              path="gestao/financas/fluxo-de-caixa"
              element={
                <PermissionRoute permission="finance:view" >
                  <PlanFeatureRoute feature="FINANCE">
                    <FluxoCaixaPage />
                  </PlanFeatureRoute>
                </PermissionRoute>
              }
            />
            <Route
              path="gestao/relatorios"
              element={
                <PermissionRoute permission="reports:view" >
                  <PlanFeatureRoute feature="REPORTS">
                    <RelatoriosPage />
                  </PlanFeatureRoute>
                </PermissionRoute>
              }
            />
            <Route
              path="gestao/relatorios/atendimento"
              element={<Navigate to="/gestao/relatorios" replace />}
            />
            <Route
              path="gestao/estoque"
              element={
                <PermissionRoute permission="finance:view" >
                  <PlanFeatureRoute feature="INVENTORY">
                    <EstoquePage />
                  </PlanFeatureRoute>
                </PermissionRoute>
              }
            />
            <Route
              path="gestao/tiss"
              element={
                <PermissionRoute permission="finance:view" >
                  <PlanFeatureRoute feature="TISS">
                    <TissPage />
                  </PlanFeatureRoute>
                </PermissionRoute>
              }
            />
            <Route
              path="gestao/pesquisa-satisfacao"
              element={
                <PermissionRoute permission="reports:view" >
                  <PlanFeatureRoute feature="SATISFACTION">
                    <PesquisaSatisfacaoPage />
                  </PlanFeatureRoute>
                </PermissionRoute>
              }
            />
            <Route path="gestao" element={<Navigate to="/gestao/financas" replace />} />
            <Route path="financas/*" element={<LegacyRouteRedirect />} />
            <Route path="finance" element={<LegacyRouteRedirect />} />
            <Route path="relatorios/*" element={<LegacyRouteRedirect />} />
            <Route path="reports" element={<LegacyRouteRedirect />} />
            <Route path="prontuarios" element={<LegacyRouteRedirect />} />
            <Route path="prontuarios/*" element={<LegacyRouteRedirect />} />
            <Route path="medical-records" element={<LegacyRouteRedirect />} />
            <Route path="configuracoes" element={<LegacyRouteRedirect />} />
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
                <PermissionRoute permission="invites:manage">
                  <ConvitesConfigPage />
                </PermissionRoute>
              }
            />
            <Route
              path="configuracoes/financeiro"
              element={
                <PermissionRoute permission="clinics:manage">
                  <FinanceConfigPage />
                </PermissionRoute>
              }
            />
            <Route path="configuracoes/aparencia" element={<AparenciaPage />} />
            <Route
              path="configuracoes/plano"
              element={
                <PermissionRoute permission="clinics:manage">
                  <PlanoAssinaturaPage />
                </PermissionRoute>
              }
            />
            <Route path="configuracoes/conta" element={<MinhaContaPage />} />
            <Route
              path="configuracoes/inteligencia-artificial"
              element={
                <PermissionRoute permission="clinics:manage">
                  <InteligenciaArtificialPage />
                </PermissionRoute>
              }
            />
            <Route
              path="configuracoes/cargos"
              element={
                <PermissionRoute permission="users:manage">
                  <CargosPage />
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
            {/* Rotas legadas. redirecionam para a nova estrutura */}
            <Route path="patients" element={<Navigate to="/pacientes" replace />} />
            <Route path="appointments" element={<Navigate to="/agenda" replace />} />
            <Route path="doctors" element={<Doctors />} />
            <Route path="records" element={<Navigate to="/pacientes" replace />} />
            <Route
              path="settings"
              element={
                <PermissionRoute permission="clinics:manage" >
                  <Navigate to="/configuracoes/clinicas" replace />
                </PermissionRoute>
              }
            />
            <Route path="*" element={<ModuleUnavailablePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      </UserAvatarProvider>
      </AuthProvider>
    </ToastProvider>
    </ThemeProvider>
  )
}
