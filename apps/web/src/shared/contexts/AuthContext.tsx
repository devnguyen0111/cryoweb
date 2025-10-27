import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { api } from '../lib/api'
import { User, UserRole, RolePermissions, ROLE_PERMISSIONS } from '../types/auth'
import type { User as ApiUser } from '@workspace/lib/api'

interface AuthContextType {
    user: User | null
    isAuthenticated: boolean
    isLoading: boolean
    userRole: UserRole | null
    userPermissions: RolePermissions | null
    login: (email: string, password: string) => Promise<void>
    register: (data: { fullName: string; email: string; phone: string; password: string }) => Promise<void>
    logout: () => Promise<void>
    updateProfile: (data: Partial<User>) => Promise<void>
    refreshUser: () => Promise<void>
    verifyEmail: (email: string, code: string) => Promise<void>
    resendVerification: (email: string) => Promise<void>
    hasPermission: (permission: keyof RolePermissions) => boolean
    hasRole: (role: UserRole) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
    children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [userRole, setUserRole] = useState<UserRole | null>(null)
    const [userPermissions, setUserPermissions] = useState<RolePermissions | null>(null)

    const isAuthenticated = !!user

    // Helper function to update user role and permissions
    const updateUserRoleAndPermissions = (userData: User | ApiUser) => {
        if (!userData) {
            console.warn('User data is missing:', userData)
            setUserRole(null)
            setUserPermissions(null)
            return
        }

        // If role is missing, set default role
        if (!userData.role) {
            console.warn('Role is missing from user data, setting default role:', userData)
            setUserRole('Receptionist') // Default role for new users
            setUserPermissions(ROLE_PERMISSIONS['Receptionist'])
            return
        }

        const roleString = userData.role as string
        const role = roleString as UserRole

        // Validate role exists in ROLE_PERMISSIONS
        if (!ROLE_PERMISSIONS[role]) {
            console.warn('Invalid role:', roleString, 'Available roles:', Object.keys(ROLE_PERMISSIONS))
            // Set default role for unknown roles
            setUserRole('Receptionist') // Default role
            setUserPermissions(ROLE_PERMISSIONS['Receptionist'])
            return
        }

        setUserRole(role)
        setUserPermissions(ROLE_PERMISSIONS[role])
    }

    // Initialize auth state from localStorage
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const token = localStorage.getItem('authToken')
                const userData = localStorage.getItem('user')

