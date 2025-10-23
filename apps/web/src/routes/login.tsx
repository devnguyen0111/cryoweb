import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Button } from '@workspace/ui/components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { Input, PasswordInput } from '@workspace/ui/components/Textfield'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@workspace/ui/components/Form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { HeartPulse } from 'lucide-react'
import { toast } from '@workspace/ui/components/Sonner'

export const Route = createFileRoute('/login')({
    component: LoginPage,
})

// Validation schema
const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

function LoginPage() {
    const navigate = useNavigate()
    const form = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    })

    const onSubmit = async (data: LoginFormData) => {
        try {
            // TODO: Replace with actual API call
            // Example: await authApi.login(data.email, data.password)

            console.log('Login data:', data)

            // Simulated API call
            await new Promise(resolve => setTimeout(resolve, 1000))

            // TODO: Store authentication token
            // Example: localStorage.setItem('authToken', response.token)

            toast.success({
                title: 'Login successful',
                description: 'Welcome back!',
            })

            // TODO: Navigate to dashboard after successful login
            // navigate({ to: '/dashboard' })
        } catch (error) {
            toast.error({
                title: 'Login failed',
                description: 'Invalid email or password. Please try again.',
            })
            console.error('Login error:', error)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-primary/5">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    <HeartPulse className="h-10 w-10 text-primary" />
                    <span className="font-bold text-2xl">CryoBank</span>
                </div>

                <Card>
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
                        <CardDescription className="text-center">
                            Enter your credentials to access your account
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input placeholder="name@example.com" type="email" {...field} />
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
                                                <a
                                                    href="#"
                                                    className="text-xs text-primary hover:underline"
                                                    onClick={e => {
                                                        e.preventDefault()
                                                        // TODO: Navigate to forgot password page when implemented
                                                        toast.info({
                                                            title: 'Coming Soon',
                                                            description:
                                                                'Password reset functionality will be available soon.',
                                                        })
                                                    }}
                                                >
                                                    Forgot password?
                                                </a>
                                            </div>
                                            <FormControl>
                                                <PasswordInput placeholder="Enter your password" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button
                                    type="submit"
                                    className="w-full"
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
