import "./ExpenseSkeleton.css";

export default function ExpenseSkeleton() {
  return (
    <div className="expense-skeleton">

      {/* Summary Cards */}

      <div className="skeleton-summary">

        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="skeleton-card shimmer"
          />
        ))}

      </div>

      {/* Charts */}

      <div className="skeleton-grid">

        <div className="skeleton-chart shimmer" />

        <div className="skeleton-chart shimmer" />

      </div>

      {/* Expense List */}

      <div className="skeleton-list">

        {[1, 2, 3, 4, 5].map((item) => (
          <div
            key={item}
            className="skeleton-expense"
          >

            <div className="expense-left">

              <div className="expense-avatar shimmer" />

              <div className="expense-info">

                <div className="line large shimmer" />

                <div className="line medium shimmer" />

                <div className="line small shimmer" />

              </div>

            </div>

            <div className="expense-right">

              <div className="amount shimmer" />

              <div className="buttons">

                <div className="btn shimmer" />

                <div className="btn shimmer" />

              </div>

            </div>

          </div>
        ))}

      </div>

    </div>
  );
}