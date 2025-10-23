import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Button } from '@workspace/ui/components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { Input, PasswordInput } from '@workspace/ui/components/Textfield'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@workspace/ui/components/Form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { HeartPulse } from 'lucide-react'
import { toast } from '@workspace/ui/components/Sonner'

export const Route = createFileRoute('/register')({
    component: RegisterPage,
})

// Validation schema
const registerSchema = z
    .object({
        fullName: z.string().min(2, 'Full name must be at least 2 characters'),
        email: z.string().email('Please enter a valid email address'),
        phone: z.string().min(10, 'Please enter a valid phone number'),
        password: z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
            .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
            .regex(/[0-9]/, 'Password must contain at least one number'),
        confirmPassword: z.string(),
    })
    .refine(data => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ['confirmPassword'],
    })

type RegisterFormData = z.infer<typeof registerSchema>

function RegisterPage() {
    const navigate = useNavigate()
    const form = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            fullName: '',
            email: '',
            phone: '',
            password: '',
            confirmPassword: '',
        },
    })

    const onSubmit = async (data: RegisterFormData) => {
        try {
            // TODO: Replace with actual API call
            // Example: await authApi.register(data)

            console.log('Registration data:', data)

            // Simulated API call
            await new Promise(resolve => setTimeout(resolve, 1500))

            // TODO: Store authentication token if auto-login after registration
            // Example: localStorage.setItem('authToken', response.token)

            toast.success({
                title: 'Registration successful',
                description: 'Your account has been created. Please check your email for verification.',
            })

            // TODO: Navigate to appropriate page after successful registration
            // Option 1: Navigate to login
            // navigate({ to: '/login' })
            // Option 2: Navigate to email verification page
            // navigate({ to: '/verify-email' })
            // Option 3: Navigate to dashboard if auto-login
            // navigate({ to: '/dashboard' })
        } catch (error) {
            toast.error({
                title: 'Registration failed',
                description: 'An error occurred during registration. Please try again.',
            })
            console.error('Registration error:', error)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-primary/5">
            <div className="w-full max-w-2xl">
                {/* Logo */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    <HeartPulse className="h-10 w-10 text-primary" />
                    <span className="font-bold text-2xl">CryoBank</span>
                </div>

                <Card>
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold text-center">Create Your Account</CardTitle>
                        <CardDescription className="text-center">
                            Join leading fertility clinics using our management system
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="fullName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Full Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="John Doe" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid md:grid-cols-2 gap-4">
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
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Phone Number</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="+1 (555) 000-0000" type="tel" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Password</FormLabel>
                                            <FormControl>
                                                <PasswordInput placeholder="Create a strong password" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                Must be at least 8 characters with uppercase, lowercase, and numbers
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Confirm Password</FormLabel>
                                            <FormControl>
                                                <PasswordInput placeholder="Confirm your password" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="text-xs text-muted-foreground">
                                    By creating an account, you agree to our{' '}
                                    <a href="#" className="text-primary hover:underline">
                                        Terms of Service
                                    </a>{' '}
                                    and{' '}
                                    <a href="#" className="text-primary hover:underline">
                                        Privacy Policy
                                    </a>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full"
                                    size="lg"
                                    isDisabled={form.formState.isSubmitting}
                                >
                                    {form.formState.isSubmitting ? 'Creating account...' : 'Create Account'}
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
                                <span className="text-muted-foreground">Already have an account? </span>
                                <Link to="/login" className="text-primary font-medium hover:underline">
                                    Sign in
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
