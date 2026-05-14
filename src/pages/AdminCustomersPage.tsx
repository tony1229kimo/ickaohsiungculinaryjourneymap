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
const fmtEventType = (t: string) => ({
  bind: "🔗 加好友",
  activate: "💳 結帳啟用",
  roll: "🎲 擲骰",
  reward_lottery: "🎁 抽中獎品",
  reward_fixed: "⭐ 固定格獎勵",
  season_reset: "🔄 新季開始",
  invoice_redeem: "📄 掃發票",
}[t] ?? t);

const AdminCustomersPage = () => {
  const { isInitialized, user, error: liffError } = useLiff();
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState<SortField>("last_seen_at");
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<CustomerDetail | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!isInitialized || !user) return;
    getStats()
      .then(setStats)
      .catch((err) => {
        if (/40[13]/.test(err.message)) {
          setLoadError("您不在服務人員白名單,請聯絡 IT 加入。");
        } else {
          setLoadError("無法載入統計:" + err.message);
        }
      });
  }, [isInitialized, user]);

  useEffect(() => {
    if (loadError || !isInitialized) return;
    setLoading(true);
    listCustomers({ sort, order: "desc", limit: PAGE_SIZE, offset, search: search || undefined })
      .then((d) => { setCustomers(d.customers); setTotal(d.total); })
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, [sort, offset, search, loadError, isInitialized]);

  const handleSearch = (v: string) => { setSearch(v); setOffset(0); };
  const handleSort = (s: SortField) => { setSort(s); setOffset(0); };

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
    return <div className="min-h-screen flex items-center justify-center bg-background p-6"><p className="text-destructive text-center">{loadError}</p></div>;
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

      {/* Stats overview cards */}
      {stats && (
        <div className="p-3 grid grid-cols-3 gap-2">
          <StatCard label="總客戶" value={stats.summary.total_customers} />
          <StatCard label="7 日活躍" value={stats.summary.active_7d} />
          <StatCard label="30 日活躍" value={stats.summary.active_30d} />
          <StatCard label="累計消費" value={fmtCurrency(stats.summary.total_spend)} small />
          <StatCard label="總擲骰" value={stats.summary.total_rolls} />
          <StatCard label="總領獎" value={stats.summary.total_rewards} />
        </div>
      )}

      {/* By restaurant */}
      {stats && stats.by_restaurant.length > 0 && (
        <div className="px-3 pb-2">
          <p className="text-xs text-muted-foreground mb-1.5">餐廳業績</p>
          <div className="space-y-1">
            {stats.by_restaurant.map((r) => (
              <div key={r.restaurant_id} className="flex items-center justify-between bg-card rounded-lg px-3 py-2 text-sm">
                <span className="font-bold">{r.restaurant_id}</span>
                <span className="text-xs text-muted-foreground">
                  {r.unique_visitors} 客 · {r.visits} 桌次 · {fmtCurrency(r.spend)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search + sort */}
      <div className="p-3 space-y-2 bg-card border-t border-b">
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
                          <span className="font-bold">{fmtEventType(e.event_type)}</span>
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

const Detail = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-muted/30 rounded-lg p-2">
    <p className="text-[10px] text-muted-foreground">{label}</p>
    <p className="text-sm font-bold text-foreground truncate">{value}</p>
  </div>
);

export default AdminCustomersPage;
