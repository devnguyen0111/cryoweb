import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@workspace/ui/components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { Input } from '@workspace/ui/components/Textfield'
import { FlaskConical, User, Bell, Shield, Database, Mail, Phone, Building } from 'lucide-react'
import { ThemeSwitcher } from '@/shared/components/ThemeSwitcher'

export const Route = createFileRoute('/settings')({
    component: SettingsPage,
})

function SettingsPage() {
    // TODO: Fetch user settings from API
    // const { data: userSettings } = useQuery({
    //     queryKey: ['user-settings'],
    //     queryFn: () => api.auth.getCurrentUser()
    // })

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FlaskConical className="h-6 w-6 text-primary" />
                        <span className="font-bold text-lg">CryoBank</span>
                    </div>
                    <nav className="hidden md:flex items-center gap-6">
                        <Link to="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
                            Dashboard
                        </Link>
                        <Link to="/patients" className="text-sm font-medium hover:text-primary transition-colors">
                            Patients
                        </Link>
                        <Link to="/samples" className="text-sm font-medium hover:text-primary transition-colors">
                            Samples
                        </Link>
                        <Link to="/appointments" className="text-sm font-medium hover:text-primary transition-colors">
                            Appointments
                        </Link>
                    </nav>
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" asChild>
                            <Link to="/settings">Settings</Link>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8 max-w-4xl">
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
                            {/* TODO: Load actual user data from API */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Full Name</label>
                                    <Input placeholder="TODO - Load from API" defaultValue="TODO" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Email</label>
                                    <Input type="email" placeholder="TODO - Load from API" defaultValue="TODO" />
                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Phone</label>
                                    <Input type="tel" placeholder="TODO - Load from API" defaultValue="TODO" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Role</label>
                                    <Input disabled defaultValue="TODO - Load from API" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline">Cancel</Button>
                                <Button>Save Changes</Button>
                            </div>
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
                                    <p className="text-sm text-muted-foreground">Upcoming appointment notifications</p>
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
                                    <p className="text-sm text-muted-foreground">Choose your preferred color scheme</p>
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
            </main>
        </div>
    )
}
