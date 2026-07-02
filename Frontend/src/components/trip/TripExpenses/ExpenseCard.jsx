import {
  CalendarDays,
  User,
  Pencil,
  Trash2,
  CreditCard,
  Users,
  Receipt,
  Utensils,
  Hotel,
  Car,
  ShoppingBag,
  HeartPulse,
  Sparkles,
} from "lucide-react";

import "./ExpenseCard.css";

const CATEGORY_CONFIG = {
  food: {
    icon: Utensils,
    color: "food",
    label: "Food",
  },
  hotel: {
    icon: Hotel,
    color: "hotel",
    label: "Hotel",
  },
  transport: {
    icon: Car,
    color: "transport",
    label: "Transport",
  },
  activity: {
    icon: Sparkles,
    color: "activity",
    label: "Activity",
  },
  shopping: {
    icon: ShoppingBag,
    color: "shopping",
    label: "Shopping",
  },
  emergency: {
    icon: HeartPulse,
    color: "emergency",
    label: "Emergency",
  },
  misc: {
    icon: Receipt,
    color: "misc",
    label: "Misc",
  },
};

const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default function ExpenseCard({
  expense,
  onEdit,
  onDelete,
}) {
  const category =
    CATEGORY_CONFIG[expense.category] ||
    CATEGORY_CONFIG.misc;

  const CategoryIcon = category.icon;

  return (
    <article className="expense-card">

      {/* Left */}

      <div className="expense-card-left">

        <div
          className={`expense-category-icon ${category.color}`}
        >
          <CategoryIcon size={24} />
        </div>

        <div className="expense-info">

          <div className="expense-title-row">

            <h3>{expense.title}</h3>

            <span
              className={`expense-category-badge ${category.color}`}
            >
              {category.label}
            </span>

          </div>

          {expense.description && (
            <p className="expense-description">
              {expense.description}
            </p>
          )}

          <div className="expense-meta">

            <span>

              <User size={15} />

              Paid by

              <strong>
                {expense.paidBy?.name}
              </strong>

            </span>

            <span>

              <CalendarDays size={15} />

              {formatDate(
                expense.expenseDate
              )}

            </span>

            <span>

              <Users size={15} />

              {expense.splitType ===
              "equal"
                ? "Equal Split"
                : "Custom Split"}

            </span>

          </div>

        </div>

      </div>

      {/* Right */}

      <div className="expense-card-right">

        <div className="expense-amount">

          <CreditCard size={18} />

          <h2>
            {formatCurrency(
              expense.amount
            )}
          </h2>

        </div>

        <div className="expense-actions">

          <button
            className="edit-btn"
            onClick={() =>
              onEdit(expense)
            }
          >
            <Pencil size={17} />
          </button>

          <button
            className="delete-btn"
            onClick={() =>
              onDelete(
                expense._id
              )
            }
          >
            <Trash2 size={17} />
          </button>

        </div>

      </div>

    </article>
  );
}