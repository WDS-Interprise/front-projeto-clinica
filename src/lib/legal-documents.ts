import {
  COMPANY_LEGAL,
  formatCompanyAddress,
  formattedCompanyCnpj,
} from "@/lib/company-legal"

export type LegalSlug = "privacidade" | "termos" | "lgpd" | "seguranca" | "sobre" | "contato"

export type LegalSection = {
  title: string
  paragraphs: string[]
}

export type LegalDocument = {
  slug: LegalSlug
  title: string
  updatedLabel: string
  intro: string
  sections: LegalSection[]
}

const company = COMPANY_LEGAL.legalName
  ? `${COMPANY_LEGAL.brandName} (${COMPANY_LEGAL.legalName})`
  : COMPANY_LEGAL.brandName
const cnpj = formattedCompanyCnpj()
const address = formatCompanyAddress()
const email = COMPANY_LEGAL.contactEmail
const site = COMPANY_LEGAL.siteUrl

export const LEGAL_DOCUMENTS: Record<LegalSlug, LegalDocument> = {
  privacidade: {
    slug: "privacidade",
    title: "Política de privacidade",
    updatedLabel: "Atualizado em agosto de 2026",
    intro: `Esta política descreve como a ${company}, CNPJ ${cnpj}, trata dados pessoais no site ${site} e na plataforma ClinMax.`,
    sections: [
      {
        title: "1. Quem é o controlador",
        paragraphs: [
          `A ${company} é a controladora dos dados tratados para operar a plataforma, o site institucional, cadastro, autenticação, cobrança e suporte.`,
          `Endereço: ${address}. Contato: ${email}.`,
          "Cada clínica cliente é, em regra, controladora dos dados de pacientes e atendimentos que ela registra na plataforma. Nesses casos a ClinMax atua como operadora, processando os dados sob instrução da clínica.",
        ],
      },
      {
        title: "2. Quais dados coletamos",
        paragraphs: [
          "Dados de conta e identificação: nome, e-mail, telefone, cargo e vínculo com a clínica.",
          "Dados de uso: registros de acesso, IP, dispositivo, páginas visitadas e eventos necessários para segurança e diagnóstico.",
          "Dados de pagamento: informações de cobrança e status da assinatura, processadas por parceiros de pagamento. Não armazenamos o número completo do cartão.",
          "Dados clínicos e de pacientes: inseridos pela clínica no prontuário, agenda, prescrições e demais módulos. Esses dados pertencem à operação da clínica.",
        ],
      },
      {
        title: "3. Para que usamos os dados",
        paragraphs: [
          "Prestar o serviço de gestão clínica, autenticar usuários, aplicar permissões e manter a conta.",
          "Cobrar planos, emitir documentos fiscais quando aplicável e prevenir fraude.",
          "Enviar comunicações operacionais (convites, recuperação de senha, avisos de segurança e suporte).",
          "Melhorar estabilidade, cumprir obrigações legais e responder autoridades quando a lei exigir.",
        ],
      },
      {
        title: "4. Compartilhamento",
        paragraphs: [
          "Compartilhamos dados com provedores essenciais (hospedagem, e-mail, autenticação, pagamento e monitoramento), sempre com contrato e finalidade limitada.",
          "Não vendemos dados pessoais.",
          "Podemos divulgar informações se houver obrigação legal, ordem judicial ou risco concreto à segurança de pessoas ou do serviço.",
        ],
      },
      {
        title: "5. Retenção e direitos",
        paragraphs: [
          "Mantemos os dados pelo tempo necessário à finalidade, à defesa de direitos e aos prazos legais de guarda.",
          `Você pode solicitar acesso, correção, anonimização, portabilidade ou eliminação, quando cabível, pelo e-mail ${email}. Pedidos sobre dados de pacientes devem ser feitos à clínica responsável.`,
        ],
      },
      {
        title: "6. Cookies",
        paragraphs: [
          "Usamos cookies e armazenamento local para sessão, preferências (como tema) e segurança. Cookies estritamente necessários não dependem de consentimento adicional.",
        ],
      },
    ],
  },
  termos: {
    slug: "termos",
    title: "Termos de uso",
    updatedLabel: "Atualizado em agosto de 2026",
    intro: `Estes termos regulam o uso do site e da plataforma ClinMax pela ${company}, CNPJ ${cnpj}. Ao criar uma conta ou acessar o serviço, você concorda com estas regras.`,
    sections: [
      {
        title: "1. O serviço",
        paragraphs: [
          "A ClinMax oferece software de gestão para clínicas e consultórios, incluindo agenda, pacientes, prontuário, prescrições, financeiro e integrações conforme o plano contratado.",
          "Recursos, limites e preços estão descritos na página de planos e no contrato ou checkout vigente. O plano pode ser alterado ou descontinuado com aviso prévio razoável.",
        ],
      },
      {
        title: "2. Cadastro e responsabilidades da clínica",
        paragraphs: [
          "Você deve informar dados verdadeiros, manter a senha em sigilo e usar a plataforma apenas para fins lícitos da sua atividade.",
          "A clínica é responsável pelo conteúdo que registra, pelo consentimento e bases legais do tratamento de pacientes, e pela conduta da sua equipe.",
          "É proibido tentar burlar limites do plano, explorar falhas de segurança, copiar o produto ou usar o serviço para spam ou atividade ilícita.",
        ],
      },
      {
        title: "3. Planos, pagamento e cancelamento",
        paragraphs: [
          "Planos pagos são cobrados conforme a periodicidade escolhida. Impostos e taxas de terceiros podem ser aplicados.",
          "O não pagamento pode suspender o acesso. Você pode cancelar a renovação pelas configurações ou pelo suporte. Valores já faturados no ciclo vigente não são reembolsados, salvo obrigação legal.",
        ],
      },
      {
        title: "4. Propriedade intelectual",
        paragraphs: [
          "O software, a marca ClinMax, o layout e os materiais institucionais pertencem à ClinMax ou aos seus licenciadores.",
          "Os dados inseridos pela clínica continuam da clínica. A ClinMax recebe licença limitada para processá-los só para operar o serviço.",
        ],
      },
      {
        title: "5. Disponibilidade e limitação",
        paragraphs: [
          "Buscamos alta disponibilidade, mas o serviço pode sofrer manutenção, falhas de terceiros ou interrupções. Não garantimos operação ininterrupta.",
          "Na máxima extensão permitida pela lei, a responsabilidade da ClinMax limita-se aos valores pagos nos 12 meses anteriores ao fato, excluídos danos indiretos.",
        ],
      },
      {
        title: "6. Encerramento",
        paragraphs: [
          "Podemos suspender ou encerrar contas em caso de violação destes termos, risco à plataforma ou ordem legal.",
          `Dúvidas: ${email}. Endereço: ${address}.`,
        ],
      },
    ],
  },
  lgpd: {
    slug: "lgpd",
    title: "LGPD",
    updatedLabel: "Atualizado em agosto de 2026",
    intro: `A ${company} trata dados pessoais de acordo com a Lei nº 13.709/2018 (LGPD) e normas correlatas aplicáveis a software de saúde.`,
    sections: [
      {
        title: "1. Papéis",
        paragraphs: [
          "ClinMax: controladora dos dados de contas, faturamento, suporte e analytics do produto.",
          "Clínica cliente: controladora dos dados de pacientes, prontuário, agenda clínica e comunicações que ela dispara.",
          "ClinMax: operadora desses dados clínicos, processando-os para executar o contrato com a clínica.",
        ],
      },
      {
        title: "2. Bases legais",
        paragraphs: [
          "Execução de contrato: criar conta, prestar o SaaS e cobrar a assinatura.",
          "Obrigação legal: guarda fiscal, resposta a autoridades e requisitos do setor quando aplicáveis.",
          "Legítimo interesse: segurança, prevenção a fraude e melhoria do serviço, com avaliação de impacto quando necessário.",
          "Consentimento: apenas quando a lei exigir e o consentimento for livre, informado e destacado.",
        ],
      },
      {
        title: "3. Direitos do titular",
        paragraphs: [
          "Confirmação de tratamento, acesso, correção, anonimização, portabilidade, informação sobre compartilhamentos e revogação de consentimento.",
          `Para exercer direitos sobre a sua conta ClinMax, escreva para ${email}. Para dados de atendimento, fale com a clínica que o atendeu.`,
        ],
      },
      {
        title: "4. Encarregado e incidentes",
        paragraphs: [
          COMPANY_LEGAL.dpoEmail
            ? `Encarregado (DPO): ${COMPANY_LEGAL.dpoName ?? "a definir"}. E-mail: ${COMPANY_LEGAL.dpoEmail}.`
            : `O canal oficial para privacidade e LGPD é ${email}. Quando um encarregado dedicado for nomeado, este texto será atualizado.`,
          "Em caso de incidente relevante, comunicaremos a clínica afetada e, quando a lei exigir, a ANPD e os titulares.",
        ],
      },
    ],
  },
  seguranca: {
    slug: "seguranca",
    title: "Segurança",
    updatedLabel: "Atualizado em agosto de 2026",
    intro: "A ClinMax aplica controles técnicos e organizacionais para proteger contas, dados clínicos e a disponibilidade do serviço.",
    sections: [
      {
        title: "1. Controles de acesso",
        paragraphs: [
          "Autenticação de usuários, sessões com expiração e permissões por cargo na clínica.",
          "Isolamento por clínica (multi-tenant): cada organização acessa apenas os seus dados.",
        ],
      },
      {
        title: "2. Proteção de dados",
        paragraphs: [
          "Tráfego protegido por HTTPS em produção.",
          "Registros de auditoria em ações sensíveis, para rastrear quem alterou o quê.",
          "Backups e restrição de acesso interno ao ambiente de produção.",
        ],
      },
      {
        title: "3. Sua parte",
        paragraphs: [
          "Use senha forte, não compartilhe login e revogue acessos de quem sair da equipe.",
          "Confirme o destinatário antes de enviar dados de paciente por WhatsApp ou e-mail.",
        ],
      },
      {
        title: "4. Relatar vulnerabilidade",
        paragraphs: [
          `Se encontrar um problema de segurança, avise em ${email} com descrição e passos de reprodução. Não explore o achado além do necessário para reportá-lo.`,
        ],
      },
    ],
  },
  sobre: {
    slug: "sobre",
    title: "Sobre nós",
    updatedLabel: "ClinMax",
    intro: "A ClinMax é uma plataforma de gestão clínica e prontuário eletrônico para consultórios e equipes que querem mais tempo para cuidar de pessoas.",
    sections: [
      {
        title: "O que fazemos",
        paragraphs: [
          "Reunimos agenda, pacientes, atendimento, prescrições, financeiro e comunicação em um só produto, com planos para diferentes portes de clínica.",
          `A operação institucional é da ${company}, CNPJ ${cnpj}, em ${address}.`,
        ],
      },
      {
        title: "Contato",
        paragraphs: [`Fale com a gente em ${email} ou pelo site ${site}.`],
      },
    ],
  },
  contato: {
    slug: "contato",
    title: "Contato e suporte",
    updatedLabel: "Canais oficiais",
    intro: "Use estes canais para comercial, suporte e assuntos legais. Blog, carreiras, tutoriais públicos e página de status ainda não estão publicados.",
    sections: [
      {
        title: "E-mail",
        paragraphs: [`${email}`],
      },
      {
        title: "Endereço",
        paragraphs: [`${address}. CNPJ ${cnpj}.`],
      },
      {
        title: "Site",
        paragraphs: [site],
      },
    ],
  },
}

export const LEGAL_NAV: { slug: LegalSlug; label: string; path: string }[] = [
  { slug: "privacidade", label: "Política de privacidade", path: "/privacidade" },
  { slug: "termos", label: "Termos de uso", path: "/termos" },
  { slug: "lgpd", label: "LGPD", path: "/lgpd" },
  { slug: "seguranca", label: "Segurança", path: "/seguranca" },
]
