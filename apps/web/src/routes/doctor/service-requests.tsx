import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@workspace/ui/components/Card'
import { api } from '../../shared/lib/api'
import { ClipboardList, Search, Filter, CheckCircle, XCircle, Clock } from 'lucide-react'
import { Input } from '@workspace/ui/components/Textfield'

export const Route = createFileRoute('/doctor/service-requests')({
    component: DoctorServiceRequestsPage,
})

function DoctorServiceRequestsPage() {
    // Fetch service requests
    const { data: serviceRequests, isLoading } = useQuery({
        queryKey: ['doctor-service-requests'],
        queryFn: () => api.serviceRequest.getServiceRequests({ limit: 50 }),
        retry: false,
    })

    return (
        <div className="container mx-auto px-6 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Service Requests</h1>
                <p className="text-muted-foreground">Manage patient service requests</p>
            </div>

            <div className="mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search service requests..." className="pl-10" />
                    </div>
                    <Filter className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted cursor-pointer">
                        <Filter className="h-4 w-4" />
                        <span>Filters</span>
                    </Filter>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Service Requests</CardTitle>
                    <CardDescription>{serviceRequests?.total || 0} total service requests</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50 animate-spin" />
                            <p>Loading service requests...</p>
                        </div>
                    ) : serviceRequests?.data && serviceRequests.data.length > 0 ? (
                        <div className="space-y-4">
                            {serviceRequests.data.map(request => (
                                <div
                                    key={request.id}
                                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-semibold text-lg">{request.serviceName}</h3>
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-medium capitalize flex items-center gap-1 ${
                                                        request.status === 'completed'
                                                            ? 'bg-green-100 text-green-700'
                                                            : request.status === 'approved'
                                                              ? 'bg-blue-100 text-blue-700'
                                                              : request.status === 'rejected' ||
                                                                  request.status === 'cancelled'
                                                                ? 'bg-red-100 text-red-700'
                                                                : 'bg-yellow-100 text-yellow-700'
                                                    }`}
                                                >
                                                    {request.status === 'pending' && <Clock className="h-3 w-3" />}
                                                    {request.status === 'approved' && (
                                                        <CheckCircle className="h-3 w-3" />
                                                    )}
                                                    {(request.status === 'rejected' ||
                                                        request.status === 'cancelled') && (
                                                        <XCircle className="h-3 w-3" />
                                                    )}
                                                    {request.status === 'completed' && (
                                                        <CheckCircle className="h-3 w-3" />
                                                    )}
                                                    {request.status}
                                                </span>
                                            </div>
                                            <div className="space-y-2 mb-3">
                                                <p className="text-sm">
                                                    <span className="font-medium">Patient:</span> {request.patientName}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    Requested Date:{' '}
                                                    {new Date(request.requestedDate).toLocaleDateString()}
                                                </p>
                                                {request.approvedDate && (
                                                    <p className="text-sm text-muted-foreground">
                                                        Approved Date:{' '}
                                                        {new Date(request.approvedDate).toLocaleDateString()}
                                                    </p>
                                                )}
                                                {request.completedDate && (
                                                    <p className="text-sm text-muted-foreground">
                                                        Completed Date:{' '}
                                                        {new Date(request.completedDate).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>
                                            {request.notes && (
                                                <p className="text-sm text-muted-foreground">Note: {request.notes}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No service requests found</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
