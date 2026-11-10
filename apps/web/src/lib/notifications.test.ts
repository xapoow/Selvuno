import { describe, expect, it } from "vitest";
import type {
  Category,
  MonthlyBudget,
  RecurringTransaction,
  SavingsGoal,
  SavingsGoalContribution,
  Settings,
  Transaction
} from "@selvuno/types";
import { appVersion, getDictionary } from "../i18n";
import { buildAppNotifications } from "./notifications";

const entityBase = {
  userId: null,
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-01T00:00:00.000Z",
  deletedAt: null,
  syncStatus: "local" as const
};

const settings: Settings = {
  id: "default",
  locale: "ru-RU",
  currency: "USD",
  dateFormat: "medium",
  timeZone: "UTC",
  theme: "dark",
  colorTheme: "sage",
  activeWalletId: "all",
  hideAmounts: false,
  quickTemplatesEnabled: true,
  categorySuggestionsEnabled: false,
  addAnotherEnabled: true,
  advancedWalletsEnabled: false,
  smartInsightsEnabled: false,
  onboardingCompleted: true,
  defaultsVersion: 2,
  createdAt: entityBase.createdAt,
  updatedAt: entityBase.updatedAt
};

const category: Category = {
  ...entityBase,
  id: "11111111-1111-4111-8111-111111111111",
  name: "Groceries",
  color: "#207a6f",
  icon: "shopping-basket",
  type: "expense",
  sortOrder: 0
};

const budget: MonthlyBudget = {
  ...entityBase,
  id: "22222222-2222-4222-8222-222222222222",
  categoryId: category.id,
  month: "2026-07",
  amountMinor: 10_000,
  currency: "USD"
};

const transaction: Transaction = {
  ...entityBase,
  id: "33333333-3333-4333-8333-333333333333",
  walletId: "44444444-4444-4444-8444-444444444444",
  categoryId: category.id,
  amountMinor: 8_500,
  currency: "USD",
  type: "expense",
  tags: [],
  transactionDate: "2026-07-20T12:00:00.000Z"
};

const recurring: RecurringTransaction = {
  ...entityBase,
  id: "55555555-5555-4555-8555-555555555555",
  walletId: transaction.walletId,
  categoryId: category.id,
  amountMinor: 1_200,
  currency: "USD",
  type: "expense",
  tags: [],
  frequency: "monthly",
  startDate: "2026-07-28",
  nextRunDate: "2026-07-28",
  paused: false
};

const goal: SavingsGoal = {
  ...entityBase,
  id: "66666666-6666-4666-8666-666666666666",
  walletId: transaction.walletId,
  name: "Trip",
  targetAmountMinor: 50_000,
  currency: "USD",
  targetDate: "2026-07-30",
  color: "#207a6f"
};

function build(overrides: Partial<Parameters<typeof buildAppNotifications>[0]> = {}) {
  return buildAppNotifications({
    settings,
    categories: [category],
    transactions: [],
    budgets: [],
    recurringTransactions: [],
    savingsGoals: [],
    savingsGoalContributions: [],
    t: getDictionary("ru-RU"),
    now: new Date("2026-07-26T10:00:00.000Z"),
    ...overrides
  });
}

describe("app notifications", () => {
  it("always includes a notification for the current release", () => {
    expect(build()[0]).toMatchObject({
      id: `update:${appVersion}`,
      tone: "update"
    });
  });

  it("retains notifications for previous changelog updates in history", () => {
    const list = build();
    expect(list.length).toBeGreaterThan(1);
    expect(list.some((n) => n.id === "update:0.7.7")).toBe(true);
    expect(list.some((n) => n.id === "update:0.7.6")).toBe(true);
  });

  it("includes release dates and a real summary without repeating the title or version", () => {
    const [notification] = build({
      announcements: [],
      changelogItems: [{ version: "0.8.0", date: "2026-09-17", notes: ["Fixed wallet layout"] }]
    });
    expect(notification).toMatchObject({ kind: "release", date: "2026-09-17", body: "Fixed wallet layout" });
    expect(notification.body).not.toBe(notification.title);
    expect(notification.details).toHaveLength(1);
    expect(notification.details[0].label).toBe(getDictionary("ru-RU").notifications.detailChanges);
  });

  it("mixes independent announcements with releases by date and removes duplicate IDs", () => {
    const announcement = {
      id: "notice", publishedAt: "2026-11-03", title: "An announcement", summary: "Short summary", paragraphs: ["Full details"]
    };
    const notifications = build({
      now: new Date("2026-11-04T12:00:00Z"),
      changelogItems: [{ version: "0.8.0", date: "2026-09-17", notes: ["Older release"] }],
      announcements: [announcement, announcement,
        { ...announcement, id: "future", publishedAt: "2026-11-05" },
        { ...announcement, id: "expired", expiresAt: "2026-11-02" }]
    });
    expect(notifications.map((item) => item.id)).toEqual(["announcement:notice", "update:0.8.0"]);
    expect(notifications[0]).toMatchObject({ kind: "announcement", date: "2026-11-03", paragraphs: ["Full details"] });
  });

  it("warns near a budget limit and escalates after it is exceeded", () => {
    const near = build({ budgets: [budget], transactions: [transaction] });
    expect(near).toContainEqual(
      expect.objectContaining({
        id: `budget:2026-07:${category.id}:near`,
        tone: "warning",
        details: expect.arrayContaining([
          expect.objectContaining({ value: "Продукты" }),
          expect.objectContaining({ value: "85%" })
        ])
      })
    );

    const exceeded = build({
      budgets: [budget],
      transactions: [{ ...transaction, amountMinor: 11_000 }]
    });
    expect(exceeded).toContainEqual(
      expect.objectContaining({
        id: `budget:2026-07:${category.id}:exceeded`,
        tone: "danger"
      })
    );
  });

  it("reminds about active recurring operations due within three days", () => {
    const notifications = build({ recurringTransactions: [recurring] });
    expect(notifications).toContainEqual(
      expect.objectContaining({
        id: `recurring:${recurring.id}:${recurring.nextRunDate}`,
        tone: "info"
      })
    );
    const baseCount = build().length;
    expect(build({ recurringTransactions: [{ ...recurring, paused: true }] })).toHaveLength(baseCount);
  });

  it("reports nearby deadlines and completed savings goals", () => {
    const deadline = build({ savingsGoals: [goal] });
    expect(deadline).toContainEqual(
      expect.objectContaining({
        id: `goal:${goal.id}:${goal.targetDate}`,
        tone: "warning"
      })
    );

    const contribution: SavingsGoalContribution = {
      ...entityBase,
      id: "77777777-7777-4777-8777-777777777777",
      goalId: goal.id,
      amountMinor: goal.targetAmountMinor,
      contributionDate: "2026-07-25T12:00:00.000Z"
    };
    const completed = build({
      savingsGoals: [goal],
      savingsGoalContributions: [contribution]
    });
    expect(completed).toContainEqual(
      expect.objectContaining({
        id: `goal:${goal.id}:completed`,
        tone: "success"
      })
    );
  });
});
