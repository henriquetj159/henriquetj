/**
 * Conteudo rico da home page — constantes tipadas.
 * Fonte: docs/research/2026-03-07-redesign-mobile-conteudo.md (Renascenca + basetriade.com)
 * Override: admin pode sobrescrever via getSiteContents()
 */

// === TIPOS ===

export interface Proposito {
  emoji: string
  titulo: string
  descricao: string
}

export interface Pratica {
  emoji: string
  titulo: string
  descricao: string
}

export interface Gestora {
  nome: string
  instagram: string
  site?: string
  bio: string
}

export interface FAQItem {
  pergunta: string
  resposta: string
}

export interface TimelineItem {
  horario: string
  titulo: string
  descricao: string
}

export interface CancellationRule {
  prazo: string
  politica: string
}

export interface PracticalInfo {
  titulo: string
  linhas: string[]
}

// === HERO ===

export const HERO_CONTENT = {
  locationBadge: 'Base Tríade — Barra Velha, SC',
  titulo: 'Ciclo das Estações',
  tagline: 'Respire. Reconecte. Renasça.',
  subtitulo: 'O primeiro programa de autocuidado cíclico do Brasil',
} as const

// === SOBRE ===

export const SOBRE_CONTENT = {
  missao: 'Resgatar a Harmonia entre Humanidade e Natureza',
  titulo: 'Sobre o Programa',
  paragrafos: [
    'O equinócio da primavera simboliza o renascimento da natureza, o equilíbrio entre luz e sombra, e o florescer de novos ciclos. O Ciclo das Estações é um programa de imersão em práticas integrativas que conectam corpo, mente e natureza através de Yoga, Ayurveda, Nutrição Consciente, Breathwork e Sound Healing.',
    'Voltado para terapeutas holísticos, facilitadores de bem-estar, praticantes de yoga, profissionais de saúde integrativa — e qualquer pessoa interessada em autocuidado cíclico e reconexão com a natureza.',
  ],
} as const

// === PROPOSITOS ===

export const PROPOSITOS: Proposito[] = [
  {
    emoji: '\uD83E\uDDD8',
    titulo: 'Autoconhecimento',
    descricao: 'Reconexão corpo-mente via Yoga, meditação e práticas contemplativas que revelam sua essência.',
  },
  {
    emoji: '\uD83D\uDCAA',
    titulo: 'Força Interna',
    descricao: 'Fortalecimento da autonomia e da capacidade de cuidar de si com sabedoria e coragem.',
  },
  {
    emoji: '\uD83C\uDF3F',
    titulo: 'Integração',
    descricao: 'Saberes ancestrais unidos a práticas contemporâneas para uma visão integral de saúde.',
  },
  {
    emoji: '\uD83C\uDF38',
    titulo: 'Alegria e Florescimento',
    descricao: 'Despertar celebrando o equinócio, honrando os ciclos da natureza e da vida.',
  },
  {
    emoji: '\uD83C\uDF4E',
    titulo: 'Saúde Integral',
    descricao: 'Alimentação ayurvédica como nutrição energética que nutre corpo, mente e espírito.',
  },
  {
    emoji: '\uD83E\uDD1D',
    titulo: 'Rede de Apoio',
    descricao: 'Comunidade entre participantes que se fortalece a cada jornada sazonal.',
  },
]

// === PROGRAMACAO TIPICA ===

export const PROGRAMACAO: TimelineItem[] = [
  { horario: '07:15', titulo: 'Credenciamento', descricao: 'Abertura e acolhimento dos participantes' },
  { horario: '08:00', titulo: 'Círculo de Intenção', descricao: 'Infusão de ervas frescas e abertura do campo energético' },
  { horario: '08:30', titulo: 'Yoga & Movimento', descricao: 'Prática corporal guiada para despertar energia e presença' },
  { horario: '10:00', titulo: 'Brunch Consciente', descricao: 'Nutrição integrativa com ingredientes sazonais e orgânicos' },
  { horario: '11:00', titulo: 'Vivência Ayurvédica', descricao: 'Rotinas de autocuidado, ervas medicinais e equilíbrio dos doshas' },
  { horario: '12:30', titulo: 'Almoço Meditativo', descricao: 'Refeição em silêncio — experiência de presença e gratidão' },
  { horario: '14:30', titulo: 'Breathwork', descricao: 'Respiração consciente para liberação emocional e expansão' },
  { horario: '16:00', titulo: 'Trilha Energética', descricao: 'Caminhada contemplativa na natureza com práticas de aterramento' },
  { horario: '17:30', titulo: 'Sound Healing', descricao: 'Imersão sonora com taças, tambores e instrumentos ancestrais' },
  { horario: '19:00', titulo: 'Rito Sazonal', descricao: 'Cerimônia de encerramento honrando o ciclo da estação' },
]

// === PRÁTICAS E MODALIDADES ===

