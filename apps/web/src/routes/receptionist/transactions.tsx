import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@workspace/ui/components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { Plus, Search, Filter, CreditCard, DollarSign, Receipt, FileDown, Eye } from 'lucide-react'
import { Input } from '@workspace/ui/components/Textfield'

export const Route = createFileRoute('/receptionist/transactions')({
    component: ReceptionistTransactionsPage,
})

function ReceptionistTransactionsPage() {
    // Note: Transaction API is not yet implemented in the backend
    // TODO: Implement when backend API is available

    return (
        <div className="container mx-auto px-6 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Transaction Management</h1>
                    <p className="text-muted-foreground">Process payments and generate invoices</p>
                </div>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Transaction
                </Button>
            </div>

            {/* Search and Filter */}
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Search transactions..." className="pl-10" />
                            </div>
                        </div>
                        <Button variant="outline">
                            <Filter className="h-4 w-4 mr-2" />
                            Filter
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Transactions Table */}
            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Transactions</CardTitle>
                        <CardDescription>Latest payment transactions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-12 text-muted-foreground">
                            <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="font-medium">Transaction Management Coming Soon</p>
                            <p className="text-sm mt-2">
                                This feature will be implemented when the backend API is ready
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Pending Payments</CardTitle>
                        <CardDescription>Outstanding invoices</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-12 text-muted-foreground">
                            <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="font-medium">Pending Payments Coming Soon</p>
                            <p className="text-sm mt-2">Track and manage outstanding invoices and payments</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Features to be implemented */}
                <div className="grid md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Receipt className="h-5 w-5" />
                                Invoice Generation
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">Generate and manage invoices for services</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Eye className="h-5 w-5" />
                                Payment Processing
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">Process cash and card payments</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <FileDown className="h-5 w-5" />
                                Export Reports
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">Export transaction reports for accounting</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
