// import api from "./axios";
import api from "./axiosInstance";
export const getRecommendations =
  (tripId) =>
    api.get(
      `/recommendations/${tripId}`
    );