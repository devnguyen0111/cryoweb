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
  login: (email: string, password: string, mobile?: boolean) => Promise<void>;
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
            const currentUser = await api.auth.getCurrentUser();
            const userData: User = {
              id: currentUser.id,
              email: currentUser.email || "",
              fullName:
                currentUser.userName ||
                currentUser.email?.split("@")[0] ||
                "User",
              role: currentUser.roleName || (currentUser as any).role,
              phone: currentUser.phone || "",
              createdAt: currentUser.createdAt,
              updatedAt: currentUser.updatedAt,
              isEmailVerified: currentUser.emailVerified,
              status: currentUser.status,
              userName: currentUser.userName,
              age: currentUser.age,
              location: currentUser.location,
              country: currentUser.country,
              image: currentUser.image,
              roleId: currentUser.roleId,
              roleName: currentUser.roleName,
            };
            setUser(userData);
            updateUserRoleAndPermissions(userData);
            localStorage.setItem("user", JSON.stringify(userData));
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

  const login = async (email: string, password: string, mobile?: boolean) => {
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
      if (response.requiresVerification || !response.data.emailVerified) {
        throw new Error("EMAIL_NOT_VERIFIED");
      }

      // Check if we have valid tokens
      if (!response.data.token || !response.data.refreshToken) {
        throw new Error("INVALID_TOKENS");
      }

      // Transform API user data to our User interface
      const userData: User = {
        id: response.data.user.id,
        email: response.data.user.email || email,
        fullName: response.data.user.userName || email.split("@")[0],
        role: response.data.user.roleName,
        phone: response.data.user.phone || "",
        createdAt: response.data.user.createdAt,
        updatedAt: response.data.user.updatedAt,
        isEmailVerified: response.data.user.emailVerified,
        status: response.data.user.status,
        userName: response.data.user.userName,
        age: response.data.user.age,
        location: response.data.user.location,
        country: response.data.user.country,
        image: response.data.user.image,
        roleId: response.data.user.roleId,
        roleName: response.data.user.roleName,
      };

      // Store tokens and user data
      localStorage.setItem("authToken", response.data.token);
      localStorage.setItem("refreshToken", response.data.refreshToken);
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
      const updatedUser = await api.auth.updateProfile(data);
      const userData: User = {
        id: updatedUser.id,
        email: updatedUser.email || user?.email || "",
        fullName:
          updatedUser.userName ||
          updatedUser.email?.split("@")[0] ||
          user?.fullName,
        role: updatedUser.roleName || (updatedUser as any).role,
        phone: updatedUser.phone || "",
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
        isEmailVerified: updatedUser.emailVerified,
        status: updatedUser.status,
        userName: updatedUser.userName,
        age: updatedUser.age,
        location: updatedUser.location,
        country: updatedUser.country,
        image: updatedUser.image,
        roleId: updatedUser.roleId,
        roleName: updatedUser.roleName,
      };
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
    } catch (error) {
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const currentUser = await api.auth.getCurrentUser();
      const userData: User = {
        id: currentUser.id,
        email: currentUser.email || "",
        fullName:
          currentUser.userName || currentUser.email?.split("@")[0] || "User",
        role: currentUser.roleName || (currentUser as any).role,
        phone: currentUser.phone || "",
        createdAt: currentUser.createdAt,
        updatedAt: currentUser.updatedAt,
        isEmailVerified: currentUser.emailVerified,
        status: currentUser.status,
        userName: currentUser.userName,
        age: currentUser.age,
        location: currentUser.location,
        country: currentUser.country,
        image: currentUser.image,
        roleId: currentUser.roleId,
        roleName: currentUser.roleName,
      };
      setUser(userData);
      updateUserRoleAndPermissions(userData);
      localStorage.setItem("user", JSON.stringify(userData));
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
