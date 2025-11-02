import { toast as sonnerToast } from 'sonner'

/**
 * Toast notification utilities using Sonner
 * Provides consistent toast notifications across the application
 */

export const toast = {
    /**
     * Show a success toast notification
     */
    success: (message: string, description?: string) => {
        sonnerToast.success(message, {
            description,
            duration: 4000,
        })
    },

    /**
     * Show an error toast notification
     */
    error: (message: string, description?: string) => {
        sonnerToast.error(message, {
            description,
            duration: 5000,
        })
    },

    /**
     * Show a warning toast notification
     */
    warning: (message: string, description?: string) => {
        sonnerToast.warning(message, {
            description,
            duration: 4000,
        })
    },

    /**
     * Show an info toast notification
     */
    info: (message: string, description?: string) => {
        sonnerToast.info(message, {
            description,
            duration: 4000,
        })
    },

    /**
     * Show a loading toast notification
     * Returns a toast ID that can be used to dismiss or update the toast
     */
    loading: (message: string, description?: string) => {
        return sonnerToast.loading(message, {
            description,
        })
    },

    /**
     * Show a promise toast that automatically updates based on promise state
     */
    promise: <T>(
        promise: Promise<T>,
        messages: {
            loading: string
            success: string | ((data: T) => string)
            error: string | ((error: Error) => string)
        },
    ) => {
        return sonnerToast.promise(promise, messages)
    },

    /**
     * Dismiss a specific toast or all toasts
     */
    dismiss: (toastId?: string | number) => {
        sonnerToast.dismiss(toastId)
    },
}

/**
 * Handle API errors and show appropriate toast notifications
 */
export const handleApiError = (error: unknown, fallbackMessage = 'An error occurred') => {
    let errorMessage = fallbackMessage
    let description: string | undefined

    if (error instanceof Error) {
        errorMessage = error.message || fallbackMessage
    } else if (typeof error === 'object' && error !== null) {
        const apiError = error as { response?: { data?: { message?: string; error?: string } } }
        errorMessage = apiError.response?.data?.message || apiError.response?.data?.error || fallbackMessage
    }

    toast.error(errorMessage, description)
}

/**
 * Show a success toast for CRUD operations
 */
export const showCrudSuccess = {
    create: (entityName: string) => toast.success('Created successfully', `${entityName} has been created`),
    update: (entityName: string) => toast.success('Updated successfully', `${entityName} has been updated`),
    delete: (entityName: string) => toast.success('Deleted successfully', `${entityName} has been deleted`),
    sign: (entityName: string) => toast.success('Signed successfully', `${entityName} has been signed`),
    send: (entityName: string) => toast.success('Sent successfully', `${entityName} has been sent`),
}
