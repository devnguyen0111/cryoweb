import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@workspace/ui/components/Button'
import { Card, CardContent } from '@workspace/ui/components/Card'
import { Input } from '@workspace/ui/components/Textfield'
import { FlaskConical, Search, Plus, Filter, Users, Mail, Phone, Calendar } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/patients')({
    component: PatientsPage,
})

function PatientsPage() {
    const [searchTerm, setSearchTerm] = useState('')

    // TODO: Fetch patients from API
    // const { data: patients, isLoading } = useQuery({
    //     queryKey: ['patients', searchTerm],
    //     queryFn: () => api.patients.getPatients({ search: searchTerm, page: 1, limit: 10 })
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
                        <Link to="/patients" className="text-sm font-medium text-primary">
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
            <main className="container mx-auto px-4 py-8">
                {/* Page Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Patients</h1>
                        <p className="text-muted-foreground">Manage patient records and information</p>
                    </div>
                    <Button isDisabled>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Patient
                    </Button>
                </div>

                {/* Search and Filters */}
                <Card className="mb-6">
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search patients by name, email, or ID..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Button variant="outline">
                                <Filter className="mr-2 h-4 w-4" />
                                Filters
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Patients List */}
                <div className="space-y-4">
                    {/* TODO: Replace with actual data from API */}
                    <PatientCard
                        id="TODO"
                        name="TODO - Connect API to load patients"
                        email="TODO@example.com"
                        phone="TODO"
                        dateOfBirth="TODO"
                        status="active"
                    />
                    <PatientCard
                        id="TODO"
                        name="TODO - Connect API to load patients"
                        email="TODO@example.com"
                        phone="TODO"
                        dateOfBirth="TODO"
                        status="active"
                    />
                    <PatientCard
                        id="TODO"
                        name="TODO - Connect API to load patients"
                        email="TODO@example.com"
                        phone="TODO"
                        dateOfBirth="TODO"
                        status="inactive"
                    />

                    {/* Empty State */}
                    <Card className="border-dashed">
                        <CardContent className="py-12 text-center">
                            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <h3 className="text-lg font-semibold mb-2">No patients found</h3>
                            <p className="text-muted-foreground mb-4">
                                Get started by adding your first patient record
                            </p>
                            <Button isDisabled>
                                <Plus className="mr-2 h-4 w-4" />
                                Add First Patient
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Pagination - TODO: Implement when API is connected */}
                <div className="mt-8 flex items-center justify-center gap-2">
                    <Button variant="outline" size="sm" isDisabled>
                        Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">Page 1 of TODO</span>
                    <Button variant="outline" size="sm" isDisabled>
                        Next
                    </Button>
                </div>
            </main>
        </div>
    )
}

function PatientCard({
    id,
    name,
    email,
    phone,
    dateOfBirth,
    status,
}: {
    id: string
    name: string
    email: string
    phone: string
    dateOfBirth: string
    status: string
}) {
    return (
        <Card className="hover:border-primary/40 transition-colors">
            <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold truncate">{name}</h3>
                                <span
                                    className={`text-xs px-2 py-1 rounded-full ${
                                        status === 'active'
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                                    }`}
                                >
                                    {status}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {email}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {phone}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {dateOfBirth}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                        <Button variant="outline" size="sm">
                            View Details
                        </Button>
                        <Button variant="ghost" size="sm">
                            Edit
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
