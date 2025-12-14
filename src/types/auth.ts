/**
 * User Roles
 */
export type UserRole = "Admin" | "Doctor" | "Lab Technician" | "Receptionist";

/**
 * User Interface
 */
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  userName?: string | null;
  phone?: string | null;
  phoneNumber?: string | null;
  role?: UserRole | string;
  roleName?: string;
  roleId?: string;
  age?: number | null;
  location?: string | null;
  country?: string | null;
  image?: string | null;
  status?: boolean;
  isActive?: boolean;
  isEmailVerified?: boolean;
  emailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string | null;
  doctorSpecialization?: string | null;
}

/**
 * Role Permissions
 */
export interface RolePermissions {
  canViewPatients: boolean;
  canCreatePatients: boolean;
  canEditPatients: boolean;
  canDeletePatients: boolean;
  canViewSamples: boolean;
  canCreateSamples: boolean;
  canEditSamples: boolean;
  canDeleteSamples: boolean;
  canViewAppointments: boolean;
  canCreateAppointments: boolean;
  canEditAppointments: boolean;
  canDeleteAppointments: boolean;
  canViewUsers: boolean;
  canCreateUsers: boolean;
  canEditUsers: boolean;
  canDeleteUsers: boolean;
  canViewReports: boolean;
  canViewSettings: boolean;
  canManageSystem: boolean;
  canManageEncounters: boolean;
  canManageTreatmentCycles: boolean;
  canManagePrescriptions: boolean;
  canAccessCryobank: boolean;
  canManageSchedule: boolean;
}

/**
 * Role Permissions Configuration
 */
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  Admin: {
    canViewPatients: true,
    canCreatePatients: true,
    canEditPatients: true,
    canDeletePatients: true,
    canViewSamples: true,
    canCreateSamples: true,
    canEditSamples: true,
    canDeleteSamples: true,
    canViewAppointments: true,
    canCreateAppointments: true,
    canEditAppointments: true,
    canDeleteAppointments: true,
    canViewUsers: true,
    canCreateUsers: true,
    canEditUsers: true,
    canDeleteUsers: true,
    canViewReports: true,
    canViewSettings: true,
    canManageSystem: true,
    canManageEncounters: true,
    canManageTreatmentCycles: true,
    canManagePrescriptions: true,
    canAccessCryobank: true,
    canManageSchedule: true,
  },
  Doctor: {
    canViewPatients: true,
    canCreatePatients: true,
    canEditPatients: true,
    canDeletePatients: false,
    canViewSamples: true,
    canCreateSamples: true,
    canEditSamples: true,
    canDeleteSamples: false,
    canViewAppointments: true,
    canCreateAppointments: true,
    canEditAppointments: true,
    canDeleteAppointments: false,
    canViewUsers: false,
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canViewReports: true,
    canViewSettings: false,
    canManageSystem: false,
    canManageEncounters: true,
    canManageTreatmentCycles: true,
    canManagePrescriptions: true,
    canAccessCryobank: true,
    canManageSchedule: true,
  },
  "Lab Technician": {
    canViewPatients: true,
    canCreatePatients: false,
    canEditPatients: false,
    canDeletePatients: false,
    canViewSamples: true,
    canCreateSamples: true,
    canEditSamples: true,
    canDeleteSamples: false,
    canViewAppointments: true,
    canCreateAppointments: false,
    canEditAppointments: false,
    canDeleteAppointments: false,
    canViewUsers: false,
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canViewReports: true,
    canViewSettings: false,
    canManageSystem: false,
    canManageEncounters: false,
    canManageTreatmentCycles: false,
    canManagePrescriptions: false,
    canAccessCryobank: true,
    canManageSchedule: false,
  },
  Receptionist: {
    canViewPatients: true,
    canCreatePatients: true,
    canEditPatients: true,
    canDeletePatients: false,
    canViewSamples: true,
    canCreateSamples: false,
    canEditSamples: false,
    canDeleteSamples: false,
    canViewAppointments: true,
    canCreateAppointments: true,
    canEditAppointments: true,
    canDeleteAppointments: true,
    canViewUsers: false,
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canViewReports: true,
    canViewSettings: false,
    canManageSystem: false,
    canManageEncounters: false,
    canManageTreatmentCycles: false,
    canManagePrescriptions: false,
    canAccessCryobank: false,
    canManageSchedule: true,
  },
};

/**
 * Role Dashboard Routes
 */
