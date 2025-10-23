import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@workspace/ui/components/Button'
import { Card, CardContent } from '@workspace/ui/components/Card'
import { Input } from '@workspace/ui/components/Textfield'
import { FlaskConical, Search, Plus, Filter, Thermometer, MapPin, Calendar } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/samples')({
    component: SamplesPage,
})

function SamplesPage() {
    const [searchTerm, setSearchTerm] = useState('')
    const [filterType, setFilterType] = useState('all')

    // TODO: Fetch samples from API
    // const { data: samples, isLoading } = useQuery({
    //     queryKey: ['samples', searchTerm, filterType],
    //     queryFn: () => api.samples.getSamples({
    //         search: searchTerm,
    //         type: filterType !== 'all' ? filterType : undefined,
    //         page: 1,
    //         limit: 10
    //     })
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
                        <Link to="/patients" className="text-sm font-medium hover:text-primary transition-colors">
                            Patients
                        </Link>
                        <Link to="/samples" className="text-sm font-medium text-primary">
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
                        <h1 className="text-3xl font-bold mb-2">Sample Storage</h1>
                        <p className="text-muted-foreground">Track and manage cryogenic samples</p>
                    </div>
                    <Button asChild>
                        <Link to="/samples/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Register Sample
                        </Link>
                    </Button>
                </div>

                {/* Search and Filters */}
                <Card className="mb-6">
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search samples by ID or patient..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <select
                                value={filterType}
                                onChange={e => setFilterType(e.target.value)}
                                className="px-3 py-2 rounded-sm border bg-background text-sm"
                            >
                                <option value="all">All Types</option>
                                <option value="sperm">Sperm</option>
                                <option value="egg">Egg</option>
                                <option value="embryo">Embryo</option>
                                <option value="tissue">Tissue</option>
                            </select>
                            <Button variant="outline">
                                <Filter className="mr-2 h-4 w-4" />
                                More Filters
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Storage Alerts */}
                <Card className="mb-6 border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-900/10">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <Thermometer className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                            <div>
                                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                                    Storage Monitoring Active
                                </h3>
                                <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                                    TODO: Connect API to display real-time storage alerts and temperature monitoring
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Samples Grid */}
                <div className="grid md:grid-cols-2 gap-4">
                    {/* TODO: Replace with actual data from API */}
                    <SampleCard
                        id="TODO"
                        type="sperm"
                        patientName="TODO - Connect API"
                        collectionDate="TODO"
                        location="Tank TODO"
                        temperature="-196°C"
                        status="stored"
                    />
                    <SampleCard
                        id="TODO"
                        type="egg"
                        patientName="TODO - Connect API"
                        collectionDate="TODO"
                        location="Tank TODO"
                        temperature="-196°C"
                        status="stored"
                    />
                    <SampleCard
                        id="TODO"
                        type="embryo"
                        patientName="TODO - Connect API"
                        collectionDate="TODO"
                        location="Tank TODO"
                        temperature="-196°C"
                        status="stored"
                    />
                    <SampleCard
                        id="TODO"
                        type="tissue"
                        patientName="TODO - Connect API"
                        collectionDate="TODO"
                        location="Tank TODO"
                        temperature="-196°C"
                        status="in-use"
                    />

                    {/* Empty State */}
                    <Card className="md:col-span-2 border-dashed">
                        <CardContent className="py-12 text-center">
                            <FlaskConical className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <h3 className="text-lg font-semibold mb-2">No samples found</h3>
                            <p className="text-muted-foreground mb-4">
                                Connect API to view stored samples or register a new sample
                            </p>
                            <Button asChild>
                                <Link to="/samples/new">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Register Sample
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Pagination */}
                <div className="mt-8 flex items-center justify-center gap-2">
                    <Button variant="outline" size="sm" disabled>
                        Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">Page 1 of TODO</span>
                    <Button variant="outline" size="sm" disabled>
                        Next
                    </Button>
                </div>
            </main>
        </div>
    )
}

function SampleCard({
    id,
    type,
    patientName,
    collectionDate,
    location,
    temperature,
    status,
}: {
    id: string
    type: string
    patientName: string
    collectionDate: string
    location: string
    temperature: string
    status: string
}) {
    const typeColors = {
        sperm: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        egg: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
        embryo: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
        tissue: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    }

    return (
        <Card className="hover:border-primary/40 transition-colors">
            <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <FlaskConical className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold">Sample #{id}</h3>
                                <span
                                    className={`text-xs px-2 py-1 rounded-full ${typeColors[type as keyof typeof typeColors]}`}
                                >
                                    {type}
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{patientName}</p>
                        </div>
                    </div>
                    <span
                        className={`text-xs px-2 py-1 rounded-full ${
                            status === 'stored'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                        }`}
                    >
                        {status}
                    </span>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span>Collected: {collectionDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        <span>Location: {location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Thermometer className="h-3 w-3" />
                        <span>Temperature: {temperature}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                        View Details
                    </Button>
                    <Button variant="ghost" size="sm">
                        Transfer
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
