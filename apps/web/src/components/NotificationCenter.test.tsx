import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { getDictionary } from "../i18n";
import type { AppNotification } from "../lib/notifications";
import { NotificationCenter } from "./NotificationCenter";

const t = getDictionary("en-US");
const notifications: AppNotification[] = [
  {
    id: "update:0.9.1", kind: "release", tone: "update", date: "2026-11-04", title: "MyFinances 0.9.1",
    body: "Fixed wallet layout", details: [{ label: "Changes", value: "• Fixed wallet layout\n• Fixed camera" }]
  },
  {
    id: "announcement:notice", kind: "announcement", tone: "info", date: "2026-11-03", title: "A separate announcement",
    body: "A short summary", paragraphs: ["Announcement details"], details: []
  }
];

beforeEach(() => localStorage.clear());

describe("NotificationCenter", () => {
  it("shows dates and opens release details in the same dialog with one title and no repeated summary", async () => {
    const user = userEvent.setup();
    render(<NotificationCenter notifications={notifications} t={t} locale="en-US" />);
    await user.click(screen.getByRole("button", { name: /Open notifications/ }));
    const dialog = screen.getByRole("dialog", { name: t.notifications.title });
    const release = within(dialog).getByRole("button", { name: "MyFinances 0.9.1" });
    expect(release.querySelector("time")).toHaveAttribute("datetime", "2026-11-04");
    expect(release.querySelector("time")).toHaveTextContent("Nov 4, 2026");
    await user.click(release);
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(screen.getByRole("dialog", { name: "MyFinances 0.9.1" })).toBe(dialog);
    expect(within(dialog).getAllByText("MyFinances 0.9.1")).toHaveLength(1);
    expect(within(dialog).getAllByText(/Fixed wallet layout/)).toHaveLength(1);
    expect(dialog.querySelector("time")).toHaveAttribute("datetime", "2026-11-04");
    expect(JSON.parse(localStorage.getItem("myfinances:read-notifications:v1")!)).toContain("update:0.9.1");
  });

  it("keeps all types in one feed with badges and returns to the full feed after viewing an announcement", async () => {
    const user = userEvent.setup();
    render(<NotificationCenter notifications={notifications} t={t} locale="en-US" />);
    await user.click(screen.getByRole("button", { name: /Open notifications/ }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("button", { name: "MyFinances 0.9.1" })).toBeInTheDocument();
    expect(within(dialog).getByText(t.notifications.kinds.release)).toBeInTheDocument();
    expect(within(dialog).getByText(t.notifications.kinds.announcement)).toBeInTheDocument();
    expect(within(dialog).queryByRole("group")).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "A separate announcement" }));
    expect(within(dialog).getByText("Announcement details")).toBeInTheDocument();
    expect(within(dialog).getAllByText("A separate announcement")).toHaveLength(1);
    await user.click(within(dialog).getByRole("button", { name: t.notifications.backToNotifications }));
    expect(within(dialog).getByRole("button", { name: "MyFinances 0.9.1" })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "A separate announcement" })).toBeInTheDocument();
  });
});
