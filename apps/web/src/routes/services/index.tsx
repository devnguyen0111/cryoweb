import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@workspace/ui/components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import {
    FlaskConical,
    ArrowRight,
    Baby,
    Microscope,
    Snowflake,
    HeartPulse,
    Users,
    Stethoscope,
    Clock,
    DollarSign,
    CheckCircle2,
} from 'lucide-react'
import { Badge } from '@workspace/ui/components/Badge'

export const Route = createFileRoute('/services/')({
    component: ServicesPage,
})

const services = [
    {
        title: 'IVF (In Vitro Fertilization)',
        description:
            'Advanced fertility treatment combining eggs and sperm in a laboratory setting for optimal results.',
        icon: Microscope,
        link: '/services/ivf',
        color: 'blue',
        stats: {
            successRate: '40-50%',
            duration: '4-6 weeks',
            cost: '$15,000-$25,000',
        },
        features: [
            'Highest success rates',
            'Genetic testing available',
            'Multiple embryo options',
            'Ideal for complex cases',
        ],
    },
    {
        title: 'IUI (Intrauterine Insemination)',
        description:
            'Less invasive fertility treatment placing prepared sperm directly into the uterus during ovulation.',
        icon: Baby,
        link: '/services/iui',
        color: 'green',
        stats: {
            successRate: '15-20%',
            duration: '2-3 weeks',
            cost: '$500-$2,500',
        },
        features: ['Minimal invasiveness', 'Lower cost', 'Natural approach', 'Quick procedure'],
    },
    {
        title: 'Egg Freezing',
        description: 'Preserve your fertility by freezing eggs for future use, providing reproductive flexibility.',
        icon: Snowflake,
        link: '/services/egg-freezing',
        color: 'purple',
        stats: {
            successRate: 'Varies',
            duration: '2-3 weeks',
            cost: '$8,000-$12,000',
        },
        features: [
            'Fertility preservation',
            'No age limit concerns',
            'Career flexibility',
            'Medical reasons supported',
        ],
        comingSoon: true,
    },
    {
        title: 'Embryo Freezing',
        description: 'Cryopreserve embryos from IVF cycles for future family planning or second pregnancies.',
        icon: Snowflake,
        link: '/services/embryo-freezing',
        color: 'cyan',
        stats: {
            successRate: '85-95%',
            duration: 'Part of IVF',
            cost: '$600-$1,000/year',
        },
        features: ['High survival rates', 'Future pregnancy options', 'Genetic testing available', 'Cost-effective'],
        comingSoon: true,
    },
    {
        title: 'Fertility Assessment',
        description: 'Comprehensive evaluation of reproductive health to create personalized treatment plans.',
        icon: Stethoscope,
        link: '/services/fertility-assessment',
        color: 'orange',
        stats: {
            successRate: 'N/A',
            duration: '1-2 weeks',
            cost: '$500-$2,000',
        },
        features: ['Hormone testing', 'Ultrasound evaluation', 'Semen analysis', 'Personalized recommendations'],
        comingSoon: true,
    },
    {
        title: 'Genetic Testing',
        description: 'Screen embryos for genetic abnormalities to improve pregnancy success and baby health.',
        icon: HeartPulse,
        link: '/services/genetic-testing',
        color: 'pink',
        stats: {
            successRate: '99% accuracy',
            duration: '1-2 weeks',
            cost: '$3,000-$5,000',
        },
        features: ['PGT-A for chromosomes', 'PGT-M for genetic diseases', 'Gender selection', 'Improved outcomes'],
        comingSoon: true,
    },
]

function ServicesPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <FlaskConical className="h-6 w-6 text-primary" />
                        <span className="font-bold text-lg">CryoBank</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" asChild>
                            <Link to="/">Home</Link>
                        </Button>
                        <Button size="sm" asChild>
                            <Link to="/register">Schedule Consultation</Link>
                        </Button>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-12 max-w-7xl">
                {/* Hero Section */}
                <div className="text-center mb-12">
                    <Badge variant="outline" className="mb-4">
                        Our Services
                    </Badge>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Fertility Treatment Options</h1>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                        Comprehensive reproductive services designed to help you achieve your dream of parenthood.
                        Expert care, advanced technology, and personalized treatment plans.
                    </p>
                </div>

                {/* Services Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {services.map((service, index) => (
                        <ServiceCard key={index} service={service} />
                    ))}
                </div>

                {/* Why Choose Us */}
                <Card className="mb-12">
                    <CardHeader>
                        <CardTitle>Why Choose CryoBank?</CardTitle>
                        <CardDescription>Leading fertility care with proven results</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                        <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <h4 className="font-semibold">Expert Team</h4>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Board-certified reproductive endocrinologists with decades of combined experience
                                </p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                                        <Microscope className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <h4 className="font-semibold">Advanced Technology</h4>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    State-of-the-art laboratory equipment and cutting-edge fertility techniques
                                </p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                                        <HeartPulse className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <h4 className="font-semibold">Personalized Care</h4>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Customized treatment plans tailored to your unique fertility journey
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Process Overview */}
                <Card className="mb-12">
                    <CardHeader>
                        <CardTitle>Your Journey With Us</CardTitle>
                        <CardDescription>Simple steps to start your fertility treatment</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-4 gap-6">
                            <ProcessStep
                                number={1}
                                title="Initial Consultation"
                                description="Meet with our specialists to discuss your goals and medical history"
                            />
                            <ProcessStep
                                number={2}
                                title="Testing & Evaluation"
                                description="Comprehensive fertility assessment to understand your situation"
                            />
                            <ProcessStep
                                number={3}
                                title="Treatment Plan"
                                description="Personalized protocol designed specifically for your needs"
                            />
                            <ProcessStep
                                number={4}
                                title="Begin Treatment"
                                description="Start your journey with expert guidance every step of the way"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* CTA Section */}
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                    <CardContent className="py-12 text-center">
                        <h2 className="text-3xl font-bold mb-4">Ready to Start Your Fertility Journey?</h2>
                        <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                            Schedule a consultation with our fertility specialists to explore your options and create a
                            personalized treatment plan.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button size="lg" asChild>
                                <Link to="/register">
                                    Schedule Consultation
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                            <Button size="lg" variant="outline" asChild>
                                <Link to="/login">Patient Portal</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Footer */}
            <footer className="border-t py-8 px-4 bg-muted/30 mt-12">
                <div className="container mx-auto text-center text-sm text-muted-foreground">
                    <p>Expert fertility care with compassion and advanced technology</p>
                    <p className="mt-2">© 2024 CryoBank. All rights reserved.</p>
                </div>
            </footer>
        </div>
    )
}

// Helper Components
function ServiceCard({ service }: { service: (typeof services)[0] }) {
    const Icon = service.icon

    const colorClasses = {
        blue: 'from-blue-500 to-indigo-600',
        green: 'from-green-500 to-emerald-600',
        purple: 'from-purple-500 to-pink-600',
        cyan: 'from-cyan-500 to-blue-600',
        orange: 'from-orange-500 to-red-600',
        pink: 'from-pink-500 to-rose-600',
    }

    return (
        <Card className="relative hover:shadow-lg transition-shadow">
            {service.comingSoon && (
                <div className="absolute top-4 right-4 z-10">
                    <Badge variant="secondary" className="text-xs">
                        Coming Soon
                    </Badge>
                </div>
            )}
            <CardHeader>
                <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[service.color as keyof typeof colorClasses]} flex items-center justify-center mb-4`}
                >
                    <Icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">{service.title}</CardTitle>
                <CardDescription>{service.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-2 bg-muted rounded">
                        <div className="font-bold text-sm">{service.stats.successRate}</div>
                        <div className="text-muted-foreground">Success</div>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                        <div className="font-bold text-sm">{service.stats.duration}</div>
                        <div className="text-muted-foreground">Duration</div>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                        <div className="font-bold text-sm">{service.stats.cost}</div>
                        <div className="text-muted-foreground">Cost</div>
                    </div>
                </div>

                {/* Features */}
                <ul className="space-y-1.5">
                    {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                            <span>{feature}</span>
                        </li>
                    ))}
                </ul>

                {/* CTA Button */}
                <Button className="w-full" variant={service.comingSoon ? 'outline' : 'default'} asChild>
                    {service.comingSoon ? (
                        <span className="cursor-not-allowed">Coming Soon</span>
                    ) : (
                        <Link to={service.link}>
                            Learn More
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    )}
                </Button>
            </CardContent>
        </Card>
    )
}

function ProcessStep({ number, title, description }: { number: number; title: string; description: string }) {
    return (
        <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg mx-auto mb-3">
                {number}
            </div>
            <h4 className="font-semibold mb-2">{title}</h4>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
    )
}
