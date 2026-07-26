import type { ColorThemePreference } from "@myfinances/types";
import type { AppView } from "./state/appStore";

export type Language = "en" | "ru";
export type SettingsTab = "general" | "appearance" | "categories" | "backup" | "sync";
export type DateFormatLabel = "short" | "medium" | "long";

export const appVersion = "0.1.0";

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
  history: {
    title: string;
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
    tabs: Record<SettingsTab, string>;
    general: string;
    appearance: string;
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
    importJson: string;
    importError: string;
    replaceBackup: string;
    sync: string;
    comingSoon: string;
    syncTitle: string;
    syncBody: string;
    version: string;
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
      swipeHint: "Swipe this card to switch wallets"
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
    categories: {
      title: "Categories",
      icon: "Icon",
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
      tabs: {
        general: "General",
        appearance: "Appearance",
        categories: "Categories",
        backup: "Backup",
        sync: "Sync"
      },
      general: "General",
      appearance: "Appearance",
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
      importJson: "Import JSON",
      importError: "Unable to import backup.",
      replaceBackup: "Replace local data with this backup?",
      sync: "Sync",
      comingSoon: "Coming soon",
      syncTitle: "Cloud sync is planned",
      syncBody: "Accounts, cloud backup, restore, and multi-device synchronization will live here.",
      version: "Version"
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
      swipeHint: "Свайпни карточку, чтобы сменить кошелек"
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
    categories: {
      title: "Категории",
      icon: "Иконка",
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
      tabs: {
        general: "Общее",
        appearance: "Вид",
        categories: "Категории",
        backup: "Бэкап",
        sync: "Синхронизация"
      },
      general: "Общее",
      appearance: "Внешний вид",
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
      importJson: "Импорт JSON",
      importError: "Не удалось импортировать бэкап.",
      replaceBackup: "Заменить локальные данные этим бэкапом?",
      sync: "Синхронизация",
      comingSoon: "Скоро",
      syncTitle: "Облачная синхронизация запланирована",
      syncBody: "Аккаунты, облачный бэкап, восстановление и синхронизация между устройствами будут здесь.",
      version: "Версия"
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
