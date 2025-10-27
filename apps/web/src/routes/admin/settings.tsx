import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { Button } from '@workspace/ui/components/Button'
import { Settings, Shield, Bell, Database, Mail, Globe } from 'lucide-react'

export const Route = createFileRoute('/admin/settings')({
    component: AdminSettingsPage,
})

function AdminSettingsPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">System Settings</h1>
                <p className="text-muted-foreground">Manage system settings and configurations</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <Settings className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle>General Settings</CardTitle>
                                <CardDescription>Basic system configuration</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">System Name</label>
                                <p className="text-sm text-muted-foreground">CryoBank Management System</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">Time Zone</label>
                                <p className="text-sm text-muted-foreground">UTC-5 (Eastern Time)</p>
                            </div>
                            <Button variant="outline" size="sm">
                                Edit Settings
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                <Shield className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle>Security Settings</CardTitle>
                                <CardDescription>Authentication and access control</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Two-Factor Authentication</span>
                                <span className="text-sm text-green-600 font-medium">Enabled</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Password Expiry</span>
                                <span className="text-sm text-muted-foreground">90 days</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Session Timeout</span>
                                <span className="text-sm text-muted-foreground">30 minutes</span>
                            </div>
                            <Button variant="outline" size="sm">
                                Configure Security
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                                <Bell className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle>Notification Settings</CardTitle>
                                <CardDescription>Email and alert preferences</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Email Notifications</span>
                                <span className="text-sm text-green-600 font-medium">Enabled</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm">SMS Alerts</span>
                                <span className="text-sm text-green-600 font-medium">Enabled</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm">System Alerts</span>
                                <span className="text-sm text-green-600 font-medium">Enabled</span>
                            </div>
                            <Button variant="outline" size="sm">
                                Manage Notifications
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                                <Database className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle>Database Settings</CardTitle>
                                <CardDescription>Backup and maintenance</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Auto Backup</span>
                                <span className="text-sm text-green-600 font-medium">Daily at 2:00 AM</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Last Backup</span>
                                <span className="text-sm text-muted-foreground">Today, 2:00 AM</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Storage Used</span>
                                <span className="text-sm text-muted-foreground">45.2 GB / 100 GB</span>
                            </div>
                            <Button variant="outline" size="sm">
                                Backup Now
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                                <Mail className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle>Email Configuration</CardTitle>
                                <CardDescription>SMTP and email settings</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">SMTP Server</label>
                                <p className="text-sm text-muted-foreground">smtp.example.com</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">From Email</label>
                                <p className="text-sm text-muted-foreground">noreply@cryobank.com</p>
                            </div>
                            <Button variant="outline" size="sm">
                                Configure Email
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-500">
                                <Globe className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle>Localization</CardTitle>
                                <CardDescription>Language and regional settings</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">Default Language</label>
                                <p className="text-sm text-muted-foreground">English (US)</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">Date Format</label>
                                <p className="text-sm text-muted-foreground">MM/DD/YYYY</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">Currency</label>
                                <p className="text-sm text-muted-foreground">USD ($)</p>
                            </div>
                            <Button variant="outline" size="sm">
                                Edit Localization
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
