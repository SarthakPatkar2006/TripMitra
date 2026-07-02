import { useMemo, useState } from "react";

import ExpenseToolbar from "./ExpenseToolbar";
import ExpenseCard from "./ExpenseCard";
import ExpenseEmptyState from "./ExpenseEmptyState";

import "./ExpenseList.css";

export default function ExpenseList({
  expenses = [],
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("latest");

  const filteredExpenses = useMemo(() => {
    let data = [...expenses];

    // Search
    if (search.trim()) {
      const query = search.toLowerCase();

      data = data.filter((expense) => {
        return (
          expense.title?.toLowerCase().includes(query) ||
          expense.description
            ?.toLowerCase()
            .includes(query) ||
          expense.paidBy?.name
            ?.toLowerCase()
            .includes(query)
        );
      });
    }

    // Category
    if (category !== "all") {
      data = data.filter(
        (expense) =>
          expense.category === category
      );
    }

    // Sort
    switch (sort) {
      case "highest":
        data.sort(
          (a, b) =>
            b.amount - a.amount
        );
        break;

      case "lowest":
        data.sort(
          (a, b) =>
            a.amount - b.amount
        );
        break;

      case "oldest":
        data.sort(
          (a, b) =>
            new Date(
              a.expenseDate
            ) -
            new Date(
              b.expenseDate
            )
        );
        break;

      default:
        data.sort(
          (a, b) =>
            new Date(
              b.expenseDate
            ) -
            new Date(
              a.expenseDate
            )
        );
    }

    return data;
  }, [
    expenses,
    search,
    category,
    sort,
  ]);

  return (
    <section className="expense-list">

      <ExpenseToolbar
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        sort={sort}
        onSortChange={setSort}
        onAddExpense={onAddExpense}
      />

      {filteredExpenses.length ===
      0 ? (
        <ExpenseEmptyState
          onAddExpense={
            onAddExpense
          }
        />
      ) : (
        <div className="expense-list-grid">

          {filteredExpenses.map(
            (expense) => (
              <ExpenseCard
                key={
                  expense._id
                }
                expense={
                  expense
                }
                onEdit={
                  onEditExpense
                }
                onDelete={
                  onDeleteExpense
                }
              />
            )
          )}

        </div>
      )}

    </section>
  );
}