import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@workspace/ui/components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import {
    HeartPulse,
    Briefcase,
    MapPin,
    Clock,
    DollarSign,
    Heart,
    Users,
    Laptop,
    Coffee,
    Plane,
    GraduationCap,
} from 'lucide-react'
import { Badge } from '@workspace/ui/components/Badge'

export const Route = createFileRoute('/careers')({
    component: CareersPage,
})

function CareersPage() {
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
                        Join Our Team
                    </Badge>
                    <h1 className="text-5xl md:text-6xl font-bold mb-6">Build the Future of Fertility Care</h1>
                    <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                        Join a passionate team working to make fertility treatment more accessible, efficient, and
                        successful for families worldwide.
                    </p>
                </div>
            </section>

            <section className="py-20 px-4">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Why CryoBank?</h2>
                        <p className="text-muted-foreground">What makes working here special</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <BenefitCard
                            icon={<Heart className="h-8 w-8" />}
                            title="Meaningful Work"
                            description="Help thousands of families achieve their dream of parenthood"
                        />
                        <BenefitCard
                            icon={<Users className="h-8 w-8" />}
                            title="Great Team"
                            description="Work with talented, passionate people who care deeply"
                        />
                        <BenefitCard
                            icon={<Laptop className="h-8 w-8" />}
                            title="Remote First"
                            description="Work from anywhere with flexible hours"
                        />
                        <BenefitCard
                            icon={<GraduationCap className="h-8 w-8" />}
                            title="Growth"
                            description="Continuous learning and career development opportunities"
                        />
                    </div>
                </div>
            </section>

            <section className="py-20 px-4 bg-muted/30">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Benefits & Perks</h2>
                        <p className="text-muted-foreground">We take care of our team</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <PerksCard
                            category="Health & Wellness"
                            icon={<Heart className="h-6 w-6" />}
                            perks={[
                                'Comprehensive health insurance',
                                'Dental and vision coverage',
                                'Mental health support',
                                'Gym membership reimbursement',
                            ]}
                        />
                        <PerksCard
                            category="Work-Life Balance"
                            icon={<Coffee className="h-6 w-6" />}
                            perks={[
                                'Flexible working hours',
                                'Unlimited PTO',
                                'Remote work options',
                                'Parental leave (16 weeks)',
                            ]}
                        />
                        <PerksCard
                            category="Financial"
                            icon={<DollarSign className="h-6 w-6" />}
                            perks={[
                                'Competitive salary',
                                '401(k) matching (4%)',
                                'Equity options',
                                'Annual bonus program',
                            ]}
                        />
                        <PerksCard
                            category="Professional Development"
                            icon={<GraduationCap className="h-6 w-6" />}
                            perks={[
                                'Learning & development budget',
                                'Conference attendance',
                                'Mentorship program',
                                'Career coaching',
                            ]}
                        />
                        <PerksCard
                            category="Office & Equipment"
                            icon={<Laptop className="h-6 w-6" />}
                            perks={[
                                'Latest MacBook Pro/PC',
                                'Home office setup budget',
                                'Co-working space membership',
                                'Ergonomic equipment',
                            ]}
                        />
                        <PerksCard
                            category="Fun & Culture"
                            icon={<Plane className="h-6 w-6" />}
                            perks={[
                                'Annual team retreats',
                                'Monthly team events',
                                'Wellness stipend',
                                'Birthday time off',
                            ]}
                        />
                    </div>
                </div>
            </section>

            <section className="py-20 px-4">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Open Positions</h2>
                        <p className="text-muted-foreground">Find your next opportunity</p>
                    </div>

                    <div className="space-y-4">
                        <JobListing
                            title="Senior Full-Stack Engineer"
                            department="Engineering"
                            location="Remote (US)"
                            type="Full-time"
                            salary="$150k - $200k"
                            description="Build and scale our healthcare platform using React, TypeScript, Node.js, and PostgreSQL."
                        />
                        <JobListing
                            title="Product Designer"
                            department="Design"
                            location="Remote (Global)"
                            type="Full-time"
                            salary="$120k - $160k"
                            description="Design intuitive interfaces that help fertility clinics deliver exceptional patient care."
                        />
                        <JobListing
                            title="Customer Success Manager"
                            department="Customer Success"
                            location="San Francisco, CA"
                            type="Full-time"
                            salary="$90k - $120k"
                            description="Help our clinic partners get maximum value from our platform and achieve their goals."
                        />
                        <JobListing
                            title="Clinical Implementation Specialist"
                            department="Operations"
                            location="Remote (US)"
                            type="Full-time"
                            salary="$80k - $110k"
                            description="Work with fertility clinics to implement and optimize our platform for their workflows."
                        />
                        <JobListing
                            title="DevOps Engineer"
                            department="Engineering"
                            location="Remote (US)"
                            type="Full-time"
                            salary="$140k - $180k"
                            description="Build and maintain our cloud infrastructure on AWS to ensure 99.9% uptime."
                        />
                        <JobListing
                            title="Data Scientist"
                            department="Data & Analytics"
                            location="Remote (US)"
                            type="Full-time"
                            salary="$130k - $170k"
                            description="Develop predictive models to help clinics improve treatment success rates."
                        />
                        <JobListing
                            title="Sales Development Representative"
                            department="Sales"
                            location="New York, NY"
                            type="Full-time"
                            salary="$70k - $90k + commission"
                            description="Generate qualified leads and help fertility clinics discover our platform."
                        />
                        <JobListing
                            title="Technical Writer"
                            department="Product"
                            location="Remote (Global)"
                            type="Contract"
                            salary="$60k - $80k"
                            description="Create clear, comprehensive documentation for our platform and API."
                        />
                    </div>
                </div>
            </section>

            <section className="py-20 px-4 bg-muted/30">
                <div className="container mx-auto max-w-4xl text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Don't See the Right Role?</h2>
                    <p className="text-muted-foreground mb-8 text-lg">
                        We're always looking for talented people. Send us your resume and we'll keep you in mind for
                        future opportunities.
                    </p>
                    <Button size="lg" asChild>
                        <Link to="/contact">Get in Touch</Link>
                    </Button>
                </div>
            </section>

            <footer className="border-t py-8 px-4 bg-muted/30">
                <div className="container mx-auto text-center text-sm text-muted-foreground">
                    <p>© 2025 CryoBank. All rights reserved. Equal Opportunity Employer.</p>
                </div>
            </footer>
        </div>
    )
}

function BenefitCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <Card className="text-center">
            <CardHeader>
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
                    {icon}
                </div>
                <CardTitle className="text-lg">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    )
}

function PerksCard({ category, icon, perks }: { category: string; icon: React.ReactNode; perks: string[] }) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2 text-primary">
                    {icon}
                    <CardTitle className="text-lg">{category}</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2">
                    {perks.map((perk, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>{perk}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    )
}

function JobListing({
    title,
    department,
    location,
    type,
    salary,
    description,
}: {
    title: string
    department: string
    location: string
    type: string
    salary: string
    description: string
}) {
    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                        <CardTitle className="text-2xl mb-2">{title}</CardTitle>
                        <CardDescription className="text-base">{description}</CardDescription>
                    </div>
                    <Button>Apply Now</Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Briefcase className="h-4 w-4" />
                        <span>{department}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{type}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        <span>{salary}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
