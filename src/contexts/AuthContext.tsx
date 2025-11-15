import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { api } from "@/api/client";
import type { User } from "@/types/auth";
import { UserRole, RolePermissions, ROLE_PERMISSIONS } from "@/types/auth";
import type { User as ApiUser } from "@/api/types";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  userRole: UserRole | null;
  userPermissions: RolePermissions | null;
  login: (email: string, password: string, mobile?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
  hasPermission: (permission: keyof RolePermissions) => boolean;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const mapUserResponse = (source: ApiUser | User, fallbackEmail = ""): User => {
  const rawEmail =
    (source as ApiUser).email ?? (source as User).email ?? fallbackEmail ?? "";
  const email = rawEmail || fallbackEmail || "";
  const userName =
    (source as ApiUser).userName ??
    (source as User).userName ??
    (email ? email.split("@")[0] : undefined);
  const fullName =
    (source as ApiUser).fullName ??
    (source as User).fullName ??
    userName ??
    fallbackEmail.split("@")[0] ??
    "User";
  const roleValue =
    (source as ApiUser).role ??
    (source as ApiUser).roleName ??
    (source as User).role ??
    "Receptionist";
  const phoneNumber =
    (source as ApiUser).phoneNumber ??
    (source as ApiUser).phone ??
    (source as User).phone ??
    null;
  const isEmailVerified =
    (source as ApiUser).isEmailVerified ??
    (source as ApiUser).emailVerified ??
    (source as User).isEmailVerified ??
    false;
  const isActive =
    (source as ApiUser).isActive ??
    (source as ApiUser).status ??
    (source as User).isActive ??
    (source as User).status ??
    false;

  const id = (source as ApiUser).id ?? (source as User).id ?? "unsigned-user";

  return {
    id,
    email,
    fullName,
    role: roleValue,
    isEmailVerified,
    emailVerified: isEmailVerified,
    isActive,
    createdAt:
      (source as ApiUser).createdAt ?? (source as User).createdAt ?? "",
    updatedAt:
      (source as ApiUser).updatedAt ?? (source as User).updatedAt ?? null,
    phoneNumber: phoneNumber,
    phone: phoneNumber,
    userName: userName ?? null,
    age: (source as ApiUser).age ?? (source as User).age ?? null,
    location: (source as ApiUser).location ?? (source as User).location ?? null,
    country: (source as ApiUser).country ?? (source as User).country ?? null,
    image: (source as ApiUser).image ?? (source as User).image ?? null,
    status: isActive,
    roleId: (source as ApiUser).roleId ?? (source as User).roleId ?? undefined,
    roleName:
      (source as ApiUser).roleName ?? (source as User).roleName ?? roleValue,
    doctorSpecialization:
      (source as ApiUser).doctorSpecialization ??
      (source as User).doctorSpecialization ??
      null,
  };
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userPermissions, setUserPermissions] =
    useState<RolePermissions | null>(null);

  const isAuthenticated = !!user;

  // Helper function to update user role and permissions
  const updateUserRoleAndPermissions = (userData: User | ApiUser) => {
    if (!userData) {
      setUserRole(null);
      setUserPermissions(null);
      return;
    }

    const roleString = ((userData as User).role ||
      (userData as ApiUser).roleName ||
      "Receptionist") as string;

    // Map role names from API to our UserRole type
    // Handle various possible role name formats from API
    let mappedRole: UserRole = "Receptionist";

    const roleLower = roleString.toLowerCase().trim();

    if (
      roleLower.includes("admin") ||
      roleLower === "administrator" ||
      roleString === "Admin"
    ) {
      mappedRole = "Admin";
    } else if (roleLower.includes("doctor") || roleString === "Doctor") {
      mappedRole = "Doctor";
    } else if (
      (roleLower.includes("lab") && roleLower.includes("technician")) ||
      roleLower.includes("lab technician") ||
      roleString === "Lab Technician"
    ) {
      mappedRole = "Lab Technician";
    } else if (
      roleLower.includes("receptionist") ||
      roleString === "Receptionist"
    ) {
      mappedRole = "Receptionist";
    }

    // Validate and set role
    if (ROLE_PERMISSIONS[mappedRole]) {
      setUserRole(mappedRole);
      setUserPermissions(ROLE_PERMISSIONS[mappedRole]);
    } else {
      // Default to Receptionist if role not recognized
      console.warn(`Unknown role: ${roleString}, defaulting to Receptionist`);
      setUserRole("Receptionist");
      setUserPermissions(ROLE_PERMISSIONS["Receptionist"]);
    }
  };

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const userData = localStorage.getItem("user");

        if (token && userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          updateUserRoleAndPermissions(parsedUser);

          // Try to refresh user data in background
          try {
            const response = await api.user.getCurrentUser();
            if (response.data) {
              const userData = mapUserResponse(
                response.data,
                (parsedUser as User | null)?.email ?? ""
              );
              setUser(userData);
              updateUserRoleAndPermissions(userData);
              localStorage.setItem("user", JSON.stringify(userData));
            }
          } catch (error) {
            console.log(
              "Could not refresh user data, using cached data:",
              error
            );
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string, mobile?: string) => {
    try {
      const response = await api.auth.login({ email, password, mobile });

      if (!response.data) {
        throw new Error("Invalid response from server");
      }

      // Check if account is banned
      if (response.isBanned) {
        throw new Error("ACCOUNT_BANNED");
      }

      // Check if email verification is required
      // Only check if requiresVerification is true (or undefined for backward compatibility)
      if (response.requiresVerification !== false) {
        // Check emailVerified at top level of data or in user object
        const emailVerified =
          response.data.emailVerified ??
          response.data.user?.emailVerified ??
          response.data.user?.isEmailVerified;
        if (!emailVerified) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }
      }

      // Check if we have valid tokens
      const token = response.data.token;
      const refreshToken = response.data.refreshToken;

      if (!token || !refreshToken) {
        throw new Error("INVALID_TOKENS");
      }

      // Transform API user data to our User interface
      const userData = mapUserResponse(response.data.user, email);

      // Store tokens and user data
      localStorage.setItem("authToken", token);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(userData));

      setUser(userData);
      updateUserRoleAndPermissions(userData);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      setUser(null);
      setUserRole(null);
      setUserPermissions(null);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      const response = await api.user.updateProfile({
        fullName: data.fullName,
        phoneNumber: data.phoneNumber ?? undefined,
      });
      if (response.data) {
        const userData = mapUserResponse(
          response.data,
          user?.email || response.data.email || ""
        );
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      }
    } catch (error) {
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const response = await api.user.getCurrentUser();
      if (response.data) {
        const userData = mapUserResponse(
          response.data,
          user?.email || response.data.email || ""
        );
        setUser(userData);
        updateUserRoleAndPermissions(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      }
    } catch (error) {
      console.error("Refresh user error:", error);
      throw error;
    }
  };

  // Helper functions for role-based access control
  const hasPermission = (permission: keyof RolePermissions): boolean => {
    return userPermissions ? userPermissions[permission] : false;
  };

  const hasRole = (role: UserRole): boolean => {
    return userRole === role;
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    userRole,
    userPermissions,
    login,
    logout,
    updateProfile,
    refreshUser,
    hasPermission,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
