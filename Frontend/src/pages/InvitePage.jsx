import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MapPin,
  CalendarDays,
  User,
  CheckCircle2,
  XCircle,
  Loader2,
  Plane,
} from "lucide-react";

import api from "../api/axiosInstance";
import "./InvitePage.css";
import toast from "react-hot-toast";
export default function InvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const res = await api.get(
          `/invitations/token/${token}`
        );

        setInvitation(res.data.invitation);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvite();
  }, [token]);

  const handleAccept = async () => {
    try {
      setProcessing(true);

      await api.post(
        `/invitations/${invitation._id}/accept`
      );

      toast.success(" Welcome to the trip!");

      navigate(`/trips/${invitation.tripId._id}`);
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to accept invitation."
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    try {
      setProcessing(true);

      await api.post(
        `/invitations/${invitation._id}/reject`
      );

      toast.success("Invitation declined.");

      navigate("/");
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to reject invitation."
      );
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="invite-loading">
        <Loader2
          size={42}
          className="spinner"
        />

        <h2>Loading Invitation...</h2>

        <p>
          Please wait while we fetch your
          invitation.
        </p>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="invite-loading">
        <XCircle
          size={60}
          color="#ef4444"
        />

        <h2>Invitation Not Found</h2>

        <p>
          This invitation may have expired
          or has already been used.
        </p>

        <button
          className="home-btn"
          onClick={() => navigate("/")}
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="invite-wrapper">

      <div className="invite-card">

        <div className="invite-top">

          <div className="plane-icon">
            <Plane size={34} />
          </div>

          <h1>You're Invited!</h1>

          <p>
            Join your friends and start
            planning an unforgettable trip.
          </p>

        </div>

        <div className="trip-title">
          {invitation.tripId.title}
        </div>

        <div className="invite-info">

          <div className="info-row">
            <MapPin size={20} />

            <div>
              <span>Destination</span>

              <strong>
                {invitation.tripId.destination}
              </strong>
            </div>
          </div>

          <div className="info-row">
            <User size={20} />

            <div>
              <span>Invited By</span>

              <strong>
                {invitation.invitedBy.name}
              </strong>
            </div>
          </div>

          <div className="info-row">
            <CalendarDays size={20} />

            <div>
              <span>Travel Dates</span>

              <strong>
                {new Date(
                  invitation.tripId.startDate
                ).toLocaleDateString()}
                {"  →  "}
                {new Date(
                  invitation.tripId.endDate
                ).toLocaleDateString()}
              </strong>
            </div>
          </div>

        </div>

        <div className="invite-note">
          Accept this invitation to become a
          member of this collaborative trip.
        </div>

        <div className="invite-actions">

          <button
            className="accept-btn"
            disabled={processing}
            onClick={handleAccept}
          >
            {processing ? (
              <>
                <Loader2
                  size={18}
                  className="spinner"
                />
                Accepting...
              </>
            ) : (
              <>
                <CheckCircle2 size={18} />
                Accept Invitation
              </>
            )}
          </button>

          <button
            className="reject-btn"
            disabled={processing}
            onClick={handleReject}
          >
            <XCircle size={18} />
            Decline
          </button>

        </div>

      </div>

    </div>
  );
}