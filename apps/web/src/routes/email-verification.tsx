import { createFileRoute, Link, useSearch } from '@tanstack/react-router'
import { Button } from '@workspace/ui/components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@workspace/ui/components/Form'
import { Input } from '@workspace/ui/components/Textfield'
import { HeartPulse, Mail, ArrowLeft, RefreshCw, CheckCircle } from 'lucide-react'
import { useAuth } from '../shared/contexts/AuthContext'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from '@workspace/ui/components/Sonner'
import { useState } from 'react'

const verificationSchema = z.object({
    email: z.string().email('Email không hợp lệ'),
    code: z.string().min(6, 'Mã xác nhận phải có 6 chữ số').max(6, 'Mã xác nhận phải có 6 chữ số'),
})

type VerificationFormData = z.infer<typeof verificationSchema>

export const Route = createFileRoute('/email-verification')({
    component: EmailVerificationPage,
    validateSearch: z.object({
        email: z.string().optional(),
        from: z.string().optional(), // 'register', 'settings', 'manual'
    }),
})

function EmailVerificationPage() {
    const search = useSearch({ from: '/email-verification' })
    const { verifyEmail, resendVerification, user } = useAuth()
    const [isVerifying, setIsVerifying] = useState(false)
    const [isResending, setIsResending] = useState(false)
    const [verificationSent, setVerificationSent] = useState(false)

    const form = useForm<VerificationFormData>({
        resolver: zodResolver(verificationSchema),
        defaultValues: {
            email: search.email || user?.email || '',
            code: '',
        },
    })

    const onSubmit = async (data: VerificationFormData) => {
        setIsVerifying(true)
        try {
            await verifyEmail(data.email, data.code)
            toast.success({
                title: 'Xác nhận email thành công!',
                description: 'Email của bạn đã được xác nhận.',
            })
            // Redirect based on where user came from
            if (search.from === 'settings') {
                window.location.href = '/settings'
            } else if (search.from === 'register') {
                window.location.href = '/login?verified=true'
            } else {
                window.location.href = '/dashboard'
            }
        } catch (error: any) {
            toast.error({
                title: 'Xác nhận email thất bại',
                description: error.message || 'Mã xác nhận không đúng hoặc đã hết hạn.',
            })
        } finally {
            setIsVerifying(false)
        }
    }

    const handleResendCode = async () => {
        const email = form.getValues('email')
        if (!email) {
            toast.error({
                title: 'Lỗi',
                description: 'Vui lòng nhập email trước khi gửi lại mã.',
            })
            return
        }

        setIsResending(true)
        try {
            await resendVerification(email)
            setVerificationSent(true)
            toast.success({
                title: 'Đã gửi lại mã xác nhận!',
                description: 'Vui lòng kiểm tra email của bạn.',
            })
        } catch (error: any) {
            toast.error({
                title: 'Gửi lại mã thất bại',
                description: error.message || 'Không thể gửi lại mã xác nhận.',
            })
        } finally {
            setIsResending(false)
        }
    }

    const getPageTitle = () => {
        switch (search.from) {
            case 'settings':
                return 'Xác nhận Email'
            case 'register':
                return 'Xác nhận Email để Hoàn tất Đăng ký'
            default:
                return 'Xác nhận Email'
        }
    }

    const getPageDescription = () => {
        switch (search.from) {
            case 'settings':
                return 'Xác nhận email để bảo mật tài khoản của bạn'
            case 'register':
                return 'Vui lòng xác nhận email để hoàn tất quá trình đăng ký'
            default:
                return 'Xác nhận email để sử dụng đầy đủ các tính năng'
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
                    <CardHeader className="space-y-1 text-center">
                        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                            <Mail className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle className="text-2xl font-bold">{getPageTitle()}</CardTitle>
                        <CardDescription className="text-base">{getPageDescription()}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Email Display */}
                        {form.getValues('email') && (
                            <div className="p-4 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-2 text-sm">
                                    <Mail className="h-4 w-4" />
                                    <span className="font-medium">Email:</span>
                                    <span className="text-muted-foreground">{form.getValues('email')}</span>
                                </div>
                            </div>
                        )}

                        {/* Verification Form */}
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
                                                    {...field}
                                                    type="email"
                                                    placeholder="Nhập email của bạn"
                                                    disabled={!!search.email || !!user?.email}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Mã xác nhận</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="text"
                                                    placeholder="Nhập mã 6 chữ số"
                                                    maxLength={6}
                                                    className="text-center text-lg tracking-widest"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button type="submit" className="w-full" size="lg" isDisabled={isVerifying}>
                                    {isVerifying ? (
                                        <>
                                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                            Đang xác nhận...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Xác nhận Email
                                        </>
                                    )}
                                </Button>
                            </form>
                        </Form>

                        {/* Resend Code */}
                        <div className="space-y-3">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">Hoặc</span>
                                </div>
                            </div>

                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={handleResendCode}
                                isDisabled={isResending || verificationSent}
                            >
                                {isResending ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                        Đang gửi...
                                    </>
                                ) : verificationSent ? (
                                    <>
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Đã gửi lại mã
                                    </>
                                ) : (
                                    <>
                                        <Mail className="h-4 w-4 mr-2" />
                                        Gửi lại mã xác nhận
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Navigation */}
                        <div className="space-y-3">
                            {search.from === 'settings' ? (
                                <Button asChild variant="ghost" className="w-full">
                                    <Link to="/settings">
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Quay lại Settings
                                    </Link>
                                </Button>
                            ) : search.from === 'register' ? (
                                <Button asChild variant="ghost" className="w-full">
                                    <Link to="/register">
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Quay lại Đăng ký
                                    </Link>
                                </Button>
                            ) : (
                                <Button asChild variant="ghost" className="w-full">
                                    <Link to="/login">
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Quay lại Đăng nhập
                                    </Link>
                                </Button>
                            )}
                        </div>

                        {/* Help Text */}
                        <div className="text-center text-xs text-muted-foreground">
                            <p>
                                Không nhận được email? Kiểm tra thư mục spam hoặc{' '}
                                <button
                                    type="button"
                                    onClick={handleResendCode}
                                    className="text-primary hover:underline"
                                    disabled={isResending}
                                >
                                    gửi lại mã
                                </button>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
