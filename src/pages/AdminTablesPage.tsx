/**
 * Staff admin LIFF page — used by IC Kaohsiung wait staff after a customer
 * checks out. The staff:
 *   1. Picks the restaurant they work at (tabs at top)
 *   2. Sees a grid of tables coloured by state
 *   3. Taps a 🟢 "bound" table → enters the bill amount → confirms
 *   4. Backend pushes a LINE invite to the customer's LIFF, with dice issued
 *      = floor(amount / 2000), capped at 5.
 *
 * Access control: server enforces both LIFF auth + staff_whitelist. The
 * client side just shows "not authorized" if any /api/admin call 401/403s.
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLiff } from "@/contexts/LiffContext";
import {
  listRestaurants,
  listTables,
  activateTable,
  type Restaurant,
  type TableRow,
} from "@/api/admin";

const STATE_STYLES: Record<TableRow["state"], { bg: string; border: string; label: string; icon: string }> = {
  idle:      { bg: "hsl(0 0% 96%)",                       border: "hsl(0 0% 86%)",    label: "等待中",    icon: "⚪" },
  bound:     { bg: "hsl(140 50% 92%)",                    border: "hsl(140 50% 55%)", label: "客戶已綁定", icon: "🟢" },
  activated: { bg: "hsl(43 85% 90%)",                     border: "hsl(43 85% 55%)",  label: "已啟用",    icon: "🟡" },
  cooldown:  { bg: "hsl(0 0% 90%)",                       border: "hsl(0 0% 70%)",    label: "冷卻中",    icon: "⚫" },
};

const REFRESH_INTERVAL_MS = 15_000;

const AdminTablesPage = () => {
  const { user, isInitialized, error: liffError } = useLiff();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRid, setSelectedRid] = useState<string | null>(null);
  const [tables, setTables] = useState<TableRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<TableRow | null>(null);
  const [amount, setAmount] = useState("");
  const [activating, setActivating] = useState(false);
  const [activateResult, setActivateResult] = useState<{ kind: "success" | "error"; msg: string } | null>(null);

  // Load restaurants once LIFF is ready
  useEffect(() => {
    if (!isInitialized || !user) return;
    listRestaurants()
      .then((rs) => {
        setRestaurants(rs);
        if (rs.length > 0 && !selectedRid) setSelectedRid(rs[0].id);
      })
      .catch((err) => {
        setLoadError(err.message?.includes("401") || err.message?.includes("403")
          ? "您不在服務人員白名單,請聯絡 IT 加入。"
          : `載入餐廳失敗:${err.message}`);
      });
  }, [isInitialized, user, selectedRid]);

  // Poll tables for currently selected restaurant
  useEffect(() => {
    if (!selectedRid) return;
    let cancelled = false;
    const fetchTables = async () => {
      try {
        const rows = await listTables(selectedRid);
        if (!cancelled) setTables(rows);
      } catch (err) {
        if (!cancelled) setLoadError(`載入桌號失敗:${(err as Error).message}`);
      }
    };
    fetchTables();
    const id = setInterval(fetchTables, REFRESH_INTERVAL_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, [selectedRid]);

  const dicePreview = (() => {
    const n = parseInt(amount, 10);
    if (!Number.isFinite(n) || n < 2000) return 0;
    return Math.min(Math.floor(n / 2000), 5);
  })();

  const handleActivate = async () => {
    if (!selectedTable || dicePreview <= 0) return;
    setActivating(true);
    setActivateResult(null);
    const result = await activateTable(selectedTable.id, parseInt(amount, 10));
    setActivating(false);
    if (result.ok) {
      setActivateResult({
        kind: "success",
        msg: `✅ 已推送給客戶 ${result.dice_issued} 次擲骰機會${result.push_ok ? "" : "(注意:LINE 推送失敗:" + (result.push_reason ?? "未知") + ")"}`,
      });
      // refresh tables to reflect new state
      if (selectedRid) listTables(selectedRid).then(setTables).catch(() => {});
      setTimeout(() => { setSelectedTable(null); setAmount(""); setActivateResult(null); }, 2500);
    } else {
      const reasonText: Record<string, string> = {
        no_active_binding: "該桌目前沒有客戶綁定,請客戶先掃桌邊 QR 加入 LINE 並送出桌號。",
        table_not_found: "桌號不存在",
      };
      setActivateResult({
        kind: "error",
        msg: reasonText[result.reason ?? ""] ?? `啟用失敗:${result.reason}`,
      });
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">正在連線 LINE...</p>
      </div>
    );
  }

  if (liffError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <p className="text-destructive text-center">LIFF 連線失敗:{liffError}</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <p className="text-destructive text-center">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Header */}
      <div className="bg-foreground text-primary-foreground p-4">
        <h1 className="text-lg font-bold text-center">🎲 IC 高雄 · 桌邊管理</h1>
        <p className="text-xs text-center opacity-80 mt-0.5">
          {user?.displayName ?? "服務人員"} · {restaurants.length} 餐廳可管
        </p>
      </div>

      {/* Restaurant picker tabs */}
      <div className="overflow-x-auto bg-card border-b">
        <div className="flex gap-1 px-2 py-2 min-w-max">
          {restaurants.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedRid(r.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                r.id === selectedRid
                  ? "bg-foreground text-primary-foreground"
                  : "bg-muted text-foreground/70 hover:bg-muted-foreground/10"
              }`}
            >
              {r.name_zh}
            </button>
          ))}
        </div>
      </div>

      {/* Table grid */}
      <div className="p-3">
        <div className="grid grid-cols-4 gap-2">
          {tables.map((t) => {
            const style = STATE_STYLES[t.state];
            const tappable = t.state === "bound";
            return (
              <button
                key={t.id}
                onClick={() => tappable && setSelectedTable(t)}
                disabled={!tappable}
                className="aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition disabled:opacity-60 enabled:active:scale-95 enabled:hover:shadow-md"
                style={{ background: style.bg, borderColor: style.border }}
              >
                <span className="text-xl">{style.icon}</span>
                <span className="font-bold text-sm text-foreground">{t.label}</span>
                <span className="text-[10px] text-muted-foreground">{style.label}</span>
              </button>
            );
          })}
        </div>

        {tables.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">載入中...</p>
        )}

        <p className="text-[10px] text-muted-foreground text-center mt-3">
          ⚪ 等待 · 🟢 客戶綁定中(可啟用)· 🟡 已啟用 · ⚫ 冷卻
          <br />
          自動每 15 秒刷新狀態
        </p>
      </div>

      {/* Activate modal */}
      <AnimatePresence>
        {selectedTable && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
            onClick={() => !activating && setSelectedTable(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 10 }}
              className="w-full max-w-sm bg-card rounded-2xl p-5 space-y-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <p className="text-xs text-muted-foreground">啟用桌號</p>
                <h3 className="text-2xl font-black text-foreground">{selectedTable.id}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  綁定客戶 ID: <span className="font-mono">{selectedTable.binding?.user_id?.slice(0, 8) ?? "—"}...</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  綁定時間: {selectedTable.binding?.bound_at?.slice(11, 16) ?? "—"}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  消費金額(NT$)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="2400"
                  disabled={activating}
                  autoFocus
                  className="w-full px-3 py-2.5 rounded-lg border-2 border-border text-lg font-bold text-center bg-background focus:outline-none focus:border-accent"
                />
                <p className="text-xs text-muted-foreground mt-1.5 text-center">
                  {dicePreview > 0
                    ? `將給予客戶 ${dicePreview} 次擲骰機會(每滿 NT$2,000 = 1 次,上限 5)`
                    : amount
                      ? "金額需滿 NT$2,000 才可啟用"
                      : ""}
                </p>
              </div>

              {activateResult && (
                <div
                  className={`text-sm rounded-lg p-2.5 text-center ${
                    activateResult.kind === "success"
                      ? "bg-accent/20 text-foreground"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {activateResult.msg}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => { setSelectedTable(null); setAmount(""); setActivateResult(null); }}
                  disabled={activating}
                  className="flex-1 py-2.5 rounded-xl border border-border text-foreground font-medium"
                >
                  取消
                </button>
                <button
                  onClick={handleActivate}
                  disabled={activating || dicePreview <= 0}
                  className="flex-1 py-2.5 rounded-xl bg-foreground text-primary-foreground font-bold disabled:opacity-50"
                >
                  {activating ? "推送中..." : "✓ 啟用並推送"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminTablesPage;
