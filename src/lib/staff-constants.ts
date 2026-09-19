export interface ModuleDefinition {
  key: string
  label: string
  shortLabel: string
  description: string
  category: "operations" | "financial" | "admin"
}

export const SYSTEM_MODULES: ModuleDefinition[] = [
  {
    key: "RESERVATIONS",
    label: "Reservations & Bookings",
    shortLabel: "Reservations",
    description: "Create, view, check-in, and check-out guest room reservations.",
    category: "operations",
  },
  {
    key: "ROOMS",
    label: "Rooms Management",
    shortLabel: "Rooms",
    description: "Manage room inventory, maintenance statuses, and room pricing.",
    category: "operations",
  },
  {
    key: "CALENDAR",
    label: "Booking Calendar",
    shortLabel: "Calendar",
    description: "Visual room booking timeline and real-time occupancy scheduler.",
    category: "operations",
  },
  {
    key: "HOUSEKEEPING",
    label: "Housekeeping",
    shortLabel: "Housekeeping",
    description: "Room cleaning schedules, inspection checklists, and status tracking.",
    category: "operations",
  },
  {
    key: "LAUNDRY",
    label: "Laundry Services",
    shortLabel: "Laundry",
    description: "Guest and in-house laundry orders, pricing catalogs, and wash cycles.",
    category: "operations",
  },
  {
    key: "RESTAURANT",
    label: "Restaurant & Bar (POS)",
    shortLabel: "POS (Bar & Dining)",
    description: "Direct touch point-of-sale ordering, table tabs, and receipt printing.",
    category: "operations",
  },
  {
    key: "EXPENSES",
    label: "Operating Expenses",
    shortLabel: "Expenses",
    description: "Log daily operational expenses (No access to company revenue or profit reports).",
    category: "financial",
  },
  {
    key: "FINANCE",
    label: "Finance & Analytics",
    shortLabel: "Finance & Analytics",
    description: "Full hotel revenue reports, profit & loss, charts, and financial statements.",
    category: "financial",
  },
  {
    key: "STAFF",
    label: "Staff Management",
    shortLabel: "Staff Accounts",
    description: "Manage staff team accounts, assign roles, credentials, and module permissions.",
    category: "admin",
  },
  {
    key: "SETTINGS",
    label: "Hotel Settings",
    shortLabel: "Settings",
    description: "Configure hotel contact information, VAT/taxes, service rates, and system preferences.",
    category: "admin",
  },
]

export const ROLE_DEFINITIONS = [
  {
    value: "FRONT_DESK",
    label: "Front Desk / Staff",
    description: "Standard operational role. Access is restricted strictly to their assigned modules.",
    badgeClass: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
  },
  {
    value: "ADMIN",
    label: "Administrator",
    description: "Full system privileges. Can access all modules, manage staff accounts, and view all finances.",
    badgeClass: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
  },
]
