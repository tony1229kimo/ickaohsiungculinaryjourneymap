/**
 * 客戶資料 dashboard — /admin/customers
 *
 * 行銷部用,看 LINE 用戶累積資料 + drill-down timeline + CSV 匯出。
 * 後端 staff_whitelist 過不了 → 顯示「請聯絡 IT」。
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLiff } from "@/contexts/LiffContext";
import {
  listCustomers,
  getCustomer,
  getStats,
  downloadCsv,
  ERR_TOKEN_EXPIRED,
  type CustomerProfile,
  type CustomerDetail,
  type StatsOverview,
  type SortField,
} from "@/api/customers";

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: "last_seen_at", label: "最近活動" },
  { value: "total_spend", label: "累計消費" },
  { value: "total_visits", label: "來訪次數" },
  { value: "total_rewards_earned", label: "領獎次數" },
  { value: "first_seen_at", label: "首次互動" },
];

const PAGE_SIZE = 50;

const fmtCurrency = (n: number) => "NT$" + (n ?? 0).toLocaleString();
const fmtDate = (iso: string) => {
  try { return iso.slice(0, 16).replace("T", " "); }
  catch { return iso; }
};
// Tony 2026-05-21: activate events are emitted by both 一般結帳 and 掛房帳 —
// peek into payload.ticket_source to distinguish them in the timeline.
const fmtEvent = (e: { event_type: string; payload?: unknown }) => {
  if (e.event_type === "activate") {
    const ticketSource = (e.payload as { ticket_source?: string } | null | undefined)?.ticket_source;
    if (ticketSource === "room_charge") return "🏨 掛房帳兌換";
    return "💳 結帳兌換";
  }
  return ({
    bind: "🔗 加好友",
    roll: "🎲 擲骰",
    reward_lottery: "🎁 抽中獎品",
    reward_fixed: "⭐ 固定格獎勵",
    season_reset: "🔄 新季開始",
    invoice_redeem: "📄 客人自掃發票",
  } as Record<string, string>)[e.event_type] ?? e.event_type;
};

const AdminCustomersPage = () => {
  const { isInitialized, user, error: liffError } = useLiff();
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState<SortField>("last_seen_at");
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  // Tony 2026-05-21: clickable restaurant cards → filter list
  const [restaurantFilter, setRestaurantFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<CustomerDetail | null>(null);
  const [downloading, setDownloading] = useState(false);
  // Tony 2026-05-21: diagnostic — show what backend actually sees on 403
  const [whoami, setWhoami] = useState<unknown>(null);
  const [whoamiLoading, setWhoamiLoading] = useState(false);
  // Tony 2026-05-21: distinguish token-expired (401) from whitelist-reject (403)
  const [errorKind, setErrorKind] = useState<"expired" | "whitelist" | "other" | null>(null);

  const handleApiError = (err: Error, user: { userId: string; displayName?: string }) => {
    if (err.message === ERR_TOKEN_EXPIRED) {
      setErrorKind("expired");
      setLoadError(
        "您的 LINE 連線已逾時 (LIFF id_token expired)。\n" +
        "請點下方「🔄 重新登入」更新 token。"
      );
    } else if (/403/.test(err.message)) {
      setErrorKind("whitelist");
      setLoadError(
        "您不在服務人員白名單,請聯絡 IT 加入。\n\n" +
        `您的 LINE userId(請複製給 IT):\n${user.userId}\n\n` +
        `您的顯示名稱:${user.displayName ?? "(無)"}`
      );
    } else {
      setErrorKind("other");
      setLoadError("無法載入:" + err.message);
    }
  };

  useEffect(() => {
    if (!isInitialized || !user) return;
    getStats()
      .then(setStats)
      .catch((err) => handleApiError(err as Error, user));
  }, [isInitialized, user]);

  const relogin = async () => {
    // Tony 2026-05-21: LIFF id_token expired — force fresh login. If LINE
    // session is still valid, the user sees a brief LINE redirect then comes
    // straight back with a fresh token. Otherwise they re-consent.
    if (!import.meta.env.VITE_LIFF_ID) {
      // Dev mode (mock user) — nothing to refresh, just reload
      window.location.reload();
      return;
    }
    try {
      const liff = (await import("@line/liff")).default;
      liff.logout();
      liff.login();
    } catch (err) {
      console.error("[relogin] failed:", err);
      window.location.reload();
    }
  };

  const runWhoami = async () => {
    setWhoamiLoading(true);
    try {
      const { getLineIdToken } = await import("@/contexts/LiffContext");
      const token = getLineIdToken();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/admin/customers/_debug/whoami`, { headers });
      const json = await res.json();
      setWhoami({ status: res.status, body: json });
    } catch (err) {
      setWhoami({ error: (err as Error).message });
    } finally {
      setWhoamiLoading(false);
    }
  };

  useEffect(() => {
    if (loadError || !isInitialized || !user) return;
    setLoading(true);
    listCustomers({
      sort, order: "desc", limit: PAGE_SIZE, offset,
      search: search || undefined,
      restaurant: restaurantFilter || undefined,
    })
      .then((d) => { setCustomers(d.customers); setTotal(d.total); })
      .catch((err) => handleApiError(err as Error, user))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, offset, search, restaurantFilter, loadError, isInitialized, user]);

  const handleSearch = (v: string) => { setSearch(v); setOffset(0); };
  const handleSort = (s: SortField) => { setSort(s); setOffset(0); };
  const handleRestaurantClick = (code: string) => {
    // Toggle: clicking the active one again clears
    setRestaurantFilter((cur) => cur === code ? null : code);
    setOffset(0);
  };

  const openDetail = async (userId: string) => {
    try {
      const d = await getCustomer(userId);
      setSelected(d);
    } catch (err) {
      alert("載入客戶詳情失敗:" + (err as Error).message);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try { await downloadCsv(); }
    catch (err) { alert("CSV 下載失敗:" + (err as Error).message); }
    setDownloading(false);
  };

  if (!isInitialized) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">正在連線 LINE...</p></div>;
  }
  if (liffError) {
    return <div className="min-h-screen flex items-center justify-center bg-background p-6"><p className="text-destructive text-center">LIFF: {liffError}</p></div>;
  }
  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full bg-card border rounded-2xl p-6 shadow-lg">
          <p className="text-destructive font-bold mb-2">
            {errorKind === "expired" ? "⏰ 連線逾時" : "⚠️ 無法載入"}
          </p>
          <pre className="text-sm text-foreground whitespace-pre-wrap break-all font-sans">{loadError}</pre>

          {/* Token expired → primary action is relogin */}
          {errorKind === "expired" && (
            <button
              onClick={relogin}
              className="mt-3 w-full px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
            >
              🔄 重新登入
            </button>
          )}

          {/* Whitelist reject → primary action is copy userId */}
          {errorKind === "whitelist" && user?.userId && (
            <button
              onClick={() => {
                navigator.clipboard?.writeText(user.userId).then(() => {
                  alert("已複製 userId 到剪貼簿");
                });
              }}
              className="mt-3 w-full px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
            >
              📋 複製 userId
            </button>
          )}

          {/* Diagnostic always available as a fallback */}
          <button
            onClick={runWhoami}
            disabled={whoamiLoading}
            className="mt-2 w-full px-3 py-2 rounded-lg border border-primary/40 text-primary text-sm font-medium"
          >
            {whoamiLoading ? "診斷中..." : "🔍 跑後端診斷 (whoami)"}
          </button>
          {whoami !== null && (
            <pre className="mt-3 text-[10px] bg-muted/40 rounded-lg p-2 overflow-auto max-h-72 whitespace-pre-wrap break-all">
              {JSON.stringify(whoami, null, 2)}
            </pre>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Header */}
      <div className="bg-foreground text-primary-foreground p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">👥 客戶資料</h1>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="px-3 py-1 rounded-full bg-accent/30 text-xs font-medium"
          >
            {downloading ? "📥 下載中..." : "📥 CSV 匯出"}
          </button>
        </div>
        <p className="text-xs opacity-80 mt-0.5">{user?.displayName ?? "服務人員"}</p>
      </div>

      {/* 🚀 PINNED: 客戶漏斗 — Tony 2026-05-21 */}
      {stats && (
        <div className="p-3 pb-0">
          <div className="rounded-2xl border-2 border-accent/40 bg-card shadow-md overflow-hidden">
            <div className="bg-accent text-accent-foreground px-3 py-2">
              <p className="text-sm font-bold">🚀 客戶漏斗 · Conversion Funnel</p>
              <p className="text-[10px] opacity-80">看每一段的轉化率</p>
            </div>
            <div className="px-2 py-3">
              <div className="grid grid-cols-4 gap-1">
                <FunnelStage label="加好友" value={stats.summary.total_customers} color="bg-primary/10" />
                <FunnelStage
                  label="綁餐廳"
                  value={stats.summary.bound_to_restaurant}
                  color="bg-primary/20"
                  drop={stats.summary.total_customers - stats.summary.bound_to_restaurant}
                />
                <FunnelStage
                  label="完成兌換"
                  value={stats.summary.has_visited}
                  color="bg-primary/30"
                  drop={stats.summary.bound_to_restaurant - stats.summary.has_visited}
                />
                <FunnelStage
                  label="領到獎"
                  value={stats.summary.has_rewarded ?? 0}
                  color="bg-primary/40"
                  drop={stats.summary.has_visited - (stats.summary.has_rewarded ?? 0)}
                />
              </div>
              <div className="text-center mt-2 text-[10px] text-muted-foreground">
                從加好友到完成兌換的 conversion rate: {
                  stats.summary.total_customers > 0
                    ? Math.round((stats.summary.has_visited / stats.summary.total_customers) * 1000) / 10
                    : 0
                }%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📌 PINNED: 各餐廳活動次數 — pinned to top per Tony 2026-05-21 */}
      {stats && stats.by_restaurant.length > 0 && (
        <div className="p-3">
          <div className="rounded-2xl border-2 border-primary/30 bg-card shadow-md overflow-hidden">
            <div className="bg-primary text-primary-foreground px-3 py-2">
              <p className="text-sm font-bold">🏬 各餐廳活動次數 · Restaurants</p>
              <p className="text-[10px] opacity-80">即時 · 從事件表彙整</p>
            </div>
            <div className="divide-y">
              {stats.by_restaurant.map((r) => {
                const isActive = r.binds > 0 || r.redeems > 0;
                const isSelected = restaurantFilter === r.restaurant_id;
                const canClick = isActive; // only allow filtering if there's data to filter to
                return (
                  <button
                    key={r.restaurant_id}
                    onClick={() => canClick && handleRestaurantClick(r.restaurant_id)}
                    disabled={!canClick}
                    className={`w-full text-left px-3 py-2.5 transition-colors ${
                      isSelected ? "bg-primary/15 ring-2 ring-primary ring-inset" : ""
                    } ${
                      canClick ? "hover:bg-primary/5 active:bg-primary/10 cursor-pointer" : "opacity-50 cursor-default"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-primary text-primary-foreground">
                          {r.restaurant_id}
                        </span>
                        <span className="font-bold text-sm">{r.name_zh}</span>
                        <span className="text-[10px] text-muted-foreground">{r.name_en}</span>
                      </div>
                      {isSelected ? (
                        <span className="text-[10px] text-primary font-bold">✓ 已篩選</span>
                      ) : !isActive ? (
                        <span className="text-[10px] text-muted-foreground italic">尚無流量</span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">點此篩選 →</span>
                      )}
                    </div>
                    <div className="grid grid-cols-5 gap-1 text-center">
                      <Mini label="客人" value={r.unique_visitors} />
                      <Mini label="掃QR" value={r.binds} />
                      <Mini label="兌換" value={r.redeems} />
                      <Mini label="擲骰" value={r.rolls} />
                      <Mini label="領獎" value={r.rewards} />
                    </div>
                    {r.spend > 0 && (
                      <p className="text-[11px] text-emerald-700 mt-1 text-right">
                        累計消費 {fmtCurrency(r.spend)}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Stats overview cards (smaller, secondary) */}
      {stats && (
        <div className="px-3 pb-2 grid grid-cols-3 gap-2">
          <StatCard label="總客戶" value={stats.summary.total_customers} />
          <StatCard label="7 日活躍" value={stats.summary.active_7d} />
          <StatCard label="30 日活躍" value={stats.summary.active_30d} />
          <StatCard label="累計消費" value={fmtCurrency(stats.summary.total_spend)} small />
          <StatCard label="總擲骰" value={stats.summary.total_rolls} />
          <StatCard label="總領獎" value={stats.summary.total_rewards} />
        </div>
      )}

      {/* Search + sort */}
      <div className="p-3 space-y-2 bg-card border-t border-b">
        {restaurantFilter && (
          <div className="flex items-center justify-between bg-primary/10 border border-primary rounded-lg px-3 py-2">
            <span className="text-sm">
              🏬 只看 <strong className="font-mono">{restaurantFilter}</strong>
              {stats?.by_restaurant.find((r) => r.restaurant_id === restaurantFilter)?.name_zh && (
                <span className="ml-1 text-xs">
                  ({stats.by_restaurant.find((r) => r.restaurant_id === restaurantFilter)!.name_zh})
                </span>
              )} 的客人  ·  共 {total} 人
            </span>
            <button
              onClick={() => { setRestaurantFilter(null); setOffset(0); }}
              className="text-xs text-primary font-semibold underline px-2 py-0.5"
            >
              ✕ 清除
            </button>
          </div>
        )}
        <input
          type="text"
          placeholder="🔍 搜尋客戶名稱..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border text-sm"
        />
        <div className="flex gap-1 overflow-x-auto">
          {SORT_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => handleSort(s.value)}
              className={`px-2.5 py-1 rounded-full text-xs whitespace-nowrap ${
                s.value === sort ? "bg-foreground text-primary-foreground" : "bg-muted"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Customer list */}
      <div className="px-3 pt-2">
        <p className="text-xs text-muted-foreground mb-2">共 {total} 位客戶</p>
        {loading ? (
          <p className="text-center text-sm text-muted-foreground py-8">載入中...</p>
        ) : (
          <div className="space-y-1.5">
            {customers.map((c) => (
              <button
                key={c.user_id}
                onClick={() => openDetail(c.user_id)}
                className="w-full bg-card rounded-xl p-3 flex items-center gap-3 hover:bg-accent/5 active:scale-99 transition text-left"
              >
                {c.picture_url ? (
                  <img src={c.picture_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs">
                    {(c.display_name ?? "??").slice(0, 2)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{c.display_name ?? "(未提供名稱)"}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {fmtDate(c.last_seen_at)} · {c.total_visits} 次來訪 · {fmtCurrency(c.total_spend)}
                  </p>
                </div>
                <div className="text-right text-[10px] text-muted-foreground shrink-0">
                  <div>🎲 {c.total_dice_rolled}</div>
                  <div>🎁 {c.total_rewards_earned}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between mt-3 text-sm">
            <button
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
              disabled={offset === 0}
              className="px-3 py-1 rounded-lg border disabled:opacity-30"
            >← 上一頁</button>
            <span className="text-xs text-muted-foreground">{offset + 1}-{Math.min(offset + PAGE_SIZE, total)} / {total}</span>
            <button
              onClick={() => setOffset(offset + PAGE_SIZE)}
              disabled={offset + PAGE_SIZE >= total}
              className="px-3 py-1 rounded-lg border disabled:opacity-30"
            >下一頁 →</button>
          </div>
        )}
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-card rounded-2xl max-h-[85vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-card border-b p-4 flex items-center gap-3 z-10">
                {selected.profile.picture_url ? (
                  <img src={selected.profile.picture_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-muted" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{selected.profile.display_name ?? "(未提供名稱)"}</p>
                  <p className="text-[10px] text-muted-foreground font-mono truncate">{selected.profile.user_id}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-muted-foreground p-1">✕</button>
              </div>

              <div className="p-4 space-y-3">
                {/* Aggregates */}
                <div className="grid grid-cols-2 gap-2">
                  <Detail label="首次互動" value={fmtDate(selected.profile.first_seen_at)} />
                  <Detail label="最近活動" value={fmtDate(selected.profile.last_seen_at)} />
                  <Detail label="累計消費" value={fmtCurrency(selected.profile.total_spend)} />
                  <Detail label="來訪次數" value={String(selected.profile.total_visits)} />
                  <Detail label="擲骰次數" value={String(selected.profile.total_dice_rolled)} />
                  <Detail label="領獎次數" value={String(selected.profile.total_rewards_earned)} />
                  <Detail label="完成季數" value={String(selected.profile.total_seasons)} />
                  {selected.game_state && (
                    <Detail label="當前位置" value={`第 ${selected.game_state.total_points} 格`} />
                  )}
                </div>

                {/* Events timeline */}
                <div>
                  <p className="text-xs font-bold mb-1.5">📜 互動歷程(最近 100 筆)</p>
                  <div className="space-y-1">
                    {selected.events.map((e) => (
                      <div key={e.id} className="text-xs flex justify-between bg-muted/40 rounded-lg px-2.5 py-1.5">
                        <div className="flex-1">
                          <span className="font-bold">{fmtEvent(e)}</span>
                          {e.restaurant_id && <span className="ml-1 text-muted-foreground">@ {e.restaurant_id}</span>}
                          {e.amount !== null && <span className="ml-1 text-accent-foreground">{fmtCurrency(e.amount)}</span>}
                        </div>
                        <span className="text-muted-foreground shrink-0 ml-2">{fmtDate(e.created_at)}</span>
                      </div>
                    ))}
                    {selected.events.length === 0 && (
                      <p className="text-xs text-muted-foreground italic">無互動紀錄</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatCard = ({ label, value, small }: { label: string; value: string | number; small?: boolean }) => (
  <div className="bg-card rounded-xl p-2.5 text-center">
    <p className="text-[10px] text-muted-foreground">{label}</p>
    <p className={`font-bold text-foreground ${small ? "text-sm" : "text-lg"}`}>{value}</p>
  </div>
);

const Mini = ({ label, value }: { label: string; value: number }) => (
  <div className={`rounded ${value > 0 ? "bg-primary/5" : "bg-muted/30"} py-0.5`}>
    <p className="text-[9px] text-muted-foreground leading-none">{label}</p>
    <p className={`text-sm font-bold leading-tight ${value > 0 ? "text-primary" : "text-muted-foreground"}`}>{value}</p>
  </div>
);

const FunnelStage = ({ label, value, color, drop }: { label: string; value: number; color: string; drop?: number }) => (
  <div className="flex flex-col items-center">
    <div className={`${color} rounded-lg w-full py-2 text-center`}>
      <p className="text-[10px] text-muted-foreground leading-none">{label}</p>
      <p className="text-2xl font-bold text-foreground leading-tight">{value}</p>
    </div>
    {drop !== undefined && drop > 0 && (
      <p className="text-[9px] text-destructive mt-0.5">↓ {drop} 流失</p>
    )}
  </div>
);

const Detail = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-muted/30 rounded-lg p-2">
    <p className="text-[10px] text-muted-foreground">{label}</p>
    <p className="text-sm font-bold text-foreground truncate">{value}</p>
  </div>
);

export default AdminCustomersPage;
