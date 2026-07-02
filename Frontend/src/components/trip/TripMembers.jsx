import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import "./TripMembers.css";
import api from "../../api/axiosInstance";
import {
  Users,
  User,
  Mail,
  CalendarDays,
  Clock,
  Inbox,
  Trash2,
  Crown,
  Plus,
  Search,
  XCircle,
} from "lucide-react";
import InviteMemberModal from "./InviteMemberModal";
import RemoveMemberModal from "./RemoveMemberModal";

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function MembersSkeleton() {
  return (
    <div className="trip-members-page">
      <div className="skeleton skeleton-header" />
      <div className="members-stats">
        <div className="skeleton skeleton-stat" />
        <div className="skeleton skeleton-stat" />
      </div>
      <div className="members-grid">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton skeleton-card" />
        ))}
      </div>
    </div>
  );
}

export default function TripMembers({ tripId, userRole }) {
  const [members, setMembers] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [cancelingInviteId, setCancelingInviteId] = useState(null);

  const isOwnerView = userRole === "owner";

  const fetchMembers = async () => {
    try {
      const res = await api.get(`/trips/${tripId}/members`);
      setMembers(res.data.members || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load members.");
    }
  };

  const fetchPendingInvites = async () => {
    try {
      const res = await api.get(`/invitations/trips/${tripId}/pending`);
      setPendingInvites(res.data.invitations || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load pending invitations.");
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await fetchMembers();
        if (isOwnerView) {
          await fetchPendingInvites();
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [tripId, userRole]);

  // Opens the confirmation modal instead of calling the API directly.
  // The actual DELETE call + toast + refetch lives inside RemoveMemberModal.
  const handleRemove = (member) => {
    setSelectedMember(member);
    setShowRemoveModal(true);
  };

  const handleCancelInvite = async (invite) => {
    if (!window.confirm(`Cancel the invitation to ${invite.email}?`)) return;

    try {
      setCancelingInviteId(invite._id);
      await api.delete(`/invitations/${invite._id}`);
      toast.success("Invitation cancelled.");
      setPendingInvites((prev) => prev.filter((i) => i._id !== invite._id));
    } catch (err) {
      console.error(err);
      toast.error("Failed to cancel invitation.");
    } finally {
      setCancelingInviteId(null);
    }
  };

  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      if (a.role === "owner") return -1;
      if (b.role === "owner") return 1;
      return (a.userId?.name || "").localeCompare(b.userId?.name || "");
    });
  }, [members]);

  const filteredMembers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return sortedMembers;

    return sortedMembers.filter((member) => {
      const name = member.userId?.name?.toLowerCase() || "";
      const email = member.userId?.email?.toLowerCase() || "";
      return name.includes(term) || email.includes(term);
    });
  }, [sortedMembers, searchTerm]);

  if (loading) {
    return <MembersSkeleton />;
  }

  return (
    <div className="trip-members-page">
      {/* Header */}
      <div className="members-header">
        <div className="members-header-text">
         <h1>
  <Users size={24} className="header-icon" />
  Who's Coming?
</h1>
<p>See who's in and invite the rest of the crew.</p>
        </div>

        {isOwnerView && (
          <button className="invite-btn" onClick={() => setShowInviteModal(true)}>
            <Plus size={18} />
            Invite Member
          </button>
        )}
      </div>

      {/* Statistics */}
      <div className="members-stats">
        <div className="stat-card">
          <div className="stat-icon stat-icon-blue">
            <Users size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Members</span>
            <span className="stat-value">{members.length}</span>
          </div>
        </div>

        {isOwnerView && (
          <div className="stat-card">
            <div className="stat-icon stat-icon-amber">
              <Mail size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Pending Invitations</span>
              <span className="stat-value">{pendingInvites.length}</span>
            </div>
          </div>
        )}
      </div>

      {/* Current Team */}
      <section className="members-section">
        <div className="section-header">
          <h2 className="section-title">Current Team</h2>

          {members.length > 4 && (
            <div className="members-search">
              <Search size={15} />
              <input
                type="text"
                placeholder="Search members…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search members"
              />
            </div>
          )}
        </div>

        {members.length === 0 ? (
          <div className="empty-state">
            <Users size={32} className="empty-icon" />
            <p className="empty-title">No members yet.</p>
            <p className="empty-subtitle">Invite someone to collaborate.</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="empty-state">
            <Search size={32} className="empty-icon" />
            <p className="empty-title">No members match "{searchTerm}"</p>
            <p className="empty-subtitle">Try a different name or email.</p>
          </div>
        ) : (
          <div className="members-grid">
            {filteredMembers.map((member) => {
              const isOwner = member.role === "owner";
              const name = member.userId?.name || "Unknown";
              const email = member.userId?.email || "—";
              const joined = formatDate(member.joinedAt || member.createdAt);

              return (
                <div key={member._id} className="member-card">
                  <div className="member-card-top">
                    <div className={`member-avatar ${isOwner ? "member-avatar-owner" : ""}`}>
                      {getInitials(name) || <User size={18} />}
                    </div>

                    <div className="member-info">
                      <h4 className="member-name">{name}</h4>
                      <p className="member-email">
                        <Mail size={13} />
                        <span>{email}</span>
                      </p>
                      {joined && (
                        <p className="member-joined">
                          <CalendarDays size={13} />
                          Joined {joined}
                        </p>
                      )}
                    </div>

                    <span className={`member-role ${isOwner ? "role-owner" : "role-member"}`}>
                      {isOwner && <Crown size={12} />}
                      {isOwner ? "OWNER" : "MEMBER"}
                    </span>
                  </div>

                  {isOwnerView && !isOwner && (
                    <div className="member-actions">
                      <button
                        className="remove-btn"
                        onClick={() => handleRemove(member)}
                      >
                        <Trash2 size={15} />
                        Remove Member
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Pending Invitations */}
      {isOwnerView && (
        <section className="members-section">
          <h2 className="section-title">Pending Invitations</h2>

          {pendingInvites.length === 0 ? (
            <div className="empty-state">
              <Inbox size={32} className="empty-icon" />
              <p className="empty-title">No pending invitations.</p>
              <p className="empty-subtitle">Everything is up to date.</p>
            </div>
          ) : (
            <div className="pending-grid">
              {pendingInvites.map((invite) => (
                <div key={invite._id} className="pending-card">
                  <div className="pending-card-top">
                    <div className="pending-icon">
                      <Mail size={16} />
                    </div>
                    <div className="pending-info">
                      <h4 className="pending-email">{invite.email}</h4>
                      <p className="pending-invited">
                        <Clock size={13} />
                        Invited {formatDate(invite.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="pending-card-footer">
                    <span className="status-badge">
                      <span className="status-dot" />
                      Pending
                    </span>

                    <button
                      className="btn-cancel-invite"
                      onClick={() => handleCancelInvite(invite)}
                      disabled={cancelingInviteId === invite._id}
                      aria-label={`Cancel invitation to ${invite.email}`}
                      title="Cancel invitation"
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Modals — already implemented elsewhere, just wired up here */}
      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        tripId={tripId}
        onSuccess={fetchPendingInvites}
      />

      <RemoveMemberModal
        isOpen={showRemoveModal}
        onClose={() => {
          setShowRemoveModal(false);
          setSelectedMember(null);
        }}
        member={selectedMember}
        tripId={tripId}
        onSuccess={fetchMembers}
      />
    </div>
  );
}