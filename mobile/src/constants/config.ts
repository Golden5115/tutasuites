// Tuta Suites & Grab and Go API Configuration

export const API_BASE_URL = "https://tutasuites.com"

export const ENDPOINTS = {
  menu: `${API_BASE_URL}/api/mobile/menu`,
  orders: `${API_BASE_URL}/api/mobile/orders`,
  orderById: (id: string) => `${API_BASE_URL}/api/mobile/orders/${id}`,
  register: `${API_BASE_URL}/api/mobile/auth/register`,
  login: `${API_BASE_URL}/api/mobile/auth/login`,
  sendOtp: `${API_BASE_URL}/api/mobile/auth/send-otp`,
  verifyOtp: `${API_BASE_URL}/api/mobile/auth/verify-otp`,
  googleAuth: `${API_BASE_URL}/api/mobile/auth/google`,
}
