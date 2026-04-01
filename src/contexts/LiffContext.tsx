import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface LiffUser {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

interface LiffContextType {
  user: LiffUser | null;
  isInitialized: boolean;
  isLoggedIn: boolean;
  isInClient: boolean;
  error: string | null;
}

const LiffContext = createContext<LiffContextType>({
  user: null,
  isInitialized: false,
  isLoggedIn: false,
  isInClient: false,
  error: null,
});

export const useLiff = () => useContext(LiffContext);

const LIFF_ID = import.meta.env.VITE_LIFF_ID as string | undefined;

export const LiffProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<LiffContextType>({
    user: null,
    isInitialized: false,
    isLoggedIn: false,
    isInClient: false,
    error: null,
  });

  useEffect(() => {
    const init = async () => {
      // Dev mode: no LIFF ID configured — use mock user
      if (!LIFF_ID) {
        console.warn("[LIFF] No VITE_LIFF_ID set, using dev mock user");
        setState({
          user: { userId: "dev_user", displayName: "開發模式" },
          isInitialized: true,
          isLoggedIn: true,
          isInClient: false,
          error: null,
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
        setState({
          user: {
            userId: profile.userId,
            displayName: profile.displayName,
            pictureUrl: profile.pictureUrl,
          },
          isInitialized: true,
          isLoggedIn: true,
          isInClient,
          error: null,
        });
      } catch (err) {
        console.error("[LIFF] Init failed:", err);
        setState((prev) => ({
          ...prev,
          isInitialized: true,
          error: err instanceof Error ? err.message : "LIFF 初始化失敗",
        }));
      }
    };

    init();
  }, []);

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

  return <LiffContext.Provider value={state}>{children}</LiffContext.Provider>;
};
