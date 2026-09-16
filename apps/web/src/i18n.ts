import type { ColorThemePreference } from "@myfinances/types";
import type { AppView } from "./state/appStore";

export type Language = "en" | "ru";
export type SettingsTab = "general" | "appearance" | "automation" | "features" | "privacy" | "categories" | "backup" | "sync" | "debug";
export type DateFormatLabel = "short" | "medium" | "long";

export const appVersion = "0.7.1";

export const languageOptions = [
  { value: "ru-RU", label: "🇷🇺 Русский", language: "ru" },
  { value: "en-US", label: "🇺🇸 English", language: "en" }
] as const;

interface ErrorCopy {
  actions: {
    back: string;
    copied: string;
    copyDetails: string;
    debugDetails: string;
    goHome: string;
    reload: string;
    reloadApp: string;
  };
  bootTitle: string;
  presets: Record<
    | "bad-request"
    | "unauthorized"
    | "forbidden"
    | "not-found"
    | "server"
    | "unavailable"
    | "offline"
    | "maintenance"
    | "storage"
    | "runtime",
    {
      eyebrow: string;
      title: string;
      description: string;
    }
  >;
}

export interface Dictionary {
  appName: string;
  brand: string;
  nav: Record<AppView, string>;
  shortcuts: {
    title: string;
    newTransaction: string;
    search: string;
  };
  common: {
    add: string;
    all: string;
    back: string;
    balance: string;
    cancel: string;
    category: string;
    close: string;
    color: string;
    copied: string;
    copyDetails: string;
    currency: string;
    date: string;
    delete: string;
    edit: string;
    expense: string;
    expenses: string;
    income: string;
    language: string;
    name: string;
    nextMonth: string;
    note: string;
    previousMonth: string;
    reload: string;
    saved: string;
    timeZone: string;
    today: string;
    uncategorized: string;
    wallet: string;
  };
  onboarding: {
    welcomeEyebrow: string;
    welcomeTitle: string;
    welcomeBody: string;
    languageTitle: string;
    start: string;
    setupEyebrow: string;
    setupTitle: string;
    setupBody: string;
    globalCurrency: string;
    walletName: string;
    walletNamePlaceholder: string;
    walletCurrency: string;
    theme: string;
    colorTheme: string;
    finish: string;
    back: string;
    error: string;
  };
  greetings: {
    morning: string[];
    day: string[];
    evening: string[];
    night: string[];
  };
  categoryNames: Record<string, string>;
  dashboard: {
    spending: string;
    recent: string;
    emptyChart: string;
    emptyTransactions: string;
    addTransaction: string;
    convertedTo: string;
    exchangeRatesLoading: string;
    exchangeRatesUnavailable: string;
    cashFlow: string;
    openAnalytics: string;
    analyticsEyebrow: string;
    analyticsTitle: string;
    backToOverview: string;
    averageTransaction: string;
    topCategory: string;
    trend: string;
    lastSevenDays: string;
    operations: string;
    categoriesBreakdown: string;
    categoryComparison: string;
  };
  insights: {
    title: string;
    hint: string;
    empty: string;
    spendingUp: string;
    spendingDown: string;
    largestCategory: string;
    recurringShare: string;
    expenseCount: string;
    noSpendStreak: string;
  };
  analytics: {
    period: string;
    week: string;
    month: string;
    year: string;
    custom: string;
    dateFrom: string;
    dateTo: string;
    currentPeriod: string;
    previousPeriod: string;
    change: string;
    comparedWithPrevious: string;
    allCategories: string;
    missingRates: string;
    noComparison: string;
    unchanged: string;
    expenseIncreased: string;
    expenseDecreased: string;
    incomeIncreased: string;
    incomeDecreased: string;
  };
  budget: {
    title: string;
    monthPlan: string;
    description: string;
    configure: string;
    planned: string;
    spent: string;
    remaining: string;
    categoryLimits: string;
    limit: string;
    back: string;
    save: string;
    saved: string;
    saveError: string;
    previousMonth: string;
    nextMonth: string;
    notConfigured: string;
    noExpenseCategories: string;
    overBy: string;
    missingRates: string;
  };
  transaction: {
    addTitle: string;
    editTitle: string;
    amount: string;
    quickHint: string;
    quickTemplates: string;
    quickTemplatesHint: string;
    manageTemplates: string;
    repeatLast: string;
    newTemplate: string;
    templateManagerHint: string;
    templateName: string;
    templateNamePlaceholder: string;
    templateAmount: string;
    templateAmountPlaceholder: string;
    saveTemplate: string;
    templateRequired: string;
    templateSaveError: string;
    confirmDeleteTemplate: string;
    templateEmpty: string;
    amountNotSet: string;
    suggestedCategory: string;
    addAnother: string;
    calculate: string;
    calculatorOperator: string;
    calculatorError: string;
    tags: string;
    tagsPlaceholder: string;
    chooseCategory: string;
    chooseWalletAndCategory: string;
    selectWalletFirst: string;
    details: string;
    detailsHint: string;
    showDetails: string;
    hideDetails: string;
    allCategories: string;
    fewerCategories: string;
    save: string;
    update: string;
    saveError: string;
  };
  recurring: {
    tabSingle: string;
    tabRecurring: string;
    title: string;
    description: string;
    add: string;
    newTitle: string;
    editTitle: string;
    frequency: string;
    firstDate: string;
    nextRun: string;
    daily: string;
    weekly: string;
    monthly: string;
    yearly: string;
    create: string;
    update: string;
    pause: string;
    resume: string;
    paused: string;
    empty: string;
    confirmDelete: string;
    chooseCategory: string;
    saveError: string;
    openAppHint: string;
  };
  cookieNotice: {
    title: string;
    body: string;
    accept: string;
  };
  connectivity: {
    offline: string;
    online: string;
  };
  notifications: {
    title: string;
    open: string;
    unread: string;
    markAllRead: string;
    empty: string;
    detailsTitle: string;
    backToNotifications: string;
    detailVersion: string;
    detailChanges: string;
    detailCategory: string;
    detailUsage: string;
    detailPeriod: string;
    detailDate: string;
    detailGoal: string;
    detailStatus: string;
    statusCompleted: string;
    statusOverdue: string;
    statusUpcoming: string;
    updateTitle: string;
    updateBody: string;
    budgetNearTitle: string;
    budgetNearBody: string;
    budgetExceededTitle: string;
    budgetExceededBody: string;
    recurringTitle: string;
    recurringBody: string;
    goalCompletedTitle: string;
    goalCompletedBody: string;
    goalDeadlineTitle: string;
    goalDeadlineBody: string;
    goalOverdueTitle: string;
    goalOverdueBody: string;
  };
  updates: {
    title: string;
    eyebrow: string;
    intro: string;
    gotIt: string;
    notes: string[];
  };
  history: {
    title: string;
    viewList: string;
    viewTable: string;
    viewCalendar: string;
    exportCsv: string;
    selectAll: string;
    selectTransaction: string;
    selected: string;
    bulkCategory: string;
    chooseBulkCategory: string;
    mixedTypesHint: string;
    applyCategory: string;
    deleteSelected: string;
    confirmDeleteSelected: string;
    csvDate: string;
    csvType: string;
    csvAmount: string;
    csvCurrency: string;
    csvCategory: string;
    csvWallet: string;
    csvNote: string;
    csvTags: string;
    calendarSelectedDay: string;
    calendarEmptyDay: string;
    calendarMissingRates: string;
    search: string;
    searchPlaceholder: string;
    allCategories: string;
    empty: string;
    confirmDelete: string;
    sort: string;
    sortOptions: {
      dateDesc: string;
      dateAsc: string;
      amountDesc: string;
      amountAsc: string;
      categoryAsc: string;
      categoryDesc: string;
      walletAsc: string;
      walletDesc: string;
    };
  };
  wallets: {
    title: string;
    allWallets: string;
    add: string;
    archive: string;
    confirmArchive: string;
    createEmpty: string;
    newTitle: string;
    editTitle: string;
    create: string;
    update: string;
    saveError: string;
    swipeHint: string;
    initialBalance: string;
    initialBalanceHint: string;
    initialBalanceError: string;
    transfers: string;
    transferDescription: string;
    addTransfer: string;
    transferEmpty: string;
    transferNeedsWallets: string;
    fromWallet: string;
    toWallet: string;
    sentAmount: string;
    receivedAmount: string;
    transferDate: string;
    transferNote: string;
    saveTransfer: string;
    transferSaveError: string;
    confirmDeleteTransfer: string;
    walletUnavailable: string;
    icon: string;
    color: string;
    manageArchive: string;
    archiveTitle: string;
    archiveEmpty: string;
    restore: string;
    archiveError: string;
    restoreError: string;
    cannotArchiveLast: string;
    kind: string;
    kindCash: string;
    kindCredit: string;
    creditLimit: string;
    creditLimitHint: string;
    creditLimitError: string;
    creditAvailable: string;
    creditUsed: string;
    excludeFromTotals: string;
    excludeFromTotalsHint: string;
    excludedBadge: string;
    hideWalletBalance: string;
    hideWalletBalanceHint: string;
  };
  goals: {
    tabWallets: string;
    tabGoals: string;
    title: string;
    description: string;
    add: string;
    empty: string;
    newTitle: string;
    editTitle: string;
    name: string;
    namePlaceholder: string;
    targetAmount: string;
    targetDate: string;
    noDeadline: string;
    addDeadline: string;
    removeDeadline: string;
    saved: string;
    remaining: string;
    completed: string;
    create: string;
    update: string;
    contribute: string;
    contributionTitle: string;
    contributionAmount: string;
    contributionDate: string;
    contributionNote: string;
    addContribution: string;
    history: string;
    noContributions: string;
    confirmDelete: string;
    confirmDeleteContribution: string;
    saveError: string;
    contributionError: string;
    walletMissing: string;
    overdue: string;
  };
  categories: {
    title: string;
    icon: string;
    iconSearch: string;
    iconSearchEmpty: string;
    recentColors: string;
    organize: string;
    reorderHint: string;
    actionReplace: string;
    actionMerge: string;
    source: string;
    target: string;
    replaceDescription: string;
    mergeDescription: string;
    applyAction: string;
    chooseDifferent: string;
    newTitle: string;
    editTitle: string;
    create: string;
    update: string;
    empty: string;
    confirmDelete: string;
    saveError: string;
  };
  settings: {
    title: string;
    section: string;
    saving: string;
    saved: string;
    saveError: string;
    tabs: Record<SettingsTab, string>;
    general: string;
    appearance: string;
    automation: string;
    quickTemplatesSetting: string;
    quickTemplatesSettingHint: string;
    categorySuggestionsSetting: string;
    categorySuggestionsSettingHint: string;
    addAnotherSetting: string;
    addAnotherSettingHint: string;
    features: string;
    advancedWalletsSetting: string;
    advancedWalletsSettingHint: string;
    smartInsightsSetting: string;
    smartInsightsSettingHint: string;
    privacy: string;
    pinProtection: string;
    pinProtectionHint: string;
    enabled: string;
    disabled: string;
    enablePin: string;
    changePin: string;
    disablePin: string;
    disablePinHint: string;
    currentPin: string;
    newPin: string;
    confirmPin: string;
    pinRequirements: string;
    pinMismatch: string;
    pinIncorrect: string;
    pinSaveError: string;
    autoLock: string;
    autoLockNever: string;
    autoLockMinutes: string;
    lockNow: string;
    hideAmounts: string;
    showAmounts: string;
    hideAmountsHint: string;
    localPrivacyNote: string;
    appLocked: string;
    appLockedHint: string;
    enterPin: string;
    pinKeypad: string;
    deleteDigit: string;
    checkingPin: string;
    unlock: string;
    globalCurrency: string;
    dateFormat: string;
    dateFormats: Record<DateFormatLabel, string>;
    system: string;
    light: string;
    dark: string;
    colorTheme: string;
    colorThemes: Record<ColorThemePreference, string>;
    backup: string;
    exportJson: string;
    exportError: string;
    importJson: string;
    importError: string;
    replaceBackup: string;
    automaticBackup: string;
    automaticBackupHint: string;
    backupHistory: string;
    backupHistoryEmpty: string;
    backupOperations: string;
    backupReasonAutomatic: string;
    backupReasonRestore: string;
    restoreBackup: string;
    restoreBackupConfirm: string;
    deleteBackup: string;
    deleteBackupError: string;
    deleteBackupConfirm: string;
    sync: string;
    comingSoon: string;
    syncTitle: string;
    syncBody: string;
    debug: string;
    version: string;
    triggerRuntimeError: string;
    resetLocalData: string;
    resetLocalDataConfirm: string;
    errorPreview: string;
    closePreview: string;
  };
  errors: ErrorCopy;
}

