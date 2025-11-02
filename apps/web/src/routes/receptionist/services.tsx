import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '@workspace/ui/components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { Badge } from '@workspace/ui/components/Badge'
import { ConfirmDialog } from '@workspace/ui/components/ConfirmDialog'
import { api } from '../../shared/lib/api'
import { handleApiError, showCrudSuccess } from '../../shared/lib/toast'
import { Search, Filter, Stethoscope, Calendar, User, CheckCircle, XCircle, AlertCircle, Eye } from 'lucide-react'
import { Input } from '@workspace/ui/components/Textfield'

export const Route = createFileRoute('/receptionist/services')({
    component: ReceptionistServicesPage,
})

function ReceptionistServicesPage() {
    const queryClient = useQueryClient()
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [approveRequestId, setApproveRequestId] = useState<string | null>(null)
    const [rejectRequestId, setRejectRequestId] = useState<string | null>(null)

    // Fetch service requests
    const { data: requests, isLoading } = useQuery({
        queryKey: ['receptionist-service-requests'],
        queryFn: () => api.serviceRequest.getServiceRequests({ limit: 100 }).catch(() => ({ data: [], total: 0 })),
        retry: false,
    })

    // Approve service request mutation
    const approveMutation = useMutation({
        mutationFn: (id: string) => api.serviceRequest.approveServiceRequest(id),
        onSuccess: () => {
            showCrudSuccess.update('Service Request')
            queryClient.invalidateQueries({ queryKey: ['receptionist-service-requests'] })
            setApproveRequestId(null)
        },
        onError: error => {
            handleApiError(error, 'Failed to approve service request')
        },
    })

    // Reject service request mutation
    const rejectMutation = useMutation({
        mutationFn: (id: string) => api.serviceRequest.rejectServiceRequest(id),
        onSuccess: () => {
            showCrudSuccess.update('Service Request')
            queryClient.invalidateQueries({ queryKey: ['receptionist-service-requests'] })
            setRejectRequestId(null)
        },
        onError: error => {
            handleApiError(error, 'Failed to reject service request')
        },
    })

    const filteredRequests = requests?.data?.filter(request => {
        const matchesSearch =
            !searchQuery ||
            request.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            request.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            request.status.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesStatus = statusFilter === 'all' || request.status === statusFilter

        return matchesSearch && matchesStatus
    })

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending', icon: AlertCircle },
            approved: { color: 'bg-green-100 text-green-800', label: 'Approved', icon: CheckCircle },
            rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected', icon: XCircle },
            completed: { color: 'bg-gray-100 text-gray-800', label: 'Completed', icon: CheckCircle },
            cancelled: { color: 'bg-orange-100 text-orange-800', label: 'Cancelled', icon: XCircle },
        }
        const config = statusConfig[status as keyof typeof statusConfig] || {
            color: 'bg-gray-100 text-gray-800',
            label: status,
            icon: AlertCircle,
        }
        const Icon = config.icon

        return (
            <Badge className={config.color}>
                <Icon className="h-3 w-3 mr-1" />
                {config.label}
            </Badge>
        )
    }

    const statusCounts = {
        all: requests?.total || 0,
        pending: requests?.data?.filter(r => r.status === 'pending').length || 0,
        approved: requests?.data?.filter(r => r.status === 'approved').length || 0,
        rejected: requests?.data?.filter(r => r.status === 'rejected').length || 0,
        completed: requests?.data?.filter(r => r.status === 'completed').length || 0,
        cancelled: requests?.data?.filter(r => r.status === 'cancelled').length || 0,
    }

    return (
        <div className="container mx-auto px-6 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Service Request Management</h1>
                <p className="text-muted-foreground">Manage service requests and scheduling</p>
            </div>

            {/* Search and Filter */}
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search service requests..."
                                    className="pl-10"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
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

            {/* Status Filters */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
                {Object.entries(statusCounts).map(([status, count]) => (
                    <Card
                        key={status}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                            statusFilter === status ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setStatusFilter(status)}
                    >
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold">{count}</p>
                            <p className="text-sm text-muted-foreground capitalize">{status}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Service Requests List */}
            <Card>
                <CardHeader>
                    <CardTitle>Service Requests</CardTitle>
                    <CardDescription>
                        Service requests ({filteredRequests?.length || 0} matching filters)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-12 text-muted-foreground">Loading...</div>
                    ) : !filteredRequests || filteredRequests.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Stethoscope className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No service requests found</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredRequests.map(request => (
                                <div
                                    key={request.id}
                                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-semibold text-lg">{request.serviceName}</h3>
                                                {getStatusBadge(request.status)}
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground mb-2">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4" />
                                                    {request.patientName}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4" />
                                                    {new Date(request.requestedDate).toLocaleDateString()}
                                                </div>
                                            </div>
                                            {request.notes && (
                                                <p className="text-sm text-muted-foreground">{request.notes}</p>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            {request.status === 'pending' && (
                                                <>
                                                    <Button
                                                        variant="default"
                                                        size="sm"
                                                        className="bg-green-600"
                                                        onPress={() => setApproveRequestId(request.id)}
                                                    >
                                                        <CheckCircle className="h-4 w-4 mr-1" />
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-red-600"
                                                        onPress={() => setRejectRequestId(request.id)}
                                                    >
                                                        <XCircle className="h-4 w-4 mr-1" />
                                                        Reject
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Approve Confirmation */}
            {approveRequestId && (
                <ConfirmDialog
                    isOpen={!!approveRequestId}
                    onClose={() => setApproveRequestId(null)}
                    onConfirm={() => {
                        if (approveRequestId) {
                            approveMutation.mutate(approveRequestId)
                        }
                    }}
                    title="Approve Service Request"
                    description="Are you sure you want to approve this service request? This action cannot be undone."
                    confirmText="Approve"
                    cancelText="Cancel"
                />
            )}

            {/* Reject Confirmation */}
            {rejectRequestId && (
                <ConfirmDialog
                    isOpen={!!rejectRequestId}
                    onClose={() => setRejectRequestId(null)}
                    onConfirm={() => {
                        if (rejectRequestId) {
                            rejectMutation.mutate(rejectRequestId)
                        }
                    }}
                    title="Reject Service Request"
                    description="Are you sure you want to reject this service request? This action cannot be undone."
                    confirmText="Reject"
                    cancelText="Cancel"
                    variant="destructive"
                />
            )}
        </div>
    )
}
