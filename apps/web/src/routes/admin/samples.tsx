import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { Button } from '@workspace/ui/components/Button'
import { FlaskConical, Plus, Search, Filter, Download, Thermometer, MapPin, Calendar } from 'lucide-react'
import { Badge } from '@workspace/ui/components/Badge'

export const Route = createFileRoute('/admin/samples')({
    component: AdminSamplesPage,
})

function AdminSamplesPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Sample Management</h1>
                    <p className="text-muted-foreground">Track and manage all biological samples in storage</p>
                </div>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Sample
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-4 mb-8">
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Total Samples</CardDescription>
                        <CardTitle className="text-3xl">2,456</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            <span className="text-green-600">+18%</span> from last month
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>In Storage</CardDescription>
                        <CardTitle className="text-3xl">2,234</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Across 45 storage units</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Processed Today</CardDescription>
                        <CardTitle className="text-3xl">34</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">12 new, 22 retrieved</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Critical Alerts</CardDescription>
                        <CardTitle className="text-3xl text-orange-600">3</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Temperature warnings</p>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filters */}
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search samples by ID, patient, or type..."
                                className="w-full pl-10 pr-4 py-2 border rounded-md bg-background"
                            />
                        </div>
                        <Button variant="outline">
                            <Filter className="h-4 w-4 mr-2" />
                            Filter
                        </Button>
                        <Button variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Sample List */}
            <Card>
                <CardHeader>
                    <CardTitle>All Samples</CardTitle>
                    <CardDescription>Complete list of samples in cryogenic storage</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Sample Rows */}
                        <SampleRow
                            sampleId="SMPL-2025-001"
                            patientName="Sarah Johnson"
                            sampleType="Egg (Oocyte)"
                            quantity={12}
                            location="Tank A-03 / Canister 12"
                            temperature="-196°C"
                            storedDate="2025-01-15"
                            status="Normal"
                        />
                        <SampleRow
                            sampleId="SMPL-2025-002"
                            patientName="Michael Chen"
                            sampleType="Embryo"
                            quantity={5}
                            location="Tank B-01 / Canister 08"
                            temperature="-196°C"
                            storedDate="2025-01-18"
                            status="Normal"
                        />
                        <SampleRow
                            sampleId="SMPL-2025-003"
                            patientName="Emily Rodriguez"
                            sampleType="Sperm"
                            quantity={8}
                            location="Tank A-05 / Canister 15"
                            temperature="-195°C"
                            storedDate="2025-01-20"
                            status="Warning"
                        />
                        <SampleRow
                            sampleId="SMPL-2025-004"
                            patientName="David Park"
                            sampleType="Egg (Oocyte)"
                            quantity={15}
                            location="Tank C-02 / Canister 04"
                            temperature="-196°C"
                            storedDate="2025-01-22"
                            status="Normal"
                        />
                        <SampleRow
                            sampleId="SMPL-2025-005"
                            patientName="Jennifer Lee"
                            sampleType="Embryo"
                            quantity={3}
                            location="Tank B-03 / Canister 10"
                            temperature="-196°C"
                            storedDate="2025-01-10"
                            status="Normal"
                        />
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-6 pt-6 border-t">
                        <p className="text-sm text-muted-foreground">Showing 1-5 of 2,456 samples</p>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" isDisabled>
                                Previous
                            </Button>
                            <Button variant="outline" size="sm">
                                1
                            </Button>
                            <Button variant="outline" size="sm">
                                2
                            </Button>
                            <Button variant="outline" size="sm">
                                3
                            </Button>
                            <Button variant="outline" size="sm">
                                Next
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function SampleRow({
    sampleId,
    patientName,
    sampleType,
    quantity,
    location,
    temperature,
    storedDate,
    status,
}: {
    sampleId: string
    patientName: string
    sampleType: string
    quantity: number
    location: string
    temperature: string
    storedDate: string
    status: string
}) {
    const statusColors = {
        Normal: 'bg-green-500/10 text-green-600 border-green-500/20',
        Warning: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
        Critical: 'bg-red-500/10 text-red-600 border-red-500/20',
    }

    return (
        <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
            <div className="flex items-center gap-4 flex-1">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <FlaskConical className="h-6 w-6" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold">{sampleId}</h3>
                        <Badge variant="outline">{sampleType}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span>Patient: {patientName}</span>
                        <span>Qty: {quantity} vials</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="hidden lg:block text-right">
                    <div className="flex items-center gap-2 text-sm mb-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Thermometer className="h-3 w-3" />
                        {temperature}
                    </div>
                </div>

                <div className="hidden md:block text-right">
                    <div className="flex items-center gap-2 text-sm mb-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">Stored</span>
                    </div>
                    <div className="text-sm text-muted-foreground">{storedDate}</div>
                </div>

                <Badge variant="outline" className={statusColors[status as keyof typeof statusColors]}>
                    {status}
                </Badge>

                <Button variant="outline" size="sm">
                    Details
                </Button>
            </div>
        </div>
    )
}
