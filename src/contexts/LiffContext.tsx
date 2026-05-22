import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface LiffUser {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

interface LiffContextType {
  user: LiffUser | null;
  idToken: string | null;
  isInitialized: boolean;
  isLoggedIn: boolean;
  isInClient: boolean;
  error: string | null;
  /** Tony 2026-05-23: null=尚未檢查, true=已加好友, false=未加好友(gate 啟動) */
  isFriend: boolean | null;
  recheckFriendship: () => Promise<void>;
}

const LiffContext = createContext<LiffContextType>({
  user: null,
  idToken: null,
  isInitialized: false,
  isLoggedIn: false,
  isInClient: false,
  error: null,
  isFriend: null,
  recheckFriendship: async () => {},
});

// Module-scope token accessor so non-React code (fetch helpers) can read the
// current id_token without importing the React context. Set on each LIFF
// init success and cleared on logout/error.
let currentIdToken: string | null = null;
export function getLineIdToken(): string | null {
  return currentIdToken;
}

export const useLiff = () => useContext(LiffContext);

const LIFF_ID = import.meta.env.VITE_LIFF_ID as string | undefined;

export const LiffProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<LiffContextType>({
    user: null,
    idToken: null,
    isInitialized: false,
    isLoggedIn: false,
    isInClient: false,
    error: null,
    isFriend: null,
    recheckFriendship: async () => {},
  });

  // Tony 2026-05-23: 強制加好友檢查 — call /api/me/friendship and update state.
  // If the request fails (network / API down), we default to true so we don't
  // block real customers because of our infrastructure problems.
  const checkFriendshipNow = async () => {
    const token = currentIdToken;
    if (!token) {
      // dev mode or view-only — skip the gate
      setState((prev) => ({ ...prev, isFriend: true }));
      return;
    }
    try {
      const apiBase = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${apiBase}/api/me/friendship`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && typeof data.isFriend === "boolean") {
        setState((prev) => ({ ...prev, isFriend: data.isFriend }));
      } else {
        console.warn("[LIFF] friendship check failed, treating as friend:", res.status, data);
        setState((prev) => ({ ...prev, isFriend: true }));
      }
    } catch (err) {
      console.error("[LIFF] friendship check error, treating as friend:", err);
      setState((prev) => ({ ...prev, isFriend: true }));
    }
  };

  useEffect(() => {
    const init = async () => {
      // Tony 2026-05-21: ?key=<ADMIN_VIEW_KEY> → external viewer mode.
      // Skip LIFF entirely so non-LINE-user can view /admin/customers via
      // a shared URL token. The api layer auto-appends the key to all calls.
      if (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("key")) {
        console.warn("[LIFF] ?key= detected — view-only mode, skipping LIFF init");
        currentIdToken = null;
        setState({
          user: { userId: "view_only", displayName: "唯讀檢視" },
          idToken: null,
          isInitialized: true,
          isLoggedIn: false,
          isInClient: false,
          error: null,
          isFriend: true,                     // view mode bypasses gate
          recheckFriendship: checkFriendshipNow,
        });
        return;
      }

      // Dev mode: no LIFF ID configured — use mock user
      if (!LIFF_ID) {
        console.warn("[LIFF] No VITE_LIFF_ID set, using dev mock user");
        currentIdToken = null;
        setState({
          user: { userId: "dev_user", displayName: "開發模式" },
          idToken: null,
          isInitialized: true,
          isLoggedIn: true,
          isInClient: false,
          error: null,
          isFriend: true,                     // dev mode bypasses gate
          recheckFriendship: checkFriendshipNow,
        });
        return;
      }

      try {
        const liff = (await import("@line/liff")).default;
        await liff.init({ liffId: LIFF_ID });

        const isInClient = liff.isInClient();

        if (!liff.isLoggedIn()) {
          liff.login();
          return; // page will redirect
        }

        const profile = await liff.getProfile();
        const idToken = liff.getIDToken();
        currentIdToken = idToken;
        setState({
          user: {
            userId: profile.userId,
            displayName: profile.displayName,
            pictureUrl: profile.pictureUrl,
          },
          idToken,
          isInitialized: true,
          isLoggedIn: true,
          isInClient,
          error: null,
          isFriend: null,                     // 待 checkFriendshipNow() 填值
          recheckFriendship: checkFriendshipNow,
        });
        // Fire friendship check immediately after init (don't await — let UI render
        // the loading state while we wait for LINE's response).
        void checkFriendshipNow();
      } catch (err) {
        console.error("[LIFF] Init failed:", err);
        currentIdToken = null;
        setState((prev) => ({
          ...prev,
          isInitialized: true,
          error: err instanceof Error ? err.message : "LIFF 初始化失敗",
        }));
      }
    };

    init();
  }, []);

  // Tony 2026-05-23: 加完好友秒跳轉回遊戲 — 多觸發 + 兩段式 polling:
  //   (1) `visibilitychange` 「visible」 → 客人切回 LIFF tab 立刻 re-check
  //   (2) `window.focus` → 補強事件,有些 webview 不發 visibilitychange
  //   (3) `touchstart` (passive) → 客人在 gate 上點任何位置也重新檢查
  //   (4) Aggressive 1.5 秒輪詢 30 秒(LINE friendship cache 通常 5-10 秒會 catch up)
  //   (5) 之後改為 5 秒輪詢 fallback,以省 API quota
  useEffect(() => {
    if (state.isFriend !== false) return;
    let stopped = false;
    let currentTimer: ReturnType<typeof setInterval> | null = null;

    const tick = async () => {
      if (stopped) return;
      await checkFriendshipNow();
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") void tick();
    };
    const onTouch = () => { void tick(); };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    document.addEventListener("touchstart", onTouch, { passive: true });

    // Aggressive 1.5s polling for first 30 sec, then back off to 5s
    currentTimer = setInterval(tick, 1500);
    const slowdown = setTimeout(() => {
      if (currentTimer) clearInterval(currentTimer);
      currentTimer = setInterval(tick, 5000);
    }, 30_000);

    return () => {
      stopped = true;
      if (currentTimer) clearInterval(currentTimer);
      clearTimeout(slowdown);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("touchstart", onTouch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isFriend]);

  // Loading screen
  if (!state.isInitialized) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">正在連線至 LINE...</p>
        </div>
      </div>
    );
  }

  // Error screen
  if (state.error && !state.user) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background p-6">
        <div className="text-center space-y-4 max-w-sm">
          <p className="text-lg font-bold text-foreground">連線失敗</p>
          <p className="text-sm text-muted-foreground">{state.error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 rounded-xl bg-primary text-primary-foreground font-medium"
          >
            重新整理
          </button>
        </div>
      </div>
    );
  }

  // Tony 2026-05-23: 強制加好友 gate — 客人沒加 IC 高雄 LINE OA 之前不能進遊戲,
  // 否則中獎時 push 優惠券會 silent fail。
  // (檢查中 — 顯示 loading)
  if (state.isFriend === null) {
    return (
      <LiffContext.Provider value={state}>
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">正在確認 LINE 好友狀態...</p>
          </div>
        </div>
      </LiffContext.Provider>
    );
  }

  // (未加好友 — 顯示 add-friend gate)
  if (state.isFriend === false) {
    return (
      <LiffContext.Provider value={state}>
        <div className="fixed inset-0 flex items-center justify-center bg-background p-6">
          <div className="max-w-sm w-full bg-card border-2 border-primary rounded-2xl p-6 shadow-lg text-center">
            <p className="text-4xl mb-3">👋</p>
            <h1 className="text-xl font-bold text-foreground mb-2">先加 IC 高雄 LINE 好友</h1>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              味蕾旅遊地圖的<strong>優惠券</strong>會發送到您的 LINE 聊天視窗,
              所以請先加「<strong>高雄洲際酒店</strong>」官方 LINE 好友,才能開始遊戲。
            </p>

            <a
              href="https://lin.ee/uKzkNI9"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-base mb-3"
            >
              ➕ 加入 LINE 好友
            </a>

            <div className="mb-3 flex items-center justify-center gap-2 text-emerald-700">
              <div className="w-3 h-3 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
              <p className="text-[12px] leading-relaxed">
                <strong>等您加好友 — 加完自動跳進遊戲</strong>
              </p>
            </div>

            <button
              onClick={async () => {
                await state.recheckFriendship();
              }}
              className="block w-full px-6 py-2.5 rounded-xl border-2 border-primary text-primary font-medium text-sm"
            >
              ✓ 手動重新檢查
            </button>

            <p className="mt-4 text-[11px] text-muted-foreground leading-relaxed">
              加完好友後切回這個畫面,系統會在 1-3 秒內自動偵測並進入遊戲。
              如果超過 10 秒仍沒跳,可以按上方手動檢查。
            </p>
          </div>
        </div>
      </LiffContext.Provider>
    );
  }

  return <LiffContext.Provider value={state}>{children}</LiffContext.Provider>;
};
