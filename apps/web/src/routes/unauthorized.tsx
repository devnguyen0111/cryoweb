import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@workspace/ui/components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { HeartPulse, Shield, ArrowLeft } from 'lucide-react'

export const Route = createFileRoute('/unauthorized')({
    component: UnauthorizedPage,
})

function UnauthorizedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-primary/5">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    <HeartPulse className="h-10 w-10 text-primary" />
                    <span className="font-bold text-2xl">CryoBank</span>
                </div>

                <Card>
                    <CardHeader className="space-y-1 text-center">
                        <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                            <Shield className="h-8 w-8 text-red-600 dark:text-red-400" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-red-600 dark:text-red-400">
                            Access Denied
                        </CardTitle>
                        <CardDescription className="text-base">
                            You don't have permission to access this page.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Error Message */}
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <div className="flex items-start gap-3">
                                <Shield className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                                <div>
                                    <p className="text-sm text-red-800 dark:text-red-200">
                                        Your account doesn't have the required permissions to view this content. Please
                                        contact your administrator if you believe this is an error.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <Button asChild className="w-full" size="lg">
                                <Link to="/dashboard">Go to Dashboard</Link>
                            </Button>

                            <Button asChild variant="outline" className="w-full">
                                <Link to="/login">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back to Login
                                </Link>
                            </Button>
                        </div>

                        {/* Help Text */}
                        <div className="text-center text-xs text-muted-foreground">
                            <p>If you need access to this page, please contact your system administrator.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
