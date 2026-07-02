import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

import {
  PieChart as PieChartIcon,
} from "lucide-react";

import "./ExpenseCategoryChart.css";

const COLORS = [
  "#2563eb",
  "#22c55e",
  "#f97316",
  "#ef4444",
  "#9333ea",
  "#14b8a6",
  "#eab308",
  "#06b6d4",
];

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export default function ExpenseCategoryChart({
  categories = [],
}) {
  if (!categories.length) {
    return (
      <section className="category-chart-card">
        <div className="chart-empty">
          <PieChartIcon size={40} />
          <h3>No Expense Data</h3>
          <p>
            Add expenses to view category
            distribution.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="category-chart-card">
      <div className="chart-header">
        <div>
          <h2>
            Expense Categories
          </h2>

          <p>
            Spending breakdown across
            all categories.
          </p>
        </div>
      </div>

      <div className="chart-container">
        <ResponsiveContainer
          width="100%"
          height={320}
        >
          <PieChart>
            <Pie
              data={categories}
              dataKey="amount"
              nameKey="name"
              innerRadius={75}
              outerRadius={110}
              paddingAngle={3}
            >
              {categories.map(
                (_, index) => (
                  <Cell
                    key={index}
                    fill={
                      COLORS[
                        index %
                          COLORS.length
                      ]
                    }
                  />
                )
              )}
            </Pie>

            <Tooltip
              formatter={(value) =>
                formatCurrency(value)
              }
            />

            <Legend
              verticalAlign="bottom"
              height={40}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="category-list">
        {categories.map(
          (
            category,
            index
          ) => (
            <div
              key={category.value}
              className="category-item"
            >
              <div className="category-left">
                <span
                  className="category-dot"
                  style={{
                    background:
                      COLORS[
                        index %
                          COLORS.length
                      ],
                  }}
                />

                <span>
                  {category.name}
                </span>
              </div>

              <div className="category-right">
                <strong>
                  {formatCurrency(
                    category.amount
                  )}
                </strong>

                <small>
                  {
                    category.count
                  }{" "}
                  expense
                  {category.count >
                  1
                    ? "s"
                    : ""}
                </small>
              </div>
            </div>
          )
        )}
      </div>
    </section>
  );
}