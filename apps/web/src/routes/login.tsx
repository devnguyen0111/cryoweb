import { createFileRoute, Link, useNavigate, useSearch } from '@tanstack/react-router'
import { Button } from '@workspace/ui/components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { Input, PasswordInput } from '@workspace/ui/components/Textfield'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@workspace/ui/components/Form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FlaskConical, CheckCircle } from 'lucide-react'
import { toast } from '@workspace/ui/components/Sonner'
import { useAuth } from '../shared/contexts/AuthContext'
import { useEffect } from 'react'
import { getDefaultRouteByRole, normalizeRoleName } from '../shared/utils/roleUtils'

export const Route = createFileRoute('/login')({
    component: LoginPage,
    validateSearch: z.object({
        verified: z.string().optional(),
        email: z.string().optional(),
        redirect: z.string().optional(),
    }),
})

// Validation schema
const loginSchema = z.object({
    email: z.string().min(1, 'Email is required').email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

function LoginPage() {
    const navigate = useNavigate()
    const search = useSearch({ from: '/login' })
    const { login } = useAuth()
    const form = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: search.email || '',
            password: '',
        },
    })

    // Show success message if email was just verified
    useEffect(() => {
        if (search.verified === 'true') {
            toast.success({
                title: 'Email verified successfully!',
                description: 'You can now log in to your account.',
            })
        }
    }, [search.verified])

    const onSubmit = async (data: LoginFormData) => {
        try {
            await login(data.email, data.password)

            toast.success({
                title: 'Login successful',
                description: 'Welcome back!',
            })

            // Get user role and redirect to appropriate page
            const userData = localStorage.getItem('user')
            if (userData) {
                const user = JSON.parse(userData)
                // Normalize role name to handle API variations
                const userRole = normalizeRoleName(user.role || user.roleName || 'User')

                // Check for redirect parameter or use default route
                const redirectTo = search.redirect || getDefaultRouteByRole(userRole)

                console.log('Login redirect:', { userRole, redirectTo })
                navigate({ to: redirectTo })
            } else {
                // Fallback to home
                navigate({ to: '/' })
            }
        } catch (error: any) {
            // Handle email not verified case
            if (error.message === 'EMAIL_NOT_VERIFIED') {
                navigate({
                    to: '/email-not-verified',
                    search: { email: data.email },
                })
                return
            }

            // Handle account banned case
            if (error.message === 'ACCOUNT_BANNED') {
                toast.error({
                    title: 'Account Banned',
                    description: 'Your account has been banned. Please contact support for assistance.',
                })
                return
            }

            // Handle invalid tokens case
            if (error.message === 'INVALID_TOKENS') {
                toast.error({
                    title: 'Authentication Error',
                    description: 'Invalid authentication tokens received. Please try again.',
                })
                return
            }

            const errorMessage =
                error.response?.data?.message ||
                'Invalid email or password. Please check your credentials and try again.'

            toast.error({
                title: 'Login failed',
                description: errorMessage,
            })
            console.error('Login error:', error)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-background to-indigo-50 dark:from-blue-950/20 dark:via-background dark:to-indigo-950/20">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                        <FlaskConical className="h-8 w-8 text-white" />
                    </div>
                    <span className="font-bold text-2xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
                        CryoBank
                    </span>
                </div>

                <Card className="shadow-xl border-0 dark:border dark:border-border">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
                        <CardDescription className="text-center">
                            Enter your credentials to access your account
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Email Verification Success Message */}
                        {search.verified === 'true' && (
                            <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                                    <CheckCircle className="h-5 w-5" />
                                    <span className="font-medium">Email verified successfully!</span>
                                </div>
                                <p className="text-sm text-green-600 dark:text-green-300 mt-1">
                                    You can now log in to your account.
                                </p>
                            </div>
                        )}

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="name@example.com"
                                                    type="email"
                                                    autoComplete="email"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex items-center justify-between">
                                                <FormLabel>Password</FormLabel>
                                                <Link
                                                    to="/forgot-password"
                                                    className="text-xs text-primary hover:underline"
                                                >
                                                    Forgot password?
                                                </Link>
                                            </div>
                                            <FormControl>
                                                <PasswordInput
                                                    placeholder="Enter your password"
                                                    autoComplete="current-password"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                                    size="lg"
                                    isDisabled={form.formState.isSubmitting}
                                >
                                    {form.formState.isSubmitting ? 'Signing in...' : 'Sign In'}
                                </Button>
                            </form>
                        </Form>

                        <div className="mt-6">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-card px-2 text-muted-foreground">Or</span>
                                </div>
                            </div>

                            <div className="mt-6 text-center text-sm">
                                <span className="text-muted-foreground">Don't have an account? </span>
                                <Link to="/register" className="text-primary font-medium hover:underline">
                                    Sign up
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Back to home */}
                <div className="mt-6 text-center">
                    <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                        ← Back to home
                    </Link>
                </div>
            </div>
        </div>
    )
}
