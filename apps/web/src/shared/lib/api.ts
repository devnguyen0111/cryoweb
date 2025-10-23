import axios from 'axios'
import { Api } from '@workspace/lib/api'

/**
 * API Base URL
 * TODO: Replace with your actual API URL
 * You can use environment variables for different environments
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

/**
 * Axios instance with interceptors for authentication and error handling
 */
const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
})

/**
 * Request interceptor to add authentication token
 */
axiosInstance.interceptors.request.use(
    config => {
        // TODO: Get token from your auth state management (localStorage, zustand, etc.)
        const token = localStorage.getItem('authToken')

        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }

        return config
    },
    error => {
        return Promise.reject(error)
    },
)

/**
 * Response interceptor for error handling and token refresh
 */
axiosInstance.interceptors.response.use(
    response => {
        return response
    },
    async error => {
        const originalRequest = error.config

        // Handle 401 Unauthorized errors
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true

            try {
                // TODO: Implement token refresh logic
                const refreshToken = localStorage.getItem('refreshToken')

                if (refreshToken) {
                    // Uncomment when API is ready
                    // const response = await api.auth.refreshToken(refreshToken)
                    // localStorage.setItem('authToken', response.token)
                    // localStorage.setItem('refreshToken', response.refreshToken)
                    // originalRequest.headers.Authorization = `Bearer ${response.token}`
                    // return axiosInstance(originalRequest)
                }
            } catch (refreshError) {
                // TODO: Redirect to login or show session expired message
                localStorage.removeItem('authToken')
                localStorage.removeItem('refreshToken')
                window.location.href = '/login'
                return Promise.reject(refreshError)
            }
        }

        return Promise.reject(error)
    },
)

/**
 * API instance for the application
 * Use this instance throughout the app to make API calls
 *
 * @example
 * import { api } from '@/shared/lib/api'
 *
 * const response = await api.auth.login({ email: 'user@example.com', password: 'password' })
 * const patients = await api.patients.getPatients({ page: 1, limit: 10 })
 */
export const api = new Api(axiosInstance)

/**
 * Export axios instance if you need to make custom requests
 */
export { axiosInstance }
