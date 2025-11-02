import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '@workspace/ui/components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { Badge } from '@workspace/ui/components/Badge'
import { api } from '../../shared/lib/api'
import { UserPlus, Search, Filter, Users, Phone, Mail, Calendar, MapPin, Edit, Eye } from 'lucide-react'
import { Input } from '@workspace/ui/components/Textfield'

export const Route = createFileRoute('/receptionist/patients')({
    component: ReceptionistPatientsPage,
})

function ReceptionistPatientsPage() {
    const [searchQuery, setSearchQuery] = useState('')

    // Fetch patients
    const { data: patients, isLoading } = useQuery({
        queryKey: ['receptionist-patients'],
        queryFn: () => api.patient.getPatients({ limit: 100 }).catch(() => ({ data: [], total: 0 })),
        retry: false,
    })

    const filteredPatients = patients?.data?.filter(
        patient =>
            !searchQuery ||
            patient.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            patient.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            patient.code?.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    const getStatusBadge = (status?: string) => {
        if (!status) return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>
        const statusConfig = {
            active: { color: 'bg-green-100 text-green-800', label: 'Active' },
            inactive: { color: 'bg-gray-100 text-gray-800', label: 'Inactive' },
            archived: { color: 'bg-orange-100 text-orange-800', label: 'Archived' },
        }
        const config = statusConfig[status as keyof typeof statusConfig] || {
            color: 'bg-gray-100 text-gray-800',
            label: status,
        }

        return <Badge className={config.color}>{config.label}</Badge>
    }

    const getGenderBadge = (gender?: string) => {
        if (!gender) return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>
        const genderConfig = {
            male: { color: 'bg-blue-100 text-blue-800', label: 'Male' },
            female: { color: 'bg-pink-100 text-pink-800', label: 'Female' },
            other: { color: 'bg-purple-100 text-purple-800', label: 'Other' },
        }
        const config = genderConfig[gender as keyof typeof genderConfig] || {
            color: 'bg-gray-100 text-gray-800',
            label: gender,
        }

        return <Badge className={config.color}>{config.label}</Badge>
    }

    return (
        <div className="container mx-auto px-6 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Patient Management</h1>
                    <p className="text-muted-foreground">Register and manage patient records</p>
                </div>
                <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Register Patient
                </Button>
            </div>

            {/* Search and Filter */}
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search patients by name, ID, or phone..."
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

            {/* Patients Table */}
            <Card>
                <CardHeader>
                    <CardTitle>All Patients</CardTitle>
                    <CardDescription>A list of all registered patients ({patients?.total || 0} total)</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-12 text-muted-foreground">Loading...</div>
                    ) : !filteredPatients || filteredPatients.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No patients found</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredPatients.map(patient => (
                                <div
                                    key={patient.id}
                                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-semibold text-lg">{patient.fullName}</h3>
                                                {getStatusBadge(patient.status)}
                                                {getGenderBadge(patient.gender)}
                                                {patient.code && (
                                                    <span className="text-sm text-muted-foreground">
                                                        #{patient.code}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                                                {patient.phone && (
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="h-4 w-4" />
                                                        {patient.phone}
                                                    </div>
                                                )}
                                                {patient.email && (
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="h-4 w-4" />
                                                        {patient.email}
                                                    </div>
                                                )}
                                                {patient.dateOfBirth && (
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4" />
                                                        {new Date(patient.dateOfBirth).toLocaleDateString()}
                                                    </div>
                                                )}
                                                {patient.address && (
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="h-4 w-4" />
                                                        <span className="truncate">{patient.address}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Button variant="outline" size="sm">
                                                <Eye className="h-4 w-4 mr-1" />
                                                View
                                            </Button>
                                            <Button variant="outline" size="sm">
                                                <Edit className="h-4 w-4 mr-1" />
                                                Edit
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
