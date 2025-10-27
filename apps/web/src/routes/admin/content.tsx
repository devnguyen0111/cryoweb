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
    Image,
    FileVideo,
} from 'lucide-react'
import { Input } from '@workspace/ui/components/Textfield'

export const Route = createFileRoute('/admin/content')({
    component: AdminContentPage,
})

const adminMenuItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'User Management', icon: Users },
    { href: '/admin/categories', label: 'Categories', icon: FolderTree },
    { href: '/admin/content', label: 'Content Management', icon: FileText },
    { href: '/admin/reports', label: 'Reports & Analytics', icon: BarChart3 },
    { href: '/admin/system-settings', label: 'System Settings', icon: Settings },
]

function AdminContentPage() {
    return (
        <RoleBasedRoute allowedRoles={['Admin']} currentPath="/admin/content">
            <DashboardLayout menuItems={adminMenuItems}>
                <div className="container mx-auto px-6 py-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">Content Management</h1>
                            <p className="text-muted-foreground">Manage CMS content and media files</p>
                        </div>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Content
                        </Button>
                    </div>

                    {/* Search and Filter */}
                    <Card className="mb-6">
                        <CardContent className="pt-6">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input placeholder="Search content..." className="pl-10" />
                                    </div>
                                </div>
                                <Button variant="outline">
                                    <Filter className="h-4 w-4 mr-2" />
                                    Filter
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Content Grid */}
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Pages & Articles */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Pages & Articles</CardTitle>
                                        <CardDescription>Manage website pages and articles</CardDescription>
                                    </div>
                                    <Button size="sm" variant="outline">
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-12 text-muted-foreground">
                                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>Connect to API to view content</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Media Library */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Media Library</CardTitle>
                                        <CardDescription>Upload and manage media files</CardDescription>
                                    </div>
                                    <Button size="sm" variant="outline">
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-12 text-muted-foreground">
                                    <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>Connect to API to view media files</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </DashboardLayout>
        </RoleBasedRoute>
    )
}
