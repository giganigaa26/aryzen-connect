import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownLeft, ArrowUpRight, Copy, HelpCircle, Loader2, Minus, Plus,
  Trophy, Gamepad2, Gift, Clock, AlertTriangle, CheckCircle2, Info,
} from "lucide-react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

import { useCountUp } from "@/hooks/useCountUp";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  WALLET, axToInr, inrToAx,
} from "@/lib/config";
import {
  fetchBalance, fetchTransactions, createDepositRequest, requestWithdrawal,
  type Tx, type TxFilter, type TxKind,
} from "@/lib/stubs";

/* ─────────────────────────────────────────────────────────────────────────
 * Wallet — money-handling screen.
 * Conversion, processing-hours and limits all live in WALLET (config.ts).
 * Backend hooks: createDepositRequest / requestWithdrawal / fetchTransactions.
 * Realtime balance: replace fetchBalance() with subscribeToBalance(uid).
 * ────────────────────────────────────────────────────────────────────── */

export default function Wallet() {
  const [balance, setBalance] = useState<number | null>(null);
  const balanceShown = useCountUp(balance ?? 0, 800);

  const [addOpen, setAddOpen] = useState(false);
  const [wdOpen, setWdOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [filter, setFilter] = useState<TxFilter>("all");
  const [txs, setTxs] = useState<Tx[] | null>(null);

  useEffect(() => { fetchBalance().then(setBalance); }, []);
  useEffect(() => { setTxs(null); fetchTransactions(filter).then(setTxs); }, [filter]);

  return (
    <>
      <ScreenHeader title="Wallet" />
      <div className="px-4 pt-4 pb-8 space-y-5">
        {/* ── Balance card ─────────────────────────────────────────────── */}
        <div className="relative rounded-2xl p-5 bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg shadow-primary/20 overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="text-[11px] uppercase tracking-wider opacity-85 font-bold">
              Total Balance
            </div>
            <button
              onClick={() => setHelpOpen(true)}
              className="press h-8 w-8 rounded-full bg-primary-foreground/15 flex items-center justify-center"
              aria-label="What is AX?"
            >
              <HelpCircle size={16} />
            </button>
          </div>

          <div className="mt-1 flex items-end gap-1">
            {balance == null ? (
              <Skeleton className="h-10 w-36 bg-primary-foreground/20" />
            ) : (
              <span className="text-4xl font-extrabold tracking-tight tabular-nums leading-none">
                ₹{axToInr(balanceShown).toLocaleString()}
              </span>
            )}
          </div>

          <div className="mt-2 text-[11px] opacity-85 font-medium">
            Withdraw to any UPI · Add money via UPI
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button
              onClick={() => setAddOpen(true)}
              className="bg-card text-foreground hover:bg-card/90 w-full font-bold"
              size="lg"
            >
              <Plus size={16} /> Add Money
            </Button>
            <Button
              onClick={() => setWdOpen(true)}
              variant="outline"
              className="bg-transparent border-2 border-primary-foreground/70 text-primary-foreground hover:bg-primary-foreground/10 w-full font-bold"
              size="lg"
            >
              <ArrowUpRight size={16} /> Withdraw
            </Button>
          </div>
        </div>

        {/* ── Processing hours notice ──────────────────────────────────── */}
        <ProcessingHoursNote />

        {/* ── Transactions ─────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-base">Transactions</h2>
          </div>

          <div className="flex gap-1 p-1 rounded-full bg-secondary border border-border mb-3 overflow-x-auto no-scrollbar">
            {(["all", "credit", "debit", "pending"] as TxFilter[]).map((f) => {
              const isSel = filter === f;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "relative press shrink-0 px-3.5 h-8 rounded-full text-xs font-bold uppercase tracking-wide transition-colors",
                    isSel ? "text-primary-foreground" : "text-muted-foreground"
                  )}
                >
                  {isSel && (
                    <motion.span
                      layoutId="walletFilterPill"
                      className="absolute inset-0 rounded-full bg-primary"
                      transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
                    />
                  )}
                  <span className="relative z-10">
                    {f === "all" ? "All" : f === "credit" ? "Credits" : f === "debit" ? "Debits" : "Pending"}
                  </span>
                </button>
              );
            })}
          </div>

          {txs == null ? (
            <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3.5">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-4 w-14" />
                </div>
              ))}
            </div>
          ) : txs.length === 0 ? (
            <EmptyTxs filter={filter} />
          ) : (
            <motion.div
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } } }}
              className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden shadow-sm"
            >
              {txs.map((t) => <TxRow key={t.id} t={t} />)}
            </motion.div>
          )}
        </section>
      </div>

      {/* ── Sheets & dialogs ───────────────────────────────────────────── */}
      <AddMoneySheet
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmitted={(ax) => {
          toast.success(`Request received! ₹${axToInr(ax).toLocaleString()} will be added after verification.`);
          fetchTransactions(filter).then(setTxs);
        }}
      />
      <WithdrawSheet
        open={wdOpen}
        onOpenChange={setWdOpen}
        balance={balance ?? 0}
        onSubmitted={() => {
          toast.success("Withdrawal requested. Payment will be sent during processing hours.");
          fetchBalance().then(setBalance);
          fetchTransactions(filter).then(setTxs);
        }}
      />
      <HelpDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </>
  );
}

/* ─── Sub-components ──────────────────────────────────────────────────── */

function ProcessingHoursNote() {
  const { startHour, endHour, tz } = WALLET.processingHours;
  return (
    <div className="rounded-2xl border border-warning/30 bg-warning/10 p-3 flex gap-2.5">
      <Clock size={16} className="text-warning shrink-0 mt-0.5" />
      <div className="text-[12px] leading-snug text-foreground">
        <div className="font-bold">Processing Hours: {startHour} AM – {endHour} PM {tz} Daily</div>
        <div className="text-muted-foreground">
          Requests outside these hours queue up and get processed the next day.
        </div>
      </div>
    </div>
  );
}

function EmptyTxs({ filter }: { filter: TxFilter }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-border bg-card/50 px-5 py-10 text-center">
      <div className="mx-auto h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-3">
        <Info size={20} className="text-muted-foreground" />
      </div>
      <h3 className="font-extrabold text-base">
        {filter === "pending" ? "Nothing pending" : "No transactions yet"}
      </h3>
      <p className="text-sm text-muted-foreground mt-1">
        Add money or join a match to see activity here.
      </p>
    </div>
  );
}

