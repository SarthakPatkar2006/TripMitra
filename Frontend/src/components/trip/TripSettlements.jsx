import { useEffect, useState, useCallback } from "react";
import { getSettlements } from "../../api/financeApi";
import SettlementGraph from "./SettlementGraph";
import "./TripSettlements.css";

const fmt = (amount) =>
  `₹${Math.round(amount || 0).toLocaleString("en-IN")}`;

const initials = (name) =>
  name
    ? name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "??";

function BalanceCard({ member }) {
  const type =
    member.balance > 0 ? "recv" : member.balance < 0 ? "pay" : "settled";

  const badgeLabel =
    type === "recv" ? "Receives" : type === "pay" ? "Pays" : "Settled";

  const balanceSign = type === "recv" ? "+" : type === "pay" ? "−" : "";

  return (
    <div className={`ts-balance-card ts-balance-card--${type}`}>
      <div className={`ts-bc-avatar ts-bc-avatar--${type}`}>
        {initials(member.name)}
      </div>
      <p className="ts-bc-name">{member.name}</p>

      <div className="ts-bc-row">
        <span className="ts-bc-row-label">Paid</span>
        <span className="ts-bc-row-val">{fmt(member.paid)}</span>
      </div>
      <div className="ts-bc-row">
        <span className="ts-bc-row-label">Should pay</span>
        <span className="ts-bc-row-val">{fmt(member.shouldPay)}</span>
      </div>

      <hr className="ts-bc-divider" />

      <div className="ts-bc-footer">
        <span className={`ts-bc-balance ts-bc-balance--${type}`}>
          {balanceSign}{fmt(Math.abs(member.balance))}
        </span>
        <span className={`ts-bc-badge ts-bc-badge--${type}`}>
          {badgeLabel}
        </span>
      </div>
    </div>
  );
}

function TransactionRow({ tx }) {
  return (
    <li className="ts-tx-item">
      <div className="ts-tx-person">
        <div className="ts-avatar ts-avatar--pay">{initials(tx.from)}</div>
        <div>
          <p className="ts-person-name">{tx.from}</p>
          <p className="ts-person-role">Pays</p>
        </div>
      </div>

      <div className="ts-tx-flow">
        <span className="ts-tx-amount">{fmt(tx.amount)}</span>
        <div className="ts-tx-arrow" aria-hidden="true">
          <div className="ts-tx-line" />
          <i className="ti ti-arrow-right" />
          <div className="ts-tx-line" />
        </div>
      </div>

      <div className="ts-tx-person ts-tx-person--right">
        <div className="ts-avatar ts-avatar--recv">{initials(tx.to)}</div>
        <div>
          <p className="ts-person-name">{tx.to}</p>
          <p className="ts-person-role">Receives</p>
        </div>
      </div>
    </li>
  );
}

export default function TripSettlements({ tripId }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSettlements = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getSettlements(tripId);
      setData(res.data);
    } catch (err) {
      console.error("Settlement error:", err);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  if (loading) {
    return (
      <div className="ts-root">
        <div className="ts-metrics">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="ts-metric">
              <div className="ts-skeleton ts-skeleton--label" />
              <div className="ts-skeleton ts-skeleton--value" />
            </div>
          ))}
        </div>
        <div className="ts-card">
          <div className="ts-card-header">
            <div className="ts-skeleton ts-skeleton--title" />
          </div>
          <div style={{ padding: "1.25rem" }}>
            <div className="ts-skeleton ts-skeleton--block" />
          </div>
        </div>
      </div>
    );
  }

  const balances     = data?.balances     || [];
  const transactions = data?.transactions || [];

  const receiving = balances.filter((m) => m.balance > 0);
  const paying    = balances.filter((m) => m.balance < 0);
  const totalAmt  = transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="ts-root">

      {/* ── Summary metrics ──────────────────────────────────── */}
      <div className="ts-metrics">
        <div className="ts-metric">
          <p className="ts-metric-label">Pending transactions</p>
          <p className="ts-metric-value">{transactions.length}</p>
        </div>
        <div className="ts-metric">
          <p className="ts-metric-label">Members receiving</p>
          <p className="ts-metric-value">{receiving.length}</p>
        </div>
        <div className="ts-metric">
          <p className="ts-metric-label">Members paying</p>
          <p className="ts-metric-value">{paying.length}</p>
        </div>
        <div className="ts-metric">
          <p className="ts-metric-label">Amount to settle</p>
          <p className="ts-metric-value">{fmt(totalAmt)}</p>
        </div>
      </div>

      {/* ── Member balances ───────────────────────────────────── */}
      <div className="ts-card">
        <div className="ts-card-header">
          <div>
            <p className="ts-card-title">
              <i className="ti ti-users" aria-hidden="true" />
              Member balances
            </p>
            <p className="ts-card-sub">Who paid how much vs what they owe</p>
          </div>
        </div>
        <div className="ts-balance-grid">
          {balances.map((member) => (
            <BalanceCard key={member.userId} member={member} />
          ))}
        </div>
      </div>

      {/* ── Money flow ────────────────────────────────────────── */}
      <div className="ts-card">
        <div className="ts-card-header">
          <div>
            <p className="ts-card-title">
              <i className="ti ti-arrows-exchange" aria-hidden="true" />
              Money flow
            </p>
            <p className="ts-card-sub">Minimum transfers to settle this trip</p>
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="ts-settled-state" role="status">
            <i className="ti ti-circle-check" aria-hidden="true" />
            <p className="ts-settled-label">Everyone is settled up</p>
            <p className="ts-settled-sub">No transfers needed.</p>
          </div>
        ) : (
          <ul className="ts-tx-list" role="list">
            {transactions.map((tx, i) => (
              <TransactionRow key={i} tx={tx} />
            ))}
          </ul>
        )}
      </div>

      {/* ── Settlement graph ──────────────────────────────────── */}
      {transactions.length > 0 && (
        <SettlementGraph balances={balances} transactions={transactions} />
      )}

      {/* ── Settlement table ──────────────────────────────────── */}
      {transactions.length > 0 && (
        <div className="ts-card">
          <div className="ts-card-header">
            <div>
              <p className="ts-card-title">
                <i className="ti ti-table" aria-hidden="true" />
                Settlement table
              </p>
              <p className="ts-card-sub">Full breakdown of all required payments</p>
            </div>
          </div>
          <div className="ts-table-wrap">
            <table className="ts-table">
              <thead>
                <tr>
                  <th>From</th>
                  <th>To</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, i) => (
                  <tr key={i}>
                    <td>
                      <div className="ts-table-person">
                        <div className="ts-avatar ts-avatar--pay ts-avatar--sm">
                          {initials(tx.from)}
                        </div>
                        {tx.from}
                      </div>
                    </td>
                    <td>
                      <div className="ts-table-person">
                        <div className="ts-avatar ts-avatar--recv ts-avatar--sm">
                          {initials(tx.to)}
                        </div>
                        {tx.to}
                      </div>
                    </td>
                    <td>
                      <span className="ts-amt-pill">{fmt(tx.amount)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}