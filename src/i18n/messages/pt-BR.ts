export const ptBR = {
  appName: "Planejador de Lixo",
  nav: {
    home: "Início",
    calendar: "Calendário",
    history: "Histórico",
    addresses: "Endereços",
    settings: "Ajustes",
    main: "Navegação principal",
  },
  home: {
    subtitle: "Quando colocar o lixo na rua",
    today: "Hoje",
    tomorrow: "Amanhã",
    upcoming: "Próximos dias",
    noToday: "Nada para colocar na rua hoje",
    noTomorrow: "Nada para colocar na rua amanhã",
    welcome: "Bem-vindo ao Planejador de Lixo!",
    welcomeHint: "Importe arquivos .ics do seu serviço de coleta em \"Endereços\".",
    noFilterResults: "Nenhuma coleta encontrada para os filtros selecionados.",
  },
  checkIn: {
    action: "Check-in",
    done: "Concluído",
    missed: "Não saiu",
    missedDone: "Não saiu",
    undo: "Desfazer",
    note: "Nota (opcional)",
    photo: "Foto (opcional)",
    changePhoto: "Alterar foto",
    confirm: "Confirmar check-in",
    missedConfirm: "Registrar que não saiu",
    missedReason: "Motivo (obrigatório)",
    missedReasonRequired: "Explique por que a coleta não saiu.",
    missedReasonPlaceholder: "Ex.: esqueci, feriado, lixeira cheia…",
    putOutDate: "Colocar na rua",
    collectionDate: "Coleta oficial",
  },
  calendar: {
    title: "Calendário",
    subtitle: "Visão mensal das coletas",
    legend: "Endereços",
    noEventsMonth: "Nenhuma coleta neste mês",
    collectionsCount: "coletas",
    prevMonth: "Mês anterior",
    nextMonth: "Próximo mês",
    dayDetail: "Coletas do dia",
  },
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
    noFilterResults: "Nenhum check-in encontrado para os filtros selecionados.",
    filterAddress: "Endereço",
    filterType: "Tipo de lixo",
    report: {
      title: "Resumo semanal",
      scheduled: "Agendadas",
      checkIns: "Check-ins",
      missed: "Não saíram",
      pending: "Pendentes",
      compliance: "Taxa de cumprimento",
      byAddress: "Por endereço",
      address: "Endereço",
      date: "Data",
      type: "Tipo",
      status: "Status",
      statusDone: "Concluído",
      statusMissed: "Não saiu",
      statusPending: "Pendente",
      checkedAt: "Registado em",
      note: "Nota",
      pendingSection: "Pendentes",
      missedSection: "Não saíram",
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
      printHint:
        "Toque em Imprimir abaixo ou use o menu do browser → Imprimir → Guardar como PDF.",
      printButton: "Imprimir / Guardar PDF",
      summary:
        "Esta semana: {scheduled} coletas, {checkIns} check-ins, {missed} não saíram, {pending} pendentes. Cumprimento: {compliance}%.",
      fileName: "relatorio-semanal",
      addressSummary: "{name}: {checkIns}/{scheduled} ({missed} não saíram, {pending} pendentes)",
      pendingLine: "• {date} — {address} ({type})",
      missedLine: "• {date} — {address} ({type}): {note}",
    },
  },
  addresses: {
    title: "Endereços",
    subtitle: "Gerenciar arquivos ICS",
    import: "Importar arquivo .ics",
    importWebcal: "Importar via URL (webcal)",
    empty: "Nenhum endereço ainda",
    emptyHint: "Envie arquivos .ics de calendário do seu serviço de coleta.",
    collections: "coletas",
    reimport: "Reimportar",
    edit: "Editar endereço",
    editDescription: "Altere o nome deste endereço.",
    delete: "Excluir endereço?",
    deleteDescription:
      "\"{name}\" e todas as coletas associadas serão excluídos permanentemente.",
    save: "Salvar",
    cancel: "Cancelar",
    deleteBtn: "Excluir",
    nameAddress: "Nomear endereço",
    addressNameLabel: "Nome do endereço",
    importDialogDescription:
      "{count} coletas encontradas em \"{fileName}\". Digite um nome para este endereço.",
    importPlaceholder: "ex.: Rua Principal, 15",
    importBtn: "Importar",
    webcalDescription: "Cole a URL webcal ou https do calendário de coleta.",
    webcalUrlLabel: "URL",
    webcalUrlPlaceholder: "webcal://...",
    webcalNamePlaceholder: "ex.: Casa",
    webcalError: "Erro ao importar",
  },
  settings: {
    title: "Configurações",
    appearance: "Aparência",
    themeLight: "Claro",
    themeDark: "Escuro",
    themeSystem: "Sistema",
    notifications: "Notificações",
    enableNotif: "Ativar notificações",
    allow: "Permitir",
    dayBefore: "No dia anterior a colocar",
    dayOf: "No dia de colocar",
    evening: "Lembrete noturno",
    eveningHint: "Se não fez check-in até este horário",
    time: "Horário",
    testNotif: "Enviar notificação de teste",
    locale: "Idioma",
    viewMode: "Modo de exibição",
    compact: "Compacto",
    detailed: "Detalhado",
    putOutLeadTitle: "Antecedência para colocar o lixo",
    putOutLeadHint: "A data oficial de coleta do calendário não muda. Só recalcula quando colocar na rua.",
    putOutSameDay: "Mesmo dia",
    putOutOneDay: "1 dia antes (padrão)",
    putOutTwoDays: "2 dias antes",
    install: "Instalar app",
    installHint: "Instalar no seu dispositivo",
    privacy: "Todos os dados são armazenados localmente no seu dispositivo.",
    iosHint: "No iPhone: Safari → Compartilhar → Adicionar à Tela de Início",
    pushOk: "Web Push ativo — lembretes funcionam com o app fechado.",
    pushPartial:
      "Push não registado no servidor. Verifique VAPID/Redis/QStash na Vercel e reative as notificações.",
    pushResync: "Re-sincronizar lembretes",
  },
  onboarding: {
    step1title: "Importe seu calendário",
    step1desc: "Baixe o .ics do serviço de coleta alemão e importe em Endereços.",
    step2title: "Acompanhe as coletas",
    step2desc: "Veja hoje, amanhã e os próximos dias.",
    step3title: "Ative lembretes",
    step3desc: "Permita notificações em Configurações.",
    next: "Próximo",
    finish: "Começar",
    skip: "Pular",
  },
  filters: {
    search: "Pesquisar endereço...",
    allAddresses: "Todos os endereços",
    allTypes: "Todos os tipos",
    clear: "Limpar filtros",
    dateFrom: "Data inicial",
    dateTo: "Data final",
    typePlaceholder: "Tipo de lixo",
    addressPlaceholder: "Endereço",
  },
  wasteTypes: {
    Restmüll: "Lixo residual",
    Biomüll: "Orgânico",
    Papier: "Papel",
    "Gelbe Tonne": "Lixo amarelo",
    Sperrmüll: "Lixo volumoso",
    Grünschnitt: "Podas",
  },
  collectionTypes: {
    restmuell: "Lixo residual",
    biomuell: "Orgânico",
    papier: "Papel",
    gelbe_tonne: "Lixo amarelo",
    sondermuell: "Lixo especial",
    glas: "Vidro",
    unknown: "Outros",
  },
  common: {
    loading: "Carregando",
    close: "Fechar",
    unknown: "Desconhecido",
    offline: "Você está offline. Seus dados locais continuam disponíveis.",
  },
};

