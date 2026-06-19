import { useEffect, useState, useMemo } from "react";
import {
  getWallet,
  contributeMoney,
  getTransactions,
} from "../../api/walletApi";

import "./TripWallet.css";

function formatINR(n) {
  if (n == null || Number.isNaN(n)) return "0";
  return Math.round(n).toLocaleString("en-IN");
}

function formatRelative(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffHrs = (now - d) / 36e5;

  if (diffHrs < 24) {
    return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  }
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function TripWallet({ tripId }) {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const fetchWallet = async () => {
    try {
      const [walletRes, transactionRes] = await Promise.all([
        getWallet(tripId),
        getTransactions(tripId),
      ]);

      setWallet(walletRes.data.wallet);
      setTransactions(transactionRes.data.transactions);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, [tripId]);

  const handleContribute = async (e) => {
    e.preventDefault();

    if (!amount || Number(amount) <= 0) {
      return;
    }

    setSubmitting(true);
    try {
      await contributeMoney(tripId, Number(amount));
      setAmount("");
      await fetchWallet();
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1800);
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const progress = useMemo(() => {
    if (!wallet || !wallet.totalContributed) return 0;
    return Math.min((wallet.totalExpenses / wallet.totalContributed) * 100, 100);
  }, [wallet]);

  // SVG ring geometry
  const RADIUS = 54;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const dashOffset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE;

  if (loading) {
    return (
      <div className="tw-root">
        <div className="tw-skeleton-wrap">
          <div className="tw-skeleton tw-skeleton-hero" />
          <div className="tw-skeleton tw-skeleton-card" />
          <div className="tw-skeleton tw-skeleton-row" />
          <div className="tw-skeleton tw-skeleton-row" />
        </div>
      </div>
    );
  }

  return (
    <div className="tw-root">
      <div className="tw-wallet">
        {/* Hero */}
        <div className="tw-hero">
          <div className="tw-hero-glow" aria-hidden="true" />

          <div className="tw-hero-top">
            <div className="tw-eyebrow">
              <span className="tw-eyebrow-dot" />
              Trip Wallet
            </div>
            {tripId && (
              <span className="tw-trip-id">
                #{String(tripId).slice(-6).toUpperCase()}
              </span>
            )}
          </div>

          <div className="tw-hero-main">
            <div className="tw-balance-block">
              <span className="tw-balance-label">Available balance</span>
              <h1 className="tw-balance-figure">
                <span className="tw-rupee">₹</span>
                {formatINR(wallet?.currentBalance)}
              </h1>
            </div>

            <div
              className="tw-ring-wrap"
              role="img"
              aria-label={`${Math.round(progress)} percent of contributions spent`}
            >
              <svg viewBox="0 0 132 132" className="tw-ring">
                <circle cx="66" cy="66" r={RADIUS} className="tw-ring-track" />
                <circle
                  cx="66"
                  cy="66"
                  r={RADIUS}
                  className="tw-ring-progress"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={dashOffset}
                />
              </svg>
              <div className="tw-ring-center">
                <span className="tw-ring-pct">{Math.round(progress)}%</span>
                <span className="tw-ring-sub">spent</span>
              </div>
            </div>
          </div>

          <div className="tw-stats">
            <div className="tw-stat">
              <span className="tw-stat-icon tw-stat-icon-in">↑</span>
              <div>
                <span className="tw-stat-value">
                  ₹{formatINR(wallet?.totalContributed)}
                </span>
                <span className="tw-stat-label">Contributed</span>
              </div>
            </div>
            <div className="tw-stat-divider" />
            <div className="tw-stat">
              <span className="tw-stat-icon tw-stat-icon-out">↓</span>
              <div>
                <span className="tw-stat-value">
                  ₹{formatINR(wallet?.totalExpenses)}
                </span>
                <span className="tw-stat-label">Spent</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contribute */}
        <div className="tw-contribute">
          <div className="tw-contribute-head">
            <h3>Add money</h3>
            <p>Top up the shared pool — everyone sees it instantly.</p>
          </div>

          <form className="tw-form" onSubmit={handleContribute}>
            <div className="tw-input-wrap">
              <span className="tw-input-prefix">₹</span>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="tw-input"
                min="0"
                step="1"
              />
            </div>
            <button
              type="submit"
              className={`tw-submit ${justAdded ? "tw-submit-success" : ""}`}
              disabled={submitting || !amount || Number(amount) <= 0}
            >
              {justAdded ? "Added ✓" : submitting ? "Adding…" : "Contribute"}
            </button>
          </form>

          <div className="tw-quick-amounts">
            {[500, 1000, 2000, 5000].map((v) => (
              <button
                key={v}
                type="button"
                className="tw-chip"
                onClick={() => setAmount(String(v))}
              >
                +₹{v.toLocaleString("en-IN")}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions */}
        <div className="tw-transactions">
          <div className="tw-tx-head">
            <h3>Recent activity</h3>
            {transactions.length > 0 && (
              <span className="tw-tx-count">{transactions.length}</span>
            )}
          </div>

          {transactions.length === 0 ? (
            <div className="tw-empty">
              <div className="tw-empty-icon">◌</div>
              <h4>No activity yet</h4>
              <p>Contributions and expenses will show up here as they happen.</p>
            </div>
          ) : (
            <ul className="tw-tx-list">
              {transactions.map((transaction) => {
                const isIn = transaction.type === "contribution";
                return (
                  <li key={transaction._id} className="tw-tx-row">
                    <span
                      className={`tw-tx-icon ${isIn ? "tw-tx-icon-in" : "tw-tx-icon-out"}`}
                    >
                      {isIn ? "↑" : "↓"}
                    </span>
                    <div className="tw-tx-info">
                      <span className="tw-tx-desc">{transaction.description}</span>
                      <span className="tw-tx-time">
                        {formatRelative(transaction.createdAt)}
                      </span>
                    </div>
                    <span
                      className={`tw-tx-amount ${isIn ? "tw-amount-in" : "tw-amount-out"}`}
                    >
                      {isIn ? "+" : "−"}₹{formatINR(transaction.amount)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}