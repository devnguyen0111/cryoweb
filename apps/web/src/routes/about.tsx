import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@workspace/ui/components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { HeartPulse, Target, Eye, Heart, Users, TrendingUp, Shield, Globe, ArrowRight } from 'lucide-react'
import { Badge } from '@workspace/ui/components/Badge'

export const Route = createFileRoute('/about')({
    component: AboutPage,
})

function AboutPage() {
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
                        About Us
                    </Badge>
                    <h1 className="text-5xl md:text-6xl font-bold mb-6">Building the Future of Fertility Care</h1>
                    <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                        We're on a mission to make fertility treatment accessible, efficient, and successful for
                        everyone through innovative technology.
                    </p>
                </div>
            </section>

            <section className="py-20 px-4">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Mission</h2>
                            <div className="space-y-4 text-muted-foreground">
                                <p>
                                    CryoBank was founded in 2010 with a simple belief: technology should make fertility
                                    treatment more accessible, not more complicated.
                                </p>
                                <p>
                                    We've built the industry's leading platform for managing cryogenic storage and
                                    fertility treatment, serving over 500 clinics worldwide and helping thousands of
                                    families grow.
                                </p>
                                <p>
                                    Our team combines deep healthcare expertise with cutting-edge technology to deliver
                                    a platform that's both powerful and easy to use.
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-4xl font-bold">500+</CardTitle>
                                    <CardDescription>Clinics Worldwide</CardDescription>
                                </CardHeader>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-4xl font-bold">100K+</CardTitle>
                                    <CardDescription>Patients Served</CardDescription>
                                </CardHeader>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-4xl font-bold">2M+</CardTitle>
                                    <CardDescription>Samples Managed</CardDescription>
                                </CardHeader>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-4xl font-bold">99.9%</CardTitle>
                                    <CardDescription>Uptime SLA</CardDescription>
                                </CardHeader>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-20 px-4 bg-muted/30">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Values</h2>
                        <p className="text-muted-foreground">What drives us every day</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <ValueCard
                            icon={<Heart className="h-8 w-8" />}
                            title="Patient-Centric"
                            description="Every decision starts with how it impacts patients and their journey to parenthood."
                        />
                        <ValueCard
                            icon={<Shield className="h-8 w-8" />}
                            title="Security First"
                            description="Healthcare data deserves the highest levels of protection and privacy."
                        />
                        <ValueCard
                            icon={<TrendingUp className="h-8 w-8" />}
                            title="Innovation"
                            description="We continuously push boundaries to improve outcomes and experiences."
                        />
                        <ValueCard
                            icon={<Users className="h-8 w-8" />}
                            title="Collaboration"
                            description="We work closely with clinicians to build tools that truly help."
                        />
                        <ValueCard
                            icon={<Globe className="h-8 w-8" />}
                            title="Accessibility"
                            description="Quality fertility care should be available to everyone, everywhere."
                        />
                        <ValueCard
                            icon={<Target className="h-8 w-8" />}
                            title="Excellence"
                            description="We strive for excellence in everything we do, from code to customer support."
                        />
                    </div>
                </div>
            </section>

            <section className="py-20 px-4">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Journey</h2>
                        <p className="text-muted-foreground">Key milestones in our story</p>
                    </div>

                    <div className="space-y-8">
                        <TimelineItem
                            year="2010"
                            title="Company Founded"
                            description="CryoBank was founded by fertility specialists and software engineers who saw a need for better management tools."
                        />
                        <TimelineItem
                            year="2013"
                            title="First 100 Clinics"
                            description="Reached 100 clinics using our platform, validating our approach to fertility management software."
                        />
                        <TimelineItem
                            year="2016"
                            title="International Expansion"
                            description="Expanded to Europe and Asia, serving clinics in 20+ countries."
                        />
                        <TimelineItem
                            year="2019"
                            title="HIPAA & SOC 2 Certification"
                            description="Achieved enterprise-grade security certifications to serve larger healthcare systems."
                        />
                        <TimelineItem
                            year="2022"
                            title="AI-Powered Analytics"
                            description="Launched predictive analytics to help clinics improve success rates and patient outcomes."
                        />
                        <TimelineItem
                            year="2025"
                            title="500+ Clinics"
                            description="Serving over 500 clinics worldwide and managing 2M+ samples with 99.9% uptime."
                        />
                    </div>
                </div>
            </section>

            <section className="py-20 px-4 bg-muted/30">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Leadership Team</h2>
                        <p className="text-muted-foreground">Meet the people leading CryoBank</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <TeamMember
                            name="Dr. Sarah Johnson"
                            role="CEO & Co-Founder"
                            bio="Reproductive endocrinologist with 15+ years in fertility treatment"
                        />
                        <TeamMember
                            name="Michael Chen"
                            role="CTO & Co-Founder"
                            bio="Former Google engineer specializing in healthcare systems"
                        />
                        <TeamMember
                            name="Dr. Emily Rodriguez"
                            role="Chief Medical Officer"
                            bio="Board-certified RE/I with expertise in cryobiology"
                        />
                        <TeamMember
                            name="David Park"
                            role="VP of Engineering"
                            bio="Led platform teams at major healthcare tech companies"
                        />
                    </div>
                </div>
            </section>

            <section className="py-20 px-4">
                <div className="container mx-auto max-w-4xl text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Join Us on Our Mission</h2>
                    <p className="text-muted-foreground mb-8 text-lg">
                        Whether you're a fertility clinic looking to improve your operations or a talented individual
                        wanting to make an impact, we'd love to hear from you.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" asChild>
                            <Link to="/login">
                                Sign In to Get Started
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" asChild>
                            <Link to="/careers">View Careers</Link>
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

function ValueCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <Card className="text-center">
            <CardHeader>
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
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

function TimelineItem({ year, title, description }: { year: string; title: string; description: string }) {
    return (
        <div className="flex gap-6">
            <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold flex-shrink-0">
                    {year.slice(2)}
                </div>
                <div className="w-0.5 h-full bg-border mt-4" />
            </div>
            <div className="pb-8">
                <h3 className="text-xl font-bold mb-2">{title}</h3>
                <p className="text-muted-foreground">{description}</p>
            </div>
        </div>
    )
}

function TeamMember({ name, role, bio }: { name: string; role: string; bio: string }) {
    return (
        <Card>
            <CardHeader>
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/50 mx-auto mb-4" />
                <CardTitle className="text-lg">{name}</CardTitle>
                <CardDescription>{role}</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground text-center">{bio}</p>
            </CardContent>
        </Card>
    )
}
