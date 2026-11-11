import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getDictionary } from "../i18n";
import { haptics } from "../lib/haptics";
import { testSettings, testWallet } from "../test/fixtures";
import { MonobankWalletCarousel } from "./MonobankWalletCarousel";

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
describe("wallet selection feedback", () => {
  it("only requests feedback on a committed change, not initial rendering, a current card or URL changes", async () => {
    vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
    const play = vi.spyOn(haptics, "play").mockReturnValue(true);
    const onChange = vi.fn();
    const client = new QueryClient();
    const t = getDictionary("en-US");
    const fixture = (activeWalletId: "all" | string) => <QueryClientProvider client={client}>
      <MonobankWalletCarousel wallets={[testWallet]} transactions={[]} transfers={[]} settings={{ ...testSettings, hapticsEnabled: true }}
        t={t} activeWalletId={activeWalletId} onChange={onChange} />
    </QueryClientProvider>;
    const user = userEvent.setup();
    const { rerender } = render(fixture("all"));
    expect(play).not.toHaveBeenCalled();
    await user.click(screen.getByRole("tab", { name: t.wallets.allWallets }));
    expect(play).not.toHaveBeenCalled();
    await user.click(screen.getByRole("tab", { name: testWallet.name }));
    expect(onChange).toHaveBeenCalledExactlyOnceWith(testWallet.id, 1);
    expect(play).toHaveBeenCalledExactlyOnceWith("selection", true);
    await user.click(screen.getByRole("tab", { name: testWallet.name }));
    expect(play).toHaveBeenCalledTimes(1);
    rerender(fixture("all"));
    expect(play).toHaveBeenCalledTimes(1);
  });
});