export function getLanguage(locale: string): Language {
  return locale.toLowerCase().startsWith("ru") ? "ru" : "en";
}

export function getLanguageLabel(locale: string): string {
  return languageOptions.find((option) => option.value === locale)?.label ?? "🇷🇺 Русский";
}

export function getCategoryName(name: string | undefined, t: Dictionary): string {
  if (!name) {
    return t.common.uncategorized;
  }
  return t.categoryNames[name] ?? name;
}

export const dictionaries: Record<Language, Dictionary> = {
  en: {
    appName: "Budget Tracker",
    brand: "MyFinances",
    nav: {
      dashboard: "Home",
      history: "History",
      add: "Add",
      wallets: "Wallets",
      settings: "Settings"
    },
    shortcuts: {
      title: "Shortcuts",
      newTransaction: "New transaction",
      search: "Search history"
    },
    common: {
      add: "Add",
      all: "All",
      back: "Back",
      balance: "Balance",
      cancel: "Cancel",
      category: "Category",
      close: "Close",
      color: "Color",
      copied: "Copied",
      copyDetails: "Copy details",
      currency: "Currency",
      date: "Date",
      delete: "Delete",
      edit: "Edit",
      expense: "Expense",
      expenses: "Expenses",
      income: "Income",
      language: "Language",
      name: "Name",
      nextMonth: "Next month",
      note: "Note",
      previousMonth: "Previous month",
      reload: "Reload",
      saved: "Saved",
      timeZone: "Time zone",
      today: "Today",
      uncategorized: "Uncategorized",
      wallet: "Wallet"
    },
    onboarding: {
      welcomeEyebrow: "Welcome",
      welcomeTitle: "Let’s set up your finance space",
      welcomeBody: "Choose the language first. The next step will prepare currency, theme, and your first wallet.",
      languageTitle: "Language",
      start: "Start setup",
      setupEyebrow: "First setup",
      setupTitle: "Make it yours",
      setupBody: "These choices can be changed later in settings.",
      globalCurrency: "Global currency",
      walletName: "First wallet name",
      walletNamePlaceholder: "Everyday",
      walletCurrency: "Wallet currency",
      theme: "Theme",
      colorTheme: "Color theme",
      finish: "Finish setup",
      back: "Back",
      error: "Unable to finish setup."
    },
    greetings: {
      morning: ["Good morning", "Morning check-in", "Fresh start", "Ready for today"],
      day: ["Good afternoon", "Midday money pulse", "Today in focus"],
      evening: ["Good evening", "Evening balance check"],
      night: ["Late-night overview"]
    },
    categoryNames: {
      Groceries: "Groceries",
      Transport: "Transport",
      Home: "Home",
      Dining: "Dining",
      Health: "Health",
      Salary: "Salary",
      Freelance: "Freelance",
      Gifts: "Gifts"
    },
    dashboard: {
      spending: "Spending",
      recent: "Recent",
      emptyChart: "Charts appear after the first expenses.",
      emptyTransactions: "No transactions yet.",
      addTransaction: "Add transaction",
      convertedTo: "Converted to",
      exchangeRatesLoading: "Updating exchange rates",
      exchangeRatesUnavailable: "Some exchange rates are unavailable",
      cashFlow: "Cash flow",
      openAnalytics: "Detailed analytics",
      analyticsEyebrow: "Insights",
      analyticsTitle: "Financial analytics",
      backToOverview: "Back to overview",
      averageTransaction: "Average transaction",
      topCategory: "Top category",
      trend: "Daily trend",
      lastSevenDays: "Last 7 days",
      operations: "operations",
      categoriesBreakdown: "Category breakdown",
      categoryComparison: "Your largest categories"
    },
    insights: {
      title: "Money observations",
      hint: "Calculated locally from your transactions. No data leaves this device.",
      empty: "Add a few transactions and useful patterns will appear here.",
      spendingUp: "Spending is up {percentage}% from the same part of last month.",
      spendingDown: "Spending is down {percentage}% from the same part of last month.",
      largestCategory: "{category} is the largest expense category this month at {percentage}%.",
      recurringShare: "Recurring expenses use {percentage}% of this month's income.",
      expenseCount: "You recorded {count} expenses over the last seven days.",
      noSpendStreak: "No expenses recorded for {days} days in a row."
    },
    analytics: {
      period: "Period",
      week: "Week",
      month: "Month",
      year: "Year",
      custom: "Custom",
      dateFrom: "From",
      dateTo: "To",
      currentPeriod: "Current period",
      previousPeriod: "Previous period",
      change: "Change",
      comparedWithPrevious: "Compared with the previous period",
      allCategories: "All categories",
      missingRates: "Some foreign-currency operations are not included.",
      noComparison: "There is not enough previous-period data for a percentage comparison.",
      unchanged: "The value stayed unchanged compared with the previous period.",
      expenseIncreased: "Expenses increased by {percentage}% compared with the previous period.",
      expenseDecreased: "Expenses decreased by {percentage}% compared with the previous period.",
      incomeIncreased: "Income increased by {percentage}% compared with the previous period.",
      incomeDecreased: "Income decreased by {percentage}% compared with the previous period."
    },
    budget: {
      title: "Budget",
      monthPlan: "Monthly budget",
      description: "Set category limits and keep the month under control.",
      configure: "Plan budget",
      planned: "Planned",
      spent: "Spent",
      remaining: "Remaining",
      categoryLimits: "Category limits",
      limit: "Limit",
      back: "Back to overview",
      save: "Save budget",
      saved: "Budget saved",
      saveError: "Unable to save budget.",
      previousMonth: "Previous month",
      nextMonth: "Next month",
      notConfigured: "No limits are planned for this month yet.",
      noExpenseCategories: "Create an expense category before planning a budget.",
      overBy: "Over budget by",
      missingRates: "Some foreign-currency expenses are not included."
    },
    transaction: {
      addTitle: "Add transaction",
      editTitle: "Edit transaction",
      amount: "Amount",
      quickHint: "Amount and category are enough — the rest is optional.",
      quickTemplates: "Quick templates",
      quickTemplatesHint: "Repeat a recent transaction in one tap.",
      manageTemplates: "Manage templates",
      repeatLast: "Repeat last",
      newTemplate: "New template",
      templateManagerHint: "Save the transactions you use most often. An amount is optional.",
      templateName: "Template name",
      templateNamePlaceholder: "Coffee, groceries, taxi",
      templateAmount: "Default amount",
      templateAmountPlaceholder: "Optional, calculations work too",
      saveTemplate: "Save template",
      templateRequired: "Choose a name and category.",
      templateSaveError: "Unable to save the template.",
      confirmDeleteTemplate: "Delete this template?",
      templateEmpty: "No custom templates yet.",
      amountNotSet: "Any amount",
      suggestedCategory: "Suggested category: {category}",
      addAnother: "Add another",
      calculate: "Calculate",
      calculatorOperator: "Calculator operator",
      calculatorError: "Enter a positive amount or a valid calculation.",
      tags: "Tags",
      tagsPlaceholder: "coffee, travel, work",
      chooseCategory: "Choose a category.",
      chooseWalletAndCategory: "Choose a wallet and category.",
      selectWalletFirst: "Choose a specific wallet above before adding a transaction.",
      details: "Details",
      detailsHint: "Date, note, and tags",
      showDetails: "Show details",
      hideDetails: "Hide details",
      allCategories: "All categories",
      fewerCategories: "Show fewer",
      save: "Save transaction",
      update: "Update transaction",
      saveError: "Unable to save transaction."
    },
    recurring: {
      tabSingle: "One-time",
      tabRecurring: "Recurring",
      title: "Recurring transactions",
      description: "Salary, subscriptions, and regular bills will be added when the app opens.",
      add: "Add schedule",
      newTitle: "New recurring transaction",
      editTitle: "Edit recurring transaction",
      frequency: "Repeats",
      firstDate: "First occurrence",
      nextRun: "Next",
      daily: "Every day",
      weekly: "Every week",
      monthly: "Every month",
      yearly: "Every year",
      create: "Create schedule",
      update: "Update schedule",
      pause: "Pause",
      resume: "Resume",
      paused: "Paused",
      empty: "No recurring transactions for this wallet yet.",
      confirmDelete: "Delete this recurring transaction?",
      chooseCategory: "Choose a category.",
      saveError: "Unable to save recurring transaction.",
      openAppHint: "Due operations are created automatically when MyFinances opens."
    },
    history: {
      title: "History",
      viewList: "List",
      viewTable: "Table",
      viewCalendar: "Calendar",
      exportCsv: "Export CSV",
      selectAll: "Select all visible transactions",
      selectTransaction: "Select {category}",
      selected: "Selected: {count}",
      bulkCategory: "Change category",
      chooseBulkCategory: "Choose a category",
      mixedTypesHint: "Choose transactions of one type to change their category.",
      applyCategory: "Apply category",
      deleteSelected: "Delete",
      confirmDeleteSelected: "Delete {count} selected transactions?",
      csvDate: "Date",
      csvType: "Type",
      csvAmount: "Amount",
      csvCurrency: "Currency",
      csvCategory: "Category",
      csvWallet: "Wallet",
      csvNote: "Note",
      csvTags: "Tags",
      calendarSelectedDay: "Selected day",
      calendarEmptyDay: "No transactions on this day.",
      calendarMissingRates: "Some totals exclude transactions without an exchange rate.",
      search: "Search",
      searchPlaceholder: "Tag, category, wallet, or note",
      allCategories: "All categories",
      empty: "No transactions match these filters.",
      confirmDelete: "Delete this transaction?",
      sort: "Sort",
      sortOptions: {
        dateDesc: "Newest first",
        dateAsc: "Oldest first",
        amountDesc: "Amount high to low",
        amountAsc: "Amount low to high",
        categoryAsc: "Category A-Z",
        categoryDesc: "Category Z-A",
        walletAsc: "Wallet A-Z",
        walletDesc: "Wallet Z-A"
      }
    },
    wallets: {
      title: "Wallets",
      allWallets: "All wallets",
      add: "Add wallet",
      archive: "Archive",
      confirmArchive: "Archive this wallet?",
      createEmpty: "Create a wallet to start tracking.",
      newTitle: "New wallet",
      editTitle: "Edit wallet",
      create: "Create wallet",
      update: "Update wallet",
      saveError: "Unable to save wallet.",
      swipeHint: "Swipe this card to switch wallets",
      initialBalance: "Initial balance",
      initialBalanceHint: "The amount already in this wallet. It is not counted as income.",
      initialBalanceError: "Enter a valid initial balance.",
      transfers: "Transfers",
      transferDescription: "Move money between wallets without changing income or expenses.",
      addTransfer: "New transfer",
      transferEmpty: "No transfers yet.",
      transferNeedsWallets: "Create at least two wallets to make a transfer.",
      fromWallet: "From wallet",
      toWallet: "To wallet",
      sentAmount: "Sent amount",
      receivedAmount: "Received amount",
      transferDate: "Transfer date",
      transferNote: "Note",
      saveTransfer: "Save transfer",
      transferSaveError: "Unable to save the transfer.",
      confirmDeleteTransfer: "Delete this transfer?",
      walletUnavailable: "Unavailable wallet",
      icon: "Wallet icon",
      color: "Wallet color",
      manageArchive: "Manage archive",
      archiveTitle: "Archived wallets",
      archiveEmpty: "The archive is empty.",
      restore: "Restore",
      archiveError: "Unable to archive the wallet.",
      restoreError: "Unable to restore the wallet.",
      cannotArchiveLast: "Create another wallet before archiving this one.",
      kind: "Wallet type",
      kindCash: "Regular",
      kindCredit: "Credit",
      creditLimit: "Credit limit",
      creditLimitHint: "Available credit is calculated from the limit and the current balance.",
      creditLimitError: "Enter a valid credit limit.",
      creditAvailable: "Available",
      creditUsed: "Credit used",
      excludeFromTotals: "Exclude from totals",
      excludeFromTotalsHint: "Keep this wallet accessible, but omit it from the combined balance and analytics.",
      excludedBadge: "Excluded from totals",
      hideWalletBalance: "Hide this wallet's balance",
      hideWalletBalanceHint: "Mask amounts only when this wallet is open or shown in the wallet list."
    },
    goals: {
      tabWallets: "Wallets",
      tabGoals: "Goals",
      title: "Savings goals",
      description: "Set money aside without mixing it with income and expenses.",
      add: "Add goal",
      empty: "Create your first goal and start moving toward it.",
      newTitle: "New savings goal",
      editTitle: "Edit savings goal",
      name: "Goal name",
      namePlaceholder: "Emergency fund, trip, new laptop",
      targetAmount: "Target amount",
      targetDate: "Target date",
      noDeadline: "No deadline",
      addDeadline: "Add deadline",
      removeDeadline: "Remove deadline",
      saved: "Saved",
      remaining: "Remaining",
      completed: "Goal reached",
      create: "Create goal",
      update: "Update goal",
      contribute: "Add money",
      contributionTitle: "Add to goal",
      contributionAmount: "Amount",
      contributionDate: "Date",
      contributionNote: "Note",
      addContribution: "Save contribution",
      history: "Contribution history",
      noContributions: "No contributions yet.",
      confirmDelete: "Delete this goal and its contribution history?",
      confirmDeleteContribution: "Delete this contribution?",
      saveError: "Unable to save the goal.",
      contributionError: "Unable to save the contribution.",
      walletMissing: "Wallet unavailable",
      overdue: "Deadline passed"
    },
    cookieNotice: {
      title: "Your privacy",
      body: "MyFinances stores your settings and finance data only on this device. We do not use advertising cookies.",
      accept: "Got it"
    },
    connectivity: {
      offline: "Offline — changes stay safely on this device",
      online: "Connection restored"
    },
    notifications: {
      title: "Notifications",
      open: "Open notifications",
      unread: "unread",
      markAllRead: "Mark all as read",
      empty: "You are all caught up.",
      detailsTitle: "Notification details",
      backToNotifications: "Back to notifications",
      detailVersion: "Version",
      detailChanges: "Changes",
      detailCategory: "Category",
      detailUsage: "Limit used",
      detailPeriod: "Period",
      detailDate: "Date",
      detailGoal: "Goal",
      detailStatus: "Status",
      statusCompleted: "Completed",
      statusOverdue: "Overdue",
      statusUpcoming: "Upcoming",
      updateTitle: "MyFinances {version} is ready",
      updateBody: "See the latest improvements in this update.",
      budgetNearTitle: "Budget is running low",
      budgetNearBody: "{category}: {percentage}% of the monthly limit has been used.",
      budgetExceededTitle: "Budget exceeded",
      budgetExceededBody: "{category}: spending reached {percentage}% of the monthly limit.",
      recurringTitle: "Recurring operation is coming up",
      recurringBody: "{category} is scheduled for {date}.",
      goalCompletedTitle: "Savings goal reached",
      goalCompletedBody: "You have collected the full amount for “{goal}”.",
      goalDeadlineTitle: "Savings goal deadline is near",
      goalDeadlineBody: "“{goal}” is due on {date}.",
      goalOverdueTitle: "Savings goal is overdue",
      goalOverdueBody: "The deadline for “{goal}” was {date}."
    },
    updates: {
      title: "What’s new",
      eyebrow: "Version {version}",
      intro: "More control on every device, with privacy and productivity features that stay optional.",
      gotIt: "Explore the update",
      notes: [
        "Optional PIN, auto-lock, and private balance visibility controls",
        "Faster transactions, advanced wallets, and local smart insights",
        "Desktop shortcuts, table history, bulk actions, and filtered CSV export"
      ]
    },
    categories: {
      title: "Categories",
      icon: "Icon",
      iconSearch: "Search icons",
      iconSearchEmpty: "No icons match this search.",
      recentColors: "Recently used",
      organize: "Organize",
      reorderHint: "Drag categories to change their order.",
      actionReplace: "Replace",
      actionMerge: "Merge",
      source: "Category to replace",
      target: "New category",
      replaceDescription: "Move all transactions, schedules, and budgets to another category.",
      mergeDescription: "Move everything to another category and remove the old category.",
      applyAction: "Apply changes",
      chooseDifferent: "Choose two different categories.",
      newTitle: "New category",
      editTitle: "Edit category",
      create: "Create category",
      update: "Update category",
      empty: "Add categories for income and expenses.",
      confirmDelete: "Delete this category?",
      saveError: "Unable to save category."
    },
    settings: {
      title: "Settings",
      section: "Section",
      saving: "Saving changes…",
      saved: "Changes saved",
      saveError: "Unable to save changes. Try again.",
      tabs: {
        general: "General",
        appearance: "Appearance",
        automation: "Quick entry",
        features: "Features",
        privacy: "Privacy",
        categories: "Categories",
        backup: "Backup",
        sync: "Sync",
        debug: "Debug"
      },
      general: "General",
      appearance: "Appearance",
      automation: "Quick entry",
      quickTemplatesSetting: "Quick templates",
      quickTemplatesSettingHint: "Show recent and saved transaction shortcuts above the entry form.",
      categorySuggestionsSetting: "Category suggestions",
      categorySuggestionsSettingHint: "Suggest a category from similar notes and tags saved on this device.",
      addAnotherSetting: "Add another after saving",
      addAnotherSettingHint: "Show a shortcut to enter the next transaction without leaving the form.",
      features: "Features",
      advancedWalletsSetting: "Advanced wallet options",
      advancedWalletsSettingHint: "Enable credit limits, per-wallet privacy, and exclusion from combined statistics.",
      smartInsightsSetting: "Money observations",
      smartInsightsSettingHint: "Show optional local summaries and patterns on the home screen. No notifications or cloud analysis.",
      privacy: "Privacy",
      pinProtection: "PIN protection",
      pinProtectionHint: "Lock access to the app on this device. The feature is optional and can be removed at any time.",
      enabled: "Enabled",
      disabled: "Disabled",
      enablePin: "Enable PIN",
      changePin: "Change PIN",
      disablePin: "Disable PIN",
      disablePinHint: "Enter your current PIN to remove protection from this device.",
      currentPin: "Current PIN",
      newPin: "New PIN",
      confirmPin: "Confirm PIN",
      pinRequirements: "Use 4 to 12 digits. The PIN cannot be recovered if you forget it.",
      pinMismatch: "The PIN values do not match.",
      pinIncorrect: "Incorrect PIN. Try again.",
      pinSaveError: "Unable to update PIN protection.",
      autoLock: "Automatic lock",
      autoLockNever: "Never",
      autoLockMinutes: "After {minutes} min",
      lockNow: "Lock now",
      hideAmounts: "Hide amounts",
      showAmounts: "Show amounts",
      hideAmountsHint: "Replace financial values with dots throughout the app. Use the eye button to switch quickly.",
      localPrivacyNote: "PIN protection is stored only on this device and is intended to prevent casual access. It does not encrypt browser storage.",
      appLocked: "App locked",
      appLockedHint: "Enter your PIN to return to your finances.",
      enterPin: "PIN",
      pinKeypad: "PIN keypad",
      deleteDigit: "Delete last digit",
      checkingPin: "Checking…",
      unlock: "Unlock",
      globalCurrency: "Global currency",
      dateFormat: "Date format",
      dateFormats: {
        short: "Short",
        medium: "Medium",
        long: "Long"
      },
      system: "System",
      light: "Light",
      dark: "Dark",
      colorTheme: "Color theme",
      colorThemes: {
        sage: "Sage",
        rose: "Rose",
        violet: "Violet",
        sky: "Sky",
        amber: "Amber",
        graphite: "Graphite",
        mint: "Mint",
        coral: "Coral"
      },
      backup: "Backup",
      exportJson: "Export JSON",
      exportError: "Unable to export backup.",
      importJson: "Import JSON",
      importError: "Unable to import backup.",
      replaceBackup: "Replace local data with this backup?",
      automaticBackup: "Automatic local backups",
      automaticBackupHint: "MyFinances saves recent versions on this device as your data changes.",
      backupHistory: "Restore history",
      backupHistoryEmpty: "Automatic backups will appear here after your next change.",
      backupOperations: "transactions",
      backupReasonAutomatic: "Automatic backup",
      backupReasonRestore: "Before restoration",
      restoreBackup: "Restore",
      restoreBackupConfirm: "Replace current local data with this saved version?",
      deleteBackup: "Delete backup",
      deleteBackupError: "Unable to delete this backup.",
      deleteBackupConfirm: "Delete this saved version?",
      sync: "Sync",
      comingSoon: "Coming soon",
      syncTitle: "Cloud sync is planned",
      syncBody: "Accounts, cloud backup, restore, and multi-device synchronization will live here.",
      debug: "Debug",
      version: "Version",
      triggerRuntimeError: "Trigger runtime error",
      resetLocalData: "Reset local data",
      resetLocalDataConfirm: "Clear local data, cookies, and restart onboarding?",
      errorPreview: "Error preview",
      closePreview: "Close preview"
    },
    errors: {
      actions: {
        back: "Back",
        copied: "Copied",
        copyDetails: "Copy details",
        debugDetails: "Debug details",
        goHome: "Go home",
        reload: "Reload",
        reloadApp: "Reload app"
      },
      bootTitle: "Unable to load MyFinances",
      presets: {
        "bad-request": {
          eyebrow: "Bad request",
          title: "The request is not valid",
          description: "Something in the request shape is malformed. Check the input and try again."
        },
        unauthorized: {
          eyebrow: "Unauthorized",
          title: "Sign in is required",
          description: "This area needs an account session. Local-only mode still works without cloud access."
        },
        forbidden: {
          eyebrow: "Forbidden",
          title: "You do not have access",
          description: "The account does not have permission for this resource."
        },
        "not-found": {
          eyebrow: "Not found",
          title: "This page does not exist",
          description: "The link may be stale, mistyped, or not available in the local app."
        },
        server: {
          eyebrow: "Server error",
          title: "Something broke",
          description: "The app hit an unexpected failure. Reloading usually clears temporary runtime state."
        },
        unavailable: {
          eyebrow: "Unavailable",
          title: "Service is temporarily unavailable",
          description: "Cloud services are not reachable right now. Local data remains available."
        },
        offline: {
          eyebrow: "Offline",
          title: "You are offline",
          description: "The app can keep working locally. Sync and cloud backup resume when the network returns."
        },
        maintenance: {
          eyebrow: "Maintenance",
          title: "Maintenance is in progress",
          description: "This area is paused while infrastructure work is happening."
        },
        storage: {
          eyebrow: "Local storage",
          title: "Local data could not be opened",
          description: "IndexedDB may be blocked, full, or corrupted. Exported backups can restore data later."
        },
        runtime: {
          eyebrow: "Runtime error",
          title: "The app hit a critical error",
          description: "A local runtime error stopped this screen. The debug details below can help trace it."
        }
      }
    }
  },
  ru: {
    appName: "Бюджет",
    brand: "MyFinances",
    nav: {
      dashboard: "Главная",
      history: "История",
      add: "Добавить",
      wallets: "Кошельки",
      settings: "Настройки"
    },
    shortcuts: {
      title: "Быстрые действия",
      newTransaction: "Новая операция",
      search: "Поиск в истории"
    },
    common: {
      add: "Добавить",
      all: "Все",
      back: "Назад",
      balance: "Баланс",
      cancel: "Отмена",
      category: "Категория",
      close: "Закрыть",
      color: "Цвет",
      copied: "Скопировано",
      copyDetails: "Скопировать детали",
      currency: "Валюта",
      date: "Дата",
      delete: "Удалить",
      edit: "Редактировать",
      expense: "Расход",
      expenses: "Расходы",
      income: "Доход",
      language: "Язык",
      name: "Название",
      nextMonth: "Следующий месяц",
      note: "Заметка",
      previousMonth: "Предыдущий месяц",
      reload: "Перезагрузить",
      saved: "Сохранено",
      timeZone: "Часовой пояс",
      today: "Сегодня",
      uncategorized: "Без категории",
      wallet: "Кошелек"
    },
    onboarding: {
      welcomeEyebrow: "Добро пожаловать",
      welcomeTitle: "Давай настроим твое финансовое пространство",
      welcomeBody: "Сначала выбери язык. На следующем шаге подготовим валюту, тему и первый кошелек.",
      languageTitle: "Язык",
      start: "Начать настройку",
      setupEyebrow: "Первый запуск",
      setupTitle: "Настроим под тебя",
      setupBody: "Все это потом можно будет изменить в настройках.",
      globalCurrency: "Общая валюта",
      walletName: "Название первого кошелька",
      walletNamePlaceholder: "Основной",
      walletCurrency: "Валюта кошелька",
      theme: "Тема",
      colorTheme: "Цветовая тема",
      finish: "Завершить настройку",
      back: "Назад",
      error: "Не удалось завершить настройку."
    },
    greetings: {
      morning: ["Доброе утро", "Утренний чек-ин", "Свежий старт", "План на день готов"],
      day: ["Добрый день", "Дневной срез финансов", "Фокус на сегодня"],
      evening: ["Добрый вечер", "Вечерняя сверка баланса"],
      night: ["Ночной обзор"]
    },
    categoryNames: {
      Groceries: "Продукты",
      Transport: "Транспорт",
      Home: "Дом",
      Dining: "Кафе",
      Health: "Здоровье",
      Salary: "Зарплата",
      Freelance: "Фриланс",
      Gifts: "Подарки"
    },
    dashboard: {
      spending: "Траты",
      recent: "Последние",
      emptyChart: "График появится после первого расхода.",
      emptyTransactions: "Операций пока нет.",
      addTransaction: "Добавить операцию",
      convertedTo: "Конвертировано в",
      exchangeRatesLoading: "Обновляем курсы валют",
      exchangeRatesUnavailable: "Некоторые курсы валют недоступны",
      cashFlow: "Движение денег",
      openAnalytics: "Подробнее",
      analyticsEyebrow: "Аналитика",
      analyticsTitle: "Финансовая аналитика",
      backToOverview: "Назад к обзору",
      averageTransaction: "Средняя операция",
      topCategory: "Главная категория",
      trend: "Динамика по дням",
      lastSevenDays: "Последние 7 дней",
      operations: "операций",
      categoriesBreakdown: "По категориям",
      categoryComparison: "Самые крупные категории"
    },
    insights: {
      title: "Наблюдения о деньгах",
      hint: "Рассчитываются локально по операциям. Данные не покидают устройство.",
      empty: "Добавь несколько операций — здесь появятся полезные закономерности.",
      spendingUp: "Расходы выросли на {percentage}% относительно той же части прошлого месяца.",
      spendingDown: "Расходы снизились на {percentage}% относительно той же части прошлого месяца.",
      largestCategory: "{category} — крупнейшая категория месяца: {percentage}% расходов.",
      recurringShare: "Регулярные расходы занимают {percentage}% дохода этого месяца.",
      expenseCount: "За последние семь дней добавлено расходов: {count}.",
      noSpendStreak: "Дней подряд без расходов: {days}."
    },
    analytics: {
      period: "Период",
      week: "Неделя",
      month: "Месяц",
      year: "Год",
      custom: "Свой",
      dateFrom: "С",
      dateTo: "По",
      currentPeriod: "Текущий период",
      previousPeriod: "Предыдущий период",
      change: "Изменение",
      comparedWithPrevious: "Относительно предыдущего периода",
      allCategories: "Все категории",
      missingRates: "Некоторые операции в другой валюте не учтены.",
      noComparison: "В предыдущем периоде недостаточно данных для сравнения в процентах.",
      unchanged: "Значение не изменилось относительно предыдущего периода.",
      expenseIncreased: "Расходы выросли на {percentage}% относительно предыдущего периода.",
      expenseDecreased: "Расходы снизились на {percentage}% относительно предыдущего периода.",
      incomeIncreased: "Доходы выросли на {percentage}% относительно предыдущего периода.",
      incomeDecreased: "Доходы снизились на {percentage}% относительно предыдущего периода."
    },
    budget: {
      title: "Бюджет",
      monthPlan: "Бюджет месяца",
      description: "Задай лимиты по категориям и контролируй расходы месяца.",
      configure: "Запланировать",
      planned: "Запланировано",
      spent: "Потрачено",
      remaining: "Осталось",
      categoryLimits: "Лимиты категорий",
      limit: "Лимит",
      back: "Назад к обзору",
      save: "Сохранить бюджет",
      saved: "Бюджет сохранён",
      saveError: "Не удалось сохранить бюджет.",
      previousMonth: "Предыдущий месяц",
      nextMonth: "Следующий месяц",
      notConfigured: "На этот месяц лимиты пока не запланированы.",
      noExpenseCategories: "Создай расходную категорию перед планированием бюджета.",
      overBy: "Превышение на",
      missingRates: "Некоторые расходы в другой валюте не учтены."
    },
    transaction: {
      addTitle: "Добавить операцию",
      editTitle: "Редактировать операцию",
      amount: "Сумма",
      quickHint: "Достаточно суммы и категории — остальное необязательно.",
      quickTemplates: "Быстрые шаблоны",
      quickTemplatesHint: "Повтори недавнюю операцию одним нажатием.",
      manageTemplates: "Управление шаблонами",
      repeatLast: "Повторить последнюю",
      newTemplate: "Новый шаблон",
      templateManagerHint: "Сохраняй частые операции. Сумму можно не указывать.",
      templateName: "Название шаблона",
      templateNamePlaceholder: "Кофе, продукты, такси",
      templateAmount: "Сумма по умолчанию",
      templateAmountPlaceholder: "Необязательно, можно с вычислением",
      saveTemplate: "Сохранить шаблон",
      templateRequired: "Выбери название и категорию.",
      templateSaveError: "Не удалось сохранить шаблон.",
      confirmDeleteTemplate: "Удалить этот шаблон?",
      templateEmpty: "Пользовательских шаблонов пока нет.",
      amountNotSet: "Любая сумма",
      suggestedCategory: "Предлагаемая категория: {category}",
      addAnother: "Добавить ещё",
      calculate: "Посчитать",
      calculatorOperator: "Оператор калькулятора",
      calculatorError: "Введи положительную сумму или корректное вычисление.",
      tags: "Теги",
      tagsPlaceholder: "кофе, поездка, работа",
      chooseCategory: "Выбери категорию.",
      chooseWalletAndCategory: "Выбери кошелек и категорию.",
      selectWalletFirst: "Выбери конкретный кошелек сверху, чтобы добавить операцию.",
      details: "Детали",
      detailsHint: "Дата, заметка и теги",
      showDetails: "Показать детали",
      hideDetails: "Скрыть детали",
      allCategories: "Все категории",
      fewerCategories: "Свернуть",
      save: "Сохранить операцию",
      update: "Обновить операцию",
      saveError: "Не удалось сохранить операцию."
    },
    recurring: {
      tabSingle: "Разовая",
      tabRecurring: "Регулярные",
      title: "Регулярные операции",
      description: "Зарплата, подписки и постоянные платежи будут добавляться при открытии приложения.",
      add: "Добавить расписание",
      newTitle: "Новая регулярная операция",
      editTitle: "Редактировать регулярную операцию",
      frequency: "Повтор",
      firstDate: "Первое списание",
      nextRun: "Следующая",
      daily: "Каждый день",
      weekly: "Каждую неделю",
      monthly: "Каждый месяц",
      yearly: "Каждый год",
      create: "Создать расписание",
      update: "Обновить расписание",
      pause: "Приостановить",
      resume: "Продолжить",
      paused: "Приостановлено",
      empty: "Для этого кошелька регулярных операций пока нет.",
      confirmDelete: "Удалить эту регулярную операцию?",
      chooseCategory: "Выбери категорию.",
      saveError: "Не удалось сохранить регулярную операцию.",
      openAppHint: "Наступившие операции создаются автоматически при открытии MyFinances."
    },
    history: {
      title: "История",
      viewList: "Список",
      viewTable: "Таблица",
      viewCalendar: "Календарь",
      exportCsv: "Экспорт CSV",
      selectAll: "Выбрать все видимые операции",
      selectTransaction: "Выбрать операцию «{category}»",
      selected: "Выбрано: {count}",
      bulkCategory: "Изменить категорию",
      chooseBulkCategory: "Выбери категорию",
      mixedTypesHint: "Для замены категории выбери операции одного типа.",
      applyCategory: "Применить категорию",
      deleteSelected: "Удалить",
      confirmDeleteSelected: "Удалить выбранные операции ({count})?",
      csvDate: "Дата",
      csvType: "Тип",
      csvAmount: "Сумма",
      csvCurrency: "Валюта",
      csvCategory: "Категория",
      csvWallet: "Кошелек",
      csvNote: "Заметка",
      csvTags: "Теги",
      calendarSelectedDay: "Выбранный день",
      calendarEmptyDay: "В этот день операций нет.",
      calendarMissingRates: "Некоторые итоги не включают операции без курса валют.",
      search: "Поиск",
      searchPlaceholder: "Тег, категория, кошелек или заметка",
      allCategories: "Все категории",
      empty: "Операций по этим фильтрам нет.",
      confirmDelete: "Удалить эту операцию?",
      sort: "Сортировка",
      sortOptions: {
        dateDesc: "Сначала новые",
        dateAsc: "Сначала старые",
        amountDesc: "Сумма по убыванию",
        amountAsc: "Сумма по возрастанию",
        categoryAsc: "Категория А-Я",
        categoryDesc: "Категория Я-А",
        walletAsc: "Кошелек А-Я",
        walletDesc: "Кошелек Я-А"
      }
    },
    wallets: {
      title: "Кошельки",
      allWallets: "Все кошельки",
      add: "Добавить кошелек",
      archive: "Архивировать",
      confirmArchive: "Архивировать этот кошелек?",
      createEmpty: "Создай кошелек, чтобы начать учет.",
      newTitle: "Новый кошелек",
      editTitle: "Редактировать кошелек",
      create: "Создать кошелек",
      update: "Обновить кошелек",
      saveError: "Не удалось сохранить кошелек.",
      swipeHint: "Свайпни карточку, чтобы сменить кошелек",
      initialBalance: "Начальный баланс",
      initialBalanceHint: "Сумма, которая уже была в кошельке. Она не считается доходом.",
      initialBalanceError: "Укажи корректный начальный баланс.",
      transfers: "Переводы",
      transferDescription: "Перемещай деньги между кошельками без искажения доходов и расходов.",
      addTransfer: "Новый перевод",
      transferEmpty: "Переводов пока нет.",
      transferNeedsWallets: "Для перевода нужно создать хотя бы два кошелька.",
      fromWallet: "Из кошелька",
      toWallet: "В кошелек",
      sentAmount: "Сумма списания",
      receivedAmount: "Сумма зачисления",
      transferDate: "Дата перевода",
      transferNote: "Заметка",
      saveTransfer: "Сохранить перевод",
      transferSaveError: "Не удалось сохранить перевод.",
      confirmDeleteTransfer: "Удалить этот перевод?",
      walletUnavailable: "Недоступный кошелек",
      icon: "Иконка кошелька",
      color: "Цвет кошелька",
      manageArchive: "Управление архивом",
      archiveTitle: "Архивные кошельки",
      archiveEmpty: "Архив пока пуст.",
      restore: "Восстановить",
      archiveError: "Не удалось архивировать кошелек.",
      restoreError: "Не удалось восстановить кошелек.",
      cannotArchiveLast: "Сначала создай другой кошелек, затем архивируй этот.",
      kind: "Тип кошелька",
      kindCash: "Обычный",
      kindCredit: "Кредитный",
      creditLimit: "Кредитный лимит",
      creditLimitHint: "Доступная сумма рассчитывается из лимита и текущего баланса.",
      creditLimitError: "Укажи корректный кредитный лимит.",
      creditAvailable: "Доступно",
      creditUsed: "Использовано кредита",
      excludeFromTotals: "Не учитывать в общем итоге",
      excludeFromTotalsHint: "Кошелек останется доступным, но не попадёт в общий баланс и аналитику.",
      excludedBadge: "Не входит в итог",
      hideWalletBalance: "Скрывать баланс этого кошелька",
      hideWalletBalanceHint: "Маскировать суммы только для этого кошелька в списке и при его открытии."
    },
    goals: {
      tabWallets: "Кошельки",
      tabGoals: "Цели",
      title: "Цели накоплений",
      description: "Откладывай деньги отдельно от доходов и расходов.",
      add: "Добавить цель",
      empty: "Создай первую цель и начни двигаться к ней.",
      newTitle: "Новая цель",
      editTitle: "Редактировать цель",
      name: "Название цели",
      namePlaceholder: "Подушка, поездка, новый ноутбук",
      targetAmount: "Нужно накопить",
      targetDate: "Срок",
      noDeadline: "Без срока",
      addDeadline: "Добавить срок",
      removeDeadline: "Убрать срок",
      saved: "Накоплено",
      remaining: "Осталось",
      completed: "Цель достигнута",
      create: "Создать цель",
      update: "Обновить цель",
      contribute: "Пополнить",
      contributionTitle: "Пополнение цели",
      contributionAmount: "Сумма",
      contributionDate: "Дата",
      contributionNote: "Заметка",
      addContribution: "Сохранить пополнение",
      history: "История пополнений",
      noContributions: "Пополнений пока нет.",
      confirmDelete: "Удалить цель вместе с историей пополнений?",
      confirmDeleteContribution: "Удалить это пополнение?",
      saveError: "Не удалось сохранить цель.",
      contributionError: "Не удалось сохранить пополнение.",
      walletMissing: "Кошелек недоступен",
      overdue: "Срок прошёл"
    },
    cookieNotice: {
      title: "О приватности",
      body: "MyFinances хранит настройки и финансовые данные только на этом устройстве. Рекламные cookies не используются.",
      accept: "Понятно"
    },
    connectivity: {
      offline: "Нет сети — изменения сохраняются на устройстве",
      online: "Соединение восстановлено"
    },
    notifications: {
      title: "Уведомления",
      open: "Открыть уведомления",
      unread: "непрочитанных",
      markAllRead: "Прочитать все",
      empty: "Новых уведомлений нет.",
      detailsTitle: "Подробнее об уведомлении",
      backToNotifications: "Назад к уведомлениям",
      detailVersion: "Версия",
      detailChanges: "Изменения",
      detailCategory: "Категория",
      detailUsage: "Использовано лимита",
      detailPeriod: "Период",
      detailDate: "Дата",
      detailGoal: "Цель",
      detailStatus: "Статус",
      statusCompleted: "Выполнено",
      statusOverdue: "Просрочено",
      statusUpcoming: "Скоро",
      updateTitle: "MyFinances {version} уже здесь",
      updateBody: "Посмотри, что изменилось в новой версии.",
      budgetNearTitle: "Бюджет подходит к лимиту",
      budgetNearBody: "{category}: использовано {percentage}% месячного лимита.",
      budgetExceededTitle: "Бюджет превышен",
      budgetExceededBody: "{category}: расходы достигли {percentage}% месячного лимита.",
      recurringTitle: "Скоро регулярная операция",
      recurringBody: "{category} запланирована на {date}.",
      goalCompletedTitle: "Цель накоплений достигнута",
      goalCompletedBody: "Полная сумма для цели «{goal}» уже накоплена.",
      goalDeadlineTitle: "Приближается срок цели",
      goalDeadlineBody: "Срок цели «{goal}» — {date}.",
      goalOverdueTitle: "Срок цели прошёл",
      goalOverdueBody: "Цель «{goal}» нужно было завершить {date}."
    },
    updates: {
      title: "Что нового",
      eyebrow: "Версия {version}",
      intro: "Больше контроля на любом устройстве — приватность и дополнительные возможности остаются опциональными.",
      gotIt: "Посмотреть обновление",
      notes: [
        "Опциональные PIN-код, автоблокировка и скрытие сумм",
        "Быстрый ввод операций, расширенные кошельки и локальные умные наблюдения",
        "Горячие клавиши, табличная история, массовые действия и экспорт CSV на ПК"
      ]
    },
    categories: {
      title: "Категории",
      icon: "Иконка",
      iconSearch: "Поиск иконок",
      iconSearchEmpty: "Подходящих иконок не найдено.",
      recentColors: "Недавние цвета",
      organize: "Управление",
      reorderHint: "Перетаскивай категории, чтобы изменить порядок.",
      actionReplace: "Заменить",
      actionMerge: "Объединить",
      source: "Категория для замены",
      target: "Новая категория",
      replaceDescription: "Перенести все операции, расписания и бюджеты в другую категорию.",
      mergeDescription: "Перенести всё в другую категорию и удалить старую.",
      applyAction: "Применить",
      chooseDifferent: "Выбери две разные категории.",
      newTitle: "Новая категория",
      editTitle: "Редактировать категорию",
      create: "Создать категорию",
      update: "Обновить категорию",
      empty: "Добавь категории для доходов и расходов.",
      confirmDelete: "Удалить эту категорию?",
      saveError: "Не удалось сохранить категорию."
    },
    settings: {
      title: "Настройки",
      section: "Раздел",
      saving: "Сохраняем изменения…",
      saved: "Изменения сохранены",
      saveError: "Не удалось сохранить изменения. Попробуй ещё раз.",
      tabs: {
        general: "Общее",
        appearance: "Вид",
        automation: "Быстрый ввод",
        features: "Функции",
        privacy: "Приватность",
        categories: "Категории",
        backup: "Бэкап",
        sync: "Синхронизация",
        debug: "Дебаг"
      },
      general: "Общее",
      appearance: "Внешний вид",
      automation: "Быстрый ввод",
      quickTemplatesSetting: "Быстрые шаблоны",
      quickTemplatesSettingHint: "Показывать недавние и сохранённые операции над формой добавления.",
      categorySuggestionsSetting: "Подсказки категорий",
      categorySuggestionsSettingHint: "Предлагать категорию по похожим заметкам и тегам, сохранённым на этом устройстве.",
      addAnotherSetting: "Добавить ещё после сохранения",
      addAnotherSettingHint: "Показывать кнопку для следующей операции, не закрывая форму.",
      features: "Функции",
      advancedWalletsSetting: "Расширенные настройки кошельков",
      advancedWalletsSettingHint: "Включает кредитные лимиты, приватность отдельного кошелька и исключение из общей статистики.",
      smartInsightsSetting: "Наблюдения о деньгах",
      smartInsightsSettingHint: "Показывать на главной необязательные локальные выводы. Без уведомлений и облачного анализа.",
      privacy: "Приватность",
      pinProtection: "Защита PIN-кодом",
      pinProtectionHint: "Блокирует доступ к приложению на этом устройстве. Функция необязательная, её можно отключить в любой момент.",
      enabled: "Включена",
      disabled: "Выключена",
      enablePin: "Включить PIN",
      changePin: "Изменить PIN",
      disablePin: "Отключить PIN",
      disablePinHint: "Введи текущий PIN, чтобы убрать защиту с этого устройства.",
      currentPin: "Текущий PIN",
      newPin: "Новый PIN",
      confirmPin: "Повтори PIN",
      pinRequirements: "От 4 до 12 цифр. Забытый PIN восстановить нельзя.",
      pinMismatch: "Введённые PIN-коды не совпадают.",
      pinIncorrect: "Неверный PIN. Попробуй ещё раз.",
      pinSaveError: "Не удалось изменить защиту PIN-кодом.",
      autoLock: "Автоматическая блокировка",
      autoLockNever: "Никогда",
      autoLockMinutes: "Через {minutes} мин",
      lockNow: "Заблокировать",
      hideAmounts: "Скрывать суммы",
      showAmounts: "Показывать суммы",
      hideAmountsHint: "Заменяет денежные значения точками во всём приложении. Быстро переключается кнопкой с глазом.",
      localPrivacyNote: "PIN хранится только на этом устройстве и защищает от случайного доступа. Данные браузера он не шифрует.",
      appLocked: "Приложение заблокировано",
      appLockedHint: "Введи PIN, чтобы вернуться к своим финансам.",
      enterPin: "PIN-код",
      pinKeypad: "Клавиатура PIN-кода",
      deleteDigit: "Удалить последнюю цифру",
      checkingPin: "Проверяем…",
      unlock: "Разблокировать",
      globalCurrency: "Общая валюта",
      dateFormat: "Формат даты",
      dateFormats: {
        short: "Короткий",
        medium: "Средний",
        long: "Длинный"
      },
      system: "Система",
      light: "Светлая",
      dark: "Темная",
      colorTheme: "Цветовая тема",
      colorThemes: {
        sage: "Шалфей",
        rose: "Розовая",
        violet: "Фиолетовая",
        sky: "Небо",
        amber: "Янтарная",
        graphite: "Графит",
        mint: "Мятная",
        coral: "Коралловая"
      },
      backup: "Бэкап",
      exportJson: "Экспорт JSON",
      exportError: "Не удалось экспортировать бэкап.",
      importJson: "Импорт JSON",
      importError: "Не удалось импортировать бэкап.",
      replaceBackup: "Заменить локальные данные этим бэкапом?",
      automaticBackup: "Автоматические локальные бэкапы",
      automaticBackupHint: "MyFinances сохраняет недавние версии на этом устройстве при изменении данных.",
      backupHistory: "История восстановления",
      backupHistoryEmpty: "Автоматические бэкапы появятся здесь после следующего изменения.",
      backupOperations: "операций",
      backupReasonAutomatic: "Автоматический бэкап",
      backupReasonRestore: "Перед восстановлением",
      restoreBackup: "Восстановить",
      restoreBackupConfirm: "Заменить текущие локальные данные этой сохранённой версией?",
      deleteBackup: "Удалить бэкап",
      deleteBackupError: "Не удалось удалить этот бэкап.",
      deleteBackupConfirm: "Удалить эту сохранённую версию?",
      sync: "Синхронизация",
      comingSoon: "Скоро",
      syncTitle: "Облачная синхронизация запланирована",
      syncBody: "Аккаунты, облачный бэкап, восстановление и синхронизация между устройствами будут здесь.",
      debug: "Дебаг",
      version: "Версия",
      triggerRuntimeError: "Вызвать runtime ошибку",
      resetLocalData: "Сбросить локальные данные",
      resetLocalDataConfirm: "Очистить локальные данные, cookies и запустить onboarding заново?",
      errorPreview: "Превью ошибки",
      closePreview: "Закрыть превью"
    },
    errors: {
      actions: {
        back: "Назад",
        copied: "Скопировано",
        copyDetails: "Скопировать детали",
        debugDetails: "Детали для дебага",
        goHome: "На главную",
        reload: "Перезагрузить",
        reloadApp: "Перезагрузить приложение"
      },
      bootTitle: "Не удалось загрузить MyFinances",
      presets: {
        "bad-request": {
          eyebrow: "Некорректный запрос",
          title: "Запрос невалиден",
          description: "В данных запроса есть ошибка. Проверь ввод и попробуй снова."
        },
        unauthorized: {
          eyebrow: "Нет авторизации",
          title: "Нужно войти",
          description: "Этому разделу нужна сессия аккаунта. Локальный режим продолжит работать без облака."
        },
        forbidden: {
          eyebrow: "Нет доступа",
          title: "Доступ закрыт",
          description: "У аккаунта нет прав на этот ресурс."
        },
        "not-found": {
          eyebrow: "Не найдено",
          title: "Такой страницы нет",
          description: "Ссылка могла устареть, быть введена с ошибкой или отсутствовать в локальном приложении."
        },
        server: {
          eyebrow: "Ошибка сервера",
          title: "Что-то сломалось",
          description: "Приложение столкнулось с неожиданной ошибкой. Перезагрузка часто очищает временное состояние."
        },
        unavailable: {
          eyebrow: "Недоступно",
          title: "Сервис временно недоступен",
          description: "Облачные сервисы сейчас недоступны. Локальные данные остаются доступны."
        },
        offline: {
          eyebrow: "Офлайн",
          title: "Нет подключения",
          description: "Приложение продолжит работать локально. Синхронизация и облачный бэкап вернутся после подключения."
        },
        maintenance: {
          eyebrow: "Обслуживание",
          title: "Идет обслуживание",
          description: "Этот раздел временно приостановлен из-за работ с инфраструктурой."
        },
        storage: {
          eyebrow: "Локальное хранилище",
          title: "Не удалось открыть локальные данные",
          description: "IndexedDB может быть заблокирована, переполнена или повреждена. Экспортированные бэкапы помогут восстановиться позже."
        },
        runtime: {
          eyebrow: "Runtime ошибка",
          title: "Критическая ошибка приложения",
          description: "Локальная runtime ошибка остановила этот экран. Детали ниже помогут найти причину."
        }
      }
    }
  }
};

export function getDictionary(locale: string): Dictionary {
  return dictionaries[getLanguage(locale)];
}
