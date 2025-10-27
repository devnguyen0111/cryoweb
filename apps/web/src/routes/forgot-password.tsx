import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Button } from '@workspace/ui/components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { Input } from '@workspace/ui/components/Textfield'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@workspace/ui/components/Form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { HeartPulse, ArrowLeft, Mail, CheckCircle } from 'lucide-react'
import { toast } from '@workspace/ui/components/Sonner'
import { api } from '../shared/lib/api'
import { useState } from 'react'

export const Route = createFileRoute('/forgot-password')({
    component: ForgotPasswordPage,
})

// Validation schema
const forgotPasswordSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

function ForgotPasswordPage() {
    const navigate = useNavigate()
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [submittedEmail, setSubmittedEmail] = useState('')

    const form = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: '',
        },
    })

    const onSubmit = async (data: ForgotPasswordFormData) => {
        try {
            await api.auth.forgotPassword({ email: data.email })

            setSubmittedEmail(data.email)
            setIsSubmitted(true)

            toast.success({
                title: 'Reset link sent!',
                description: 'Please check your email for password reset instructions.',
            })
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Failed to send reset email. Please try again.'

            toast.error({
                title: 'Request failed',
                description: errorMessage,
            })
            console.error('Forgot password error:', error)
        }
    }

    if (isSubmitted) {
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
                            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                            </div>
                            <CardTitle className="text-2xl font-bold text-green-600 dark:text-green-400">
                                Check Your Email
                            </CardTitle>
                            <CardDescription className="text-base">
                                We've sent password reset instructions to
                                <br />
                                <span className="font-medium text-foreground">{submittedEmail}</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Success Message */}
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <Mail className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-green-800 dark:text-green-200">
                                            Please check your email and follow the instructions to reset your password.
                                            The link will expire in 1 hour.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                <Button
                                    onClick={() => {
                                        setIsSubmitted(false)
                                        setSubmittedEmail('')
                                        form.reset()
                                    }}
                                    variant="outline"
                                    className="w-full"
                                >
                                    Send to Different Email
                                </Button>
                            </div>

                            {/* Help Text */}
                            <div className="text-center text-xs text-muted-foreground">
                                <p>Didn't receive the email? Check your spam folder or try again.</p>
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
                        <CardTitle className="text-2xl font-bold text-center">Forgot Password?</CardTitle>
                        <CardDescription className="text-center">
                            Enter your email address and we'll send you a link to reset your password
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
                                            <FormLabel>Email Address</FormLabel>
                                            <FormControl>
                                                <Input placeholder="name@example.com" type="email" {...field} />
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
                                    {form.formState.isSubmitting ? 'Sending...' : 'Send Reset Link'}
                                </Button>
                            </form>
                        </Form>

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
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
