import { useEffect, useState, useCallback } from "react";
import {
  getExpenses,
  addExpense,
  deleteExpense,
  updateExpense,
} from "../../api/expenseApi";
import { getFinanceSummary } from "../../api/financeApi";
import BudgetPrediction from "./BudgetPrediction";
import TripSettlements from "./TripSettlements";
import TripWallet from "./TripWallet";
import TripAnalytics from "./TripAnalytics";
import "./TripExpenses.css";

const fmt = (n) => `₹${Math.round(n ?? 0).toLocaleString("en-IN")}`;

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const CATEGORY_META = {
  food: { icon: "ti-tools-kitchen-2", label: "Food" },
  hotel: { icon: "ti-building", label: "Hotel" },
  transport: { icon: "ti-car", label: "Transport" },
  activity: { icon: "ti-ticket", label: "Activity" },
  shopping: { icon: "ti-shopping-bag", label: "Shopping" },
  emergency: { icon: "ti-first-aid-kit", label: "Emergency" },
  misc: { icon: "ti-box", label: "Misc" },
};

const HEALTH_CONFIG = {
  healthy: { icon: "ti-circle-check", label: "Healthy budget" },
  warning: { icon: "ti-alert-triangle", label: "Watch your budget" },
  danger: { icon: "ti-alert-circle", label: "Near budget limit" },
};

function getHealthStatus(pct) {
  if (pct < 60) return "healthy";
  if (pct < 85) return "warning";
  return "danger";
}

const INITIAL_FORM = {
  title: "",
  description: "",
  category: "food",
  amount: "",
  paidBy: "",
  expenseDate: new Date().toISOString().split("T")[0],
};

const TABS = [
  { id: "overview", label: "Overview", icon: "ti-layout-dashboard" },
  { id: "wallet", label: "Wallet", icon: "ti-wallet" },
  { id: "analytics", label: "Analytics", icon: "ti-chart-bar" },
  { id: "expenses", label: "Expenses", icon: "ti-receipt" },
  { id: "settlements", label: "Settlements", icon: "ti-arrows-exchange" },
];

