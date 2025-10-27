import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@workspace/ui/components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { HeartPulse, Mail, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react'
import { AppLayout } from '../shared/components/AppLayout'
import { ProtectedRoute } from '../shared/components/ProtectedRoute'

export const Route = createFileRoute('/verify-email-manual')({
    component: VerifyEmailManualPage,
})

function VerifyEmailManualPage() {
    return (
        <ProtectedRoute>
            <AppLayout>
                <div className="container mx-auto px-4 py-8 max-w-2xl">
                    {/* Page Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold mb-2">Xác nhận Email</h1>
                        <p className="text-muted-foreground">Quản lý xác nhận email của bạn</p>
                    </div>

                    <div className="space-y-6">
                        {/* Email Verification Status */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Mail className="h-5 w-5" />
                                    <CardTitle>Trạng thái Email</CardTitle>
                                </div>
                                <CardDescription>Kiểm tra và quản lý xác nhận email</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                        <div>
                                            <p className="font-medium">Email chưa được xác nhận</p>
                                            <p className="text-sm text-muted-foreground">
                                                Vui lòng xác nhận email để sử dụng đầy đủ các tính năng
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Button asChild>
                                        <Link to="/email-verification" search={{ from: 'manual' }}>
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Xác nhận Email
                                        </Link>
                                    </Button>
                                    <Button asChild variant="outline">
                                        <Link to="/settings">
                                            <Mail className="h-4 w-4 mr-2" />
                                            Quản lý trong Settings
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Instructions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Hướng dẫn xác nhận email</CardTitle>
                                <CardDescription>Các bước để xác nhận email của bạn</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                                            1
                                        </div>
                                        <div>
                                            <p className="font-medium">Kiểm tra email</p>
                                            <p className="text-sm text-muted-foreground">
                                                Mở email xác nhận đã được gửi đến hộp thư của bạn
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                                            2
                                        </div>
                                        <div>
                                            <p className="font-medium">Nhập mã xác nhận</p>
                                            <p className="text-sm text-muted-foreground">
                                                Sao chép mã 6 chữ số từ email và nhập vào form
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                                            3
                                        </div>
                                        <div>
                                            <p className="font-medium">Hoàn tất xác nhận</p>
                                            <p className="text-sm text-muted-foreground">
                                                Nhấn "Xác nhận Email" để hoàn tất quá trình
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Troubleshooting */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Khắc phục sự cố</CardTitle>
                                <CardDescription>Nếu bạn gặp vấn đề với việc xác nhận email</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    <div className="p-3 border rounded-lg">
                                        <p className="font-medium text-sm">Không nhận được email?</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Kiểm tra thư mục spam, junk mail hoặc sử dụng chức năng "Gửi lại mã"
                                        </p>
                                    </div>
                                    <div className="p-3 border rounded-lg">
                                        <p className="font-medium text-sm">Mã xác nhận không đúng?</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Đảm bảo bạn nhập đúng mã 6 chữ số và mã chưa hết hạn
                                        </p>
                                    </div>
                                    <div className="p-3 border rounded-lg">
                                        <p className="font-medium text-sm">Vẫn gặp vấn đề?</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Liên hệ với quản trị viên hệ thống để được hỗ trợ
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Navigation */}
                        <div className="flex gap-3">
                            <Button asChild variant="outline">
                                <Link to="/dashboard">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Quay lại Dashboard
                                </Link>
                            </Button>
                            <Button asChild variant="outline">
                                <Link to="/settings">
                                    <Mail className="h-4 w-4 mr-2" />
                                    Cài đặt Email
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </AppLayout>
        </ProtectedRoute>
    )
}
