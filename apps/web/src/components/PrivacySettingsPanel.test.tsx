import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { settingsSchema } from "@selvuno/types";
import { getDictionary } from "../i18n";
import type { PrivacyLockController } from "../state/usePrivacyLock";
import { PrivacySettingsPanel } from "./PrivacySettingsPanel";

const settings = settingsSchema.parse({
  id: "default",
  locale: "en-US",
  currency: "USD",
  dateFormat: "medium",
  timeZone: "UTC",
  theme: "dark",
  colorTheme: "sage",
  activeWalletId: "all",
  onboardingCompleted: true,
  defaultsVersion: 2,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z"
});

function createPrivacy(overrides: Partial<PrivacyLockController> = {}): PrivacyLockController {
  return {
    pinEnabled: false,
    locked: false,
    config: { autoLockMinutes: 0 },
    enablePin: vi.fn().mockResolvedValue(undefined),
    changePin: vi.fn().mockResolvedValue(true),
    disablePin: vi.fn().mockResolvedValue(true),
    unlock: vi.fn().mockResolvedValue(true),
    lockNow: vi.fn(),
    setAutoLockMinutes: vi.fn(),
    ...overrides
  };
}

describe("PrivacySettingsPanel", () => {
  it("keeps PIN protection opt-in and disables auto-lock until it is enabled", () => {
    render(
      <PrivacySettingsPanel
        settings={settings}
        privacy={createPrivacy()}
        t={getDictionary("en-US")}
        onUpdateSettings={vi.fn().mockResolvedValue(undefined)}
      />
    );

    expect(screen.getByText("Disabled")).toBeInTheDocument();
    expect(
      screen.getAllByLabelText("Automatic lock").find((element) => element.tagName === "BUTTON")
    ).toBeDisabled();
  });

  it("validates confirmation and enables a numeric PIN", async () => {
    const user = userEvent.setup();
    const privacy = createPrivacy();
    render(
      <PrivacySettingsPanel
        settings={settings}
        privacy={privacy}
        t={getDictionary("en-US")}
        onUpdateSettings={vi.fn().mockResolvedValue(undefined)}
      />
    );

    await user.click(screen.getByRole("button", { name: "Enable PIN" }));
    for (const digit of ["4", "8", "2", "6", "0", "1"]) {
      await user.click(screen.getByRole("button", { name: digit }));
    }
    expect(screen.getByRole("button", { name: "New PIN" })).toHaveTextContent("6");
    for (const digit of ["4", "8", "2", "6", "0", "1"]) {
      await user.click(screen.getByRole("button", { name: digit }));
    }
    const enableButtons = screen.getAllByRole("button", { name: "Enable PIN" });
    await user.click(enableButtons.at(-1)!);

    expect(privacy.enablePin).toHaveBeenCalledWith("482601");
  });

  it("updates the independent amount visibility preference", async () => {
    const user = userEvent.setup();
    const onUpdateSettings = vi.fn().mockResolvedValue(undefined);
    render(
      <PrivacySettingsPanel
        settings={settings}
        privacy={createPrivacy()}
        t={getDictionary("en-US")}
        onUpdateSettings={onUpdateSettings}
      />
    );

    await user.click(screen.getByRole("switch", { name: "Hide amounts" }));
    expect(onUpdateSettings).toHaveBeenCalledWith({ hideAmounts: true });
  });
});
