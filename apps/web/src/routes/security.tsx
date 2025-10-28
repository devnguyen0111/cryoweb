import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@workspace/ui/components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import {
    HeartPulse,
    Shield,
    Lock,
    Eye,
    FileCheck,
    CheckCircle2,
    AlertTriangle,
    Database,
    Key,
    Server,
    UserCheck,
    Clock,
    ArrowRight,
} from 'lucide-react'
import { Badge } from '@workspace/ui/components/Badge'

export const Route = createFileRoute('/security')({
    component: SecurityPage,
})

function SecurityPage() {
    return (
        <div className="min-h-screen bg-background">
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
                            <Link to="/login">Sign In</Link>
                        </Button>
                    </div>
                </div>
            </header>

            <section className="py-20 px-4 bg-gradient-to-b from-primary/5 to-background">
                <div className="container mx-auto text-center max-w-4xl">
                    <Badge variant="outline" className="mb-4">
                        Enterprise Security
                    </Badge>
                    <h1 className="text-5xl md:text-6xl font-bold mb-6">Your Data is Our Priority</h1>
                    <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                        Bank-level security, HIPAA compliance, and military-grade encryption protect your most sensitive
                        data.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4 text-sm">
                        <Badge variant="secondary" className="text-base py-2 px-4">
                            <Shield className="h-4 w-4 mr-2" />
                            HIPAA Compliant
                        </Badge>
                        <Badge variant="secondary" className="text-base py-2 px-4">
                            <Lock className="h-4 w-4 mr-2" />
                            SOC 2 Type II
                        </Badge>
                        <Badge variant="secondary" className="text-base py-2 px-4">
                            <FileCheck className="h-4 w-4 mr-2" />
                            ISO 27001
                        </Badge>
                    </div>
                </div>
            </section>

            <section className="py-20 px-4">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Enterprise-Grade Security</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Multi-layered security architecture for healthcare
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <SecurityFeature
                            icon={<Lock className="h-8 w-8" />}
                            title="End-to-End Encryption"
                            description="AES-256 encryption for data at rest and TLS 1.3 for data in transit."
                            color="blue"
                        />
                        <SecurityFeature
                            icon={<Key className="h-8 w-8" />}
                            title="Multi-Factor Authentication"
                            description="Mandatory MFA using authenticator apps, SMS, or hardware tokens."
                            color="green"
                        />
                        <SecurityFeature
                            icon={<UserCheck className="h-8 w-8" />}
                            title="Role-Based Access Control"
                            description="Granular permissions ensure users only access what they need."
                            color="purple"
                        />
                        <SecurityFeature
                            icon={<Eye className="h-8 w-8" />}
                            title="Comprehensive Audit Logs"
                            description="Every action is logged with timestamp, user, and IP address."
                            color="orange"
                        />
                        <SecurityFeature
                            icon={<Server className="h-8 w-8" />}
                            title="Secure Infrastructure"
                            description="AWS cloud infrastructure with isolated VPCs and encrypted backups."
                            color="cyan"
                        />
                        <SecurityFeature
                            icon={<AlertTriangle className="h-8 w-8" />}
                            title="Threat Detection"
                            description="Real-time monitoring for suspicious activity and automated alerts."
                            color="red"
                        />
                    </div>
                </div>
            </section>

            <section className="py-20 px-4 bg-muted/30">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Compliance & Certifications</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            We meet or exceed all healthcare security standards
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <ComplianceCard
                            title="HIPAA Compliance"
                            description="Full compliance with the Health Insurance Portability and Accountability Act:"
                            points={[
                                'Business Associate Agreements (BAA) available',
                                'Privacy Rule implementation',
                                'Security Rule technical safeguards',
                                'Breach notification procedures',
                                'Regular risk assessments',
                            ]}
                        />
                        <ComplianceCard
                            title="SOC 2 Type II"
                            description="Third-party audited controls for security and availability:"
                            points={[
                                'Annual independent audits',
                                'Security control effectiveness',
                                'Availability monitoring',
                                'Processing integrity verification',
                                'Privacy protection measures',
                            ]}
                        />
                        <ComplianceCard
                            title="GDPR Ready"
                            description="Designed to support General Data Protection Regulation compliance:"
                            points={[
                                'Data portability support',
                                'Right to erasure',
                                'Consent management',
                                'EU data residency options',
                                'Privacy by design principles',
                            ]}
                        />
                        <ComplianceCard
                            title="Additional Standards"
                            description="We adhere to additional healthcare and security standards:"
                            points={[
                                'ISO 27001 (Information Security)',
                                'PCI DSS (Payment Card Security)',
                                'NIST Cybersecurity Framework',
                                'FDA 21 CFR Part 11 compatible',
                                'CAP laboratory standards',
                            ]}
                        />
                    </div>
                </div>
            </section>

            <section className="py-20 px-4">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Security Best Practices</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Continuous security improvements and proactive protection
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader>
                                <Shield className="h-10 w-10 text-primary mb-3" />
                                <CardTitle>Regular Penetration Testing</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Quarterly third-party security assessments identify and fix vulnerabilities.
                                </p>
                                <ul className="space-y-2">
                                    <li className="flex items-start gap-2 text-sm">
                                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                                        <span>External penetration tests</span>
                                    </li>
                                    <li className="flex items-start gap-2 text-sm">
                                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                                        <span>Internal vulnerability scans</span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <Database className="h-10 w-10 text-primary mb-3" />
                                <CardTitle>Data Backup & Recovery</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Automated backups with geographic redundancy ensure data is never lost.
                                </p>
                                <ul className="space-y-2">
                                    <li className="flex items-start gap-2 text-sm">
                                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                                        <span>Hourly incremental backups</span>
                                    </li>
                                    <li className="flex items-start gap-2 text-sm">
                                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                                        <span>Multi-region replication</span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <Clock className="h-10 w-10 text-primary mb-3" />
                                <CardTitle>24/7 Security Monitoring</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Round-the-clock monitoring responds immediately to suspicious activity.
                                </p>
                                <ul className="space-y-2">
                                    <li className="flex items-start gap-2 text-sm">
                                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                                        <span>Real-time threat detection</span>
                                    </li>
                                    <li className="flex items-start gap-2 text-sm">
                                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                                        <span>Automated incident response</span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            <section className="py-20 px-4">
                <div className="container mx-auto max-w-4xl text-center">
                    <Shield className="h-16 w-16 mx-auto mb-6 text-primary" />
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Questions About Security?</h2>
                    <p className="text-muted-foreground mb-8 text-lg">
                        Our security team is here to answer your questions and provide detailed documentation.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" asChild>
                            <Link to="/contact">
                                Contact Security Team
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" asChild>
                            <Link to="/login">Sign In</Link>
                        </Button>
                    </div>
                </div>
            </section>

            <footer className="border-t py-8 px-4 bg-muted/30">
                <div className="container mx-auto text-center text-sm text-muted-foreground">
                    <p>© 2025 CryoBank. All rights reserved.</p>
                </div>
            </footer>
        </div>
    )
}

function SecurityFeature({
    icon,
    title,
    description,
    color,
}: {
    icon: React.ReactNode
    title: string
    description: string
    color: string
}) {
    const colorClasses = {
        blue: 'from-blue-500 to-indigo-600',
        green: 'from-green-500 to-emerald-600',
        purple: 'from-purple-500 to-pink-600',
        orange: 'from-orange-500 to-red-600',
        cyan: 'from-cyan-500 to-blue-600',
        red: 'from-red-500 to-rose-600',
    }

    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
                <div
                    className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} flex items-center justify-center mb-4 text-white`}
                >
                    {icon}
                </div>
                <CardTitle className="text-xl">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    )
}

function ComplianceCard({ title, description, points }: { title: string; description: string; points: string[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                    {title}
                </CardTitle>
                <CardDescription className="text-base">{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2">
                    {points.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                            <span className="text-muted-foreground">{point}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    )
}
