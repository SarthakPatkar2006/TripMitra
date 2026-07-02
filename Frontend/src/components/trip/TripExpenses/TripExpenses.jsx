import { useState, useEffect, useCallback } from "react";

import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from "../../../api/expenseApi";

import {
  getFinanceSummary,
  getBudgetPrediction,
  getCategories,
  getTimeline,
  getSettlements,
} from "../../../api/financeApi";

import ExpenseSummaryCards from "./ExpenseSummaryCards";
import BudgetOverviewCard from "./BudgetOverviewCard";
import BudgetPrediction from "./BudgetPrediction";
import ExpenseCategoryChart from "./ExpenseCategoryChart";
import ExpenseTimeline from "./ExpenseTimeline";
import ExpenseList from "./ExpenseList";
import ExpenseModal from "./ExpenseModal";
import TripSettlements from "./TripSettlements";
import ExpenseSkeleton from "./ExpenseSkeleton";

import "./TripExpenses.css";

const TABS = [
  {
    id: "dashboard",
    label: "Dashboard",
  },
  {
    id: "expenses",
    label: "Expenses",
  },
  {
    id: "settlements",
    label: "Settlements",
  },
];

export default function TripExpenses({
  tripId,
  members,
}) {
  const [activeTab, setActiveTab] =
    useState("dashboard");

  const [loading, setLoading] =
    useState(true);

  const [expenses, setExpenses] =
    useState([]);

  const [summary, setSummary] =
    useState(null);

  const [prediction, setPrediction] =
    useState(null);

  const [categories, setCategories] =
    useState([]);

  const [timeline, setTimeline] =
    useState([]);

  const [showModal, setShowModal] =
    useState(false);

  const [editingExpense, setEditingExpense] =
    useState(null);

  const fetchData =
    useCallback(async () => {
      try {
        setLoading(true);

        const [
          expenseRes,
          summaryRes,
          predictionRes,
          categoryRes,
          timelineRes,
        ] =
          await Promise.all([
            getExpenses(tripId),
            getFinanceSummary(tripId),
            getBudgetPrediction(tripId),
            getCategories(tripId),
            getTimeline(tripId),
          ]);

        setExpenses(
          expenseRes.data.expenses || []
        );

        setSummary(
          summaryRes.data.summary
        );

        setPrediction(
          predictionRes.data.prediction
        );

        setCategories(
          categoryRes.data.categories ||
            []
        );

        setTimeline(
          timelineRes.data.timeline ||
            []
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, [tripId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddExpense = () => {
    setEditingExpense(null);
    setShowModal(true);
  };

  const handleEditExpense = (
    expense
  ) => {
    setEditingExpense(expense);
    setShowModal(true);
  };

  const handleDeleteExpense =
    async (id) => {
      if (
        !window.confirm(
          "Delete this expense?"
        )
      )
        return;

      await deleteExpense(id);

      fetchData();
    };

  if (loading) {
    return <ExpenseSkeleton />;
  }

  return (
    <div className="trip-expenses">

      {/* Header */}

      <div className="expense-page-header">

        <div>

          <h1>
            Expense Dashboard
          </h1>

          <p>
            Manage expenses, monitor
            budgets and settle trip
            balances.
          </p>

        </div>

        <button
          className="primary-btn"
          onClick={
            handleAddExpense
          }
        >
          Add Expense
        </button>

      </div>

      {/* Tabs */}

      <div className="expense-tabs">

        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={
              activeTab === tab.id
                ? "tab active"
                : "tab"
            }
            onClick={() =>
              setActiveTab(tab.id)
            }
          >
            {tab.label}
          </button>
        ))}

      </div>

      {/* Dashboard */}

      {activeTab ===
        "dashboard" && (
        <>

          <ExpenseSummaryCards
            budget={
              summary?.budget
            }
            totalSpent={
              summary?.totalSpent
            }
            remaining={
              summary?.remaining
            }
            memberCount={
              summary?.totalPeople
            }
            perHead={
              summary?.costPerPerson
            }
          />

          <div className="dashboard-grid">

            <BudgetOverviewCard
              budget={
                summary?.budget
              }
              spent={
                summary?.totalSpent
              }
              remaining={
                summary?.remaining
              }
              percent={
                summary?.budgetUsage
              }
              status={
                summary?.budgetStatus
              }
            />

            <BudgetPrediction
              prediction={
                prediction
              }
            />

          </div>

          <div className="dashboard-grid">

            <ExpenseCategoryChart
              categories={
                categories
              }
            />

            <ExpenseTimeline
              timeline={
                timeline
              }
            />

          </div>

        </>
      )}

      {/* Expenses */}

      {activeTab ===
        "expenses" && (
        <ExpenseList
          expenses={expenses}
          onAddExpense={
            handleAddExpense
          }
          onEditExpense={
            handleEditExpense
          }
          onDeleteExpense={
            handleDeleteExpense
          }
        />
      )}

      {/* Settlements */}

      {activeTab ===
        "settlements" && (
        <TripSettlements
          tripId={tripId}
        />
      )}

      {/* Modal */}

      {showModal && (
        <ExpenseModal
          tripId={tripId}
          members={members}
          expense={
            editingExpense
          }
          onClose={() =>
            setShowModal(false)
          }
          onSuccess={fetchData}
        />
      )}

    </div>
  );
}