                if (token && userData) {
                    const parsedUser = JSON.parse(userData)
                    setUser(parsedUser)
                    updateUserRoleAndPermissions(parsedUser)

                    // Optionally verify token with backend
                    try {
                        const currentUser = await api.auth.getCurrentUser()
                        // Convert ApiUser to User if needed
                        const userData: User = {
                            id: currentUser.id,
                            email: currentUser.email,
                            fullName: currentUser.fullName || currentUser.userName || currentUser.email.split('@')[0],
                            role: currentUser.role || currentUser.roleName,
                            phone: currentUser.phone || '',
                            createdAt: currentUser.createdAt,
                            updatedAt: currentUser.updatedAt,
                            isEmailVerified: currentUser.isEmailVerified,
                            status: currentUser.status,
                            userName: currentUser.userName,
                            age: currentUser.age,
                            location: currentUser.location,
                            country: currentUser.country,
                            image: currentUser.image,
                            roleId: currentUser.roleId,
                            roleName: currentUser.roleName,
                        }
                        setUser(userData)
                        updateUserRoleAndPermissions(userData)
                    } catch (error) {
                        // Token might be expired, clear auth state
                        localStorage.removeItem('authToken')
                        localStorage.removeItem('refreshToken')
                        localStorage.removeItem('user')
                        setUser(null)
                        setUserRole(null)
                        setUserPermissions(null)
                    }
                }
            } catch (error) {
                console.error('Auth initialization error:', error)
                // Clear invalid auth data
                localStorage.removeItem('authToken')
                localStorage.removeItem('refreshToken')
                localStorage.removeItem('user')
                setUser(null)
            } finally {
                setIsLoading(false)
            }
        }

        initializeAuth()
    }, [])

    const login = async (email: string, password: string) => {
        try {
            const response = await api.auth.login({ email, password })

            // Debug logging
            console.log('Login response:', response)
            console.log('User data:', response.data.user)

            // Check if account is banned
            if (response.isBanned) {
                throw new Error('ACCOUNT_BANNED')
            }

            // Check if email verification is required
            if (response.requiresVerification || !response.data.emailVerified) {
                // Don't store tokens if email is not verified
                // Redirect to email verification page
                throw new Error('EMAIL_NOT_VERIFIED')
            }

            // Check if we have valid tokens
            if (!response.data.token || !response.data.refreshToken) {
                throw new Error('INVALID_TOKENS')
            }

            // Transform API user data to our User interface
            const userData: User = {
                id: response.data.user.id,
                email: response.data.user.email,
                fullName: response.data.user.userName || response.data.user.email.split('@')[0],
                role: response.data.user.roleName,
                phone: response.data.user.phone || '',
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
            }

            console.log('Login - User data to store:', userData)
            console.log('Login - User role:', userData.role, 'Role name:', userData.roleName)

            // Store tokens and user data
            localStorage.setItem('authToken', response.data.token)
            localStorage.setItem('refreshToken', response.data.refreshToken)
            localStorage.setItem('user', JSON.stringify(userData))

            setUser(userData)
            updateUserRoleAndPermissions(userData)
        } catch (error) {
            throw error
        }
    }

    const register = async (data: { fullName: string; email: string; phone: string; password: string }) => {
        try {
            const response = await api.auth.register(data)

            // Debug logging
            console.log('Register response:', response)
            console.log('User data:', response.data?.user)

            // Check if account is banned
            if (response.isBanned) {
                throw new Error('ACCOUNT_BANNED')
            }

            // Check if we have valid tokens (registration might not return tokens if email verification is required)
            if (!response.data?.token || !response.data?.refreshToken) {
                // If no tokens, user needs to verify email first
                if (response.data?.user) {
                    // Transform API user data to our User interface
                    const userData: User = {
                        id: response.data.user.id,
                        email: response.data.user.email,
                        fullName: response.data.user.userName || data.fullName,
                        role: response.data.user.roleName,
                        phone: response.data.user.phone || data.phone,
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
                    }
                    setUser(userData)
                    updateUserRoleAndPermissions(userData)
                }
                throw new Error('EMAIL_VERIFICATION_REQUIRED')
            }

            // Transform API user data to our User interface
            const userData: User = {
                id: response.data.user.id,
                email: response.data.user.email,
                fullName: response.data.user.userName || data.fullName,
                role: response.data.user.roleName,
                phone: response.data.user.phone || data.phone,
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
            }

            // Store tokens and user data
            localStorage.setItem('authToken', response.data.token)
            localStorage.setItem('refreshToken', response.data.refreshToken)
            localStorage.setItem('user', JSON.stringify(userData))

            setUser(userData)
            updateUserRoleAndPermissions(userData)
        } catch (error) {
            throw error
        }
    }

    const logout = async () => {
        try {
            await api.auth.logout()
        } catch (error) {
            console.error('Logout error:', error)
        } finally {
            // Clear auth state regardless of API call success
            localStorage.removeItem('authToken')
            localStorage.removeItem('refreshToken')
            localStorage.removeItem('user')
            setUser(null)
            setUserRole(null)
            setUserPermissions(null)
        }
    }

    const updateProfile = async (data: Partial<User | ApiUser>) => {
        try {
            const updatedUser = await api.auth.updateProfile(data)
            // Convert ApiUser to User if needed
            const userData: User = {
                id: updatedUser.id,
                email: updatedUser.email,
                fullName: updatedUser.fullName || updatedUser.userName || updatedUser.email.split('@')[0],
                role: updatedUser.role || updatedUser.roleName,
                phone: updatedUser.phone || '',
                createdAt: updatedUser.createdAt,
                updatedAt: updatedUser.updatedAt,
                isEmailVerified: updatedUser.isEmailVerified,
                status: updatedUser.status,
                userName: updatedUser.userName,
                age: updatedUser.age,
                location: updatedUser.location,
                country: updatedUser.country,
                image: updatedUser.image,
                roleId: updatedUser.roleId,
                roleName: updatedUser.roleName,
            }
            setUser(userData)
            localStorage.setItem('user', JSON.stringify(userData))
        } catch (error) {
            throw error
        }
    }

    const refreshUser = async () => {
        try {
            const currentUser = await api.auth.getCurrentUser()
            // Convert ApiUser to User if needed
            const userData: User = {
                id: currentUser.id,
                email: currentUser.email,
                fullName: currentUser.fullName || currentUser.userName || currentUser.email.split('@')[0],
                role: currentUser.role || currentUser.roleName,
                phone: currentUser.phone || '',
                createdAt: currentUser.createdAt,
                updatedAt: currentUser.updatedAt,
                isEmailVerified: currentUser.isEmailVerified,
                status: currentUser.status,
                userName: currentUser.userName,
                age: currentUser.age,
                location: currentUser.location,
                country: currentUser.country,
                image: currentUser.image,
                roleId: currentUser.roleId,
                roleName: currentUser.roleName,
            }
            setUser(userData)
            localStorage.setItem('user', JSON.stringify(userData))
        } catch (error) {
            console.error('Refresh user error:', error)
            throw error
        }
    }

    const verifyEmail = async (email: string, code: string) => {
        try {
            await api.auth.verifyEmail(email, code)
        } catch (error) {
            throw error
        }
    }

    const resendVerification = async (email: string) => {
        try {
            await api.auth.resendVerification(email)
        } catch (error) {
            throw error
        }
    }

    // Helper functions for role-based access control
    const hasPermission = (permission: keyof RolePermissions): boolean => {
        return userPermissions ? userPermissions[permission] : false
    }

    const hasRole = (role: UserRole): boolean => {
        return userRole === role
    }

    const value: AuthContextType = {
        user,
        isAuthenticated,
        isLoading,
        userRole,
        userPermissions,
        login,
        register,
        logout,
        updateProfile,
        refreshUser,
        verifyEmail,
        resendVerification,
        hasPermission,
        hasRole,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
