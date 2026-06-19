import { useEffect, useState } from "react";

import "./TripAnalytics.css";
import {getCategories,getTimeline,getFinanceSummary} from "../../api/financeApi";
const categoryMeta = {
  food: { icon: "🍽️", label: "Food", color: "var(--c-food)" },
  hotel: { icon: "🏨", label: "Hotel", color: "var(--c-hotel)" },
  transport: { icon: "🚕", label: "Transport", color: "var(--c-transport)" },
  activity: { icon: "🎟️", label: "Activity", color: "var(--c-activity)" },
  shopping: { icon: "🛍️", label: "Shopping", color: "var(--c-shopping)" },
  emergency: { icon: "🩺", label: "Emergency", color: "var(--c-emergency)" },
  misc: { icon: "📦", label: "Misc", color: "var(--c-misc)" },
};

const fallbackMeta = { icon: "💳", label: "Other", color: "var(--c-misc)" };

function formatRupees(amount) {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

function formatDay(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function formatWeekday(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IN", { weekday: "short" });
}

// Builds the conic-gradient stops for the CSS donut chart.
function buildDonutGradient(categories, total) {
  if (!total) return "var(--color-track)";

  let cursor = 0;
  const stops = categories.map((item) => {
    const meta = categoryMeta[item._id] || fallbackMeta;
    const share = (item.amount / total) * 360;
    const start = cursor;
    const end = cursor + share;
    cursor = end;
    return `${meta.color} ${start}deg ${end}deg`;
  });

  return `conic-gradient(${stops.join(", ")})`;
}

export default function TripAnalytics({ tripId }) {
  const [categories, setCategories] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [summary, setSummary] =
  useState(null);
  useEffect(() => {
    let cancelled = false;

    async function fetchAnalytics() {
      setLoading(true);
      setError(false);

      try {
     const [
  summaryRes,
  categoryRes,
  timelineRes
] = await Promise.all([
  getFinanceSummary(tripId),
  getCategories(tripId),
  getTimeline(tripId)
]);

if (cancelled) return;

setSummary(
  summaryRes.data.summary
);

setCategories(
  categoryRes.data.categories
);

setTimeline(
  timelineRes.data.timeline
);

        if (cancelled) return;

        setCategories(categoryRes.data.categories);
        setTimeline(timelineRes.data.timeline);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAnalytics();
    return () => {
      cancelled = true;
    };
  }, [tripId]);

  if (loading) {
    return (
      <div className="analytics">
        <div className="analytics-skeleton">
          <div className="skeleton-block skeleton-header" />
          <div className="skeleton-row">
            <div className="skeleton-block skeleton-card" />
            <div className="skeleton-block skeleton-card" />
          </div>
          <div className="skeleton-block skeleton-panel" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics">
        <div className="analytics-empty">
          <span className="empty-icon">⚠️</span>
          <h3>Couldn't load your analytics</h3>
          <p>Something went wrong fetching this trip's spending data.</p>
        </div>
      </div>
    );
  }

  const sortedCategories = [...categories].sort(
    (a, b) => b.amount - a.amount
  );
  const highestCategory = sortedCategories[0];
  const totalSpent = categories.reduce((sum, item) => sum + item.amount, 0);
  const averageDaily = timeline.length
    ? Math.round(totalSpent / timeline.length)
    : 0;
  const peakDay = timeline.length
    ? timeline.reduce((max, day) => (day.amount > max.amount ? day : max))
    : null;
const budgetUsage =
  summary?.budgetUsage ||
  0;

const budgetStatus =
  budgetUsage < 60
    ? {
        text:
          "Healthy Budget",
        icon: "🟢"
      }
    : budgetUsage < 85
    ? {
        text:
          "Watch Budget",
        icon: "🟡"
      }
    : {
        text:
          "Near Limit",
        icon: "🔴"
      };
  const donutBackground = buildDonutGradient(sortedCategories, totalSpent);

  return (
    <div className="analytics">
      <div className="analytics-header">
        <div>
          <h2>Spending analytics</h2>
          <p>Understand your travel expenses</p>
        </div>
        <div className="header-total">

  <span className="header-total-label">
    Total spent
  </span>

  <span className="header-total-value">
    {formatRupees(
      totalSpent
    )}
  </span>

  {summary && (
    <small>
      Budget ₹
      {summary.budget?.toLocaleString(
        "en-IN"
      )}
    </small>
  )}

</div>
      </div>

      {/* Insights */}
     <div className="insights-grid">

  <div className="insight-card">
    <span className="insight-icon">
      💸
    </span>

    <div>
      <h3>
        {formatRupees(
          totalSpent
        )}
      </h3>

      <p>
        Total Spent
      </p>
    </div>
  </div>

  <div className="insight-card">
    <span className="insight-icon">
      {highestCategory
        ? (
            categoryMeta[
              highestCategory
                ._id
            ] ||
            fallbackMeta
          ).icon
        : "—"}
    </span>

    <div>
      <h3>
        {highestCategory
          ? (
              categoryMeta[
                highestCategory
                  ._id
              ] ||
              fallbackMeta
            ).label
          : "No Data"}
      </h3>

      <p>
        Highest Category
      </p>
    </div>
  </div>

  <div className="insight-card">
    <span className="insight-icon">
      📈
    </span>

    <div>
      <h3>
        {formatRupees(
          averageDaily
        )}
      </h3>

      <p>
        Avg Daily Spend
      </p>
    </div>
  </div>

  <div className="insight-card">
    <span className="insight-icon">
      {budgetStatus.icon}
    </span>

    <div>
      <h3>
        {budgetUsage}%
      </h3>

      <p>
        {
          budgetStatus.text
        }
      </p>
    </div>
  </div>

  <div className="insight-card">
    <span className="insight-icon">
      🔥
    </span>

    <div>
      <h3>
        {peakDay
          ? formatRupees(
              peakDay.amount
            )
          : "—"}
      </h3>

      <p>
        {peakDay
          ? `Peak Day • ${formatDay(
              peakDay._id
            )}`
          : "Peak Day"}
      </p>
    </div>
  </div>

  <div className="insight-card">
    <span className="insight-icon">
      👤
    </span>

    <div>
      <h3>
        {formatRupees(
          summary?.costPerPerson ||
            0
        )}
      </h3>

      <p>
        Cost Per Person
      </p>
    </div>
  </div>

</div>

      {/* Category breakdown: donut + bars */}
      <div className="analytics-card">
        <div className="card-title-row">
          <h3>Category breakdown</h3>
          <span className="card-subtitle">{categories.length} categories</span>
        </div>

        {categories.length === 0 ? (
          <div className="panel-empty">
            <span className="empty-icon">🧾</span>
            <p>No expense data yet. Add an expense to see it here.</p>
          </div>
        ) : (
          <div className="breakdown-layout">
            <div className="donut-wrap">
              <div
                className="donut"
                style={{ background: donutBackground }}
                role="img"
                aria-label={`Spending split across ${categories.length} categories, totalling ${formatRupees(totalSpent)}`}
              >
                <div className="donut-hole">
                  <span className="donut-total-label">Total</span>
                  <span className="donut-total-value">
                    {formatRupees(totalSpent)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bars-wrap">
              {sortedCategories.map((item) => {
                const meta = categoryMeta[item._id] || fallbackMeta;
                const pct = totalSpent
                  ? Math.round((item.amount / totalSpent) * 100)
                  : 0;

                return (
                  <div key={item._id} className="analytics-row">
                    <div className="analytics-info">
                      <span
                        className="legend-dot"
                        style={{ background: meta.color }}
                      />
                      <span className="row-icon">{meta.icon}</span>
                      <span className="row-label">{meta.label}</span>
                    </div>

                    <div className="analytics-bar">
                      <div
                        className="analytics-fill"
                        style={{ width: `${pct}%`, background: meta.color }}
                      />
                    </div>

                    <div className="row-numbers">
                      <strong>{formatRupees(item.amount)}</strong>
                      <span className="row-pct">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="analytics-card">
        <div className="card-title-row">
          <h3>Daily spending</h3>
          <span className="card-subtitle">
            {timeline.length} day{timeline.length === 1 ? "" : "s"}
          </span>
        </div>

        {timeline.length === 0 ? (
          <div className="panel-empty">
            <span className="empty-icon">📅</span>
            <p>No timeline data yet. Your daily spend will show up here.</p>
          </div>
        ) : (
          <div className="ticket-strip">
            {timeline.map((day) => {
              const isPeak = peakDay && day._id === peakDay._id;
              return (
                <div
                  key={day._id}
                  className={`ticket-stub ${isPeak ? "ticket-peak" : ""}`}
                >
                  <span className="ticket-weekday">
                    {formatWeekday(day._id)}
                  </span>
                  <span className="ticket-day">{formatDay(day._id)}</span>
                  <div className="ticket-bottom">

  <span className="ticket-amount">
    {formatRupees(
      day.amount
    )}
  </span>

  {isPeak && (
    <span className="peak-badge">
      Highest
    </span>
  )}

</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
