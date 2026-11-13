// Tuta Suites & Grab and Go API Configuration

export const API_BASE_URL = "https://tutasuites.com";

export const ENDPOINTS = {
  menu: `${API_BASE_URL}/api/mobile/menu`,
  orders: `${API_BASE_URL}/api/mobile/orders`,
  myOrders: `${API_BASE_URL}/api/mobile/orders?mine=1`,
  orderById: (id: string) => `${API_BASE_URL}/api/mobile/orders/${encodeURIComponent(id)}`,
  orderCancel: (id: string) =>
    `${API_BASE_URL}/api/mobile/orders/${encodeURIComponent(id)}/cancel`,
  orderByTrackingToken: (token: string) =>
    `${API_BASE_URL}/api/mobile/orders/tracking/${encodeURIComponent(token)}`,
  notifications: `${API_BASE_URL}/api/mobile/notifications`,
  pushToken: `${API_BASE_URL}/api/mobile/push-token`,
  register: `${API_BASE_URL}/api/mobile/auth/register`,
  login: `${API_BASE_URL}/api/mobile/auth/login`,
  sendOtp: `${API_BASE_URL}/api/mobile/auth/send-otp`,
  verifyOtp: `${API_BASE_URL}/api/mobile/auth/verify-otp`,
  googleAuth: `${API_BASE_URL}/api/mobile/auth/google`,
  forgotPassword: `${API_BASE_URL}/api/mobile/auth/forgot-password`,
  resetPassword: `${API_BASE_URL}/api/mobile/auth/reset-password`,
  refresh: `${API_BASE_URL}/api/mobile/auth/refresh`,
  logout: `${API_BASE_URL}/api/mobile/auth/logout`,
  me: `${API_BASE_URL}/api/mobile/auth/me`,
};
