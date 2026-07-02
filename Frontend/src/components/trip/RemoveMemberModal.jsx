import { useState } from "react";
import {
  Trash2,
  X,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axiosInstance";
import './RemoveMemberModal.css';
export default function RemoveMemberModal({
  isOpen,
  onClose,
  member,
  tripId,
  onSuccess,
}) {
  const [loading, setLoading] =
    useState(false);

  if (!isOpen || !member) return null;

  const handleRemove =
    async () => {
      const toastId =
        toast.loading(
          "Removing member..."
        );

      try {
        setLoading(true);

        await api.delete(
          `/invitations/${tripId}/members/${member.userId._id}`
        );

        toast.dismiss(toastId);

        toast.success(
          "Member removed successfully."
        );

        onSuccess?.();

        onClose();
      } catch (err) {
        toast.dismiss(toastId);

        toast.error(
          err.response?.data
            ?.message ||
            "Failed to remove member."
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="remove-modal"
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        <button
          className="modal-close"
          onClick={onClose}
        >
          <X size={20} />
        </button>

        <div className="modal-header">

          <div className="danger-icon">
            <AlertTriangle size={30} />
          </div>

          <h2>
            Remove Member
          </h2>

          <p>
            This action cannot be
            undone.
          </p>

        </div>

        <div className="remove-member-info">

          <h3>
            {member.userId?.name}
          </h3>

          <p>
            {member.userId?.email}
          </p>

        </div>

        <div className="warning-box">

          Removing this member
          will revoke access to
          this trip, itinerary,
          expenses and future
          updates.

        </div>

        <div className="modal-actions">

          <button
            className="cancel-btn"
            disabled={loading}
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="danger-btn"
            disabled={loading}
            onClick={
              handleRemove
            }
          >
            {loading ? (
              <>
                <Loader2
                  className="spin"
                  size={18}
                />

                Removing...
              </>
            ) : (
              <>
                <Trash2
                  size={18}
                />

                Remove Member
              </>
            )}
          </button>

        </div>

      </div>
    </div>
  );
}