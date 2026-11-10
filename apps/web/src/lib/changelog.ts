import { appVersion } from "../i18n";

export interface ChangelogItem {
  version: string;
  notes: string[];
  date?: string;
}

export const BUILTIN_CHANGELOG: Record<"ru" | "en", ChangelogItem[]> = {
  ru: [
    {
      version: "0.9.6",
      date: "2026-11-05",
      notes: [
        "Адресная строка синхронизирована с экранами и вкладками настроек, истории и кошельков",
        "Прямые ссылки, перезагрузка и кнопки «Назад/Вперёд» восстанавливают выбранный раздел",
        "Выбор кошелька отражается в URL без лишних шагов в истории браузера",
        "Основные разделы открываются в новой вкладке; добавлена обработка вложенных ссылок в PWA"
      ]
    },
    {
      version: "0.9.5",
      date: "2026-11-05",
      notes: [
        "Выбор видимых блоков в Настройки → Вид → Главный экран",
        "Порядок блоков меняется перетаскиванием или стрелками и одинаков на телефоне и ПК",
        "Опциональный блок накопительных целей с прогрессом и переходом ко всем целям",
        "Настройки сохраняются автоматически, попадают в бэкапы и сбрасываются в любой момент"
      ]
    },
    {
      version: "0.9.4",
      date: "2026-11-04",
      notes: [
        "Отмена удаления операций и восстановление из корзины в истории или настройках",
        "Сверка баланса кошелька с историей корректировок без изменения доходов и расходов",
        "Фильтры истории по нескольким категориям, вложениям и диапазону суммы с конвертацией",
        "Сохранённые наборы фильтров запоминают выбранную валюту суммы",
        "Общая лента уведомлений с компактными бейджами и ровными отступами",
        "Мягкое свечение кошельков и тени карточек без обрезки на главной и в истории"
      ]
    },
    {
      version: "0.9.2",
      date: "2026-11-04",
      notes: [
        "Меню настроек на телефоне затемняет весь экран и открывается без скачков страницы",
        "Выбор доступного объектива камеры для чеков с запоминанием на устройстве",
        "Основная задняя камера выбирается автоматически, если браузер позволяет её определить",
        "Даты уведомлений и фильтры обновлений, объявлений и напоминаний",
        "Убраны повторяющиеся заголовки релизов, восстановлены даты старых обновлений"
      ]
    },
    {
      version: "0.9.1",
      date: "2026-11-04",
      notes: [
        "Редактирование и удаление операций прямо из окна подробностей",
        "Модалки затемняют весь экран и блокируют прокрутку фона",
        "Исправлено падение вкладки «Кошельки», когда кошелёк один или недоступно перетаскивание",
        "Боковая панель на ПК остаётся на месте при прокрутке страницы",
        "Убраны горячие клавиши приложения, конфликтовавшие с браузером",
        "Бегунки переключателей выровнены по центру с одинаковыми отступами",
        "Последние операции больше не растягиваются по высоте, когда записей мало",
        "Убрана зелёная рамка поля суммы, кнопки калькулятора заменяют последний знак операции"
      ]
    },
    {
      version: "0.9.0",
      date: "2026-09-17",
      notes: [
        "Фотографии чеков и PDF-документы можно прикреплять прямо к операции",
        "Собственная полноэкранная камера с рамкой для удобной съёмки чеков",
        "Встроенный просмотр фотографий и PDF без выхода из Selvuno",
        "Переработанная навигация настроек для телефона, планшета и ПК"
      ]
    },
    {
      version: "0.8.4",
      date: "2026-09-17",
      notes: [
        "Гармонизирована концентрическая сетка border-radius (карточки 16px, элементы ввода 12px, сегменты и кнопки 8px)",
        "Быстрая горизонтальная панель разделов настроек на смартфонах для мгновенного переключения в одно касание",
        "Аппаратная оптимизация GPU (120 FPS): устранены тяжёлые фильтры размытия при переходе между экранами и в мастере настройки",
        "Улучшенный рендеринг и плавность открытия бокового меню настроек на мобильных устройствах"
      ]
    },
    {
      version: "0.8.3",
      date: "2026-09-17",
      notes: [
        "Устранены визуальные несостыковки в переключателе цветовых схем (убраны лишние точки и дублирующиеся иконки)",
        "Плавный скользящий индикатор для переключателей режимов с равным распределением колонок",
        "Сверхплавные кинематические переходы между страницами с пространственной ориентацией и размытием",
        "Анимация мастера первого запуска в стиле iOS Setup Assistant с мягким размытием и пружинной физикой"
      ]
    },
    {
      version: "0.8.2",
      date: "2026-09-17",
      notes: [
        "Изменение порядка кошельков перетаскиванием за левый край во вкладке «Кошельки»",
        "Перетаскивание категорий на смартфонах теперь срабатывает только за левую ручку",
        "Плавные переходы между страницами и анимированный мастер первого запуска",
        "Карточки карусели на главной и классический компактный переключатель на остальных экранах"
      ]
    },
    {
      version: "0.8.1",
      date: "2026-09-17",
      notes: [
        "Исправлен неконтролируемый рост карточек кошельков на узких экранах",
        "Восстановлены стабильные границы свайпа без растягивания страницы",
        "Обновлены цвета status bar PWA и фон безопасной области при запуске"
      ]
    },
    {
      version: "0.8.0",
      date: "2026-09-17",
      notes: [
        "Устранено растягивание страницы и переполнение карусели на смартфонах",
        "PWA-манифест синхронизирован с тёмной темой для статусной строки Android и WebAPK",
        "Блокировка зума и корректный масштаб карточек на мобильных экранах"
      ]
    },
    {
      version: "0.7.9",
      date: "2026-09-17",
      notes: [
        "Адаптивный статус-бар для смартфонов в тёмной теме под цвет выбранной схемы",
        "Устранение белого статус-бара и белых вспышек при запуске на мобильных устройствах"
      ]
    },
    {
      version: "0.7.8",
      date: "2026-09-17",
      notes: [
        "Сохранение истории changelog всех обновлений в уведомлениях",
        "Чёткое форматирование списка изменений по пунктам в деталях уведомления"
      ]
    },
    {
      version: "0.7.7",
      date: "2026-09-17",
      notes: [
        "Чёткое отображение активной карты без затемнения по краям",
        "Расширенные границы карусели кошельков (до 576px)",
        "Плавная пружинная физика и возврат карточки при недотянутом свайпе"
      ]
    },
    {
      version: "0.7.6",
      date: "2026-09-17",
      notes: [
        "Мягкое затухание (fade in/out) для карточек на границах карусели",
        "Оптимистичное мгновенное переключение активного кошелька без задержек",
        "Устранение подтормаживаний анимации при быстром свайпе"
      ]
    },
    {
      version: "0.7.5",
      date: "2026-09-17",
      notes: [
        "Непрерывный горизонтальный трек карусели в стиле Monobank",
        "Исправлен баг обрезания карточки при вытягивании за пределы экрана"
      ]
    },
    {
      version: "0.7.4",
      date: "2026-09-17",
      notes: [
        "Мгновенный локальный стейт при свайпе без задержек базы данных",
        "Плавная физика перелистывания карточек"
      ]
    },
    {
      version: "0.7.3",
      date: "2026-09-16",
      notes: [
        "Плавная непрерывная анимация карточек без замедления на середине пути"
      ]
    },
    {
      version: "0.7.2",
      date: "2026-09-16",
      notes: [
        "Дизайн дебетовых карточек кошельков в стиле Monobank",
        "Ступенчатая водопадная анимация обновления элементов страницы при свайпе"
      ]
    },
    {
      version: "0.7.0",
      date: "2026-09-16",
      notes: [
        "Карусель кошельков на главном экране",
        "Удаление лишнего заголовка и оптимизация мобильного экрана"
      ]
    },
    {
      version: "0.6.0",
      date: "2026-09-11",
      notes: [
        "Опциональные PIN-код, автоблокировка и скрытие сумм",
        "Быстрый ввод операций, расширенные кошельки и локальные умные наблюдения",
        "Горячие клавиши, табличная история, массовые действия и экспорт CSV на ПК"
      ]
    }
  ],
  en: [
    {
      version: "0.9.6",
      date: "2026-11-05",
      notes: [
        "The address bar now follows screens and tabs in Settings, History and Wallets",
        "Direct links, page reloads and Back/Forward restore the selected section",
        "Wallet selection appears in the URL without flooding browser history",
        "Main sections can open in a new tab; nested links have a PWA navigation fallback"
      ]
    },
    {
      version: "0.9.5",
      date: "2026-11-05",
      notes: [
        "Choose visible home blocks in Settings → Appearance → Home screen",
        "Reorder blocks by dragging or using arrows, with one layout on mobile and desktop",
        "Optionally show savings goals with progress and a shortcut to all goals",
        "Your layout is saved automatically, included in backups, and can be reset at any time"
      ]
    },
    {
      version: "0.9.4",
      date: "2026-11-04",
      notes: [
        "Undo transaction deletions and restore them later from Trash in History or Settings",
        "Reconcile wallet balances with a correction history, without changing income or expenses",
        "Filter history by multiple categories, attachments, and a converted amount range",
        "Save and reuse filter sets with their original amount currency",
        "One notification feed with compact type badges and balanced spacing",
        "Softer wallet glow and unclipped card shadows on Home and History"
      ]
    },
    {
      version: "0.9.2",
      date: "2026-11-04",
      notes: [
        "Mobile settings menu dims the whole screen and opens without page jumps",
        "Choose an available receipt camera lens and remember it on this device",
        "The main rear camera is preferred when the browser identifies it",
        "Notification dates and separate filters for updates, announcements, and reminders",
        "Removed repeated release headings and restored historical changelog dates"
      ]
    },
    {
      version: "0.9.1",
      date: "2026-11-04",
      notes: [
        "Edit or delete transactions directly from their details",
        "Dialogs now dim the entire screen and lock background scrolling",
        "Fixed a Wallets crash with a single wallet or when reordering is unavailable",
        "Desktop sidebar stays in place while the page scrolls",
        "Removed app hotkeys that conflicted with browser shortcuts",
        "Aligned switch thumbs with consistent spacing in both states",
        "Recent transactions keep their natural height even with only a few entries",
        "Removed the green amount field frame; calculator buttons replace the pending operator"
      ]
    },
    {
      version: "0.9.0",
      date: "2026-09-17",
      notes: [
        "Attach receipt photos and PDF documents directly to a transaction",
        "Capture receipts in a custom full-screen camera with an alignment frame",
        "Preview photos and PDFs without leaving Selvuno",
        "Redesigned responsive settings navigation for phone, tablet, and desktop"
      ]
    },
    {
      version: "0.8.4",
      date: "2026-09-17",
      notes: [
        "Harmonized concentric border-radius hierarchy (16px cards, 12px controls, 8px pills and segments)",
        "Quick horizontal settings navigation strip on mobile phones for instant one-tap category switching",
        "120 FPS GPU compositor optimizations: eliminated heavy blur filters on page switches and onboarding",
        "Optimized mobile settings drawer rendering and smooth transition performance"
      ]
    },
    {
      version: "0.8.3",
      date: "2026-09-17",
      notes: [
        "Refined color theme picker UI: eliminated redundant dots and balanced item layout",
        "Interactive animated indicator for segmented controls with equal column sizing",
        "Silky-smooth spatial page transitions with soft depth blur and Apple-style curves",
        "Fluid iPhone Setup Assistant-style transitions and spring physics in onboarding wizard"
      ]
    },
    {
      version: "0.8.2",
      date: "2026-09-17",
      notes: [
        "Reorder wallets via drag-and-drop handles in the Wallets tab",
        "Refined category drag on mobile: items only move when grabbed by the left edge",
        "Smooth, fluid page transitions and animated onboarding setup wizard",
        "Consistent wallet switching: card carousel on Dashboard, classic switcher on other pages"
      ]
    },
    {
      version: "0.8.1",
      date: "2026-09-17",
      notes: [
        "Fixed runaway wallet card sizing on narrow mobile screens",
        "Restored stable swipe bounds without stretching the page",
        "Refreshed PWA status bar colors and safe-area startup background"
      ]
    },
    {
      version: "0.8.0",
      date: "2026-09-17",
      notes: [
        "Eliminated horizontal page stretch and carousel overflow on mobile phones",
        "Synchronized PWA manifest with dark theme for Android and WebAPK status bar",
        "Scale protection and responsive card sizing for mobile screens"
      ]
    },
    {
      version: "0.7.9",
      date: "2026-09-17",
      notes: [
        "Adaptive mobile status bar in dark mode matching the active color scheme",
        "Eliminated white status bar and startup flashes on mobile devices"
      ]
    },
    {
      version: "0.7.8",
      date: "2026-09-17",
      notes: [
        "Preserve complete update changelog history in notifications",
        "Bulleted formatting for change details in notification view"
      ]
    },
    {
      version: "0.7.7",
      date: "2026-09-17",
      notes: [
        "Crisp active card rendering without edge gradient blur",
        "Wider wallet carousel boundaries (up to 576px)",
        "Smooth spring physics and bounce-back on short swipe"
      ]
    },
    {
      version: "0.7.6",
      date: "2026-09-17",
      notes: [
        "Soft edge feathering and real-time fade in/out for cards at carousel boundaries",
        "Instant optimistic wallet switching without UI latency",
        "Eliminated drag stalling during transitions"
      ]
    },
    {
      version: "0.7.5",
      date: "2026-09-17",
      notes: [
        "Continuous horizontal carousel track in Monobank style",
        "Fixed card clipping bug when dragged past container edges"
      ]
    },
    {
      version: "0.7.4",
      date: "2026-09-17",
      notes: [
        "Instant local state on swipe without database latency",
        "Smooth physics for card sliding"
      ]
    },
    {
      version: "0.7.3",
      date: "2026-09-16",
      notes: [
        "Continuous smooth card animation without mid-transition stall"
      ]
    },
    {
      version: "0.7.2",
      date: "2026-09-16",
      notes: [
        "Monobank-style card design for wallets",
        "Staggered waterfall animation of page elements on wallet switch"
      ]
    },
    {
      version: "0.7.0",
      date: "2026-09-16",
      notes: [
        "Wallet carousel on home screen",
        "Removed redundant header and streamlined mobile dashboard"
      ]
    },
    {
      version: "0.6.0",
      date: "2026-09-11",
      notes: [
        "Optional PIN, auto-lock, and private balance visibility controls",
        "Faster transactions, advanced wallets, and local smart insights",
        "Desktop shortcuts, table history, bulk actions, and filtered CSV export"
      ]
    }
  ]
};

