import { useEffect, useState } from "react";
import "./TripMembers.css";
import api from "../../api/axiosInstance";

export default function TripMembers({
  tripId,
  userRole
}) {
  const [members, setMembers] =
    useState([]);

  const [
    pendingInvites,
    setPendingInvites
  ] = useState([]);

  const [email, setEmail] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const fetchMembers =
    async () => {
      try {
        const res =
          await api.get(
            `/trips/${tripId}/members`
          );

        setMembers(
          res.data.members || []
        );
      } catch (err) {
        console.error(err);
      }
    };

  const fetchPendingInvites =
    async () => {
      try {
        const res =
          await api.get(
            `/invitations/trips/${tripId}/pending`
          );

        setPendingInvites(
          res.data.invitations || []
        );
      } catch (err) {
        console.error(err);
      }
    };

  useEffect(() => {
    const loadData =
      async () => {
        try {
          setLoading(true);

          await fetchMembers();

          if (
            userRole === "owner"
          ) {
            await fetchPendingInvites();
          }
        } finally {
          setLoading(false);
        }
      };

    loadData();
  }, [tripId, userRole]);

  const handleInvite =
    async () => {
      if (!email.trim()) {
        return;
      }

      try {
        await api.post(
          `/invitations/trips/${tripId}/invite`,
          {
            email
          }
        );

        alert(
          "Invitation sent."
        );

        setEmail("");

        await fetchPendingInvites();
      } catch (err) {
        alert(
          err.response?.data
            ?.message ||
            "Failed to invite."
        );
      }
    };

  const handleRemove =
    async (userId) => {
      const confirmRemove =
        window.confirm(
          "Remove member?"
        );

      if (!confirmRemove)
        return;

      try {
        await api.delete(
          `/invitations/${tripId}/members/${userId}`
        );

        await fetchMembers();
      } catch (err) {
        alert(
          err.response?.data
            ?.message ||
            "Failed to remove member."
        );
      }
    };

  if (loading) {
    return (
      <p>
        Loading members...
      </p>
    );
  }

  return (
    <div className="trip-members">
      <h2>
        Trip Members
      </h2>

      {/* Members */}

      {members.length ===
      0 ? (
        <p>
          No members yet.
        </p>
      ) : (
        members.map(
          (member) => (
            <div
              key={member._id}
              className="member-card"
            >
              <div>
                <h4>
                  {member.role ===
                  "owner"
                    ? "👑 "
                    : "👤 "}
                  {
                    member
                      .userId
                      ?.name
                  }
                </h4>

                <p>
                  {
                    member
                      .userId
                      ?.email
                  }
                </p>
              </div>

              {userRole ===
                "owner" &&
                member.role !==
                  "owner" && (
                  <button
                    onClick={() =>
                      handleRemove(
                        member
                          .userId
                          ?._id
                      )
                    }
                  >
                    Remove
                  </button>
                )}
            </div>
          )
        )
      )}

      {/* Invite */}

      {userRole ===
        "owner" && (
        <>
          <div className="invite-card">
            <h3>
              Invite Member
            </h3>

            <input
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(
                e
              ) =>
                setEmail(
                  e.target
                    .value
                )
              }
            />

            <button
              onClick={
                handleInvite
              }
            >
              Invite
            </button>
          </div>

          {/* Pending Invitations */}

          <div className="pending-card">
            <h3>
              Pending Invitations
            </h3>

            {pendingInvites
              .length ===
            0 ? (
              <p>
                No pending
                invitations.
              </p>
            ) : (
              pendingInvites.map(
                (
                  invite
                ) => (
                  <div
                    key={
                      invite._id
                    }
                    className="pending-item"
                  >
                    <div>
                      <h4>
                        {
                          invite.email
                        }
                      </h4>

                      <p>
                        Invited on{" "}
                        {new Date(
                          invite.createdAt
                        ).toLocaleDateString()}
                      </p>
                    </div>

                    <span>
                      Pending
                    </span>
                  </div>
                )
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}