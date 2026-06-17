import api from "./axiosInstance";

export const getTripDays = (
  tripId
) => {
  return api.get(
    `/itineraries/trip/${tripId}`
  );
};

export const createDay = (
  data
) => {
  return api.post(
    "/itineraries",
    data
  );
};

export const updateDay = (
  id,
  data
) => {
  return api.put(
    `/itineraries/${id}`,
    data
  );
};

export const deleteDay = (
  id
) => {
  return api.delete(
    `/itineraries/${id}`
  );
};