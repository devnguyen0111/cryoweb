import { createFileRoute, Link, useNavigate, useSearch } from '@tanstack/react-router'
import { Button } from '@workspace/ui/components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { Input } from '@workspace/ui/components/Textfield'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@workspace/ui/components/Form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FlaskConical, Mail, ArrowLeft, RefreshCw } from 'lucide-react'
import { toast } from '@workspace/ui/components/Sonner'
import { useAuth } from '../shared/contexts/AuthContext'
import { useState, useRef, useEffect } from 'react'

export const Route = createFileRoute('/verify-email')({
    component: VerifyEmailPage,
    validateSearch: z.object({
        email: z.string().email(),
        token: z.string().optional(),
    }),
})

// Validation schema for verification code
const verifySchema = z.object({
    code: z
        .string()
        .min(6, 'Verification code must be 6 digits')
        .max(6, 'Verification code must be 6 digits')
        .regex(/^\d{6}$/, 'Verification code must contain only numbers'),
})

type VerifyFormData = z.infer<typeof verifySchema>

// OTP Input Component
interface OTPInputProps {
    value: string
    onChange: (value: string) => void
    onComplete?: (value: string) => void
}

function OTPInput({ value, onChange, onComplete }: OTPInputProps) {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])
    const digits = value.padEnd(6, ' ').split('').slice(0, 6)

    const handleChange = (index: number, newValue: string) => {
        // Only allow numbers
        if (newValue && !/^\d$/.test(newValue)) return

        const newDigits = [...digits]
        newDigits[index] = newValue
        const newCode = newDigits.join('').trim()
        onChange(newCode)

        // Auto-focus next input
        if (newValue && index < 5) {
            inputRefs.current[index + 1]?.focus()
        }

        // Call onComplete if all digits are filled
        if (newCode.length === 6) {
            onComplete?.(newCode)
        }
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !digits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
    }

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault()
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
        onChange(pastedData)

        // Focus the last filled input or the next empty one
        const nextIndex = Math.min(pastedData.length, 5)
        inputRefs.current[nextIndex]?.focus()

        // Call onComplete if 6 digits were pasted
        if (pastedData.length === 6) {
            onComplete?.(pastedData)
        }
    }

    return (
        <div className="flex gap-2 justify-center" onPaste={handlePaste}>
            {digits.map((digit, index) => (
                <input
                    key={index}
                    ref={el => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit === ' ' ? '' : digit}
                    onChange={e => handleChange(index, e.target.value)}
                    onKeyDown={e => handleKeyDown(index, e)}
                    className="w-12 h-14 text-center text-2xl font-mono border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                    autoFocus={index === 0}
                />
            ))}
        </div>
    )
}

function VerifyEmailPage() {
    const navigate = useNavigate()
    const search = useSearch({ from: '/verify-email' })
    const { verifyEmail, resendVerification } = useAuth()
    const [isResending, setIsResending] = useState(false)

    const form = useForm<VerifyFormData>({
        resolver: zodResolver(verifySchema),
        defaultValues: {
            code: '',
        },
    })

    const onSubmit = async (data: VerifyFormData) => {
        if (!search.email) {
            toast.error({
                title: 'Email required',
                description: 'Email address is required for verification.',
            })
            return
        }

        try {
            // Call the verify email API with both email and code
            await verifyEmail(search.email, data.code)

            toast.success({
                title: 'Email verified successfully!',
                description: 'Your email has been verified. You can now log in to your account.',
            })

            // Navigate to login page with success message
            navigate({
                to: '/login',
                search: {
                    verified: 'true',
                    email: search.email,
                },
            })
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Invalid verification code. Please try again.'

            toast.error({
                title: 'Verification failed',
                description: errorMessage,
            })
            console.error('Verification error:', error)
        }
    }

    const handleResendCode = async () => {
        try {
            setIsResending(true)
            await resendVerification(search.email)

            toast.success({
                title: 'Verification code sent!',
                description: 'A new verification code has been sent to your email.',
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
                        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full flex items-center justify-center mb-4">
                            <Mail className="h-8 w-8 text-green-600 dark:text-green-400" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
                        <CardDescription>
                            We've sent a 6-digit verification code to
                            <br />
                            <span className="font-medium text-foreground">{search.email}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-center block">Verification Code</FormLabel>
                                            <FormControl>
                                                <OTPInput
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    onComplete={code => {
                                                        field.onChange(code)
                                                        // Auto-submit on complete
                                                        form.handleSubmit(onSubmit)()
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                                    size="lg"
                                    isDisabled={form.formState.isSubmitting}
                                >
                                    {form.formState.isSubmitting ? 'Verifying...' : 'Verify Email'}
                                </Button>
                            </form>
                        </Form>

                        {/* Resend Code */}
                        <div className="mt-6 text-center">
                            <p className="text-sm text-muted-foreground mb-3">Didn't receive the code?</p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleResendCode}
                                isDisabled={isResending}
                                className="w-full"
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

                {/* Help Text */}
                <div className="mt-6 text-center text-xs text-muted-foreground">
                    <p>
                        The verification code will expire in <strong>15 minutes</strong>.
                        <br />
                        Check your spam folder if you don't see the email.
                    </p>
                </div>
            </div>
        </div>
    )
}
