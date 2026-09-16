import { appVersion } from "../i18n";

export interface ChangelogItem {
  version: string;
  notes: string[];
  date?: string;
}

export const BUILTIN_CHANGELOG: Record<"ru" | "en", ChangelogItem[]> = {
  ru: [
    {
      version: "0.7.9",
      notes: [
        "Адаптивный статус-бар для смартфонов в тёмной теме под цвет выбранной схемы",
        "Устранение белого статус-бара и белых вспышек при запуске на мобильных устройствах"
      ]
    },
    {
      version: "0.7.8",
      notes: [
        "Сохранение истории changelog всех обновлений в уведомлениях",
        "Чёткое форматирование списка изменений по пунктам в деталях уведомления"
      ]
    },
    {
      version: "0.7.7",
      notes: [
        "Чёткое отображение активной карты без затемнения по краям",
        "Расширенные границы карусели кошельков (до 576px)",
        "Плавная пружинная физика и возврат карточки при недотянутом свайпе"
      ]
    },
    {
      version: "0.7.6",
      notes: [
        "Мягкое затухание (fade in/out) для карточек на границах карусели",
        "Оптимистичное мгновенное переключение активного кошелька без задержек",
        "Устранение подтормаживаний анимации при быстром свайпе"
      ]
    },
    {
      version: "0.7.5",
      notes: [
        "Непрерывный горизонтальный трек карусели в стиле Monobank",
        "Исправлен баг обрезания карточки при вытягивании за пределы экрана"
      ]
    },
    {
      version: "0.7.4",
      notes: [
        "Мгновенный локальный стейт при свайпе без задержек базы данных",
        "Плавная физика перелистывания карточек"
      ]
    },
    {
      version: "0.7.3",
      notes: [
        "Плавная непрерывная анимация карточек без замедления на середине пути"
      ]
    },
    {
      version: "0.7.2",
      notes: [
        "Дизайн дебетовых карточек кошельков в стиле Monobank",
        "Ступенчатая водопадная анимация обновления элементов страницы при свайпе"
      ]
    },
    {
      version: "0.7.0",
      notes: [
        "Карусель кошельков на главном экране",
        "Удаление лишнего заголовка и оптимизация мобильного экрана"
      ]
    },
    {
      version: "0.6.0",
      notes: [
        "Опциональные PIN-код, автоблокировка и скрытие сумм",
        "Быстрый ввод операций, расширенные кошельки и локальные умные наблюдения",
        "Горячие клавиши, табличная история, массовые действия и экспорт CSV на ПК"
      ]
    }
  ],
  en: [
    {
      version: "0.7.9",
      notes: [
        "Adaptive mobile status bar in dark mode matching the active color scheme",
        "Eliminated white status bar and startup flashes on mobile devices"
      ]
    },
    {
      version: "0.7.8",
      notes: [
        "Preserve complete update changelog history in notifications",
        "Bulleted formatting for change details in notification view"
      ]
    },
    {
      version: "0.7.7",
      notes: [
        "Crisp active card rendering without edge gradient blur",
        "Wider wallet carousel boundaries (up to 576px)",
        "Smooth spring physics and bounce-back on short swipe"
      ]
    },
    {
      version: "0.7.6",
      notes: [
        "Soft edge feathering and real-time fade in/out for cards at carousel boundaries",
        "Instant optimistic wallet switching without UI latency",
        "Eliminated drag stalling during transitions"
      ]
    },
    {
      version: "0.7.5",
      notes: [
        "Continuous horizontal carousel track in Monobank style",
        "Fixed card clipping bug when dragged past container edges"
      ]
    },
    {
      version: "0.7.4",
      notes: [
        "Instant local state on swipe without database latency",
        "Smooth physics for card sliding"
      ]
    },
    {
      version: "0.7.3",
      notes: [
        "Continuous smooth card animation without mid-transition stall"
      ]
    },
    {
      version: "0.7.2",
      notes: [
        "Monobank-style card design for wallets",
        "Staggered waterfall animation of page elements on wallet switch"
      ]
    },
    {
      version: "0.7.0",
      notes: [
        "Wallet carousel on home screen",
        "Removed redundant header and streamlined mobile dashboard"
      ]
    },
    {
      version: "0.6.0",
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
        stored = JSON.parse(raw) as ChangelogItem[];
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
        notes: item.notes && item.notes.length ? item.notes : (existing?.notes ?? []),
        date: item.date ?? existing?.date
      });
    }
  }

  if (currentNotes && currentNotes.length) {
    map.set(appVersion, {
      version: appVersion,
      notes: currentNotes
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
