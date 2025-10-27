import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@workspace/ui/components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import {
    HeartPulse,
    FlaskConical,
    Shield,
    Database,
    Lock,
    BarChart3,
    Users,
    Calendar,
    FileText,
    Zap,
    Bell,
    CheckCircle2,
    ArrowRight,
} from 'lucide-react'
import { Badge } from '@workspace/ui/components/Badge'

export const Route = createFileRoute('/features')({
    component: FeaturesPage,
})

function FeaturesPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <HeartPulse className="h-8 w-8 text-primary" />
                        <span className="font-bold text-xl">CryoBank</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" asChild>
                            <Link to="/">Home</Link>
                        </Button>
                        <Button size="sm" asChild>
                            <Link to="/register">Get Started</Link>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="py-20 px-4 bg-gradient-to-b from-primary/5 to-background">
                <div className="container mx-auto text-center max-w-4xl">
                    <Badge variant="outline" className="mb-4">
                        Powerful Features
                    </Badge>
                    <h1 className="text-5xl md:text-6xl font-bold mb-6">Everything You Need to Manage Your Cryobank</h1>
                    <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                        Comprehensive tools designed specifically for fertility clinics and cryogenic storage
                        facilities. Streamline operations, ensure compliance, and provide exceptional patient care.
                    </p>
                    <Button size="lg" asChild>
                        <Link to="/register">
                            Start Free Trial
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </section>

            {/* Core Features */}
            <section className="py-20 px-4">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Core Features</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Essential tools for modern cryobank management
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FeatureCard
                            icon={<FlaskConical className="h-8 w-8" />}
                            title="Sample Management"
                            description="Track every sample from collection to storage with detailed metadata, chain of custody, and automated quality checks."
                            features={[
                                'Barcode scanning & labeling',
                                'Automated inventory tracking',
                                'Quality control workflows',
                                'Expiration date alerts',
                            ]}
                        />

                        <FeatureCard
                            icon={<Database className="h-8 w-8" />}
                            title="Cryogenic Storage"
                            description="Monitor tank levels, temperatures, and locations in real-time with automated alerts for any anomalies."
                            features={[
                                'Real-time temperature monitoring',
                                'Tank capacity management',
                                'Location tracking (tank/canister/vial)',
                                'Automated maintenance schedules',
                            ]}
                        />

                        <FeatureCard
                            icon={<Users className="h-8 w-8" />}
                            title="Patient Portal"
                            description="Give patients 24/7 access to their information, test results, and storage status through a secure portal."
                            features={[
                                'Secure login with MFA',
                                'View storage details',
                                'Download reports',
                                'Message healthcare team',
                            ]}
                        />

                        <FeatureCard
                            icon={<Calendar className="h-8 w-8" />}
                            title="Appointment Scheduling"
                            description="Streamline booking for consultations, sample collection, and procedures with automated reminders."
                            features={[
                                'Online booking system',
                                'SMS/email reminders',
                                'Calendar synchronization',
                                'Waitlist management',
                            ]}
                        />

                        <FeatureCard
                            icon={<BarChart3 className="h-8 w-8" />}
                            title="Analytics & Reporting"
                            description="Generate comprehensive reports on inventory, success rates, financials, and operational metrics."
                            features={[
                                'Customizable dashboards',
                                'Success rate tracking',
                                'Financial reports',
                                'Regulatory compliance reports',
                            ]}
                        />

                        <FeatureCard
                            icon={<Shield className="h-8 w-8" />}
                            title="Compliance & Auditing"
                            description="Stay compliant with HIPAA, CAP, FDA regulations with built-in audit trails and documentation."
                            features={[
                                'HIPAA-compliant workflows',
                                'Complete audit logs',
                                'Regulatory documentation',
                                'Automated compliance checks',
                            ]}
                        />
                    </div>
                </div>
            </section>

            {/* Advanced Capabilities */}
            <section className="py-20 px-4 bg-muted/30">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Advanced Capabilities</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Go beyond basic management with intelligent automation
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <DetailedFeature
                            icon={<Zap className="h-10 w-10" />}
                            title="Automated Workflows"
                            description="Reduce manual work and human error with intelligent automation:"
                            items={[
                                'Auto-assign storage locations based on sample type',
                                'Trigger alerts for critical inventory levels',
                                'Schedule periodic quality checks',
                                'Generate reports on predefined schedules',
                                'Automate patient communication',
                            ]}
                        />

                        <DetailedFeature
                            icon={<Bell className="h-10 w-10" />}
                            title="Smart Notifications"
                            description="Stay informed with intelligent, context-aware alerts:"
                            items={[
                                'Temperature excursions',
                                'Low nitrogen levels',
                                'Upcoming expirations',
                                'Pending quality reviews',
                                'Patient appointment reminders',
                            ]}
                        />

                        <DetailedFeature
                            icon={<FileText className="h-10 w-10" />}
                            title="Document Management"
                            description="Centralize all critical documents with version control:"
                            items={[
                                'Consent forms with e-signatures',
                                'Medical records',
                                'Lab results and reports',
                                'Regulatory documentation',
                                'Standard operating procedures (SOPs)',
                            ]}
                        />

                        <DetailedFeature
                            icon={<Lock className="h-10 w-10" />}
                            title="Role-Based Access"
                            description="Granular permissions ensure data security:"
                            items={[
                                'Custom user roles (admin, clinician, lab tech, etc.)',
                                'Department-specific access',
                                'Temporary access grants',
                                'Activity logging',
                                'Automatic access reviews',
                            ]}
                        />
                    </div>
                </div>
            </section>

            {/* Integration */}
            <section className="py-20 px-4">
                <div className="container mx-auto max-w-4xl text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Seamless Integration</h2>
                    <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                        Connect CryoBank with your existing systems through our robust API and pre-built integrations.
                    </p>

                    <div className="grid md:grid-cols-3 gap-6 mt-12">
                        <Card>
                            <CardHeader>
                                <CardTitle>EMR/EHR Systems</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Bi-directional sync with Epic, Cerner, Allscripts, and more
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Laboratory Systems</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Connect with LIMS and andrology lab equipment
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Billing Systems</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Integrate with billing and accounting software
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-4 bg-primary text-primary-foreground">
                <div className="container mx-auto max-w-4xl text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your Cryobank?</h2>
                    <p className="text-lg mb-8 opacity-90">
                        Join leading fertility clinics using CryoBank to streamline operations and improve patient
                        outcomes.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" variant="secondary" asChild>
                            <Link to="/register">
                                Start Free Trial
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="bg-transparent text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:text-primary"
                            asChild
                        >
                            <Link to="/contact">Schedule Demo</Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t py-8 px-4 bg-muted/30">
                <div className="container mx-auto text-center text-sm text-muted-foreground">
                    <p>© 2025 CryoBank. All rights reserved.</p>
                </div>
            </footer>
        </div>
    )
}

function FeatureCard({
    icon,
    title,
    description,
    features,
}: {
    icon: React.ReactNode
    title: string
    description: string
    features: string[]
}) {
    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
                    {icon}
                </div>
                <CardTitle className="text-xl">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2">
                    {features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                            <span className="text-muted-foreground">{feature}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    )
}

function DetailedFeature({
    icon,
    title,
    description,
    items,
}: {
    icon: React.ReactNode
    title: string
    description: string
    items: string[]
}) {
    return (
        <Card>
            <CardHeader>
                <div className="text-primary mb-3">{icon}</div>
                <CardTitle className="text-2xl">{title}</CardTitle>
                <CardDescription className="text-base">{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2">
                    {items.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    )
}
