# Optional haptic feedback

Enable it in **Settings → Features → Haptic feedback**. It defaults to off for new
installations, existing settings and old backups. The preference is included in
JSON backups. The Test vibration button is enabled only after opting in.

Feedback is requested at these explicit action points:

- A different wallet is selected at the end of a carousel swipe, or with arrows/dots.
  Initial rendering, URL-driven changes and snapping back to the current card are silent.
- A manual transaction add/edit succeeds, including attachment persistence. The
  current query-cache preference is checked after completion so opting out during
  a save prevents late feedback. Automatic recurring materialization is silent.
- A submitted PIN is incorrect. Entering individual digits is silent.

`lib/haptics.ts` owns the short selection/success/error patterns, a shared 150 ms
rate limit, capability checks, user-activation and visibility guards. Unsupported,
rejected or throwing browser APIs do not interrupt finance actions. Disabling the
preference, hiding the tab or unmounting the app cancels active feedback.

The setting stays explainable when unsupported. An imported enabled preference can
still be switched off there. A successful API return means a request was accepted,
not that the phone physically vibrated, so the test UI does not claim otherwise.

## Device validation

On a supported Android browser/PWA, verify the default off state, opt-in, test
button, one pulse per committed wallet change, successful transaction saves and an
incorrect PIN. Also test system vibration disabled, hidden tabs, rapid repeated
actions and opting out. Adjust pattern durations only after testing on real devices.

Safari on iPhone does not expose the Vibration API. Installation as a PWA does not
add a native haptics bridge. No hidden-switch workarounds, native wrappers, backend
or additional library are used. Browser support reference:
[MDN navigator.vibrate](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate).
