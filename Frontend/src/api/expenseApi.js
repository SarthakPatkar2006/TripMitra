import api from "./axiosInstance";

export const getExpenses = (tripId) =>
  api.get(`/trips/${tripId}/expenses`);

export const createExpense = (tripId, data) =>
  api.post(`/trips/${tripId}/expenses`, data);

export const updateExpense = (expenseId, data) =>
  api.put(`/expenses/${expenseId}`, data);

export const deleteExpense = (expenseId) =>
  api.delete(`/expenses/${expenseId}`);