export const changelogStorageKey = "myfinances:changelog-history:v1";

export function compareVersions(a: string, b: string): number {
  const parse = (v: string) => v.split(".").map((n) => parseInt(n, 10) || 0);
  const pa = parse(a);
  const pb = parse(b);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] ?? 0;
    const nb = pb[i] ?? 0;
    if (na !== nb) return na - nb;
  }
  return 0;
}

export function getChangelogHistory(locale: string, currentNotes?: string[]): ChangelogItem[] {
  const lang = locale.startsWith("ru") ? "ru" : "en";
  const builtin = BUILTIN_CHANGELOG[lang];

  let stored: ChangelogItem[] = [];
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem(changelogStorageKey);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          stored = parsed.filter((item): item is ChangelogItem =>
            item && typeof item.version === "string" && /^\d+\.\d+\.\d+$/.test(item.version) &&
            Array.isArray(item.notes) && item.notes.every((note: unknown) => typeof note === "string") &&
            (item.date === undefined || (typeof item.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(item.date)))
          );
        }
      }
    }
  } catch {
    stored = [];
  }

  const map = new Map<string, ChangelogItem>();

  for (const item of builtin) {
    map.set(item.version, item);
  }

  for (const item of stored) {
    if (item && item.version) {
      const existing = map.get(item.version);
      map.set(item.version, {
        version: item.version,
        notes: existing?.notes ?? [...new Set(item.notes)],
        date: existing?.date ?? item.date
      });
    }
  }

  if (currentNotes && currentNotes.length) {
    map.set(appVersion, {
      version: appVersion,
      notes: [...new Set(currentNotes)],
      date: map.get(appVersion)?.date
    });
  }

  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const toSave = Array.from(map.values());
      window.localStorage.setItem(changelogStorageKey, JSON.stringify(toSave));
    }
  } catch {
    // Ignore storage errors
  }

  const list = Array.from(map.values());
  return list.sort((a, b) => compareVersions(b.version, a.version));
}
