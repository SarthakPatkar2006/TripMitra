import {
  Search,
  Filter,
  Plus,
  ArrowUpDown,
} from "lucide-react";

import "./ExpenseToolbar.css";

const categories = [
  { value: "all", label: "All Categories" },
  { value: "food", label: "Food" },
  { value: "hotel", label: "Hotel" },
  { value: "transport", label: "Transport" },
  { value: "activity", label: "Activity" },
  { value: "shopping", label: "Shopping" },
  { value: "emergency", label: "Emergency" },
  { value: "misc", label: "Miscellaneous" },
];

export default function ExpenseToolbar({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  sort,
  onSortChange,
  onAddExpense,
}) {
  return (
    <div className="expense-toolbar">

      <div className="expense-search">

        <Search size={18} />

        <input
          type="text"
          placeholder="Search expenses..."
          value={search}
          onChange={(e) =>
            onSearchChange(e.target.value)
          }
        />

      </div>

      <div className="expense-toolbar-actions">

        <div className="toolbar-select">

          <Filter size={18} />

          <select
            value={category}
            onChange={(e) =>
              onCategoryChange(e.target.value)
            }
          >
            {categories.map((item) => (
              <option
                key={item.value}
                value={item.value}
              >
                {item.label}
              </option>
            ))}
          </select>

        </div>

        <div className="toolbar-select">

          <ArrowUpDown size={18} />

          <select
            value={sort}
            onChange={(e) =>
              onSortChange(e.target.value)
            }
          >
            <option value="latest">
              Latest
            </option>

            <option value="oldest">
              Oldest
            </option>

            <option value="highest">
              Highest Amount
            </option>

            <option value="lowest">
              Lowest Amount
            </option>
          </select>

        </div>

        <button
          className="expense-add-btn"
          onClick={onAddExpense}
        >
          <Plus size={18} />
          Add Expense
        </button>

      </div>

    </div>
  );
}