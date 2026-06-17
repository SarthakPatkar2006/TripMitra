import React, {
  useEffect,
  useState
} from "react";
import api from "../api/axiosInstance";
import ExpenseModal from "./ExpenseModal";
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

  const [members,
    setMembers] =
    useState([]);

  const [showModal,
    setShowModal] =
    useState(false);

  useEffect(() => {
    fetchData();
  }, [tripId]);

  const fetchData =
    async () => {
      try {
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
            .expenses
        );

        setSettlements(
          settlementRes.data
            .settlements
        );

        const owner =
          memberRes.data.owner;

        const accepted =
          memberRes.data
            .members
            .map(
              (m) =>
                m.userId
            )
            .filter(Boolean);

        setMembers([
          owner,
          ...accepted
        ]);
      } catch (err) {
        console.error(err);
      }
    };

  const totalSpent =
    expenses.reduce(
      (sum, expense) =>
        sum +
        expense.amount,
      0
    );

  const remaining =
    trip?.budget
      ? trip.budget -
        totalSpent
      : 0;

  const percent =
    trip?.budget
      ? Math.min(
          (
            totalSpent /
            trip.budget
          ) *
            100,
          100
        )
      : 0;

  const perPerson =
    members.length
      ? Math.round(
          totalSpent /
            members.length
        )
      : totalSpent;

  return (
    <section className="expense-dashboard">

      {/* Analytics */}

      <div className="expense-cards">

        <div className="expense-card">
          <span>
            Total Spent
          </span>

          <strong>
            ₹{totalSpent}
          </strong>
        </div>

        <div className="expense-card">
          <span>
            Remaining
          </span>

          <strong>
            ₹{remaining}
          </strong>
        </div>

        <div className="expense-card">
          <span>
            Per Person
          </span>

          <strong>
            ₹{perPerson}
          </strong>
        </div>

        <div className="expense-card">
          <span>
            Expenses
          </span>

          <strong>
            {
              expenses.length
            }
          </strong>
        </div>

      </div>

      {/* Budget */}

      <div className="budget-panel">

        <h2>
          Budget Usage
        </h2>

        <div className="budget-bar">
          <div
            className="budget-fill"
            style={{
              width:
                `${percent}%`
            }}
          />
        </div>

        <p>
          ₹{totalSpent}
          {" / "}
          ₹{trip?.budget}
          {" ("}
          {percent.toFixed(
            1
          )}
          %)
        </p>

      </div>

      {/* Expenses */}

      <div className="expense-panel">

        <div className="expense-header">

          <h2>
            Recent Expenses
          </h2>

          <button
            onClick={() =>
              setShowModal(
                true
              )
            }
          >
            + Expense
          </button>

        </div>

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
                    {
                      expense.title
                    }
                  </strong>

                  <p>
                    Paid by{" "}
                    {
                      expense
                        .paidBy
                        ?.name
                    }
                  </p>
                </div>

                <h3>
                  ₹
                  {
                    expense.amount
                  }
                </h3>
              </div>
            )
          )
        )}

      </div>

      {/* Settlement */}

      <div className="expense-panel">

        <h2>
          Settlements
        </h2>

        {settlements.length ===
        0 ? (
          <p>
            Everyone is
            settled 🎉
          </p>
        ) : (
          settlements.map(
            (
              item,
              index
            ) => (
              <div
                key={index}
                className="settlement-row"
              >
                <span>
                  {
                    item.from
                  }
                  {" owes "}
                  {
                    item.to
                  }
                </span>

                <strong>
                  ₹
                  {
                    item.amount
                  }
                </strong>
              </div>
            )
          )
        )}

      </div>

      {showModal && (
        <ExpenseModal
          tripId={
            tripId
          }
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