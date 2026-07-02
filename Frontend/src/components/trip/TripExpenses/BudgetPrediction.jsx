import {
  TrendingUp,
  CalendarDays,
  IndianRupee,
  AlertTriangle,
  CheckCircle2,
  Activity,
} from "lucide-react";

import "./BudgetPrediction.css";

const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

export default function BudgetPrediction({ prediction }) {
  if (!prediction) return null;

  const {
    averagePerDay,
    recommendedPerDay,
    predictedTotal,
    budget,
    excess,
    daysElapsed,
    daysRemaining,
    status,
  } = prediction;

  const statusConfig = {
    safe: {
      icon: CheckCircle2,
      title: "On Track",
      className: "success",
      message:
        "Current spending trend indicates you're within your planned budget.",
    },
    near_limit: {
      icon: Activity,
      title: "Approaching Budget",
      className: "warning",
      message:
        "You're spending faster than expected. Keep an eye on upcoming expenses.",
    },
    over_budget: {
      icon: AlertTriangle,
      title: "Budget Exceeded",
      className: "danger",
      message:
        "Current trend predicts that this trip will exceed the allocated budget.",
    },
  };

  const config = statusConfig[status] || statusConfig.safe;
  const StatusIcon = config.icon;

  return (
    <section className="prediction-card">
      <div className="prediction-header">
        <div>
          <h2>Budget Prediction</h2>
          <p>AI-based spending forecast</p>
        </div>

        <div className={`prediction-badge ${config.className}`}>
          <StatusIcon size={16} />
          {config.title}
        </div>
      </div>

      <div className="prediction-grid">
        <div className="prediction-item">
          <TrendingUp size={20} />
          <div>
            <span>Average / Day</span>
            <strong>{formatCurrency(averagePerDay)}</strong>
          </div>
        </div>

        <div className="prediction-item">
          <IndianRupee size={20} />
          <div>
            <span>Recommended / Day</span>
            <strong>{formatCurrency(recommendedPerDay)}</strong>
          </div>
        </div>

        <div className="prediction-item">
          <CalendarDays size={20} />
          <div>
            <span>Days Remaining</span>
            <strong>{daysRemaining}</strong>
          </div>
        </div>

        <div className="prediction-item">
          <TrendingUp size={20} />
          <div>
            <span>Predicted Total</span>
            <strong>{formatCurrency(predictedTotal)}</strong>
          </div>
        </div>
      </div>

      <div className={`prediction-summary ${config.className}`}>
        <StatusIcon size={22} />

        <div>
          <h4>{config.title}</h4>

          <p>{config.message}</p>

          <ul>
            <li>
              Budget:
              <strong>{formatCurrency(budget)}</strong>
            </li>

            <li>
              Predicted Spend:
              <strong>{formatCurrency(predictedTotal)}</strong>
            </li>

            <li>
              Excess:
              <strong>{formatCurrency(excess)}</strong>
            </li>

            <li>
              Trip Progress:
              <strong>
                {daysElapsed} day(s) completed
              </strong>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}