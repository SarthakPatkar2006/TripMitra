import React, { useState } from "react";
import api from "../api/axiosInstance";

export default function ExpenseModal({
  tripId,
  members,
  onClose,
  onSuccess
}) {
  const [title, setTitle] =
    useState("");

  const [amount, setAmount] =
    useState("");

  const [description,
    setDescription] =
    useState("");

  const [category,
    setCategory] =
    useState("Food");

  const [expenseDate,
    setExpenseDate] =
    useState(
      new Date()
        .toISOString()
        .split("T")[0]
    );

  const [selectedUsers,
    setSelectedUsers] =
    useState([]);

  const [loading,
    setLoading] =
    useState(false);

  const categories = [
    "Food",
    "Transport",
    "Hotel",
    "Activity",
    "Shopping",
    "Other"
  ];

  const toggleUser =
    (userId) => {
      setSelectedUsers(
        (prev) => {
          if (
            prev.includes(userId)
          ) {
            return prev.filter(
              (id) =>
                id !== userId
            );
          }

          return [
            ...prev,
            userId
          ];
        }
      );
    };

  const handleSubmit =
    async (e) => {
      e.preventDefault();

      if (
        !title ||
        !amount
      ) {
        return alert(
          "Please fill all fields."
        );
      }

      if (
        selectedUsers.length ===
        0
      ) {
        return alert(
          "Select at least one member."
        );
      }

      try {
        setLoading(true);

        const share =
          Number(amount) /
          selectedUsers.length;

        const splitBetween =
          selectedUsers.map(
            (userId) => ({
              userId,
              share
            })
          );

        await api.post(
          "/expenses/log",
          {
            tripId,
            title,
            description,
            category,
            amount:
              Number(
                amount
              ),
            expenseDate,
            splitBetween
          }
        );

        onSuccess();
        onClose();
      } catch (err) {
        console.error(err);

        alert(
          err.response?.data
            ?.message ||
            "Failed to add expense."
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <div className="modal-overlay">

      <div className="modal-content">

        <h2>
          Add Expense
        </h2>

        <form
          onSubmit={
            handleSubmit
          }
        >

          <input
            type="text"
            placeholder="Expense Title"
            value={title}
            onChange={(e) =>
              setTitle(
                e.target.value
              )
            }
          />

          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) =>
              setAmount(
                e.target.value
              )
            }
          />

          <select
            value={category}
            onChange={(e) =>
              setCategory(
                e.target.value
              )
            }
          >
            {categories.map(
              (item) => (
                <option
                  key={item}
                >
                  {item}
                </option>
              )
            )}
          </select>

          <textarea
            placeholder="Description"
            value={
              description
            }
            onChange={(e) =>
              setDescription(
                e.target.value
              )
            }
          />

          <input
            type="date"
            value={
              expenseDate
            }
            onChange={(e) =>
              setExpenseDate(
                e.target.value
              )
            }
          />

          <div className="split-section">

            <h3>
              Split Between
            </h3>

            {members.map(
              (member) => (
                <label
                  key={
                    member._id
                  }
                  className="member-checkbox"
                >
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(
                      member._id
                    )}
                    onChange={() =>
                      toggleUser(
                        member._id
                      )
                    }
                  />

                  {
                    member.name
                  }
                </label>
              )
            )}

          </div>

          <div className="modal-actions">

            <button
              type="submit"
              disabled={
                loading
              }
            >
              {loading
                ? "Saving..."
                : "Add Expense"}
            </button>

            <button
              type="button"
              onClick={
                onClose
              }
            >
              Cancel
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}