export const PRATICAS: Pratica[] = [
  {
    emoji: '\uD83E\uDDD8',
    titulo: 'Yoga',
    descricao: 'Prática milenar que une corpo, mente e respiração através de posturas (asanas), técnicas respiratórias (pranayamas) e meditação. Promove flexibilidade, equilíbrio e paz interior.',
  },
  {
    emoji: '\uD83C\uDF3F',
    titulo: 'Ayurveda',
    descricao: 'Ciência da vida originária da Índia, que busca o equilíbrio dos doshas (Vata, Pitta, Kapha) através de alimentação, ervas medicinais, rotinas diárias e autocuidado personalizado.',
  },
  {
    emoji: '\uD83C\uDF4E',
    titulo: 'Nutrição Consciente',
    descricao: 'Alimentação como medicina — refeições preparadas com ingredientes orgânicos e sazonais, respeitando os princípios ayurvédicos e a conexão entre nutrição e energia vital.',
  },
  {
    emoji: '\uD83C\uDF2C\uFE0F',
    titulo: 'Breathwork',
    descricao: 'Técnicas de respiração consciente que promovem liberação emocional, expansão da consciência e ativação energética. Uma ferramenta poderosa de transformação e autoconhecimento.',
  },
  {
    emoji: '\uD83D\uDD14',
    titulo: 'Sound Healing',
    descricao: 'Terapia sonora com taças tibetanas, tambores xamânicos e instrumentos ancestrais. As vibrações restauram o equilíbrio celular, acalmam o sistema nervoso e induzem estados meditativos profundos.',
  },
  {
    emoji: '\uD83C\uDF3B',
    titulo: 'Trilha Energética',
    descricao: 'Caminhada contemplativa na natureza com práticas de aterramento (grounding), meditação ativa e conexão com os elementos. Uma jornada de reconexão com a terra e consigo mesmo.',
  },
]

// === GESTORAS DO PROGRAMA ===

export const GESTORAS: Gestora[] = [
  {
    nome: 'Milena Koch',
    instagram: '@koch.milenar',
    site: 'www.ocamilenar.com.br',
    bio: 'Terapeuta holística, facilitadora de vivências integrativas e cofundadora do Ciclo das Estações. Milena é especialista em práticas ancestrais de cura e autocuidado, com formação em Ayurveda, Aromaterapia e Terapias Vibracionais. Conduz jornadas que resgatam a sabedoria milenar e a conexão com os ciclos da natureza.',
  },
  {
    nome: 'Lionara Prana',
    instagram: '@podprana',
    bio: 'Yogini, terapeuta integrativa e cofundadora do Ciclo das Estações. Formada em Hatha Vinyasa e Hatha Chakra Yoga, Lionara conduz práticas que unem movimento, respiração e consciência. Seu trabalho é guiado pela filosofia do Prana — a energia vital que permeia todas as coisas.',
  },
  {
    nome: 'Daniela',
    instagram: '@daniela',
    bio: 'Terapeuta e facilitadora dedicada ao bem-estar integral. Integra a equipe de gestão do Ciclo das Estações, contribuindo com sua experiência em práticas holísticas e organização de eventos transformadores.',
  },
]

// === FAQ ===

export const FAQ_ITEMS: FAQItem[] = [
  {
    pergunta: 'O que está incluído no passaporte?',
    resposta: 'O passaporte inclui alimentação completa (brunch ayurvédico, almoço meditativo e lanches), todas as oficinas e vivências do dia, e material básico para as práticas.',
  },
  {
    pergunta: 'Posso levar crianças ou animais?',
    resposta: 'As jornadas são espaços de imersão voltados para adultos. Para garantir a profundidade das práticas, não é permitida a entrada de crianças ou animais de estimação.',
  },
  {
    pergunta: 'O menu atende restrições alimentares?',
    resposta: 'Sim! Nosso cardápio ayurvédico é naturalmente adaptável. Informe suas restrições alimentares no momento da inscrição para que possamos atendê-lo adequadamente.',
  },
  {
    pergunta: 'As vagas são limitadas?',
    resposta: 'Sim, trabalhamos com grupos reduzidos para garantir qualidade e atenção individual em cada vivência. Recomendamos inscrição antecipada.',
  },
  {
    pergunta: 'O que devo levar?',
    resposta: 'Tapete de yoga (se tiver), manta ou canga, garrafa de água reutilizável, caderno para anotações e roupas confortáveis. Itens básicos também serão disponibilizados.',
  },
  {
    pergunta: 'Há estacionamento no local?',
    resposta: 'Sim, a Base Tríade oferece estacionamento gratuito e seguro para todos os participantes.',
  },
]

// === POLITICA DE CANCELAMENTO ===

export const CANCELAMENTO: CancellationRule[] = [
  { prazo: 'Mais de 15 dias', politica: '80% de reembolso' },
  { prazo: '7 a 14 dias', politica: '50% de reembolso' },
  { prazo: 'Menos de 7 dias', politica: 'Sem reembolso, pode transferir' },
  { prazo: 'No-show', politica: 'Sem reembolso' },
  { prazo: 'Intempérie', politica: 'Crédito integral ou 80% reembolso' },
]

// === INFORMACOES PRATICAS ===

export const INFO_PRATICAS: PracticalInfo[] = [
  {
    titulo: 'Local',
    linhas: ['Base Tríade — Barra Velha, SC', 'Estacionamento gratuito e seguro'],
  },
  {
    titulo: 'Contato',
    linhas: ['contato@basetriade.com', 'WhatsApp: (47) 999 660 210 — Milena Koch'],
  },
  {
    titulo: 'Gestoras do Programa',
    linhas: ['@koch.milenar', '@podprana'],
  },
]