export const ROLE_DASHBOARD_ROUTES: Record<UserRole, string> = {
  Admin: "/admin/dashboard",
  Doctor: "/doctor/dashboard",
  "Lab Technician": "/lab-technician/dashboard",
  Receptionist: "/receptionist/dashboard",
};

/**
 * Navigation Item
 */
export interface NavigationItem {
  label: string;
  href: string;
  icon: string;
  permission?: keyof RolePermissions;
}

/**
 * Role Navigation Configuration
 */
export const ROLE_NAVIGATION: Record<UserRole, NavigationItem[]> = {
  Admin: [
    { label: "Dashboard", href: "/admin/dashboard", icon: "LayoutDashboard" },
    {
      label: "Users",
      href: "/admin/users",
      icon: "UserCog",
      permission: "canViewUsers",
    },
    {
      label: "Service categories",
      href: "/admin/categories",
      icon: "ClipboardList",
      permission: "canManageSystem",
    },
    {
      label: "Content",
      href: "/admin/content",
      icon: "FileText",
      permission: "canManageSystem",
    },
    {
      label: "Reports",
      href: "/admin/reports",
      icon: "BarChart3",
      permission: "canViewReports",
    },
    {
      label: "Settings",
      href: "/admin/settings",
      icon: "Settings",
      permission: "canViewSettings",
    },
    {
      label: "Audit logs",
      href: "/admin/logs",
      icon: "ClipboardList",
      permission: "canManageSystem",
    },
  ],
  Doctor: [
    { label: "Dashboard", href: "/doctor/dashboard", icon: "LayoutDashboard" },
    {
      label: "My Patients",
      href: "/doctor/patients",
      icon: "Users",
      permission: "canViewPatients",
    },
    {
      label: "Appointments",
      href: "/doctor/appointments",
      icon: "Calendar",
      permission: "canViewAppointments",
    },
    {
      label: "Service Requests",
      href: "/doctor/service-requests",
      icon: "FileCheck",
      permission: "canManageEncounters",
    },
    {
      label: "Encounters",
      href: "/doctor/encounters",
      icon: "ClipboardList",
      permission: "canManageEncounters",
    },
    {
      label: "Medical Records",
      href: "/doctor/medical-records",
      icon: "FileText",
      permission: "canManageEncounters",
    },
    {
      label: "Treatment Cycles",
      href: "/doctor/treatment-cycles",
      icon: "Workflow",
      permission: "canManageTreatmentCycles",
    },
    {
      label: "Prescriptions",
      href: "/doctor/prescriptions",
      icon: "Pill",
      permission: "canManagePrescriptions",
    },
    {
      label: "Cryobank",
      href: "/doctor/cryobank",
      icon: "Snowflake",
      permission: "canAccessCryobank",
    },
    {
      label: "Reports",
      href: "/doctor/reports",
      icon: "BarChart3",
      permission: "canViewReports",
    },
    {
      label: "Schedule",
      href: "/doctor/schedule",
      icon: "Clock",
      permission: "canManageSchedule",
    },
  ],
  "Lab Technician": [
    {
      label: "Dashboard",
      href: "/lab-technician/dashboard",
      icon: "LayoutDashboard",
    },
    {
      label: "Samples",
      href: "/lab-technician/samples",
      icon: "FlaskConical",
      permission: "canViewSamples",
    },
    {
      label: "Tests",
      href: "/lab-technician/tests",
      icon: "TestTube",
      permission: "canViewSamples",
    },
  ],
  Receptionist: [
    {
      label: "Dashboard",
      href: "/receptionist/dashboard",
      icon: "LayoutDashboard",
    },
    {
      label: "Service requests",
      href: "/receptionist/service-requests",
      icon: "ClipboardList",
    },
    {
      label: "Patients",
      href: "/receptionist/patients",
      icon: "Users",
      permission: "canViewPatients",
    },
    {
      label: "Appointments",
      href: "/receptionist/appointments",
      icon: "Calendar",
      permission: "canViewAppointments",
    },
    {
      label: "Schedule",
      href: "/receptionist/schedule",
      icon: "Clock",
      permission: "canViewAppointments",
    },
    {
      label: "Transactions",
      href: "/receptionist/transactions",
      icon: "CreditCard",
    },
    {
      label: "Reports",
      href: "/receptionist/reports",
      icon: "BarChart3",
      permission: "canViewReports",
    },
  ],
};
