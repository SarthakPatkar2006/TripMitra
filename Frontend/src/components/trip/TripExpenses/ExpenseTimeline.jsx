import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import {
  CalendarDays,
} from "lucide-react";

import "./ExpenseTimeline.css";

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });

export default function ExpenseTimeline({
  timeline = [],
}) {
  if (!timeline.length) {
    return (
      <section className="timeline-card">
        <div className="timeline-empty">
          <CalendarDays size={42} />

          <h3>No Timeline Available</h3>

          <p>
            Add expenses during your trip
            to visualize daily spending.
          </p>
        </div>
      </section>
    );
  }

  const data = timeline.map((item) => ({
    ...item,
    label: formatDate(item.date),
  }));

  return (
    <section className="timeline-card">
      <div className="timeline-header">
        <div>
          <h2>Expense Timeline</h2>

          <p>
            Daily spending trend throughout
            your trip.
          </p>
        </div>
      </div>

      <div className="timeline-chart">
        <ResponsiveContainer
          width="100%"
          height={340}
        >
          <AreaChart data={data}>
            <defs>
              <linearGradient
                id="expenseGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor="#2563eb"
                  stopOpacity={0.35}
                />

                <stop
                  offset="95%"
                  stopColor="#2563eb"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="4 4"
              stroke="#e2e8f0"
            />

            <XAxis
              dataKey="label"
              tick={{
                fill: "#64748b",
                fontSize: 12,
              }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              tickFormatter={(v) =>
                `₹${v}`
              }
              tick={{
                fill: "#64748b",
                fontSize: 12,
              }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip
              formatter={(value) =>
                formatCurrency(value)
              }
              labelFormatter={(label) =>
                `Date : ${label}`
              }
            />

            <Area
              type="monotone"
              dataKey="amount"
              stroke="#2563eb"
              strokeWidth={3}
              fill="url(#expenseGradient)"
              activeDot={{
                r: 6,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="timeline-footer">
        <div className="timeline-stat">
          <span>Total Days</span>

          <strong>
            {timeline.length}
          </strong>
        </div>

        <div className="timeline-stat">
          <span>Total Recorded</span>

          <strong>
            {formatCurrency(
              timeline.reduce(
                (sum, day) =>
                  sum + day.amount,
                0
              )
            )}
          </strong>
        </div>
      </div>
    </section>
  );
}