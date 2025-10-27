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
    UserPlus,
    Search,
    Filter,
    Edit,
    Trash2,
} from 'lucide-react'
import { Input } from '@workspace/ui/components/Textfield'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@workspace/ui/components/Table'
import { Badge } from '@workspace/ui/components/Badge'

export const Route = createFileRoute('/admin/users')({
    component: AdminUsersPage,
})

const adminMenuItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'User Management', icon: Users },
    { href: '/admin/categories', label: 'Categories', icon: FolderTree },
    { href: '/admin/content', label: 'Content Management', icon: FileText },
    { href: '/admin/reports', label: 'Reports & Analytics', icon: BarChart3 },
    { href: '/admin/system-settings', label: 'System Settings', icon: Settings },
]

// Mock data for demonstration
const mockUsers = [
    {
        id: '1',
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        role: 'Admin',
        status: 'Active',
        lastLogin: '2024-01-15',
    },
    {
        id: '2',
        fullName: 'Jane Smith',
        email: 'jane.smith@example.com',
        role: 'Doctor',
        status: 'Active',
        lastLogin: '2024-01-14',
    },
    {
        id: '3',
        fullName: 'Bob Johnson',
        email: 'bob.johnson@example.com',
        role: 'Lab Technician',
        status: 'Active',
        lastLogin: '2024-01-13',
    },
    {
        id: '4',
        fullName: 'Alice Williams',
        email: 'alice.williams@example.com',
        role: 'Receptionist',
        status: 'Inactive',
        lastLogin: '2024-01-10',
    },
]

function AdminUsersPage() {
    return (
        <RoleBasedRoute allowedRoles={['Admin']} currentPath="/admin/users">
            <DashboardLayout menuItems={adminMenuItems}>
                <div className="container mx-auto px-6 py-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">User Management</h1>
                            <p className="text-muted-foreground">Manage system users, roles and permissions</p>
                        </div>
                        <Button>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add User
                        </Button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                                        <h3 className="text-2xl font-bold mt-1">248</h3>
                                    </div>
                                    <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                        <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                                        <h3 className="text-2xl font-bold mt-1">189</h3>
                                    </div>
                                    <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                                        <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">New This Month</p>
                                        <h3 className="text-2xl font-bold mt-1">24</h3>
                                    </div>
                                    <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                                        <UserPlus className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Inactive</p>
                                        <h3 className="text-2xl font-bold mt-1">59</h3>
                                    </div>
                                    <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                                        <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Search and Filter */}
                    <Card className="mb-6">
                        <CardContent className="pt-6">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search users by name, email, or role..."
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <Button variant="outline">
                                    <Filter className="h-4 w-4 mr-2" />
                                    Filter
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Users Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>All Users</CardTitle>
                            <CardDescription>A list of all users in the system</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Last Login</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {mockUsers.map(user => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.fullName}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{user.role}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={user.status === 'Active' ? 'default' : 'secondary'}>
                                                    {user.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{user.lastLogin}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="sm">
                                                        <Edit className="h-4 w-4 mr-1" />
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-1" />
                                                        Delete
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>
        </RoleBasedRoute>
    )
}