export default function TripExpenses({ tripId, members }) {
  const [activeTab, setActiveTab] = useState("overview");
console.log("Members:", members);
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [memberFilter, setMemberFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [expenseRes, financeRes] = await Promise.all([
        getExpenses(tripId),
        getFinanceSummary(tripId),
      ]);
      setExpenses(expenseRes.data.expenses);
      setSummary(financeRes.data.summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
        splitType: "equal",
        splitAmong: [],
      };
      if (editingId) {
        await updateExpense(editingId, payload);
      } else {
        await addExpense(tripId, payload);
      }
      resetForm();
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (expenseId) => {
    if (!window.confirm("Delete this expense?")) return;
    try {
      await deleteExpense(expenseId);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (expense) => {
    setEditingId(expense._id);
    setForm({
      title: expense.title,
      description: expense.description || "",
      category: expense.category,
      amount: expense.amount,
      paidBy: expense.paidBy?._id,
      expenseDate: expense.expenseDate?.split("T")[0],
    });
    setShowForm(true);
    setActiveTab("expenses");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filtered = [...expenses]
    .filter((e) => e.title?.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter((e) => categoryFilter === "all" || e.category === categoryFilter)
    .filter((e) => memberFilter === "all" || e.paidBy?._id === memberFilter)
    .sort((a, b) => {
      if (sortBy === "highest") return b.amount - a.amount;
      if (sortBy === "lowest") return a.amount - b.amount;
      if (sortBy === "oldest")
        return new Date(a.expenseDate) - new Date(b.expenseDate);
      return new Date(b.expenseDate) - new Date(a.expenseDate);
    });

  const budgetPct = summary?.budgetUsage ?? 0;
  const health = getHealthStatus(budgetPct);
  const healthMeta = HEALTH_CONFIG[health];

  if (loading) {
    return (
      <div className="te-root">
        <div className="te-loading">
          <div className="te-skeleton te-skeleton--tabs" />
          <div className="te-metrics">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="te-metric">
                <div className="te-skeleton te-skeleton--label" />
                <div className="te-skeleton te-skeleton--value" />
              </div>
            ))}
          </div>
          <div className="te-skeleton te-skeleton--block" />
        </div>
      </div>
    );
  }

  return (
    <div className="te-root">
      <div className="te">
        {/* ── Tabs ──────────────────────────────────────────── */}
        <div className="te-tabs" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`te-tab${activeTab === tab.id ? " te-tab--active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <i className={`ti ${tab.icon}`} aria-hidden="true" />
              {tab.label}
              {tab.id === "expenses" && expenses.length > 0 && (
                <span className="te-tab-count">{expenses.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Overview tab ──────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="te-panel">
            <div className="te-metrics">
              <div className="te-metric">
                <p className="te-metric-label">Trip budget</p>
                <p className="te-metric-value">{fmt(summary?.budget)}</p>
                <p className="te-metric-sub">Total allocated</p>
              </div>
              <div className="te-metric">
                <p className="te-metric-label">Total spent</p>
                <p className="te-metric-value">{fmt(summary?.totalSpent)}</p>
                <p className="te-metric-sub">Across {expenses.length} expenses</p>
              </div>
              <div className="te-metric">
                <p className="te-metric-label">Remaining</p>
                <p className="te-metric-value">{fmt(summary?.remaining)}</p>
                <p className="te-metric-sub">Available to spend</p>
              </div>
              <div className="te-metric">
                <p className="te-metric-label">Per person</p>
                <p className="te-metric-value">{fmt(summary?.costPerPerson)}</p>
                <p className="te-metric-sub">Split equally</p>
              </div>
            </div>

            {summary && (
              <div className={`te-health te-health--${health}`} role="status">
                <div className="te-health-left">
                  <i className={`ti ${healthMeta.icon}`} aria-hidden="true" />
                  <span>{healthMeta.label}</span>
                </div>
                <div className="te-health-bar-wrap">
                  <div
                    className="te-health-bar"
                    style={{ width: `${Math.min(budgetPct, 100)}%` }}
                    role="progressbar"
                    aria-valuenow={budgetPct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
                <span className="te-health-pct">{Math.round(budgetPct)}%</span>
              </div>
            )}

            <BudgetPrediction tripId={tripId} />
          </div>
        )}

        {/* ── Wallet tab ────────────────────────────────────── */}
        {activeTab === "wallet" && (
          <div className="te-panel te-panel--flush">
            <TripWallet tripId={tripId} />
          </div>
        )}

        {/* ── Analytics tab ─────────────────────────────────── */}
        {activeTab === "analytics" && (
          <div className="te-panel">
            <TripAnalytics tripId={tripId} />
          </div>
        )}

        {/* ── Expenses tab ──────────────────────────────────── */}
        {activeTab === "expenses" && (
          <div className="te-panel">
            <div className="te-toolbar">
              <div className="te-search">
                <i className="ti ti-search" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Search expenses…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Search expenses"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                aria-label="Filter by category"
              >
                <option value="all">All categories</option>
                {Object.entries(CATEGORY_META).map(([val, { label }]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>

              <select
                value={memberFilter}
                onChange={(e) => setMemberFilter(e.target.value)}
                aria-label="Filter by member"
              >
                <option value="all">All members</option>
                {members?.map((m) => (
                  <option key={m.userId?._id} value={m.userId?._id}>
                    {m.userId?.name}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort expenses"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="highest">Highest amount</option>
                <option value="lowest">Lowest amount</option>
              </select>
            </div>

            <div className="te-section">
              <div className="te-section-header">
                <div>
                  <p className="te-section-title">
                    <i className="ti ti-receipt" aria-hidden="true" />
                    All expenses
                  </p>
                  <p className="te-section-sub">
                    Track all trip spending in one place
                  </p>
                </div>
                <button
                  className={`te-add-btn${showForm ? " te-add-btn--active" : ""}`}
                  onClick={() => (showForm ? resetForm() : setShowForm(true))}
                >
                  <i
                    className={`ti ${showForm ? "ti-x" : "ti-plus"}`}
                    aria-hidden="true"
                  />
                  {showForm ? "Cancel" : "Add expense"}
                </button>
              </div>

              {showForm && (
                <form className="te-form" onSubmit={handleSubmit} noValidate>
                  <div className="te-form-grid">
                    <input
                      type="text"
                      name="title"
                      placeholder="Expense title"
                      value={form.title}
                      onChange={handleChange}
                      required
                      autoFocus
                    />
                    <input
                      type="number"
                      name="amount"
                      placeholder="Amount (₹)"
                      value={form.amount}
                      onChange={handleChange}
                      min="0"
                      required
                    />
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                    >
                      {Object.entries(CATEGORY_META).map(([val, { label }]) => (
                        <option key={val} value={val}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <select
                      name="paidBy"
                      value={form.paidBy}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Paid by…</option>
                      {members?.map((m) => (
                        <option key={m.userId?._id} value={m.userId?._id}>
                          {m.userId?.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="date"
                      name="expenseDate"
                      value={form.expenseDate}
                      onChange={handleChange}
                    />
                  </div>
                  <textarea
                    name="description"
                    placeholder="Description (optional)"
                    value={form.description}
                    onChange={handleChange}
                    rows={2}
                  />
                  <div className="te-form-actions">
                    <button
                      type="button"
                      className="te-cancel-btn"
                      onClick={resetForm}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="te-submit-btn">
                      {editingId ? "Update expense" : "Save expense"}
                    </button>
                  </div>
                </form>
              )}

              {filtered.length === 0 ? (
                <div className="te-empty">
                  <i className="ti ti-file-off" aria-hidden="true" />
                  <p className="te-empty-title">No expenses found</p>
                  <p className="te-empty-sub">
                    Try changing filters or add a new expense.
                  </p>
                </div>
              ) : (
                <ul className="te-list" role="list">
                  {filtered.map((expense) => {
                    const meta =
                      CATEGORY_META[expense.category] ?? CATEGORY_META.misc;
                    return (
                      <li key={expense._id} className="te-item">
                        <div className="te-cat-icon" aria-hidden="true">
                          <i className={`ti ${meta.icon}`} />
                        </div>

                        <div className="te-item-body">
                          <p className="te-item-title">{expense.title}</p>
                          <div className="te-item-meta">
                            <span className="te-cat-badge">{meta.label}</span>
                            <span className="te-item-paid">
                              <i className="ti ti-user" aria-hidden="true" />
                              {expense.paidBy?.name}
                            </span>
                            {expense.description && (
                              <span className="te-item-desc">
                                {expense.description}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="te-item-right">
                          <div className="te-item-amounts">
                            <p className="te-item-amount">
                              {fmt(expense.amount)}
                            </p>
                            <p className="te-item-date">
                              {fmtDate(expense.expenseDate)}
                            </p>
                          </div>
                          <div className="te-actions">
                            <button
                              className="te-icon-btn te-icon-btn--edit"
                              onClick={() => handleEdit(expense)}
                              aria-label={`Edit ${expense.title}`}
                              title="Edit"
                            >
                              <i className="ti ti-edit" />
                            </button>
                            <button
                              className="te-icon-btn te-icon-btn--delete"
                              onClick={() => handleDelete(expense._id)}
                              aria-label={`Delete ${expense.title}`}
                              title="Delete"
                            >
                              <i className="ti ti-trash" />
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* ── Settlements tab ───────────────────────────────── */}
        {activeTab === "settlements" && (
          <div className="te-panel">
            <TripSettlements tripId={tripId} />
          </div>
        )}
      </div>
    </div>
  );
}