import api from "./axiosInstance";

export const getFinanceSummary =
  (tripId) =>
    api.get(
      `/trips/${tripId}/finance/summary`
    );
    export const getCategories =
  (tripId) =>
    api.get(
      `/trips/${tripId}/finance/categories`
    );

export const getTimeline =
  (tripId) =>
    api.get(
      `/trips/${tripId}/finance/timeline`
    );
    export const getPrediction =
  (tripId) =>
    api.get(
      `/trips/${tripId}/finance/prediction`
    );
    export const getSettlements =
  (tripId) =>
    api.get(
      `/trips/${tripId}/settlements`
    );