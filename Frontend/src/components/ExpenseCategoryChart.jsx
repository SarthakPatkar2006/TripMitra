import React,
{
  useMemo
} from "react";

import {
  Doughnut
} from "react-chartjs-2";

import {
  Chart,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";

Chart.register(
  ArcElement,
  Tooltip,
  Legend
);

export default function ExpenseCategoryChart({
  expenses
}) {
  const {
    labels,
    values
  } = useMemo(() => {
    const map = {};

    expenses.forEach(
      (expense) => {
        const category =
          expense.category ||
          "Other";

        map[category] =
          (map[
            category
          ] || 0) +
          expense.amount;
      }
    );

    return {
      labels:
        Object.keys(map),

      values:
        Object.values(map)
    };
  }, [expenses]);

  const data = {
    labels,

    datasets: [
      {
        data: values,

        borderWidth: 0,

        borderRadius: 10,

        backgroundColor: [
          "#3b82f6",
          "#10b981",
          "#8b5cf6",
          "#f59e0b",
          "#ef4444",
          "#06b6d4"
        ]
      }
    ]
  };

  return (
    <div className="expense-panel">
      <h3>
        📊 Expense Categories
      </h3>

      {values.length ===
      0 ? (
        <p>
          No expenses
          available.
        </p>
      ) : (
        <>
          <div
            style={{
              height:
                300
            }}
          >
            <Doughnut
              data={data}
              options={{
                cutout:
                  "70%",

                plugins: {
                  legend:
                    {
                      position:
                        "bottom"
                    }
                }
              }}
            />
          </div>

          <div className="chart-legend">

            {labels.map(
              (
                label,
                index
              ) => (
                <div
                  key={
                    label
                  }
                  className="legend-row"
                >
                  <span>
                    {
                      label
                    }
                  </span>

                  <strong>
                    ₹
                    {
                      values[
                        index
                      ]
                    }
                  </strong>
                </div>
              )
            )}

          </div>
        </>
      )}
    </div>
  );
}