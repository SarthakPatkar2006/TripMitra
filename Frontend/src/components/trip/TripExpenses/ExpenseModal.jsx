import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  X,
  Receipt,
  IndianRupee,
  CalendarDays,
  User,
  Users,
  FileText,
  Save,
} from "lucide-react";

import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from "../../../api/expenseApi";

import "./ExpenseModal.css";

const CATEGORY_OPTIONS = [
  { value: "food", label: "Food" },
  { value: "hotel", label: "Hotel" },
  { value: "transport", label: "Transport" },
  { value: "activity", label: "Activity" },
  { value: "shopping", label: "Shopping" },
  { value: "emergency", label: "Emergency" },
  { value: "misc", label: "Miscellaneous" },
];

export default function ExpenseModal({
  tripId,
  members = [],
  expense,
  onClose,
  onSuccess,
}) {
  const editing = Boolean(expense);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "food",
    amount: "",
    paidBy: "",
    splitType: "equal",
    splitAmong: [],
    expenseDate: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    if (!expense) return;

    setForm({
      title: expense.title || "",
      description: expense.description || "",
      category: expense.category || "food",
      amount: expense.amount || "",
      paidBy: expense.paidBy?._id || "",
      splitType: expense.splitType || "equal",
      splitAmong: expense.splitAmong || [],
      expenseDate:
        expense.expenseDate?.slice(0, 10) ||
        new Date().toISOString().slice(0, 10),
    });
  }, [expense]);

  // Fix 1: initialize paidBy / splitAmong from member.userId._id,
  // since `members` holds TripMember docs (userId is a populated user object),
  // not flat user objects.
  useEffect(() => {
    if (editing || members.length === 0) return;

    setForm((prev) => ({
      ...prev,
      paidBy: members[0].userId._id,
      splitAmong: members.map((member) => ({
        userId: member.userId._id,
        amount: 0,
      })),
    }));
  }, [editing, members]);

  const equalShare = useMemo(() => {
    if (!members.length || !form.amount) return 0;
    return Number(form.amount) / members.length;
  }, [form.amount, members]);

  // Fix 2: same correction for the equal-split recalculation effect.
  useEffect(() => {
    if (form.splitType !== "equal") return;

    setForm((prev) => ({
      ...prev,
      splitAmong: members.map((member) => ({
        userId: member.userId._id,
        amount: Number(equalShare.toFixed(2)),
      })),
    }));
  }, [equalShare, members, form.splitType]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Fix 5 (part 3): custom share handler now keyed by member.userId._id.
  // Updated: defaults to 0 instead of NaN when the input is cleared.
  const handleCustomShare = (userId, value) => {
    setForm((prev) => ({
      ...prev,
      splitAmong: prev.splitAmong.map((split) =>
        split.userId === userId
          ? { ...split, amount: Number(value) || 0 }
          : split
      ),
    }));
  };

  const validateForm = () => {
    if (!form.title.trim()) {
      return "Expense title is required.";
    }

    if (Number(form.amount) <= 0) {
      return "Amount should be greater than zero.";
    }

    if (!form.paidBy) {
      return "Select who paid.";
    }

    if (form.splitType === "custom") {
      const participants = form.splitAmong.filter(
        (item) => item.amount > 0
      );

      if (participants.length === 0) {
        return "Select at least one participant.";
      }

      const total = participants.reduce(
        (sum, item) => sum + Number(item.amount),
        0
      );

      if (Math.abs(total - Number(form.amount)) > 0.01) {
        return "Custom split total must equal expense amount.";
      }
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const validation = validateForm();
    if (validation) {
      setError(validation);
      return;
    }

    try {
      setLoading(true);

      const payload = {
        ...form,
        amount: Number(form.amount),
      };

      if (editing) {
        await updateExpense(expense._id, payload);
      } else {
        await createExpense(tripId, payload);
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to save expense."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="expense-modal-overlay">
      <div className="expense-modal">
        {/* Header */}
        <div className="expense-modal-header">
          <div>
            <h2>{editing ? "Edit Expense" : "Add Expense"}</h2>
            <p>
              Record trip expenses and automatically calculate settlements.
            </p>
          </div>

          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <form className="expense-form" onSubmit={handleSubmit}>
          {error && <div className="expense-error">{error}</div>}

          {/* Title */}
          <div className="form-group">
            <label>
              <Receipt size={16} />
              Expense Title
            </label>

            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Dinner, Hotel, Taxi..."
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label>
              <FileText size={16} />
              Description
            </label>

            <textarea
              rows={3}
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Optional description..."
            />
          </div>

          <div className="form-row">
            {/* Category */}
            <div className="form-group">
              <label>Category</label>

              <select
                name="category"
                value={form.category}
                onChange={handleChange}
              >
                {CATEGORY_OPTIONS.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div className="form-group">
              <label>
                <IndianRupee size={16} />
                Amount
              </label>

              <input
                type="number"
                name="amount"
                min="1"
                value={form.amount}
                onChange={handleChange}
                placeholder="0"
              />
            </div>
          </div>

          <div className="form-row">
            {/* Fix 3: Paid By dropdown */}
            <div className="form-group">
              <label>
                <User size={16} />
                Paid By
              </label>

              <select
                name="paidBy"
                value={form.paidBy}
                onChange={handleChange}
              >
                {members.map((member) => (
                  <option key={member.userId._id} value={member.userId._id}>
                    {member.userId.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div className="form-group">
              <label>
                <CalendarDays size={16} />
                Expense Date
              </label>

              <input
                type="date"
                name="expenseDate"
                value={form.expenseDate}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Split */}
          <div className="form-group">
            <label>
              <Users size={16} />
              Split Type
            </label>

            <div className="split-toggle">
              <button
                type="button"
                className={form.splitType === "equal" ? "active" : ""}
                onClick={() =>
                  setForm((prev) => ({ ...prev, splitType: "equal" }))
                }
              >
                Equal
              </button>

              <button
                type="button"
                className={form.splitType === "custom" ? "active" : ""}
                onClick={() =>
                  setForm((prev) => ({ ...prev, splitType: "custom" }))
                }
              >
                Custom
              </button>
            </div>
          </div>

          {/* Fix 4: Equal Split preview */}
          {form.splitType === "equal" && (
            <div className="split-preview">
              {members.map((member) => (
                <div key={member.userId._id} className="member-share">
                  <span>{member.userId.name}</span>
                  <strong>₹{equalShare.toFixed(2)}</strong>
                </div>
              ))}
            </div>
          )}

          {/* Fix 5: Custom Split — now with per-member participation checkbox */}
          {form.splitType === "custom" && (
            <div className="split-custom-list">
              {members.map((member) => {
                const userId = member.userId._id;
                const split = form.splitAmong.find(
                  (item) => item.userId === userId
                );
                const participating = !!split;

                return (
                  <div key={userId} className="split-custom-row">
                    <label className="participant-check">
                      <input
                        type="checkbox"
                        checked={participating}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setForm((prev) => ({
                              ...prev,
                              splitAmong: [
                                ...prev.splitAmong,
                                { userId, amount: 0 },
                              ],
                            }));
                          } else {
                            setForm((prev) => ({
                              ...prev,
                              splitAmong: prev.splitAmong.filter(
                                (item) => item.userId !== userId
                              ),
                            }));
                          }
                        }}
                      />
                      <span>{member.userId.name}</span>
                    </label>

                    <input
                      type="number"
                      min="0"
                      disabled={!participating}
                      value={split?.amount ?? ""}
                      onChange={(e) =>
                        handleCustomShare(userId, e.target.value)
                      }
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer */}
          <div className="expense-modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>

            <button type="submit" className="btn-primary" disabled={loading}>
              <Save size={17} />
              {loading ? "Saving..." : editing ? "Update Expense" : "Add Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}