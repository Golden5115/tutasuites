// Tuta Suites & Grab and Go API Configuration

export const API_BASE_URL = "https://tutasuites.com"

export const ENDPOINTS = {
  menu: `${API_BASE_URL}/api/mobile/menu`,
  orders: `${API_BASE_URL}/api/mobile/orders`,
  orderById: (id: string) => `${API_BASE_URL}/api/mobile/orders/${id}`,
}
