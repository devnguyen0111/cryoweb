import { createFileRoute, Link, useNavigate, useSearch } from '@tanstack/react-router'
import { Button } from '@workspace/ui/components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { FlaskConical, CheckCircle, Mail, ArrowRight } from 'lucide-react'
import { z } from 'zod'
import { useEffect } from 'react'

export const Route = createFileRoute('/verification-success')({
    component: VerificationSuccessPage,
    validateSearch: z.object({
        email: z.string().email(),
    }),
})

function VerificationSuccessPage() {
    const navigate = useNavigate()
    const search = useSearch({ from: '/verification-success' })

    // Auto-redirect after 3 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            handleContinueToLogin()
        }, 3000)

        return () => clearTimeout(timer)
    }, [])

    const handleContinueToLogin = () => {
        navigate({
            to: '/login',
            search: {
                verified: 'true',
                email: search.email,
            },
        })
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 via-background to-emerald-50 dark:from-green-950/20 dark:via-background dark:to-emerald-950/20">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                        <FlaskConical className="h-8 w-8 text-white" />
                    </div>
                    <span className="font-bold text-2xl bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent dark:from-green-400 dark:to-emerald-400">
                        CryoBank
                    </span>
                </div>

                <Card className="shadow-xl border-0 dark:border dark:border-border">
                    <CardHeader className="space-y-1 text-center">
                        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full flex items-center justify-center mb-4 animate-bounce">
                            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-green-600 dark:text-green-400">
                            Email Verified!
                        </CardTitle>
                        <CardDescription className="text-base">
                            Your email <span className="font-medium text-foreground">{search.email}</span> has been
                            successfully verified.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Success Message */}
                        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <div className="text-center space-y-2">
                                <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                                    Welcome to CryoBank!
                                </p>
                                <p className="text-sm text-green-700 dark:text-green-300">
                                    You can now access all features of your account.
                                </p>
                            </div>
                        </div>

                        {/* Continue Button */}
                        <Button
                            onClick={handleContinueToLogin}
                            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                            size="lg"
                        >
                            Continue to Login
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>

                        {/* Additional Info */}
                        <div className="text-center">
                            <p className="text-xs text-muted-foreground">Redirecting automatically in 3 seconds...</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Back to Home */}
                <div className="mt-6 text-center">
                    <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                        ← Back to home
                    </Link>
                </div>
            </div>
        </div>
    )
}
