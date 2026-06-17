import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api/axiosInstance';
import './InviteResponse.css';

export default function InviteResponse() {
  const { invitationId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const hasToken = Boolean(localStorage.getItem('token'));

  const respondToInvitation = async (action) => {
    setIsLoading(true);
    setStatus('');

    try {
      await api.post(`/invitations/${invitationId}/${action}`);
      setStatus(action === 'accept' ? 'Invitation accepted.' : 'Invitation rejected.');

      if (action === 'accept') {
        setTimeout(() => navigate('/dashboard'), 900);
      }
    } catch (err) {
      setStatus(err.response?.data?.message || 'Could not process this invitation.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="invite-response-page">
      <div className="invite-response-card">
        <h1>Trip Invitation</h1>
        <p>Respond to this TripMitra invitation using the account linked to the invited email.</p>

        {!hasToken ? (
          <div className="invite-login-note">
            <p>Please log in first, then open this invitation link again.</p>
            <Link to="/login">Go to Login</Link>
          </div>
        ) : (
          <div className="invite-actions">
            <button
              type="button"
              className="accept-invite-btn"
              disabled={isLoading}
              onClick={() => respondToInvitation('accept')}
            >
              Accept
            </button>
            <button
              type="button"
              className="reject-invite-btn"
              disabled={isLoading}
              onClick={() => respondToInvitation('reject')}
            >
              Reject
            </button>
          </div>
        )}

        {status && <p className="invite-response-status">{status}</p>}

        <Link className="invite-dashboard-link" to="/dashboard">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}