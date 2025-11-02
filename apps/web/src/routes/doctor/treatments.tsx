import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@workspace/ui/components/Card'
import { api } from '../../shared/lib/api'
import { Stethoscope, Search, Filter, Clock } from 'lucide-react'
import { Input } from '@workspace/ui/components/Textfield'

export const Route = createFileRoute('/doctor/treatments')({
    component: DoctorTreatmentsPage,
})

function DoctorTreatmentsPage() {
    // Note: Treatment API is not in the backend yet
    // TODO: Implement when backend API is available
    const treatments = { data: [], total: 0 }
    const isLoading = false

    return (
        <div className="container mx-auto px-6 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Treatments</h1>
                <p className="text-muted-foreground">Manage patient treatments and encounters</p>
            </div>

            <div className="mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search treatments..." className="pl-10" />
                    </div>
                    <Filter className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted cursor-pointer">
                        <Filter className="h-4 w-4" />
                        <span>Filters</span>
                    </Filter>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Treatments</CardTitle>
                    <CardDescription>{treatments?.total || 0} total treatments</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                        <Stethoscope className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Treatment management feature is not yet available</p>
                        <p className="text-sm mt-2">This feature will be implemented when the backend API is ready</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
