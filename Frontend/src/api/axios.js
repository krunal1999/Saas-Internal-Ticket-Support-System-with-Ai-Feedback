import axios from "axios";
import conf from "../../config.js";

const api = axios.create({
  baseURL: conf.baseUrl,
  headers: { "Content-Type": "application/json" },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ----- AUTH -----
export const loginAgent = (data) => api.post("/auth/login", data);
export const loginCustomer = (data) => api.post("/auth/customer-login", data);
export const getMe = () => api.get("/auth/me");

// ----- TICKETS -----
export const getTickets = (params) => api.get("/tickets", { params });
export const getTicketById = (id) => api.get(`/tickets/${id}`);
export const createTicket = (data) => api.post("/tickets", data);
export const updateTicketField = (id, data) =>
  api.patch(`/tickets/${id}`, data);
export const updateStatus = (id, data) =>
  api.patch(`/tickets/${id}/status`, data);
export const assignTicket = (id, data) =>
  api.patch(`/tickets/${id}/assign`, data);

// ----- MESSAGES -----
export const getMessages = (id) => api.get(`/tickets/${id}/messages`);
export const addMessage = (id, data) =>
  api.post(`/tickets/${id}/messages`, data);

// ----- AI INSIGHT -----
export const getInsight = (id) => api.get(`/tickets/${id}/ai-insight`);
export const generateInsight = (id) => api.post(`/tickets/${id}/ai-insight`);
export const editInsight = (id, data) =>
  api.patch(`/tickets/${id}/ai-insight`, data);
export const regenerateInsight = (id) =>
  api.patch(`/tickets/${id}/ai-insight/regenerate`);

// ----- MISC -----
export const getAgents = () => api.get("/misc/agents");
export const getCustomers = (params) => api.get("/misc/customers", { params });
export const createCustomer = (data) => api.post("/misc/customers", data);

export default api;
