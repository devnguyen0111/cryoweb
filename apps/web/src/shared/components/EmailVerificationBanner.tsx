import React from 'react'
import { Link } from '@tanstack/react-router'
import { Button } from '@workspace/ui/components/Button'
import { AlertTriangle, Mail, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useState } from 'react'

export const EmailVerificationBanner = () => {
    const { user, resendVerification } = useAuth()
    const [isResending, setIsResending] = useState(false)
    const [isDismissed, setIsDismissed] = useState(false)

    // Don't show banner if email is verified or user is not logged in
    if (!user || user.isEmailVerified || isDismissed) {
        return null
    }

    const handleResendVerification = async () => {
        if (!user.email) return

        setIsResending(true)
        try {
            await resendVerification(user.email)
        } catch (error) {
            console.error('Failed to resend verification:', error)
        } finally {
            setIsResending(false)
        }
    }

    return (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
            <div className="container mx-auto px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                        <div>
                            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                Email chưa được xác nhận
                            </p>
                            <p className="text-xs text-yellow-700 dark:text-yellow-300">
                                Vui lòng xác nhận email để sử dụng đầy đủ các tính năng.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleResendVerification}
                            disabled={isResending}
                            className="text-yellow-800 border-yellow-300 hover:bg-yellow-100 dark:text-yellow-200 dark:border-yellow-600 dark:hover:bg-yellow-800/30"
                        >
                            {isResending ? (
                                <>
                                    <Mail className="h-3 w-3 mr-1 animate-pulse" />
                                    Đang gửi...
                                </>
                            ) : (
                                <>
                                    <Mail className="h-3 w-3 mr-1" />
                                    Gửi lại
                                </>
                            )}
                        </Button>
                        <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="text-yellow-800 border-yellow-300 hover:bg-yellow-100 dark:text-yellow-200 dark:border-yellow-600 dark:hover:bg-yellow-800/30"
                        >
                            <Link to="/email-verification" search={{ from: 'manual', email: user.email }}>
                                Xác nhận
                            </Link>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsDismissed(true)}
                            className="text-yellow-600 hover:bg-yellow-100 dark:text-yellow-400 dark:hover:bg-yellow-800/30"
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
