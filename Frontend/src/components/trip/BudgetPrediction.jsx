import { useEffect, useState } from "react";
import { getPrediction } from "../../api/financeApi";
import "./BudgetPrediction.css";

const formatMoney = (amount) =>
  `₹${Math.round(amount).toLocaleString("en-IN")}`;

const STATUS_CONFIG = {
  on_budget: {
    icon: "ti-circle-check",
    label: "On budget",
    message: "Spending at a healthy pace.",
  },
  near_limit: {
    icon: "ti-alert-triangle",
    label: "Near limit",
    message: "Watch your spending carefully.",
  },
  over_budget: {
    icon: "ti-alert-triangle",
    label: "Over budget",
    message: "You're likely to exceed your budget.",
  },
};

export default function BudgetPrediction({ tripId }) {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrediction();
  }, [tripId]);

  const fetchPrediction = async () => {
    try {
      const res = await getPrediction(tripId);
      setPrediction(res.data.prediction);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bp-card">
        <div className="bp-skeleton bp-skeleton--title" />
        <div className="bp-skeleton bp-skeleton--subtitle" />
        <div className="bp-grid" style={{ marginTop: "1.5rem" }}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="bp-metric">
              <div className="bp-skeleton bp-skeleton--label" />
              <div className="bp-skeleton bp-skeleton--value" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!prediction) return null;

  const {
    predictedTotal,
    averagePerDay,
    recommendedPerDay,
    budgetUsage,
    excess,
    status,
  } = prediction;

  const current = STATUS_CONFIG[status];

  return (
    <div className="bp-card">
      {/* Header */}
      <div className="bp-header">
        <div>
          <h2 className="bp-title">
            <i className="ti ti-brain" aria-hidden="true" />
            Budget intelligence
          </h2>
          <p className="bp-subtitle">Smart spending insights for your trip</p>
        </div>
        <div className="bp-status-block">
          <span className={`bp-badge bp-badge--${status}`}>
            <i className={`ti ${current.icon}`} aria-hidden="true" />
            {current.label}
          </span>
          <p className="bp-badge-msg">{current.message}</p>
        </div>
      </div>

      <hr className="bp-divider" />

      {/* Metric cards */}
      <div className="bp-grid">
        <div className="bp-metric">
          <p className="bp-metric-label">Predicted final cost</p>
          <p className="bp-metric-value">{formatMoney(predictedTotal)}</p>
        </div>
        <div className="bp-metric">
          <p className="bp-metric-label">Current spending pace</p>
          <p className="bp-metric-value">{formatMoney(averagePerDay)}</p>
        </div>
        <div className="bp-metric">
          <p className="bp-metric-label">Recommended per day</p>
          <p className="bp-metric-value">{formatMoney(recommendedPerDay)}</p>
        </div>
      </div>

      {/* Usage bar */}
      <div className="bp-usage-section">
        <div className="bp-usage-header">
          <span className="bp-usage-label">Budget usage</span>
          <span className="bp-usage-pct">{budgetUsage}%</span>
        </div>
        <div className="bp-bar-track" role="progressbar" aria-valuenow={budgetUsage} aria-valuemin={0} aria-valuemax={100}>
          <div
            className={`bp-bar-fill bp-bar-fill--${status}`}
            style={{ width: `${Math.min(budgetUsage, 100)}%` }}
          />
        </div>
      </div>

      {/* Warning */}
      {status === "over_budget" && (
        <div className="bp-warning" role="alert">
          <i className="ti ti-alert-circle" aria-hidden="true" />
          <div>
            <p className="bp-warning-title">Budget alert</p>
            <p className="bp-warning-body">
              At your current pace, you may exceed your budget by{" "}
              <strong>{formatMoney(excess)}</strong>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
