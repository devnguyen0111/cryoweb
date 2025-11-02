import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@workspace/ui/components/Card'
import { Button } from '@workspace/ui/components/Button'
import {
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
} from '@workspace/ui/components/Dialog'
import { api } from '../../shared/lib/api'
import { Users, Search, Filter, Phone, Mail, Building2, Eye } from 'lucide-react'
import { Input } from '@workspace/ui/components/Textfield'
import type { Patient } from '@workspace/lib/api'

export const Route = createFileRoute('/doctor/patients')({
    component: DoctorPatientsPage,
})

function DoctorPatientsPage() {
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

    // Fetch patients
    const {
        data: patients,
        isLoading,
        error,
    } = useQuery({
        queryKey: ['doctor-patients'],
        queryFn: () => api.patient.getPatients({ limit: 50 }),
        retry: false,
    })

    const handleViewPatient = (patient: Patient) => {
        setSelectedPatient(patient)
        setIsDetailsModalOpen(true)
    }

    const handleCloseModal = () => {
        setIsDetailsModalOpen(false)
        setSelectedPatient(null)
    }

    return (
        <div className="container mx-auto px-6 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Patients</h1>
                <p className="text-muted-foreground">Manage patient records and medical history</p>
            </div>

            <div className="mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search patients..." className="pl-10" />
                    </div>
                    <Button variant="outline" className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        <span>Filters</span>
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Patients</CardTitle>
                    <CardDescription>
                        {patients?.total || patients?.metaData?.total || 0} total patients in your care
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-4 opacity-50 animate-spin" />
                            <p>Loading patients...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 text-red-500">
                            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Error loading patients: {String(error)}</p>
                        </div>
                    ) : patients?.data && patients.data.length > 0 ? (
                        <div className="space-y-4">
                            {patients.data.map(patient => (
                                <div
                                    key={patient.id}
                                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between">
                                        <div
                                            className="flex-1 cursor-pointer"
                                            onClick={() => handleViewPatient(patient)}
                                        >
                                            <div className="flex items-center gap-3 mb-3">
                                                <div>
                                                    <h3 className="font-semibold text-lg">
                                                        {patient.accountInfo?.username || 'Unknown Patient'}
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        Patient Code: {patient.patientCode}
                                                    </p>
                                                </div>
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        patient.isActive
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-gray-100 text-gray-700'
                                                    }`}
                                                >
                                                    {patient.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-4 text-sm mb-3">
                                                {patient.accountInfo?.email && (
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                                        <span>{patient.accountInfo.email}</span>
                                                    </div>
                                                )}
                                                {patient.accountInfo?.phone && (
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                                        <span>{patient.accountInfo.phone}</span>
                                                    </div>
                                                )}
                                                {patient.bloodType && (
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                                        <span>Blood Type: {patient.bloodType}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground">
                                                {patient.nationalId && (
                                                    <div>
                                                        <span className="font-medium">National ID:</span>{' '}
                                                        {patient.nationalId}
                                                    </div>
                                                )}
                                                {patient.emergencyContact && (
                                                    <div>
                                                        <span className="font-medium">Emergency Contact:</span>{' '}
                                                        {patient.emergencyContact}
                                                    </div>
                                                )}
                                                {patient.emergencyPhone && (
                                                    <div>
                                                        <span className="font-medium">Emergency Phone:</span>{' '}
                                                        {patient.emergencyPhone}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                                                {patient.treatmentCount !== undefined && (
                                                    <span>Treatments: {patient.treatmentCount}</span>
                                                )}
                                                {patient.labSampleCount !== undefined && (
                                                    <span>Samples: {patient.labSampleCount}</span>
                                                )}
                                                {patient.relationshipCount !== undefined && (
                                                    <span>Relationships: {patient.relationshipCount}</span>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onPress={() => handleViewPatient(patient)}
                                            className="h-8"
                                        >
                                            <Eye className="h-3 w-3" /> View
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No patients found</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Patient Details Modal */}
            <DialogTrigger isOpen={isDetailsModalOpen} onOpenChange={handleCloseModal}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Patient Details</DialogTitle>
                        <DialogDescription>View complete patient information and medical records</DialogDescription>
                    </DialogHeader>

                    {selectedPatient && (
                        <div className="space-y-6 py-4">
                            {/* Patient Basic Info */}
                            <div className="border-b pb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-xl font-bold">
                                        {selectedPatient.accountInfo?.username || 'Unknown Patient'}
                                    </h3>
                                    <span
                                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                                            selectedPatient.isActive
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-700'
                                        }`}
                                    >
                                        {selectedPatient.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <p className="text-muted-foreground">Patient Code: {selectedPatient.patientCode}</p>
                            </div>

                            {/* Contact Information */}
                            <div className="border-b pb-4">
                                <h4 className="font-semibold mb-3">Contact Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {selectedPatient.accountInfo?.email && (
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Email</p>
                                                <p className="font-medium">{selectedPatient.accountInfo.email}</p>
                                            </div>
                                        </div>
                                    )}
                                    {selectedPatient.accountInfo?.phone && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Phone</p>
                                                <p className="font-medium">{selectedPatient.accountInfo.phone}</p>
                                            </div>
                                        </div>
                                    )}
                                    {selectedPatient.accountInfo?.address && (
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Address</p>
                                                <p className="font-medium">{selectedPatient.accountInfo.address}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Identity Information */}
                            <div className="border-b pb-4">
                                <h4 className="font-semibold mb-3">Identity Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {selectedPatient.nationalId && (
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">National ID</p>
                                            <p className="font-medium">{selectedPatient.nationalId}</p>
                                        </div>
                                    )}
                                    {selectedPatient.accountInfo?.isVerified !== undefined && (
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Verification Status</p>
                                            <p className="font-medium">
                                                {selectedPatient.accountInfo.isVerified ? (
                                                    <span className="text-green-600">Verified</span>
                                                ) : (
                                                    <span className="text-orange-600">Not Verified</span>
                                                )}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Emergency Contact */}
                            {(selectedPatient.emergencyContact || selectedPatient.emergencyPhone) && (
                                <div className="border-b pb-4">
                                    <h4 className="font-semibold mb-3">Emergency Contact</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {selectedPatient.emergencyContact && (
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Contact Name</p>
                                                <p className="font-medium">{selectedPatient.emergencyContact}</p>
                                            </div>
                                        )}
                                        {selectedPatient.emergencyPhone && (
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Phone</p>
                                                <p className="font-medium">{selectedPatient.emergencyPhone}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Medical Information */}
                            <div className="border-b pb-4">
                                <h4 className="font-semibold mb-3">Medical Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {selectedPatient.bloodType && (
                                        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                            <p className="text-xs font-medium text-red-700 mb-1">Blood Type</p>
                                            <p className="text-xl font-bold text-red-700">
                                                {selectedPatient.bloodType}
                                            </p>
                                        </div>
                                    )}
                                    {selectedPatient.height && (
                                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                            <p className="text-xs font-medium text-blue-700 mb-1">Height</p>
                                            <p className="text-xl font-bold text-blue-700">
                                                {selectedPatient.height} cm
                                            </p>
                                        </div>
                                    )}
                                    {selectedPatient.weight && (
                                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                            <p className="text-xs font-medium text-purple-700 mb-1">Weight</p>
                                            <p className="text-xl font-bold text-purple-700">
                                                {selectedPatient.weight} kg
                                            </p>
                                        </div>
                                    )}
                                </div>
                                {selectedPatient.bmi && (
                                    <div className="mt-3">
                                        <p className="text-xs text-muted-foreground mb-1">BMI</p>
                                        <p className="font-medium">{selectedPatient.bmi}</p>
                                    </div>
                                )}
                            </div>

                            {/* Allergies & Medical History */}
                            {(selectedPatient.allergies || selectedPatient.medicalHistory) && (
                                <div className="border-b pb-4">
                                    <h4 className="font-semibold mb-3">Health Information</h4>
                                    {selectedPatient.allergies && (
                                        <div className="mb-3">
                                            <p className="text-xs text-muted-foreground mb-1">Allergies</p>
                                            <p className="font-medium text-red-600">{selectedPatient.allergies}</p>
                                        </div>
                                    )}
                                    {selectedPatient.medicalHistory && (
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Medical History</p>
                                            <p className="font-medium whitespace-pre-wrap">
                                                {selectedPatient.medicalHistory}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Statistics */}
                            <div className="border-b pb-4">
                                <h4 className="font-semibold mb-3">Statistics</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {selectedPatient.treatmentCount !== undefined && (
                                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                            <p className="text-sm font-medium text-green-700 mb-1">Treatments</p>
                                            <p className="text-2xl font-bold text-green-700">
                                                {selectedPatient.treatmentCount}
                                            </p>
                                        </div>
                                    )}
                                    {selectedPatient.labSampleCount !== undefined && (
                                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                            <p className="text-sm font-medium text-blue-700 mb-1">Lab Samples</p>
                                            <p className="text-2xl font-bold text-blue-700">
                                                {selectedPatient.labSampleCount}
                                            </p>
                                        </div>
                                    )}
                                    {selectedPatient.relationshipCount !== undefined && (
                                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                            <p className="text-sm font-medium text-purple-700 mb-1">Relationships</p>
                                            <p className="text-2xl font-bold text-purple-700">
                                                {selectedPatient.relationshipCount}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Additional Information */}
                            {(selectedPatient.occupation || selectedPatient.insurance) && (
                                <div className="border-b pb-4">
                                    <h4 className="font-semibold mb-3">Additional Information</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {selectedPatient.occupation && (
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Occupation</p>
                                                <p className="font-medium">{selectedPatient.occupation}</p>
                                            </div>
                                        )}
                                        {selectedPatient.insurance && (
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Insurance</p>
                                                <p className="font-medium">{selectedPatient.insurance}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            {selectedPatient.notes && (
                                <div className="border-b pb-4">
                                    <h4 className="font-semibold mb-3">Notes</h4>
                                    <p className="whitespace-pre-wrap">{selectedPatient.notes}</p>
                                </div>
                            )}

                            {/* Timestamps */}
                            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                                {selectedPatient.createdAt && (
                                    <div>
                                        <span className="font-medium">Created:</span>{' '}
                                        {new Date(selectedPatient.createdAt).toLocaleString()}
                                    </div>
                                )}
                                {selectedPatient.updatedAt && (
                                    <div>
                                        <span className="font-medium">Last Updated:</span>{' '}
                                        {new Date(selectedPatient.updatedAt).toLocaleString()}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Dialog Actions */}
                    <DialogFooter>
                        <Button variant="outline" onPress={handleCloseModal}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </DialogTrigger>
        </div>
    )
}
