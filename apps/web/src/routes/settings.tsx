import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@workspace/ui/components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { Input } from '@workspace/ui/components/Textfield'
import {
    FlaskConical,
    User,
    Bell,
    Shield,
    Database,
    Mail,
    Phone,
    Building,
    CheckCircle,
    AlertTriangle,
    RefreshCw,
} from 'lucide-react'
import { ThemeSwitcher } from '@/shared/components/ThemeSwitcher'
import { AppLayout } from '../shared/components/AppLayout'
import { ProtectedRoute } from '../shared/components/ProtectedRoute'
import { useAuth } from '../shared/contexts/AuthContext'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@workspace/ui/components/Form'
import { toast } from '@workspace/ui/components/Sonner'
import { useState } from 'react'

export const Route = createFileRoute('/settings')({
    component: SettingsPage,
})

// Validation schema for profile update
const profileSchema = z.object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    phone: z.string().min(10, 'Please enter a valid phone number'),
})

type ProfileFormData = z.infer<typeof profileSchema>

function SettingsPage() {
    const { user, updateProfile, resendVerification } = useAuth()
    const [isResendingVerification, setIsResendingVerification] = useState(false)

    const form = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            fullName: user?.fullName || '',
            email: user?.email || '',
            phone: user?.phone || '',
        },
    })

    const handleResendVerification = async () => {
        if (!user?.email) {
            toast.error({
                title: 'Lỗi',
                description: 'Không tìm thấy email của bạn.',
            })
            return
        }

        setIsResendingVerification(true)
        try {
            await resendVerification(user.email)
            toast.success({
                title: 'Đã gửi lại email xác nhận!',
                description: 'Vui lòng kiểm tra email của bạn.',
            })
        } catch (error: any) {
            toast.error({
                title: 'Gửi lại email thất bại',
                description: error.message || 'Không thể gửi lại email xác nhận.',
            })
        } finally {
            setIsResendingVerification(false)
        }
    }

    const onSubmit = async (data: ProfileFormData) => {
        try {
            await updateProfile(data)
            toast.success({
                title: 'Profile updated',
                description: 'Your profile has been updated successfully.',
            })
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Failed to update profile. Please try again.'
            toast.error({
                title: 'Update failed',
                description: errorMessage,
            })
        }
    }

    return (
        <ProtectedRoute>
            <AppLayout>
                <div className="container mx-auto px-4 py-8 max-w-4xl">
                    {/* Page Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold mb-2">Settings</h1>
                        <p className="text-muted-foreground">Manage your account and application preferences</p>
                    </div>

                    <div className="space-y-6">
                        {/* Profile Settings */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    <CardTitle>Profile Information</CardTitle>
                                </div>
                                <CardDescription>Update your personal information</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="fullName"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Full Name</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Enter your full name" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="email"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Email</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="email"
                                                                placeholder="Enter your email"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="phone"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Phone</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="tel"
                                                                placeholder="Enter your phone number"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <div>
                                                <label className="text-sm font-medium mb-2 block">Role</label>
                                                <Input disabled value={user?.role || 'User'} />
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <Button type="button" variant="outline" onClick={() => form.reset()}>
                                                Cancel
                                            </Button>
                                            <Button type="submit" isDisabled={form.formState.isSubmitting}>
                                                {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                                            </Button>
                                        </div>
                                    </form>
                                </Form>
                            </CardContent>
                        </Card>

                        {/* Email Verification Status */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Mail className="h-5 w-5" />
                                    <CardTitle>Email Verification</CardTitle>
                                </div>
                                <CardDescription>Manage your email verification status</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        {user?.isEmailVerified ? (
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                        ) : (
                                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                        )}
                                        <div>
                                            <p className="font-medium">
                                                {user?.isEmailVerified
                                                    ? 'Email đã được xác nhận'
                                                    : 'Email chưa được xác nhận'}
                                            </p>
                                            <p className="text-sm text-muted-foreground">{user?.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {!user?.isEmailVerified && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleResendVerification}
                                                isDisabled={isResendingVerification}
                                            >
                                                {isResendingVerification ? (
                                                    <>
                                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                                        Đang gửi...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Mail className="h-4 w-4 mr-2" />
                                                        Gửi lại mã
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                        <Button asChild variant="outline" size="sm">
                                            <Link
                                                to="/email-verification"
                                                search={{ from: 'settings', email: user?.email }}
                                            >
                                                {user?.isEmailVerified ? 'Xác nhận lại' : 'Xác nhận Email'}
                                            </Link>
                                        </Button>
                                    </div>
                                </div>

                                {!user?.isEmailVerified && (
                                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                                    Email chưa được xác nhận
                                                </p>
                                                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                                                    Vui lòng xác nhận email để sử dụng đầy đủ các tính năng và bảo mật
                                                    tài khoản.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Notification Settings */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Bell className="h-5 w-5" />
                                    <CardTitle>Notifications</CardTitle>
                                </div>
                                <CardDescription>Configure how you receive notifications</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* TODO: Load notification preferences from API */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Email Notifications</p>
                                        <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                                    </div>
                                    <input type="checkbox" className="w-4 h-4" defaultChecked />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Storage Alerts</p>
                                        <p className="text-sm text-muted-foreground">
                                            Critical temperature and storage alerts
                                        </p>
                                    </div>
                                    <input type="checkbox" className="w-4 h-4" defaultChecked />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Appointment Reminders</p>
                                        <p className="text-sm text-muted-foreground">
                                            Upcoming appointment notifications
                                        </p>
                                    </div>
                                    <input type="checkbox" className="w-4 h-4" defaultChecked />
                                </div>
                                <div className="flex justify-end">
                                    <Button>Save Preferences</Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Appearance Settings */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Appearance</CardTitle>
                                <CardDescription>Customize the application appearance</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Theme</p>
                                        <p className="text-sm text-muted-foreground">
                                            Choose your preferred color scheme
                                        </p>
                                    </div>
                                    <ThemeSwitcher />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Security Settings */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Shield className="h-5 w-5" />
                                    <CardTitle>Security</CardTitle>
                                </div>
                                <CardDescription>Manage your security settings</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h4 className="font-medium mb-2">Change Password</h4>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Update your password regularly to keep your account secure
                                    </p>
                                    <Button variant="outline">Change Password</Button>
                                </div>
                                <div className="border-t pt-4">
                                    <h4 className="font-medium mb-2">Two-Factor Authentication</h4>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Add an extra layer of security to your account
                                    </p>
                                    <Button variant="outline">Enable 2FA</Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Data & Privacy */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Database className="h-5 w-5" />
                                    <CardTitle>Data & Privacy</CardTitle>
                                </div>
                                <CardDescription>Manage your data and privacy settings</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h4 className="font-medium mb-2">Export Data</h4>
                                    <p className="text-sm text-muted-foreground mb-4">Download a copy of your data</p>
                                    <Button variant="outline">Request Data Export</Button>
                                </div>
                                <div className="border-t pt-4">
                                    <h4 className="font-medium mb-2 text-destructive">Danger Zone</h4>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Permanently delete your account and all associated data
                                    </p>
                                    <Button variant="destructive">Delete Account</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </AppLayout>
        </ProtectedRoute>
    )
}
