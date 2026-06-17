import React, {
  useEffect,
  useMemo,
  useState
} from "react";
import api from "../api/axiosInstance";

import ExpenseModal from "./ExpenseModal";
import ExpenseFlowGraph from "./ExpenseFlowGraph";
import ExpenseCategoryChart from "./ExpenseCategoryChart";

import "./ExpenseDashboard.css";

export default function ExpenseDashboard({
  trip,
  tripId
}) {
  const [expenses, setExpenses] =
    useState([]);

  const [settlements,
    setSettlements] =
    useState([]);

  const [balances,
    setBalances] =
    useState([]);

  const [members,
    setMembers] =
    useState([]);

  const [loading,
    setLoading] =
    useState(true);

  const [showModal,
    setShowModal] =
    useState(false);

  useEffect(() => {
    fetchData();
  }, [tripId]);

  const fetchData =
    async () => {
      try {
        setLoading(true);

        const [
          expenseRes,
          settlementRes,
          memberRes
        ] = await Promise.all([
          api.get(
            `/expenses/trip/${tripId}`
          ),

          api.get(
            `/expenses/trip/${tripId}/settlements`
          ),

          api.get(
            `/trip-members/trip/${tripId}`
          )
        ]);

        setExpenses(
          expenseRes.data
            .expenses || []
        );

        setSettlements(
          settlementRes.data
            .settlements || []
        );

        setBalances(
          settlementRes.data
            .balances || []
        );

        const owner =
          memberRes.data
            .owner;

        const accepted =
          memberRes.data
            .members
            ?.map(
              (m) =>
                m.userId
            )
            .filter(Boolean) ||
          [];

        setMembers([
          owner,
          ...accepted
        ]);
      } catch (err) {
        console.error(
          "Expense Dashboard Error:",
          err
        );
      } finally {
        setLoading(false);
      }
    };

  const totalSpent =
    useMemo(() => {
      return expenses.reduce(
        (
          sum,
          expense
        ) =>
          sum +
          expense.amount,
        0
      );
    }, [expenses]);

  const remainingBudget =
    trip?.budget
      ? trip.budget -
        totalSpent
      : 0;

  const budgetPercent =
    trip?.budget
      ? Math.min(
          (
            totalSpent /
            trip.budget
          ) * 100,
          100
        )
      : 0;

  const perHead =
    members.length
      ? Math.round(
          totalSpent /
            members.length
        )
      : totalSpent;

  const categoryIcons = {
    Food: "🍔",
    Transport: "🚕",
    Hotel: "🏨",
    Activity: "🎟️",
    Shopping: "🛍️",
    Other: "📦"
  };

  if (loading) {
    return (
      <div className="expense-loading">
        Loading expenses...
      </div>
    );
  }

  return (
    <section className="expense-dashboard">

      {/* HEADER */}

      <div className="expense-top">

        <div>
          <h2>
            💰 Expense Dashboard
          </h2>

          <p>
            Manage trip spending
            and settlements.
          </p>
        </div>

        <button
          className="expense-btn"
          onClick={() =>
            setShowModal(
              true
            )
          }
        >
          + Add Expense
        </button>

      </div>

      {/* ANALYTICS */}

      <div className="analytics-grid">

        <div className="analytics-card">
          <div className="card-icon">
            💸
          </div>

          <span>
            Total Spent
          </span>

          <h3>
            ₹
            {totalSpent.toLocaleString()}
          </h3>
        </div>

        <div className="analytics-card">
          <div className="card-icon">
            💰
          </div>

          <span>
            Remaining
          </span>

          <h3>
            ₹
            {remainingBudget.toLocaleString()}
          </h3>
        </div>

        <div className="analytics-card">
          <div className="card-icon">
            👥
          </div>

          <span>
            Per Person
          </span>

          <h3>
            ₹
            {perHead.toLocaleString()}
          </h3>
        </div>

        <div className="analytics-card">
          <div className="card-icon">
            🧾
          </div>

          <span>
            Expenses
          </span>

          <h3>
            {expenses.length}
          </h3>
        </div>

      </div>

      {/* BUDGET */}

      <div className="expense-panel">

        <h3>
          💰 Budget Usage
        </h3>

        <div className="budget-bar">
          <div
            className="budget-fill"
            style={{
              width:
                `${budgetPercent}%`
            }}
          />
        </div>

        <div className="budget-info">
          <span>
            ₹
            {totalSpent.toLocaleString()}
          </span>

          <span>
            ₹
            {trip?.budget?.toLocaleString()}
          </span>
        </div>

        <p>
          {budgetPercent.toFixed(
            1
          )}
          % of your trip budget
          used
        </p>

      </div>

      {/* MEMBER BALANCES */}

      <div className="expense-panel">

        <h3>
          👥 Member Balances
        </h3>

        <div className="balance-grid">

          {balances.length ===
          0 ? (
            <p>
              No balance
              information
              available.
            </p>
          ) : (
            balances.map(
              (user) => (
                <div
                  key={
                    user.userId
                  }
                  className="balance-card"
                >

                  <div
                    className={
                      user.amount >=
                      0
                        ? "avatar positive"
                        : "avatar negative"
                    }
                  >
                    {user.name
                      ?.split(
                        " "
                      )
                      .map(
                        (
                          word
                        ) =>
                          word[0]
                      )
                      .join(
                        ""
                      )
                      .slice(
                        0,
                        2
                      )}
                  </div>

                  <h4>
                    {
                      user.name
                    }
                  </h4>

                  <h2>
                    {user.amount >
                    0
                      ? "+"
                      : ""}
                    ₹
                    {Math.abs(
                      user.amount
                    ).toLocaleString()}
                  </h2>

                  <span>
                    {user.amount >
                    0
                      ? "Will Receive"
                      : user.amount <
                        0
                      ? "Needs To Pay"
                      : "Settled"}
                  </span>

                </div>
              )
            )
          )}

        </div>

      </div>

      {/* GRAPH + CHART */}

      <div className="visualization-grid">

        <ExpenseFlowGraph
          balances={
            balances
          }
          settlements={
            settlements
          }
        />

        <ExpenseCategoryChart
          expenses={
            expenses
          }
        />

      </div>

      {/* RECENT EXPENSES */}

      <div className="expense-panel">

        <h3>
          🧾 Recent Expenses
        </h3>

        {expenses.length ===
        0 ? (
          <p>
            No expenses yet.
          </p>
        ) : (
          expenses.map(
            (
              expense
            ) => (
              <div
                key={
                  expense._id
                }
                className="expense-row"
              >

                <div>

                  <strong>
                    {categoryIcons[
                      expense
                        .category
                    ] ||
                      "📦"}{" "}
                    {
                      expense.title
                    }
                  </strong>

                  <p>
                    👤 Paid by{" "}
                    {
                      expense
                        .paidBy
                        ?.name
                    }
                  </p>

                  <small>
                    {
                      expense.category
                    }
                  </small>

                </div>

                <h4>
                  ₹
                  {expense.amount.toLocaleString()}
                </h4>

              </div>
            )
          )
        )}

      </div>

      {/* SETTLEMENTS */}

      <div className="expense-panel">

        <h3>
          💸 Settlements
        </h3>

        {settlements.length ===
        0 ? (
          <div className="empty-settlement">

            <div className="celebrate">
              🎉
            </div>

            <h4>
              Everyone is
              settled!
            </h4>

            <p>
              No pending
              payments.
            </p>

          </div>
        ) : (
          settlements.map(
            (
              item,
              index
            ) => (
              <div
                key={
                  index
                }
                className="settlement-row"
              >

                <div>

                  <strong>
                    👤{" "}
                    {
                      item.fromName
                    }
                  </strong>

                  <p>
                    owes{" "}
                    {
                      item.toName
                    }
                  </p>

                </div>

                <h4>
                  ₹
                  {item.amount.toLocaleString()}
                </h4>

              </div>
            )
          )
        )}

      </div>

      {/* MODAL */}

      {showModal && (
        <ExpenseModal
          tripId={tripId}
          members={
            members
          }
          onClose={() =>
            setShowModal(
              false
            )
          }
          onSuccess={
            fetchData
          }
        />
      )}

    </section>
  );
}