const KIND_META: Record<TxKind, { icon: React.ReactNode; tone: string }> = {
  deposit:       { icon: <ArrowDownLeft size={18} />, tone: "bg-success/15 text-success" },
  withdrawal:    { icon: <ArrowUpRight  size={18} />, tone: "bg-warning/15 text-warning" },
  "match-entry":{ icon: <Gamepad2     size={18} />, tone: "bg-destructive/15 text-destructive" },
  prize:         { icon: <Trophy        size={18} />, tone: "bg-warning/15 text-warning" },
  bonus:         { icon: <Gift          size={18} />, tone: "bg-accent/15 text-accent" },
};

function TxRow({ t }: { t: Tx }) {
  const meta = KIND_META[t.kind];
  const isCredit = t.type === "credit";
  const time = new Date(t.date);
  const timeLabel = isNaN(time.getTime())
    ? t.date
    : time.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  // Match-cancelled refunds get a subtle green left border + tag for the first
  // 24h after creation, so users notice the credit landed in their wallet.
  const isMatchRefund = t.reasonCode === "match_cancelled";
  const ageMs = Date.now() - time.getTime();
  const isFreshRefund = isMatchRefund && !isNaN(time.getTime()) && ageMs < 24 * 3_600_000;

  const showReason = () => {
    if (t.status === "rejected" && t.reason) toast.error(t.reason);
    else if (t.status === "pending") {
      toast.message("Processing", {
        description: `Submitted ${timeLabel}. Will be processed during ${WALLET.processingHours.startHour} AM – ${WALLET.processingHours.endHour} PM ${WALLET.processingHours.tz}.`,
      });
    }
  };

  return (
    <motion.button
      onClick={showReason}
      variants={{
        hidden: { opacity: 0, y: 8 },
        show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: "easeOut" } },
      }}
      className={cn(
        "w-full flex items-center gap-3 p-3.5 active:bg-secondary/50 transition-colors text-left relative",
        isFreshRefund && "border-l-2 border-l-success bg-success/[0.03]",
      )}
    >
      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", meta.tone)}>
        {meta.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold truncate flex items-center gap-1.5">
          <span className="truncate">{t.title}</span>
          {isFreshRefund && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-success/15 text-success text-[9px] font-extrabold uppercase tracking-wide shrink-0">
              Match Refund
            </span>
          )}
        </div>
        <div className="text-[11px] text-muted-foreground truncate flex items-center gap-1.5">
          <span>{timeLabel}</span>
          {t.subtitle && <><span className="opacity-50">·</span><span className="truncate">{t.subtitle}</span></>}
        </div>
        {t.status !== "completed" && (
          <div className="mt-1">
            <StatusBadge status={t.status} />
          </div>
        )}
      </div>
      <div className={cn(
        "font-extrabold text-sm tabular-nums shrink-0",
        isCredit ? "text-success" : "text-foreground"
      )}>
        {isCredit ? "+" : "−"}₹{axToInr(t.amount).toLocaleString()}
      </div>
    </motion.button>
  );
}

