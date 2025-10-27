import { createFileRoute } from '@tanstack/react-router'
import { RoleBasedRoute } from '../../shared/components/RoleBasedRoute'
import { DashboardLayout } from '../../shared/components/dashboard/DashboardLayout'
import { Button } from '@workspace/ui/components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import {
    LayoutDashboard,
    Users,
    FolderTree,
    FileText,
    BarChart3,
    Settings,
    Plus,
    Search,
    Filter,
    Pill,
    Stethoscope,
} from 'lucide-react'
import { Input } from '@workspace/ui/components/Textfield'

export const Route = createFileRoute('/admin/categories')({
    component: AdminCategoriesPage,
})

const adminMenuItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'User Management', icon: Users },
    { href: '/admin/categories', label: 'Categories', icon: FolderTree },
    { href: '/admin/content', label: 'Content Management', icon: FileText },
    { href: '/admin/reports', label: 'Reports & Analytics', icon: BarChart3 },
    { href: '/admin/system-settings', label: 'System Settings', icon: Settings },
]

function AdminCategoriesPage() {
    return (
        <RoleBasedRoute allowedRoles={['Admin']} currentPath="/admin/categories">
            <DashboardLayout menuItems={adminMenuItems}>
                <div className="container mx-auto px-6 py-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">Category Management</h1>
                            <p className="text-muted-foreground">Manage service categories and medicines</p>
                        </div>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Category
                        </Button>
                    </div>

                    {/* Search and Filter */}
                    <Card className="mb-6">
                        <CardContent className="pt-6">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input placeholder="Search categories..." className="pl-10" />
                                    </div>
                                </div>
                                <Button variant="outline">
                                    <Filter className="h-4 w-4 mr-2" />
                                    Filter
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Categories Grid */}
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Service Categories */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Service Categories</CardTitle>
                                        <CardDescription>Medical service categories</CardDescription>
                                    </div>
                                    <Button size="sm" variant="outline">
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-12 text-muted-foreground">
                                    <Stethoscope className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>Connect to API to view service categories</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Medicine Categories */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Medicine Categories</CardTitle>
                                        <CardDescription>Pharmaceutical categories</CardDescription>
                                    </div>
                                    <Button size="sm" variant="outline">
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-12 text-muted-foreground">
                                    <Pill className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>Connect to API to view medicine categories</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </DashboardLayout>
        </RoleBasedRoute>
    )
}
