export interface AppAnnouncement {
  id: string;
  publishedAt: string;
  expiresAt?: string;
  title: string;
  summary: string;
  paragraphs: string[];
}

// Add announcements independently of app releases. Stable IDs preserve read status across updates.
const announcements: Record<"ru" | "en", AppAnnouncement[]> = {
  ru: [{
    id: "local-receipts",
    publishedAt: "2026-11-04",
    title: "Где хранятся ваши чеки",
    summary: "Фотографии и PDF привязаны к операциям и хранятся локально на этом устройстве.",
    paragraphs: [
      "Откройте операцию в истории или в последних операциях на главной, чтобы посмотреть прикреплённые фотографии и документы.",
      "Вложения сохраняются в этом браузере. Очистка данных сайта может удалить локальные записи и файлы."
    ]
  }],
  en: [{
    id: "local-receipts",
    publishedAt: "2026-11-04",
    title: "Where your receipts are stored",
    summary: "Photos and PDFs belong to their transactions and are stored locally on this device.",
    paragraphs: [
      "Open a transaction from History or the recent transactions on Home to view its attached photos and documents.",
      "Attachments are saved in this browser. Clearing site data can remove local records and files."
    ]
  }]
};

export function getAppAnnouncements(locale: string): AppAnnouncement[] {
  return announcements[locale.startsWith("ru") ? "ru" : "en"];
}
