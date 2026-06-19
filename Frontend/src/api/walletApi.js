import api from "./axiosInstance";

export const getWallet = (tripId) =>
  api.get(
    `/trips/${tripId}/wallet`
  );

export const contributeMoney = (
  tripId,
  amount
) =>
  api.post(
    `/trips/${tripId}/wallet/contribute`,
    {
      amount
    }
  );

export const getTransactions = (
  tripId
) =>
  api.get(
    `/trips/${tripId}/wallet/transactions`
  );