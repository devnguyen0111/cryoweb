import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { Button } from '@workspace/ui/components/Button'
import { useAuth } from '../shared/contexts/AuthContext'
import { normalizeRoleName, getDefaultRouteByRole } from '../shared/utils/roleUtils'

export const Route = createFileRoute('/debug-auth')({
    component: DebugAuthPage,
})

function DebugAuthPage() {
    const { user, isAuthenticated, isLoading, userRole, userPermissions } = useAuth()

    const userData = user ? JSON.parse(JSON.stringify(user)) : null
    const storageUser = localStorage.getItem('user')
    const storageToken = localStorage.getItem('authToken')

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8">Auth Debug Page</h1>

            <div className="space-y-6">
                {/* Auth State */}
                <Card>
                    <CardHeader>
                        <CardTitle>Auth State</CardTitle>
                        <CardDescription>Current authentication state from useAuth hook</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 font-mono text-sm">
                            <div>
                                <strong>isLoading:</strong> {isLoading ? 'true' : 'false'}
                            </div>
                            <div>
                                <strong>isAuthenticated:</strong> {isAuthenticated ? 'true' : 'false'}
                            </div>
                            <div>
                                <strong>userRole:</strong> {userRole || 'null'}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* User Object */}
                <Card>
                    <CardHeader>
                        <CardTitle>User Object</CardTitle>
                        <CardDescription>Current user data from context</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <pre className="bg-muted p-4 rounded-lg overflow-auto">{JSON.stringify(userData, null, 2)}</pre>
                    </CardContent>
                </Card>

                {/* LocalStorage Data */}
                <Card>
                    <CardHeader>
                        <CardTitle>LocalStorage Data</CardTitle>
                        <CardDescription>Data stored in browser localStorage</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <strong className="block mb-2">User:</strong>
                                <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
                                    {storageUser || 'null'}
                                </pre>
                            </div>
                            <div>
                                <strong className="block mb-2">Token:</strong>
                                <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs break-all">
                                    {storageToken || 'null'}
                                </pre>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Role Normalization Test */}
                {user && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Role Normalization Test</CardTitle>
                            <CardDescription>Test role normalization and routing</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 font-mono text-sm">
                                <div>
                                    <strong>user.role:</strong> {user.role || 'undefined'}
                                </div>
                                <div>
                                    <strong>user.roleName:</strong> {user.roleName || 'undefined'}
                                </div>
                                <div>
                                    <strong>Normalized (from role):</strong>{' '}
                                    {user.role ? normalizeRoleName(user.role) : 'N/A'}
                                </div>
                                <div>
                                    <strong>Normalized (from roleName):</strong>{' '}
                                    {user.roleName ? normalizeRoleName(user.roleName) : 'N/A'}
                                </div>
                                <div>
                                    <strong>Default Route (from role):</strong>{' '}
                                    {user.role ? getDefaultRouteByRole(user.role) : 'N/A'}
                                </div>
                                <div>
                                    <strong>Default Route (from roleName):</strong>{' '}
                                    {user.roleName ? getDefaultRouteByRole(user.roleName) : 'N/A'}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Permissions */}
                {userPermissions && (
                    <Card>
                        <CardHeader>
                            <CardTitle>User Permissions</CardTitle>
                            <CardDescription>Permissions for current role</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <pre className="bg-muted p-4 rounded-lg overflow-auto">
                                {JSON.stringify(userPermissions, null, 2)}
                            </pre>
                        </CardContent>
                    </Card>
                )}

                {/* Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Debug Actions</CardTitle>
                        <CardDescription>Test actions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-4">
                            <Button
                                onClick={() => {
                                    console.log('=== Current Auth State ===')
                                    console.log('User:', user)
                                    console.log('UserRole:', userRole)
                                    console.log('isAuthenticated:', isAuthenticated)
                                    console.log('LocalStorage User:', localStorage.getItem('user'))
                                }}
                            >
                                Log to Console
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    localStorage.clear()
                                    window.location.reload()
                                }}
                            >
                                Clear LocalStorage
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
