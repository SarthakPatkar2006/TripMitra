import { useEffect, useRef, useState } from "react";
import { Mail, Send, X, Loader2, UserPlus, CheckCircle2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axiosInstance";
import "./InviteMemberModal.css";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function InviteMemberModal({ isOpen, onClose, tripId, onSuccess }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const isValidEmail = EMAIL_REGEX.test(email.trim());
  const showValidation = email.length > 0;

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") closeModal();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, loading]);

  if (!isOpen) return null;

  const handleInvite = async (e) => {
    e?.preventDefault();

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      toast.error("Please enter an email.");
      return;
    }

    if (!isValidEmail) {
      toast.error("Enter a valid email.");
      return;
    }

    const toastId = toast.loading("Sending invitation...");

    try {
      setLoading(true);

      await api.post(`/invitations/trips/${tripId}/invite`, {
        email: trimmedEmail,
      });

      toast.dismiss(toastId);
      toast.success("Invitation sent successfully!");

      setEmail("");
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err.response?.data?.message || "Failed to send invitation.");
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    if (loading) return;
    setEmail("");
    onClose();
  };

  return (
    <div
      className="invite-modal-overlay"
      onClick={closeModal}
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-modal-title"
    >
      <div className="invite-modal" onClick={(e) => e.stopPropagation()}>
        <button
          className="invite-modal-close"
          onClick={closeModal}
          disabled={loading}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="invite-modal-header">
          <div className="invite-modal-icon">
            <UserPlus size={30} />
          </div>

          <h2 id="invite-modal-title">Invite Member</h2>
          <p>Invite someone to collaborate on this trip.</p>
        </div>

        <form className="invite-modal-body" onSubmit={handleInvite}>
          <label htmlFor="invite-email">Email Address</label>

          <div
            className={`invite-input-wrapper${
              showValidation ? (isValidEmail ? " is-valid" : " is-invalid") : ""
            }`}
          >
            <Mail size={18} />
            <input
              id="invite-email"
              ref={inputRef}
              type="email"
              placeholder="example@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
            />
          </div>

          {showValidation && (
            <small className={isValidEmail ? "invite-valid-email" : "invite-invalid-email"}>
              {isValidEmail ? (
                <>
                  <CheckCircle2 size={13} />
                  Valid email
                </>
              ) : (
                <>
                  <AlertCircle size={13} />
                  Invalid email format
                </>
              )}
            </small>
          )}

          <div className="invite-modal-actions">
            <button
              type="button"
              className="invite-cancel-btn"
              disabled={loading}
              onClick={closeModal}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="invite-send-btn"
              disabled={loading || !isValidEmail}
            >
              {loading ? (
                <>
                  <Loader2 className="invite-spin" size={18} />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Send Invitation
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}