import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@workspace/ui/components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { ThemeSwitcher } from '@/shared/components/ThemeSwitcher'
import { HeartPulse, FlaskConical, Shield, Database, UserCheck, FileCheck, Clock, Lock } from 'lucide-react'

export const Route = createFileRoute('/')({
    component: HomePage,
})

function HomePage() {
    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <HeartPulse className="h-8 w-8 text-primary" />
                        <span className="font-bold text-xl">CryoBank</span>
                    </div>
                    <nav className="hidden md:flex items-center gap-6">
                        <a href="#services" className="text-sm font-medium hover:text-primary transition-colors">
                            Services
                        </a>
                        <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">
                            Features
                        </a>
                        <a href="#about" className="text-sm font-medium hover:text-primary transition-colors">
                            About
                        </a>
                    </nav>
                    <div className="flex items-center gap-3">
                        <ThemeSwitcher />
                        <Button variant="ghost" size="sm" asChild>
                            <Link to="/login">Login</Link>
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
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                        <FlaskConical className="h-4 w-4" />
                        Professional Fertility & Cryobank Management
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Advanced Fertility Service & Cryobank Management System
                    </h1>
                    <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                        Streamline your fertility clinic operations with our comprehensive management system. Securely
                        manage patient records, track samples, and ensure regulatory compliance.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="xl" asChild>
                            <Link to="/register">Start Free Trial</Link>
                        </Button>
                        <Button size="xl" variant="outline" asChild>
                            <Link to="/login">Sign In</Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section id="services" className="py-20 px-4">
                <div className="container mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Services</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Comprehensive solutions for fertility clinics and cryobank facilities
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        <ServiceCard
                            icon={<HeartPulse className="h-8 w-8" />}
                            title="Fertility Treatment Management"
                            description="Track and manage all aspects of fertility treatments including IVF, IUI, and egg freezing procedures."
                        />
                        <ServiceCard
                            icon={<Database className="h-8 w-8" />}
                            title="Sample Storage & Tracking"
                            description="Advanced cryogenic storage management with real-time tracking and temperature monitoring."
                        />
                        <ServiceCard
                            icon={<UserCheck className="h-8 w-8" />}
                            title="Patient Records Management"
                            description="Secure, HIPAA-compliant patient record management with easy access and retrieval."
                        />
                        <ServiceCard
                            icon={<FileCheck className="h-8 w-8" />}
                            title="Regulatory Compliance"
                            description="Built-in compliance checks and reporting tools for FDA, CAP, and other regulatory standards."
                        />
                        <ServiceCard
                            icon={<Clock className="h-8 w-8" />}
                            title="Appointment Scheduling"
                            description="Integrated scheduling system for consultations, procedures, and follow-up appointments."
                        />
                        <ServiceCard
                            icon={<Shield className="h-8 w-8" />}
                            title="Quality Assurance"
                            description="Comprehensive quality control and assurance protocols for all laboratory procedures."
                        />
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 px-4 bg-muted/50">
                <div className="container mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Key Features</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Everything you need to run a modern fertility clinic
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        <FeatureItem
                            title="Advanced Security"
                            description="End-to-end encryption, role-based access control, and comprehensive audit logs."
                            icon={<Lock className="h-5 w-5" />}
                        />
                        <FeatureItem
                            title="Real-time Monitoring"
                            description="24/7 monitoring of storage conditions with instant alerts for any anomalies."
                            icon={<Clock className="h-5 w-5" />}
                        />
                        <FeatureItem
                            title="Automated Workflows"
                            description="Streamline operations with automated workflows and intelligent scheduling."
                            icon={<FileCheck className="h-5 w-5" />}
                        />
                        <FeatureItem
                            title="Comprehensive Reporting"
                            description="Generate detailed reports for clinical, financial, and regulatory purposes."
                            icon={<Database className="h-5 w-5" />}
                        />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4">
                <div className="container mx-auto">
                    <Card className="max-w-4xl mx-auto text-center border-primary/20">
                        <CardContent className="py-12">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">
                                Ready to Transform Your Fertility Clinic?
                            </h2>
                            <p className="text-muted-foreground mb-8 text-lg">
                                Join leading fertility clinics worldwide in providing exceptional care with our
                                platform.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button size="xl" asChild>
                                    <Link to="/register">Create Free Account</Link>
                                </Button>
                                <Button size="xl" variant="outline">
                                    Schedule a Demo
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t py-12 px-4 bg-muted/30">
                <div className="container mx-auto">
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <HeartPulse className="h-6 w-6 text-primary" />
                                <span className="font-bold text-lg">CryoBank</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Advanced fertility service and cryobank management system for modern clinics.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-4">Product</h3>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>
                                    <a href="#" className="hover:text-primary transition-colors">
                                        Features
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="hover:text-primary transition-colors">
                                        Pricing
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="hover:text-primary transition-colors">
                                        Security
                                    </a>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-4">Company</h3>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>
                                    <a href="#" className="hover:text-primary transition-colors">
                                        About Us
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="hover:text-primary transition-colors">
                                        Contact
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="hover:text-primary transition-colors">
                                        Careers
                                    </a>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-4">Legal</h3>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>
                                    <a href="#" className="hover:text-primary transition-colors">
                                        Privacy Policy
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="hover:text-primary transition-colors">
                                        Terms of Service
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="hover:text-primary transition-colors">
                                        HIPAA Compliance
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t pt-8 text-center text-sm text-muted-foreground">
                        <p>&copy; 2025 CryoBank. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}

function ServiceCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <Card className="hover:border-primary/40 transition-colors">
            <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                    {icon}
                </div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
        </Card>
    )
}

function FeatureItem({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="flex gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary text-white flex items-center justify-center shrink-0">
                {icon}
            </div>
            <div>
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm">{description}</p>
            </div>
        </div>
    )
}
