import { useEffect, useState } from "react";
import {
  getMyInvitations,
  acceptInvitation,
  rejectInvitation
} from "../api/invitationApi";

import "./Invitations.css";

function Invitations() {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState("");

  const fetchInvitations = async () => {
    try {
      setLoading(true);

      const res = await getMyInvitations();

      setInvitations(
        res.data.invitations || []
      );
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.message ||
          "Failed to fetch invitations."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleAccept = async (id) => {
    try {
      setProcessingId(id);

      await acceptInvitation(id);

      setInvitations((prev) =>
        prev.filter(
          (inv) => inv._id !== id
        )
      );
    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.message ||
          "Failed to accept invitation."
      );
    } finally {
      setProcessingId("");
    }
  };

  const handleReject = async (id) => {
    try {
      setProcessingId(id);

      await rejectInvitation(id);

      setInvitations((prev) =>
        prev.filter(
          (inv) => inv._id !== id
        )
      );
    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.message ||
          "Failed to reject invitation."
      );
    } finally {
      setProcessingId("");
    }
  };

  if (loading) {
    return (
      <div className="invitations-page">
        <h1>Invitations</h1>
        <p>Loading invitations...</p>
      </div>
    );
  }

  return (
    <div className="invitations-page">
      <h1>Trip Invitations</h1>

      {invitations.length === 0 ? (
        <div className="empty-state">
          <p>No pending invitations.</p>
        </div>
      ) : (
        <div className="invitation-grid">
          {invitations.map((inv) => (
            <div
              key={inv._id}
              className="invitation-card"
            >
              <h3>
                {inv.tripId?.title ||
                  "Untitled Trip"}
              </h3>

              <p>
                <strong>
                  Destination:
                </strong>{" "}
                {inv.tripId
                  ?.destination ||
                  "-"}
              </p>

              <p>
                <strong>
                  Invited By:
                </strong>{" "}
                {inv.invitedBy?.name ||
                  "Unknown"}
              </p>

              <p>
                <strong>
                  Start:
                </strong>{" "}
                {inv.tripId?.startDate
                  ? new Date(
                      inv.tripId.startDate
                    ).toLocaleDateString()
                  : "-"}
              </p>

              <p>
                <strong>
                  End:
                </strong>{" "}
                {inv.tripId?.endDate
                  ? new Date(
                      inv.tripId.endDate
                    ).toLocaleDateString()
                  : "-"}
              </p>

              <div className="invitation-actions">
                <button
                  disabled={
                    processingId ===
                    inv._id
                  }
                  onClick={() =>
                    handleAccept(
                      inv._id
                    )
                  }
                >
                  {processingId ===
                  inv._id
                    ? "Processing..."
                    : "Accept"}
                </button>

                <button
                  disabled={
                    processingId ===
                    inv._id
                  }
                  onClick={() =>
                    handleReject(
                      inv._id
                    )
                  }
                >
                  {processingId ===
                  inv._id
                    ? "Processing..."
                    : "Reject"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Invitations;