export interface Messages {
  appName: string;
  nav: {
    home: string;
    calendar: string;
    history: string;
    addresses: string;
    settings: string;
    main: string;
  };
  home: {
    subtitle: string;
    today: string;
    tomorrow: string;
    upcoming: string;
    noToday: string;
    noTomorrow: string;
    welcome: string;
    welcomeHint: string;
    noFilterResults: string;
  };
  checkIn: {
    action: string;
    done: string;
    missed: string;
    missedDone: string;
    undo: string;
    note: string;
    photo: string;
    changePhoto: string;
    confirm: string;
    missedConfirm: string;
    missedReason: string;
    missedReasonRequired: string;
    missedReasonPlaceholder: string;
    putOutDate: string;
    collectionDate: string;
  };
  calendar: {
    title: string;
    subtitle: string;
    legend: string;
    noEventsMonth: string;
    collectionsCount: string;
    prevMonth: string;
    nextMonth: string;
    dayDetail: string;
  };
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
    noFilterResults: string;
    filterAddress: string;
    filterType: string;
    report: {
      title: string;
      scheduled: string;
      checkIns: string;
      missed: string;
      pending: string;
      compliance: string;
      byAddress: string;
      address: string;
      date: string;
      type: string;
      status: string;
      statusDone: string;
      statusMissed: string;
      statusPending: string;
      checkedAt: string;
      note: string;
      pendingSection: string;
      missedSection: string;
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
      printHint: string;
      printButton: string;
      summary: string;
      fileName: string;
      addressSummary: string;
      pendingLine: string;
      missedLine: string;
    };
  };
  addresses: {
    title: string;
    subtitle: string;
    import: string;
    importWebcal: string;
    empty: string;
    emptyHint: string;
    collections: string;
    reimport: string;
    edit: string;
    editDescription: string;
    delete: string;
    deleteDescription: string;
    save: string;
    cancel: string;
    deleteBtn: string;
    nameAddress: string;
    addressNameLabel: string;
    importDialogDescription: string;
    importPlaceholder: string;
    importBtn: string;
    webcalDescription: string;
    webcalUrlLabel: string;
    webcalUrlPlaceholder: string;
    webcalNamePlaceholder: string;
    webcalError: string;
  };
  settings: {
    title: string;
    appearance: string;
    themeLight: string;
    themeDark: string;
    themeSystem: string;
    notifications: string;
    enableNotif: string;
    allow: string;
    dayBefore: string;
    dayOf: string;
    evening: string;
    eveningHint: string;
    time: string;
    testNotif: string;
    locale: string;
    viewMode: string;
    compact: string;
    detailed: string;
    putOutLeadTitle: string;
    putOutLeadHint: string;
    putOutSameDay: string;
    putOutOneDay: string;
    putOutTwoDays: string;
    install: string;
    installHint: string;
    privacy: string;
    iosHint: string;
    pushOk: string;
    pushPartial: string;
    pushResync: string;
  };
  onboarding: {
    step1title: string;
    step1desc: string;
    step2title: string;
    step2desc: string;
    step3title: string;
    step3desc: string;
    next: string;
    finish: string;
    skip: string;
  };
  filters: {
    search: string;
    allAddresses: string;
    allTypes: string;
    clear: string;
    dateFrom: string;
    dateTo: string;
    typePlaceholder: string;
    addressPlaceholder: string;
  };
  wasteTypes: Record<
    "Restmüll" | "Biomüll" | "Papier" | "Gelbe Tonne" | "Sperrmüll" | "Grünschnitt",
    string
  >;
  collectionTypes: Record<
    "restmuell" | "biomuell" | "papier" | "gelbe_tonne" | "sondermuell" | "glas" | "unknown",
    string
  >;
  common: { loading: string; close: string; unknown: string; offline: string };
}
