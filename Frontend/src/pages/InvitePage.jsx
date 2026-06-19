import {
  useEffect,
  useState
} from "react";

import {
  useParams,
  useNavigate
} from "react-router-dom";

import api from "../api/axiosInstance";

export default function InvitePage() {
  const { token } =
    useParams();

  const navigate =
    useNavigate();

  const [
    invitation,
    setInvitation
  ] = useState(null);

  const [loading,
    setLoading] =
    useState(true);

  useEffect(() => {
    const fetchInvite =
      async () => {
        try {
          const res =
            await api.get(
              `/invitations/token/${token}`
            );

          setInvitation(
            res.data
              .invitation
          );
        } catch (error) {
          console.error(
            error
          );
        } finally {
          setLoading(
            false
          );
        }
      };

    fetchInvite();
  }, [token]);

  const handleAccept =
    async () => {
      try {
        await api.post(
          `/invitations/${invitation._id}/accept`
        );

        alert(
          "Trip joined successfully!"
        );

        navigate(
          `/trips/${invitation.tripId._id}`
        );
      } catch (error) {
        alert(
          error.response
            ?.data
            ?.message ||
            "Failed to accept invitation"
        );
      }
    };

  const handleReject =
    async () => {
      try {
        await api.post(
          `/invitations/${invitation._id}/reject`
        );

        alert(
          "Invitation rejected."
        );

        navigate("/");
      } catch (error) {
        alert(
          error.response
            ?.data
            ?.message ||
            "Failed to reject invitation"
        );
      }
    };

  if (loading) {
    return (
      <p>
        Loading invitation...
      </p>
    );
  }

  if (!invitation) {
    return (
      <h2>
        Invitation not
        found
      </h2>
    );
  }

  return (
    <div
      style={{
        maxWidth:
          "700px",
        margin:
          "60px auto",
        padding:
          "30px",
        background:
          "#fff",
        borderRadius:
          "16px"
      }}
    >
      <h1>
        ✈️ Trip
        Invitation
      </h1>

      <h2>
        {
          invitation
            .tripId.title
        }
      </h2>

      <p>
        Destination:
        {" "}
        {
          invitation
            .tripId
            .destination
        }
      </p>

      <p>
        Invited By:
        {" "}
        {
          invitation
            .invitedBy
            .name
        }
      </p>

      <p>
        Start:
        {" "}
        {new Date(
          invitation
            .tripId
            .startDate
        ).toLocaleDateString()}
      </p>

      <p>
        End:
        {" "}
        {new Date(
          invitation
            .tripId
            .endDate
        ).toLocaleDateString()}
      </p>

      <div
        style={{
          marginTop:
            "30px"
        }}
      >
        <button
          onClick={
            handleAccept
          }
        >
          Accept
        </button>

        <button
          onClick={
            handleReject
          }
          style={{
            marginLeft:
              "20px"
          }}
        >
          Reject
        </button>
      </div>
    </div>
  );
}