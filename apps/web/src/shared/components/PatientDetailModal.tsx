import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@workspace/ui/components/Dialog'
import { Button } from '@workspace/ui/components/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { Badge } from '@workspace/ui/components/Badge'
import { Input } from '@workspace/ui/components/Textfield'
import { Tabs, TabList, Tab, TabPanel } from '@workspace/ui/components/Tabs'
import { api } from '@/shared/lib/api'
import {
    Loader2,
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Hash,
    Stethoscope,
    FlaskConical,
    Users,
    FileText,
    Heart,
    Maximize2,
    Minimize2,
    Edit,
    Save,
    X,
    Search,
    Plus,
    FileDown,
    Calendar as CalendarIcon,
    AlertCircle,
    CheckCircle2,
    Clock,
    History,
    ChevronRight,
} from 'lucide-react'
import type { Patient } from '@workspace/lib/api'

interface PatientDetailModalProps {
    isOpen: boolean
    onClose: () => void
    patientId: string
}

export function PatientDetailModal({ isOpen, onClose, patientId }: PatientDetailModalProps) {
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [activeTab, setActiveTab] = useState('basic')
    const [isEditing, setIsEditing] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    const { data: patientDetails, isLoading } = useQuery({
        queryKey: ['patient-details', patientId],
        queryFn: () => api.patient.getPatientDetails(patientId),
        enabled: isOpen && !!patientId,
    })

    if (isLoading) {
        return (
            <DialogTrigger isOpen={isOpen} onOpenChange={onClose}>
                <DialogContent className="!max-w-[98vw] !w-[98vw] !max-h-[95vh] md:!max-w-[98vw] overflow-y-auto !rounded-none">
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                </DialogContent>
            </DialogTrigger>
        )
    }

    if (!patientDetails) {
        return (
            <DialogTrigger isOpen={isOpen} onOpenChange={onClose}>
                <DialogContent className="!max-w-[98vw] !w-[98vw] !max-h-[95vh] md:!max-w-[98vw] overflow-y-auto !rounded-none">
                    <div className="text-center py-12 text-muted-foreground">
                        <p>Patient not found</p>
                    </div>
                </DialogContent>
            </DialogTrigger>
        )
    }

    const displayName = patientDetails.accountInfo?.username || patientDetails.fullName || 'Unknown'
    const displayEmail = patientDetails.accountInfo?.email || patientDetails.email
    const displayPhone = patientDetails.accountInfo?.phone || patientDetails.phone
    const displayAddress = patientDetails.accountInfo?.address || patientDetails.address
    const patientCode = patientDetails.patientCode || patientDetails.code || 'N/A'

    // Filter treatments and samples based on search
    const filteredTreatments =
        patientDetails.treatments?.filter(t => {
            if (!searchQuery) return true
            const query = searchQuery.toLowerCase()
            return (
                t.treatmentCode?.toLowerCase().includes(query) ||
                t.status?.toLowerCase().includes(query) ||
                t.startDate?.toLowerCase().includes(query)
            )
        }) || []

    const filteredLabSamples =
        patientDetails.labSamples?.filter(s => {
            if (!searchQuery) return true
            const query = searchQuery.toLowerCase()
            return (
                s.sampleCode?.toLowerCase().includes(query) ||
                s.sampleType?.toLowerCase().includes(query) ||
                s.status?.toLowerCase().includes(query)
            )
        }) || []

    // Timeline events
    const timelineEvents = [
        { date: patientDetails.createdAt, label: 'Patient Created', icon: User, type: 'created' },
        ...(patientDetails.treatments?.map(t => ({
            date: t.startDate || patientDetails.createdAt,
            label: `Treatment ${t.treatmentCode || 'Added'}`,
            icon: Stethoscope,
            type: 'treatment' as const,
        })) || []),
        ...(patientDetails.updatedAt
            ? [
                  {
                      date: patientDetails.updatedAt,
                      label: 'Last Updated',
                      icon: Edit,
                      type: 'updated' as const,
                  },
              ]
            : []),
    ].sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime())

    return (
        <DialogTrigger isOpen={isOpen} onOpenChange={onClose}>
            <DialogContent
                className={`${
                    isFullscreen
                        ? '!max-w-[100vw] !w-screen h-screen !max-h-screen !left-0 !top-0 !-translate-x-0 !-translate-y-0'
                        : '!max-w-[98vw] !w-[98vw] !max-h-[95vh] md:!max-w-[98vw] !left-[1vw] !top-[2.5vh] !-translate-x-0 !-translate-y-0'
                } overflow-hidden p-0 !rounded-none`}
            >
                {/* Header with Breadcrumb and Actions */}
                <div className="border-b bg-muted/30 px-6 py-4 flex-shrink-0">
                    <div className="flex items-center justify-between gap-4 min-w-0">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0 flex-1">
                            <span className="flex-shrink-0">Patients</span>
                            <ChevronRight className="h-4 w-4 flex-shrink-0" />
                            <span className="font-semibold text-foreground truncate">
                                {displayName} ({patientCode})
                            </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <Button
                                variant="ghost"
                                size="sm"
                                onPress={() => setIsFullscreen(!isFullscreen)}
                                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                                className="flex-shrink-0"
                            >
                                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex h-[calc(95vh-80px)] overflow-hidden min-w-0">
                    {/* Sidebar Summary */}
                    <div className="w-80 flex-shrink-0 border-r bg-muted/20 p-6 overflow-y-auto">
                        <div className="space-y-6">
                            {/* Profile Photo/Avatar */}
                            <div className="flex flex-col items-center">
                                <div className="relative w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center mb-4 border-4 border-primary/20">
                                    {(patientDetails as any).accountInfo?.image || (patientDetails as any).image ? (
                                        <img
                                            src={
                                                (patientDetails as any).accountInfo?.image ||
                                                (patientDetails as any).image
                                            }
                                            alt={displayName}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center w-full h-full">
                                            <span className="text-3xl font-bold text-primary">
                                                {displayName.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground p-0"
                                        aria-label="Edit photo"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </div>
                                <h2 className="text-xl font-bold text-center">{displayName}</h2>
                                <p className="text-sm text-muted-foreground">{patientCode}</p>
                            </div>

                            {/* Quick Status */}
                            <Card className="border-2">
                                <CardContent className="pt-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">Status</span>
                                            <Badge
                                                className={
                                                    patientDetails.isActive
                                                        ? 'bg-green-100 text-green-800 px-3 py-1'
                                                        : 'bg-gray-100 text-gray-800 px-3 py-1'
                                                }
                                            >
                                                {patientDetails.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                        {patientDetails.accountInfo?.isVerified !== undefined && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">Email</span>
                                                <Badge
                                                    className={
                                                        patientDetails.accountInfo.isVerified
                                                            ? 'bg-green-100 text-green-800 px-3 py-1'
                                                            : 'bg-yellow-100 text-yellow-800 px-3 py-1'
                                                    }
                                                >
                                                    {patientDetails.accountInfo.isVerified ? (
                                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                                    ) : (
                                                        <AlertCircle className="h-3 w-3 mr-1" />
                                                    )}
                                                    {patientDetails.accountInfo.isVerified ? 'Verified' : 'Pending'}
                                                </Badge>
                                            </div>
                                        )}
                                        {patientDetails.bloodType && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">Blood Type</span>
                                                <span className="text-base font-semibold">
                                                    {patientDetails.bloodType}
                                                </span>
                                            </div>
                                        )}
                                        {patientDetails.height && patientDetails.weight && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">BMI</span>
                                                <span className="text-base font-semibold">
                                                    {patientDetails.bmi
                                                        ? patientDetails.bmi.toFixed(1)
                                                        : (
                                                              patientDetails.weight /
                                                              (patientDetails.height / 100) ** 2
                                                          ).toFixed(1)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Quick Stats */}
                            <Card className="border-2">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm">Quick Stats</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Stethoscope className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm text-muted-foreground">Treatments</span>
                                        </div>
                                        <span className="text-lg font-bold">
                                            {patientDetails.treatmentCount ?? patientDetails.treatments?.length ?? 0}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <FlaskConical className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm text-muted-foreground">Lab Samples</span>
                                        </div>
                                        <span className="text-lg font-bold">
                                            {patientDetails.labSampleCount ?? patientDetails.labSamples?.length ?? 0}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm text-muted-foreground">Relationships</span>
                                        </div>
                                        <span className="text-lg font-bold">
                                            {patientDetails.relationshipCount ??
                                                patientDetails.relationships?.length ??
                                                0}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Emergency Contact Quick View */}
                            {(patientDetails.emergencyContact || patientDetails.emergencyPhone) && (
                                <Card className="border-2">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm">Emergency Contact</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        {patientDetails.emergencyContact && (
                                            <div>
                                                <p className="text-xs text-muted-foreground">Name</p>
                                                <p className="text-sm font-medium">{patientDetails.emergencyContact}</p>
                                            </div>
                                        )}
                                        {patientDetails.emergencyPhone && (
                                            <div>
                                                <p className="text-xs text-muted-foreground">Phone</p>
                                                <p className="text-sm font-medium">{patientDetails.emergencyPhone}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>

                    {/* Main Content Area with Tabs */}
                    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                        <Tabs
                            selectedKey={activeTab}
                            onSelectionChange={key => setActiveTab(key as string)}
                            className="flex-1 flex flex-col h-full min-w-0"
                        >
                            <div className="border-b px-6 flex-shrink-0 overflow-x-auto">
                                <TabList className="flex gap-1 min-w-max">
                                    <Tab id="basic" className="px-4 py-2">
                                        <User className="h-4 w-4 mr-2" />
                                        Basic
                                    </Tab>
                                    <Tab id="contact" className="px-4 py-2">
                                        <Mail className="h-4 w-4 mr-2" />
                                        Contact
                                    </Tab>
                                    <Tab id="medical" className="px-4 py-2">
                                        <Heart className="h-4 w-4 mr-2" />
                                        Medical
                                    </Tab>
                                    <Tab id="treatments" className="px-4 py-2">
                                        <Stethoscope className="h-4 w-4 mr-2" />
                                        Treatments ({patientDetails.treatments?.length || 0})
                                    </Tab>
                                    <Tab id="history" className="px-4 py-2">
                                        <History className="h-4 w-4 mr-2" />
                                        History
                                    </Tab>
                                </TabList>
                            </div>

                            <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 min-w-0">
                                {/* Basic Information Tab */}
                                <TabPanel id="basic" className="space-y-4">
                                    <Card className="border-2">
                                        <CardHeader className="bg-muted/50 pb-3">
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="flex items-center gap-2 text-lg">
                                                    <User className="h-5 w-5 text-primary" />
                                                    Basic Information
                                                </CardTitle>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onPress={() => setIsEditing(!isEditing)}
                                                >
                                                    {isEditing ? (
                                                        <>
                                                            <X className="h-4 w-4 mr-1" />
                                                            Cancel
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Edit className="h-4 w-4 mr-1" />
                                                            Edit
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                <div className="space-y-1 min-w-0">
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                        Full Name
                                                    </p>
                                                    {isEditing ? (
                                                        <Input defaultValue={displayName} className="text-lg" />
                                                    ) : (
                                                        <p className="text-lg font-semibold text-foreground break-words">
                                                            {displayName}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="space-y-1 min-w-0">
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                        Patient Code
                                                    </p>
                                                    <p className="text-lg font-medium text-foreground break-words">
                                                        {patientCode}
                                                    </p>
                                                </div>
                                                <div className="space-y-1 min-w-0">
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                        National ID
                                                    </p>
                                                    <p className="text-lg font-medium text-foreground break-words">
                                                        {patientDetails.nationalId || 'N/A'}
                                                    </p>
                                                </div>
                                                {patientDetails.gender && (
                                                    <div className="space-y-1 min-w-0">
                                                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                            Gender
                                                        </p>
                                                        <p className="text-lg font-medium capitalize text-foreground break-words">
                                                            {patientDetails.gender}
                                                        </p>
                                                    </div>
                                                )}
                                                {patientDetails.dateOfBirth && (
                                                    <div className="space-y-1 min-w-0">
                                                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                            Date of Birth
                                                        </p>
                                                        <p className="text-lg font-medium text-foreground break-words">
                                                            {new Date(patientDetails.dateOfBirth).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                )}
                                                {patientDetails.nationality && (
                                                    <div className="space-y-1 min-w-0">
                                                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                            Nationality
                                                        </p>
                                                        <p className="text-lg font-medium text-foreground break-words">
                                                            {patientDetails.nationality}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabPanel>

                                {/* Contact Information Tab */}
                                <TabPanel id="contact" className="space-y-4">
                                    <Card className="border-2">
                                        <CardHeader className="bg-muted/50 pb-3">
                                            <CardTitle className="flex items-center gap-2 text-lg">
                                                <Mail className="h-5 w-5 text-primary" />
                                                Contact Information
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {displayEmail && (
                                                    <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border min-w-0">
                                                        <Mail className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                                                        <div className="space-y-1 flex-1 min-w-0">
                                                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                                Email
                                                            </p>
                                                            <p className="text-lg font-medium text-foreground break-all break-words">
                                                                {displayEmail}
                                                            </p>
                                                            {patientDetails.accountInfo?.isVerified && (
                                                                <Badge className="bg-green-100 text-green-800 mt-1">
                                                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                                                    Verified
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                                {displayPhone && (
                                                    <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border min-w-0">
                                                        <Phone className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                                                        <div className="space-y-1 flex-1 min-w-0">
                                                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                                Phone
                                                            </p>
                                                            <p className="text-lg font-medium text-foreground break-words">
                                                                {displayPhone}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                                {displayAddress && (
                                                    <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border md:col-span-2 min-w-0">
                                                        <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                                                        <div className="space-y-1 flex-1 min-w-0">
                                                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                                Address
                                                            </p>
                                                            <p className="text-lg font-medium text-foreground break-words">
                                                                {displayAddress}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {(patientDetails.emergencyContact || patientDetails.emergencyPhone) && (
                                        <Card className="border-2">
                                            <CardHeader className="bg-muted/50 pb-3">
                                                <CardTitle className="flex items-center gap-2 text-lg">
                                                    <Phone className="h-5 w-5 text-primary" />
                                                    Emergency Contact
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="pt-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
                                                    {patientDetails.emergencyContact && (
                                                        <div className="space-y-1 p-4 rounded-lg bg-muted/30 border min-w-0">
                                                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                                Contact Name
                                                            </p>
                                                            <p className="text-lg font-medium text-foreground break-words">
                                                                {patientDetails.emergencyContact}
                                                            </p>
                                                        </div>
                                                    )}
                                                    {patientDetails.emergencyPhone && (
                                                        <div className="space-y-1 p-4 rounded-lg bg-muted/30 border min-w-0">
                                                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                                Contact Phone
                                                            </p>
                                                            <p className="text-lg font-medium text-foreground break-words">
                                                                {patientDetails.emergencyPhone}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}
                                </TabPanel>

                                {/* Medical Information Tab */}
                                <TabPanel id="medical" className="space-y-4">
                                    <Card className="border-2">
                                        <CardHeader className="bg-muted/50 pb-3">
                                            <CardTitle className="flex items-center gap-2 text-lg">
                                                <Heart className="h-5 w-5 text-primary" />
                                                Medical Information
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 min-w-0">
                                                {patientDetails.bloodType && (
                                                    <div className="space-y-1 p-3 rounded-lg bg-muted/30 border min-w-0">
                                                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                            Blood Type
                                                        </p>
                                                        <p className="text-lg font-semibold text-foreground break-words">
                                                            {patientDetails.bloodType}
                                                        </p>
                                                    </div>
                                                )}
                                                {patientDetails.height && (
                                                    <div className="space-y-1 p-3 rounded-lg bg-muted/30 border min-w-0">
                                                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                            Height
                                                        </p>
                                                        <p className="text-lg font-medium text-foreground break-words">
                                                            {patientDetails.height} cm
                                                        </p>
                                                    </div>
                                                )}
                                                {patientDetails.weight && (
                                                    <div className="space-y-1 p-3 rounded-lg bg-muted/30 border min-w-0">
                                                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                            Weight
                                                        </p>
                                                        <p className="text-lg font-medium text-foreground break-words">
                                                            {patientDetails.weight} kg
                                                        </p>
                                                    </div>
                                                )}
                                                {patientDetails.bmi && (
                                                    <div className="space-y-1 p-3 rounded-lg bg-muted/30 border min-w-0">
                                                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                            BMI
                                                        </p>
                                                        <p className="text-lg font-medium text-foreground break-words">
                                                            {patientDetails.bmi.toFixed(1)}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                            {patientDetails.medicalHistory && (
                                                <div className="mt-4 p-4 rounded-lg bg-muted/30 border">
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                                                        Medical History
                                                    </p>
                                                    <p className="text-base whitespace-pre-wrap text-foreground leading-relaxed">
                                                        {patientDetails.medicalHistory}
                                                    </p>
                                                </div>
                                            )}
                                            {patientDetails.allergies && (
                                                <div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-200">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <AlertCircle className="h-4 w-4 text-red-600" />
                                                        <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
                                                            Allergies
                                                        </p>
                                                    </div>
                                                    <p className="text-base text-red-900">{patientDetails.allergies}</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {(patientDetails.occupation ||
                                        patientDetails.insurance ||
                                        patientDetails.notes) && (
                                        <Card className="border-2">
                                            <CardHeader className="bg-muted/50 pb-3">
                                                <CardTitle className="flex items-center gap-2 text-lg">
                                                    <FileText className="h-5 w-5 text-primary" />
                                                    Additional Information
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="pt-6">
                                                <div className="space-y-4">
                                                    {patientDetails.occupation && (
                                                        <div className="p-4 rounded-lg bg-muted/30 border">
                                                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                                                                Occupation
                                                            </p>
                                                            <p className="text-lg font-medium text-foreground">
                                                                {patientDetails.occupation}
                                                            </p>
                                                        </div>
                                                    )}
                                                    {patientDetails.insurance && (
                                                        <div className="p-4 rounded-lg bg-muted/30 border">
                                                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                                                                Insurance
                                                            </p>
                                                            <p className="text-lg font-medium text-foreground">
                                                                {patientDetails.insurance}
                                                            </p>
                                                        </div>
                                                    )}
                                                    {patientDetails.notes && (
                                                        <div className="p-4 rounded-lg bg-muted/30 border">
                                                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                                                                Notes
                                                            </p>
                                                            <p className="text-base whitespace-pre-wrap text-foreground leading-relaxed">
                                                                {patientDetails.notes}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}
                                </TabPanel>

                                {/* Treatments Tab */}
                                <TabPanel id="treatments" className="space-y-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold">Treatments</h3>
                                        <div className="flex items-center gap-2">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder="Search treatments..."
                                                    className="pl-10 w-64"
                                                    value={searchQuery}
                                                    onChange={e => setSearchQuery(e.target.value)}
                                                />
                                            </div>
                                            <Button size="sm">
                                                <Plus className="h-4 w-4 mr-1" />
                                                Add Treatment
                                            </Button>
                                        </div>
                                    </div>

                                    {filteredTreatments.length === 0 ? (
                                        <Card>
                                            <CardContent className="py-12 text-center">
                                                <Stethoscope className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                                                <p className="text-muted-foreground">No treatments found</p>
                                            </CardContent>
                                        </Card>
                                    ) : (
                                        <div className="space-y-3">
                                            {filteredTreatments.map((treatment, index) => (
                                                <Card key={treatment.id || index} className="border-2">
                                                    <CardContent className="pt-6">
                                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 min-w-0">
                                                            {treatment.treatmentCode && (
                                                                <div className="min-w-0">
                                                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                                        Code
                                                                    </p>
                                                                    <p className="text-sm font-medium break-words">
                                                                        {treatment.treatmentCode}
                                                                    </p>
                                                                </div>
                                                            )}
                                                            {treatment.startDate && (
                                                                <div className="min-w-0">
                                                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                                        Start Date
                                                                    </p>
                                                                    <p className="text-sm break-words">
                                                                        {new Date(
                                                                            treatment.startDate,
                                                                        ).toLocaleDateString()}
                                                                    </p>
                                                                </div>
                                                            )}
                                                            {treatment.endDate && (
                                                                <div className="min-w-0">
                                                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                                        End Date
                                                                    </p>
                                                                    <p className="text-sm break-words">
                                                                        {new Date(
                                                                            treatment.endDate,
                                                                        ).toLocaleDateString()}
                                                                    </p>
                                                                </div>
                                                            )}
                                                            {treatment.status && (
                                                                <div className="min-w-0">
                                                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                                        Status
                                                                    </p>
                                                                    <Badge className="break-words">
                                                                        {treatment.status}
                                                                    </Badge>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {treatment.notes && (
                                                            <div className="mt-4 pt-4 border-t">
                                                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                                                                    Notes
                                                                </p>
                                                                <p className="text-sm">{treatment.notes}</p>
                                                            </div>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    )}
                                </TabPanel>

                                {/* History Tab */}
                                <TabPanel id="history" className="space-y-4">
                                    <Card className="border-2">
                                        <CardHeader className="bg-muted/50 pb-3">
                                            <CardTitle className="flex items-center gap-2 text-lg">
                                                <History className="h-5 w-5 text-primary" />
                                                Timeline & History
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-6">
                                            <div className="relative">
                                                {/* Timeline */}
                                                <div className="space-y-6">
                                                    {timelineEvents.map((event, index) => {
                                                        const EventIcon = event.icon
                                                        return (
                                                            <div key={index} className="flex gap-4 min-w-0">
                                                                <div className="flex flex-col items-center flex-shrink-0">
                                                                    <div className="rounded-full bg-primary/10 p-2 border-2 border-primary/20">
                                                                        <EventIcon className="h-4 w-4 text-primary" />
                                                                    </div>
                                                                    {index < timelineEvents.length - 1 && (
                                                                        <div className="w-0.5 h-full bg-border min-h-[40px] mt-2" />
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 pb-6 min-w-0">
                                                                    <p className="font-medium text-foreground break-words">
                                                                        {event.label}
                                                                    </p>
                                                                    <p className="text-sm text-muted-foreground break-words">
                                                                        {new Date(event.date || '').toLocaleString()}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-2">
                                        <CardHeader className="bg-muted/50 pb-3">
                                            <CardTitle className="text-lg">Record Information</CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm min-w-0">
                                                <div className="min-w-0">
                                                    <p className="text-muted-foreground">Created At</p>
                                                    <p className="font-medium break-words">
                                                        {new Date(patientDetails.createdAt).toLocaleString()}
                                                    </p>
                                                </div>
                                                {patientDetails.updatedAt && (
                                                    <div className="min-w-0">
                                                        <p className="text-muted-foreground">Last Updated</p>
                                                        <p className="font-medium break-words">
                                                            {new Date(patientDetails.updatedAt).toLocaleString()}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabPanel>
                            </div>
                        </Tabs>

                        {/* Action Toolbar */}
                        <div className="border-t bg-muted/30 px-6 py-3 flex items-center justify-between flex-wrap gap-2 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap min-w-0">
                                <Button variant="outline" size="sm" className="flex-shrink-0">
                                    <CalendarIcon className="h-4 w-4 mr-1" />
                                    Schedule Appointment
                                </Button>
                                <Button variant="outline" size="sm" className="flex-shrink-0">
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Treatment
                                </Button>
                                <Button variant="outline" size="sm" className="flex-shrink-0">
                                    <Users className="h-4 w-4 mr-1" />
                                    Link Relationship
                                </Button>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <Button variant="outline" size="sm" className="flex-shrink-0">
                                    <FileDown className="h-4 w-4 mr-1" />
                                    Generate Report
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </DialogTrigger>
    )
}
