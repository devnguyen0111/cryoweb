import { createFileRoute, Link, useNavigate, useSearch } from '@tanstack/react-router'
import { Button } from '@workspace/ui/components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { FlaskConical, Mail, ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react'
import { toast } from '@workspace/ui/components/Sonner'
import { useAuth } from '../shared/contexts/AuthContext'
import { useState } from 'react'
import { z } from 'zod'

export const Route = createFileRoute('/email-not-verified')({
    component: EmailNotVerifiedPage,
    validateSearch: z.object({
        email: z.string().email(),
    }),
})

function EmailNotVerifiedPage() {
    const navigate = useNavigate()
    const search = useSearch({ from: '/email-not-verified' })
    const { resendVerification } = useAuth()
    const [isResending, setIsResending] = useState(false)

    const handleResendCode = async () => {
        try {
            setIsResending(true)
            await resendVerification(search.email)

            toast.success({
                title: 'Verification code sent!',
                description: 'A new verification code has been sent to your email.',
            })

            // Navigate to verify email page
            navigate({
                to: '/verify-email',
                search: { email: search.email },
            })
        } catch (error: any) {
            const errorMessage =
                error.response?.data?.message || 'Failed to resend verification code. Please try again.'

            toast.error({
                title: 'Resend failed',
                description: errorMessage,
            })
            console.error('Resend error:', error)
        } finally {
            setIsResending(false)
        }
    }

    const handleGoToVerify = () => {
        navigate({
            to: '/verify-email',
            search: { email: search.email },
        })
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 via-background to-orange-50 dark:from-amber-950/20 dark:via-background dark:to-orange-950/20">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
                        <FlaskConical className="h-8 w-8 text-white" />
                    </div>
                    <span className="font-bold text-2xl bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent dark:from-amber-400 dark:to-orange-400">
                        CryoBank
                    </span>
                </div>

                <Card className="shadow-xl border-0 dark:border dark:border-border">
                    <CardHeader className="space-y-1 text-center">
                        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-full flex items-center justify-center mb-4">
                            <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                            Email Not Verified
                        </CardTitle>
                        <CardDescription className="text-base">
                            Your email <span className="font-medium text-foreground">{search.email}</span> has not been
                            verified yet.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Warning Message */}
                        <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                            <div className="flex items-start gap-3">
                                <Mail className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm text-amber-800 dark:text-amber-200">
                                        Please check your email and enter the verification code to activate your
                                        account.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <Button
                                onClick={handleGoToVerify}
                                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                                size="lg"
                            >
                                Enter Verification Code
                            </Button>

                            <Button
                                onClick={handleResendCode}
                                variant="outline"
                                className="w-full"
                                isDisabled={isResending}
                            >
                                {isResending ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    'Resend Verification Code'
                                )}
                            </Button>
                        </div>

                        {/* Help Text */}
                        <div className="text-center text-xs text-muted-foreground">
                            <p>
                                Didn't receive the email? Check your spam folder or try resending the verification code.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Back to Login */}
                <div className="mt-6 text-center">
                    <Link
                        to="/login"
                        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back to login
                    </Link>
                </div>
            </div>
        </div>
    )
}
