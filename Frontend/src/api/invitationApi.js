import api from "./axios";

export const getMyInvitations = () =>
  api.get("/invitations");

export const inviteMember = (tripId, email) =>
  api.post(
    `/invitations/trips/${tripId}/invite`,
    { email }
  );

export const acceptInvitation = (id) =>
  api.post(`/invitations/${id}/accept`);

export const rejectInvitation = (id) =>
  api.post(`/invitations/${id}/reject`);
export const getPendingInvitations =
  (tripId) =>
    api.get(
      `/invitations/trips/${tripId}/pending`
    );
export const getInvitation =
  (token) =>
    api.get(
      `/invitations/token/${token}`
    );