export const ptBR = {
  appName: "Planejador de Lixo",
  nav: { home: "Início", calendar: "Calendário", history: "Histórico", addresses: "Endereços", settings: "Ajustes" },
  home: { subtitle: "Suas datas de coleta", today: "Hoje", tomorrow: "Amanhã", upcoming: "Próximos dias", noToday: "Sem coleta hoje", noTomorrow: "Sem coleta amanhã", welcome: "Bem-vindo ao Planejador de Lixo!", welcomeHint: "Importe arquivos .ics do seu serviço de coleta em \"Endereços\".", noFilterResults: "Nenhuma coleta encontrada para os filtros selecionados." },
  checkIn: { action: "Check-in", done: "Concluído", undo: "Desfazer", note: "Nota (opcional)", photo: "Foto (opcional)", confirm: "Confirmar check-in" },
  calendar: { title: "Calendário", subtitle: "Visão mensal das coletas", legend: "Endereços", noEventsMonth: "Nenhuma coleta neste mês", collectionsCount: "coletas", prevMonth: "Mês anterior", nextMonth: "Próximo mês", dayDetail: "Coletas do dia" },
  history: {
    title: "Histórico",
    subtitle: "Check-ins de coleta",
    empty: "Nenhum check-in ainda",
    emptyHint: "Marque coletas como feitas na visão geral.",
    stats: "Estatísticas",
    streak: "Sequência atual",
    total: "Total de check-ins",
    thisMonth: "Este mês",
    byType: "Por tipo",
    report: {
      title: "Resumo semanal",
      scheduled: "Agendadas",
      checkIns: "Check-ins",
      pending: "Pendentes",
      byAddress: "Por endereço",
      address: "Endereço",
      date: "Data",
      type: "Tipo",
      status: "Status",
      statusDone: "Concluído",
      statusPending: "Pendente",
      checkedAt: "Check-in em",
      pendingSection: "Pendentes",
      checkInsSection: "Check-ins realizados",
      noData: "Nenhuma coleta nesta semana",
      prevWeek: "Semana anterior",
      nextWeek: "Próxima semana",
      email: "E-mail",
      share: "Compartilhar",
      excel: "Excel",
      pdf: "PDF / Imprimir",
      period: "Período",
      value: "Valor",
      allEvents: "Todas as coletas da semana",
      summary:
        "Esta semana: {scheduled} coletas, {checkIns} check-ins, {pending} pendentes.",
    },
  },
  addresses: { title: "Endereços", subtitle: "Gerenciar arquivos ICS", import: "Importar arquivo .ics", importWebcal: "Importar via URL (webcal)", empty: "Nenhum endereço ainda", collections: "coletas", reimport: "Reimportar", edit: "Editar endereço", delete: "Excluir endereço?", save: "Salvar", cancel: "Cancelar", deleteBtn: "Excluir", nameAddress: "Nomear endereço" },
  settings: { title: "Configurações", appearance: "Aparência", themeLight: "Claro", themeDark: "Escuro", themeSystem: "Sistema", notifications: "Notificações", enableNotif: "Ativar notificações", allow: "Permitir", dayBefore: "No dia anterior", dayOf: "No dia da coleta", evening: "Lembrete noturno", eveningHint: "Se não fez check-in até este horário", time: "Horário", testNotif: "Enviar notificação de teste", locale: "Idioma", viewMode: "Modo de exibição", compact: "Compacto", detailed: "Detalhado", install: "Instalar app", installHint: "Instalar no seu dispositivo", privacy: "Todos os dados são armazenados localmente no seu dispositivo.", iosHint: "No iPhone: Safari → Compartilhar → Adicionar à Tela de Início" },
  onboarding: { step1title: "Importe seu calendário", step1desc: "Baixe o .ics do serviço de coleta alemão e importe em Endereços.", step2title: "Acompanhe as coletas", step2desc: "Veja hoje, amanhã e os próximos dias.", step3title: "Ative lembretes", step3desc: "Permita notificações em Configurações.", next: "Próximo", finish: "Começar", skip: "Pular" },
  filters: { search: "Pesquisar endereço...", allAddresses: "Todos os endereços", allTypes: "Todos os tipos", clear: "Limpar filtros", dateFrom: "Data inicial", dateTo: "Data final" },
  common: { loading: "Carregando", close: "Fechar", unknown: "Desconhecido", offline: "Você está offline. Seus dados locais continuam disponíveis." },
};

export interface Messages {
  appName: string;
  nav: { home: string; calendar: string; history: string; addresses: string; settings: string };
  home: { subtitle: string; today: string; tomorrow: string; upcoming: string; noToday: string; noTomorrow: string; welcome: string; welcomeHint: string; noFilterResults: string };
  checkIn: { action: string; done: string; undo: string; note: string; photo: string; confirm: string };
  calendar: { title: string; subtitle: string; legend: string; noEventsMonth: string; collectionsCount: string; prevMonth: string; nextMonth: string; dayDetail: string };
  history: {
    title: string;
    subtitle: string;
    empty: string;
    emptyHint: string;
    stats: string;
    streak: string;
    total: string;
    thisMonth: string;
    byType: string;
    report: {
      title: string;
      scheduled: string;
      checkIns: string;
      pending: string;
      byAddress: string;
      address: string;
      date: string;
      type: string;
      status: string;
      statusDone: string;
      statusPending: string;
      checkedAt: string;
      pendingSection: string;
      checkInsSection: string;
      noData: string;
      prevWeek: string;
      nextWeek: string;
      email: string;
      share: string;
      excel: string;
      pdf: string;
      period: string;
      value: string;
      allEvents: string;
      summary: string;
    };
  };
  addresses: { title: string; subtitle: string; import: string; importWebcal: string; empty: string; collections: string; reimport: string; edit: string; delete: string; save: string; cancel: string; deleteBtn: string; nameAddress: string };
  settings: { title: string; appearance: string; themeLight: string; themeDark: string; themeSystem: string; notifications: string; enableNotif: string; allow: string; dayBefore: string; dayOf: string; evening: string; eveningHint: string; time: string; testNotif: string; locale: string; viewMode: string; compact: string; detailed: string; install: string; installHint: string; privacy: string; iosHint: string };
  onboarding: { step1title: string; step1desc: string; step2title: string; step2desc: string; step3title: string; step3desc: string; next: string; finish: string; skip: string };
  filters: { search: string; allAddresses: string; allTypes: string; clear: string; dateFrom: string; dateTo: string };
  common: { loading: string; close: string; unknown: string; offline: string };
}