function StatusBadge({ status }: { status: Tx["status"] }) {
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-warning/15 text-warning text-[10px] font-extrabold uppercase tracking-wide">
        <Loader2 size={9} className="animate-spin" /> Processing
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-destructive/15 text-destructive text-[10px] font-extrabold uppercase tracking-wide">
        <AlertTriangle size={9} /> Failed
      </span>
    );
  }
  return null;
}

/* ─── Add Money sheet (multi-step) ───────────────────────────────────── */

function AddMoneySheet({
  open, onOpenChange, onSubmitted,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmitted: (amountAx: number) => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  // amount is in RUPEES (user-facing). Converted to AX only for ledger calls.
  const [amountInr, setAmountInr] = useState(WALLET.minAddInr);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) { setStep(1); setAmountInr(WALLET.minAddInr); }
  }, [open]);

  const inRange = amountInr >= WALLET.minAddInr && amountInr <= WALLET.maxAddInr;
  const valid = inRange;

  const error = !inRange
    ? `Amount must be between ₹${WALLET.minAddInr} and ₹${WALLET.maxAddInr.toLocaleString()}`
    : "";

  const adjust = (delta: number) => {
    const next = Math.max(WALLET.minAddInr, Math.min(WALLET.maxAddInr, amountInr + delta));
    setAmountInr(next);
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const ax = inrToAx(amountInr);
      // TODO: replace with createDepositRequest() Supabase RPC.
      await createDepositRequest(ax);
      onOpenChange(false);
      onSubmitted(ax);
    } catch {
      toast.error("Couldn't submit request. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[92vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Plus size={18} className="text-primary" />
            {step === 1 ? "Add Money" : "Send Payment to Complete"}
          </SheetTitle>
        </SheetHeader>

        {step === 1 ? (
          <div className="mt-5 space-y-4">
            {/* Stepper input — in rupees */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Amount
              </label>
              <div className="mt-2 flex items-stretch gap-2">
                <button
                  onClick={() => adjust(-WALLET.stepInr)}
                  disabled={amountInr <= WALLET.minAddInr}
                  className="press h-14 w-14 rounded-xl border-2 border-border bg-card flex items-center justify-center disabled:opacity-40"
                  aria-label="Decrease"
                >
                  <Minus size={18} />
                </button>
                <div className="flex-1 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground">
                    ₹
                  </span>
                  <input
                    inputMode="numeric"
                    value={amountInr || ""}
                    onChange={(e) => {
                      const v = parseInt(e.target.value.replace(/\D/g, "")) || 0;
                      setAmountInr(Math.min(WALLET.maxAddInr, v));
                    }}
                    className="w-full h-14 pl-10 pr-4 rounded-xl border-2 border-border bg-card focus:border-primary outline-none text-center text-2xl font-extrabold tabular-nums"
                  />
                </div>
                <button
                  onClick={() => adjust(WALLET.stepInr)}
                  disabled={amountInr >= WALLET.maxAddInr}
                  className="press h-14 w-14 rounded-xl border-2 border-border bg-card flex items-center justify-center disabled:opacity-40"
                  aria-label="Increase"
                >
                  <Plus size={18} />
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between text-[12px]">
                <span className="text-muted-foreground">
                  Min ₹{WALLET.minAddInr} · Max ₹{WALLET.maxAddInr.toLocaleString()}
                </span>
              </div>
              {amountInr > 0 && error && (
                <div className="mt-1.5 text-[11px] font-semibold text-destructive">
                  {error}
                </div>
              )}
            </div>

            {/* Quick presets — in rupees */}
            <div className="grid grid-cols-4 gap-2">
              {[10, 25, 50, 100].map((p) => (
                <button
                  key={p}
                  onClick={() => setAmountInr(p)}
                  className={cn(
                    "press h-11 rounded-xl border-2 font-bold text-xs",
                    amountInr === p
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-foreground"
                  )}
                >
                  ₹{p}
                </button>
              ))}
            </div>

            <ProcessingHoursNote />

            <Button
              size="xl"
              disabled={!valid}
              onClick={() => setStep(2)}
              className="w-full"
            >
              Proceed to Pay · ₹{amountInr.toLocaleString()}
            </Button>
          </div>
        ) : (
          <PaymentStep
            inr={amountInr}
            submitting={submitting}
            onBack={() => setStep(1)}
            onSubmit={submit}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function PaymentStep({
  inr, submitting, onBack, onSubmit,
}: {
  inr: number;
  submitting: boolean;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const copy = (txt: string, label: string) => {
    navigator.clipboard?.writeText(txt);
    toast.success(`${label} copied`);
  };
  return (
    <div className="mt-5 space-y-4">
      {/* Payment card */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="text-center">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Send exactly
          </div>
          <div className="text-3xl font-extrabold tabular-nums mt-0.5">
            ₹{inr.toLocaleString()}
          </div>
        </div>

        {WALLET.paymentQrUrl ? (
          <div className="mt-3 flex justify-center">
            <img
              src={WALLET.paymentQrUrl}
              alt="Payment QR"
              className="h-44 w-44 rounded-xl border border-border bg-background object-contain"
            />
          </div>
        ) : (
          <div className="mt-3 mx-auto h-44 w-44 rounded-xl border-2 border-dashed border-border bg-secondary/40 flex items-center justify-center text-xs text-muted-foreground text-center px-3">
            QR code will appear here
            {/* TODO: paste paymentQrUrl in WALLET (config.ts) or pull from Supabase. */}
          </div>
        )}

        <div className="mt-3 rounded-xl bg-secondary/60 border border-border p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            UPI ID
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-mono font-extrabold text-base tracking-wide truncate flex-1">
              {WALLET.upiId}
            </span>
            <button
              onClick={() => copy(WALLET.upiId, "UPI ID")}
              className="press h-9 w-9 rounded-lg bg-card border border-border flex items-center justify-center"
              aria-label="Copy UPI ID"
            >
              <Copy size={14} />
            </button>
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">{WALLET.upiName}</div>
        </div>
      </div>

      {/* Steps */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
          What to do
        </div>
        <ol className="space-y-2 text-sm">
          {[
            <>Send exactly <span className="font-bold">₹{inr.toLocaleString()}</span> to the UPI ID above</>,
            <>Screenshot your payment confirmation</>,
            <>Your AX will be added within 1 hour during processing hours</>,
          ].map((line, i) => (
            <li key={i} className="flex gap-2.5 leading-snug">
              <span className="shrink-0 h-5 w-5 rounded-md bg-primary/10 text-primary text-[11px] font-extrabold flex items-center justify-center">
                {i + 1}
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ol>
      </div>

      <ProcessingHoursNote />

      <div className="grid grid-cols-3 gap-2">
        <Button variant="outline" onClick={onBack} disabled={submitting}>
          Back
        </Button>
        <Button
          size="xl"
          className="col-span-2"
          onClick={onSubmit}
          disabled={submitting}
        >
          {submitting
            ? <><Loader2 size={16} className="animate-spin" /> Submitting…</>
            : <>I've Sent the Payment</>}
        </Button>
      </div>
    </div>
  );
}

/* ─── Withdraw sheet (multi-step) ────────────────────────────────────── */

function WithdrawSheet({
  open, onOpenChange, balance, onSubmitted,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  balance: number;
  onSubmitted: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  // amount in RUPEES (user-facing). Converted to AX only for the ledger call.
  const [amountInr, setAmountInr] = useState(WALLET.minWithdrawInr);
  const [upi, setUpi] = useState("");
  const [upiConfirm, setUpiConfirm] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const balanceInr = axToInr(balance);

  useEffect(() => {
    if (open) {
      setStep(1);
      setAmountInr(WALLET.minWithdrawInr);
      setUpi(""); setUpiConfirm(""); setName("");
    }
  }, [open]);

  const above = amountInr >= WALLET.minWithdrawInr;
  const within = amountInr <= balanceInr;
  const validAmount = above && within;

  const amountError = !above
    ? `Min withdrawal is ₹${WALLET.minWithdrawInr}`
    : !within
    ? `Insufficient balance (you have ₹${balanceInr.toLocaleString()})`
    : "";

  const upiValid = /^[\w.\-]+@[\w.\-]+$/.test(upi);
  const upiMatch = upi === upiConfirm;
  const nameValid = name.trim().length >= 2;
  const validDetails = upiValid && upiMatch && nameValid;

  const adjust = (delta: number) => {
    const cap = Math.max(WALLET.minWithdrawInr, balanceInr || WALLET.minWithdrawInr);
    const next = Math.max(WALLET.minWithdrawInr, Math.min(cap, amountInr + delta));
    setAmountInr(next);
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const ax = inrToAx(amountInr);
      // TODO: replace with requestWithdrawal() Supabase RPC. Server deducts AX
      // immediately into a "pending" hold; refund on rejection.
      await requestWithdrawal(ax, upi, name);
      onOpenChange(false);
      onSubmitted();
    } catch {
      toast.error("Couldn't submit request. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[92vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ArrowUpRight size={18} className="text-primary" />
            {step === 1 ? "Withdraw Amount" : "UPI Details"}
          </SheetTitle>
        </SheetHeader>

        {step === 1 ? (
          <div className="mt-5 space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Amount
              </label>
              <div className="mt-2 flex items-stretch gap-2">
                <button
                  onClick={() => adjust(-WALLET.stepInr)}
                  disabled={amountInr <= WALLET.minWithdrawInr}
                  className="press h-14 w-14 rounded-xl border-2 border-border bg-card flex items-center justify-center disabled:opacity-40"
                  aria-label="Decrease"
                >
                  <Minus size={18} />
                </button>
                <div className="flex-1 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground">
                    ₹
                  </span>
                  <input
                    inputMode="numeric"
                    value={amountInr || ""}
                    onChange={(e) => {
                      const v = parseInt(e.target.value.replace(/\D/g, "")) || 0;
                      setAmountInr(v);
                    }}
                    className="w-full h-14 pl-10 pr-4 rounded-xl border-2 border-border bg-card focus:border-primary outline-none text-center text-2xl font-extrabold tabular-nums"
                  />
                </div>
                <button
                  onClick={() => adjust(WALLET.stepInr)}
                  disabled={amountInr >= balanceInr}
                  className="press h-14 w-14 rounded-xl border-2 border-border bg-card flex items-center justify-center disabled:opacity-40"
                  aria-label="Increase"
                >
                  <Plus size={18} />
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between text-[12px]">
                <span className="text-muted-foreground">
                  Min ₹{WALLET.minWithdrawInr} · Bal ₹{balanceInr.toLocaleString()}
                </span>
              </div>
              {amountInr > 0 && amountError && (
                <div className="mt-1.5 text-[11px] font-semibold text-destructive">
                  {amountError}
                </div>
              )}
            </div>

            <ProcessingHoursNote />

            <Button
              size="xl"
              disabled={!validAmount}
              onClick={() => setStep(2)}
              className="w-full"
            >
              Continue
            </Button>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <Field
              label="UPI ID"
              value={upi}
              onChange={setUpi}
              placeholder="yourname@bank"
              error={upi.length > 0 && !upiValid ? "Enter a valid UPI ID" : ""}
            />
            <Field
              label="Confirm UPI ID"
              value={upiConfirm}
              onChange={setUpiConfirm}
              placeholder="re-enter UPI"
              error={upiConfirm.length > 0 && !upiMatch ? "UPI IDs don't match" : ""}
            />
            <Field
              label="Account holder name"
              value={name}
              onChange={setName}
              placeholder="As on UPI account"
              error={name.length > 0 && !nameValid ? "Enter a valid name" : ""}
            />

            <div className="rounded-xl border border-border bg-secondary/40 p-3 text-xs flex gap-2">
              <CheckCircle2 size={14} className="text-success shrink-0 mt-0.5" />
              <div className="leading-snug">
                You'll receive <span className="font-bold text-foreground">₹{amountInr.toLocaleString()}</span>
                {" "}to your UPI. Amount is held immediately and refunded if rejected.
              </div>
            </div>

            <ProcessingHoursNote />

            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" onClick={() => setStep(1)} disabled={submitting}>
                Back
              </Button>
              <Button
                size="xl"
                className="col-span-2"
                disabled={!validDetails || submitting}
                onClick={submit}
              >
                {submitting
                  ? <><Loader2 size={16} className="animate-spin" /> Requesting…</>
                  : <>Request Withdrawal</>}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Field({
  label, value, onChange, placeholder, error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
}) {
  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full h-12 px-4 rounded-xl border-2 border-border bg-card focus:border-primary outline-none font-semibold"
      />
      {error && (
        <div className="mt-1 text-[11px] font-semibold text-destructive">{error}</div>
      )}
    </div>
  );
}

/* ─── Help dialog ────────────────────────────────────────────────────── */

function HelpDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info size={18} /> Wallet Help
          </DialogTitle>
          <DialogDescription>
            Add money via UPI, withdraw anytime to UPI.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <Section title="How do deposits work?">
            <ul className="space-y-1 text-muted-foreground">
              <li>• You send money via UPI</li>
              <li>• We verify payment manually</li>
              <li>• Balance credited within 1 hour ({WALLET.processingHours.startHour} AM – {WALLET.processingHours.endHour} PM {WALLET.processingHours.tz})</li>
              <li>• 100% secure, full refund if any issue</li>
            </ul>
          </Section>
          <Section title="How do withdrawals work?">
            <ul className="space-y-1 text-muted-foreground">
              <li>• Request any amount ≥ ₹{WALLET.minWithdrawInr}</li>
              <li>• Money sent to your UPI within processing hours</li>
              <li>• Track status in transaction history</li>
            </ul>
          </Section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-bold uppercase tracking-wider text-foreground mb-1">
        {title}
      </div>
      {children}
    </div>
  );
}
