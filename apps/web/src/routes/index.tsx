import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@workspace/ui/components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { ThemeSwitcher } from '@/shared/components/ThemeSwitcher'
import {
    HeartPulse,
    FlaskConical,
    Shield,
    Database,
    UserCheck,
    FileCheck,
    Clock,
    Lock,
    ArrowRight,
    Award,
    Users,
    TrendingUp,
    CheckCircle2,
    Star,
    Quote,
    Calendar,
    ClipboardCheck,
    Activity,
    Target,
} from 'lucide-react'

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
                        <Button size="sm" asChild>
                            <Link to="/login">Sign In</Link>
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
                        Your Journey to Parenthood Starts Here
                    </h1>
                    <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                        Advanced fertility treatments backed by cutting-edge technology and compassionate care. We help
                        thousands of families achieve their dream of having a child with personalized treatment plans
                        and expert guidance every step of the way.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="xl" asChild>
                            <Link to="/login">
                                Start Your Journey
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                        <Button size="xl" variant="outline" asChild>
                            <a href="#services">Explore Services</a>
                        </Button>
                    </div>

                    {/* Trust Indicators */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-3xl mx-auto">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-primary mb-1">15+</div>
                            <div className="text-sm text-muted-foreground">Years Experience</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-primary mb-1">10,000+</div>
                            <div className="text-sm text-muted-foreground">Successful Pregnancies</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-primary mb-1">45%</div>
                            <div className="text-sm text-muted-foreground">Average Success Rate</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-primary mb-1">98%</div>
                            <div className="text-sm text-muted-foreground">Patient Satisfaction</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section id="about" className="py-20 px-4 bg-muted/30">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold mb-6">
                                Leading the Way in Fertility Care & Cryopreservation
                            </h2>
                            <p className="text-muted-foreground mb-6 text-lg">
                                CryoBank is a state-of-the-art fertility clinic and cryobank facility dedicated to
                                helping individuals and couples achieve their family-building goals. With over 15 years
                                of experience, we combine advanced reproductive technology with personalized,
                                compassionate care.
                            </p>
                            <p className="text-muted-foreground mb-6">
                                Our team of board-certified reproductive endocrinologists, embryologists, and fertility
                                specialists work together to provide comprehensive fertility services, from initial
                                consultation to successful pregnancy and beyond.
                            </p>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                                    <div>
                                        <div className="font-semibold mb-1">Advanced Laboratory Technology</div>
                                        <p className="text-sm text-muted-foreground">
                                            State-of-the-art IVF lab with cutting-edge equipment and strict quality
                                            control
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                                    <div>
                                        <div className="font-semibold mb-1">Expert Medical Team</div>
                                        <p className="text-sm text-muted-foreground">
                                            Board-certified specialists with decades of combined experience
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                                    <div>
                                        <div className="font-semibold mb-1">Personalized Treatment Plans</div>
                                        <p className="text-sm text-muted-foreground">
                                            Every patient receives customized care based on their unique needs
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Card className="text-center p-6">
                                <Award className="h-10 w-10 text-primary mx-auto mb-3" />
                                <div className="text-2xl font-bold mb-1">CAP Accredited</div>
                                <div className="text-sm text-muted-foreground">Laboratory Excellence</div>
                            </Card>
                            <Card className="text-center p-6">
                                <Shield className="h-10 w-10 text-primary mx-auto mb-3" />
                                <div className="text-2xl font-bold mb-1">HIPAA Compliant</div>
                                <div className="text-sm text-muted-foreground">Data Security</div>
                            </Card>
                            <Card className="text-center p-6">
                                <Users className="h-10 w-10 text-primary mx-auto mb-3" />
                                <div className="text-2xl font-bold mb-1">50+ Staff</div>
                                <div className="text-sm text-muted-foreground">Dedicated Team</div>
                            </Card>
                            <Card className="text-center p-6">
                                <TrendingUp className="h-10 w-10 text-primary mx-auto mb-3" />
                                <div className="text-2xl font-bold mb-1">Top 10%</div>
                                <div className="text-sm text-muted-foreground">Success Rates</div>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-20 px-4">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Your fertility journey simplified into clear, manageable steps with expert support
                        </p>
                    </div>
                    <div className="grid md:grid-cols-4 gap-6">
                        <ProcessStep
                            number="1"
                            title="Initial Consultation"
                            description="Meet with our fertility specialists to discuss your medical history, goals, and concerns. We'll answer all your questions."
                            icon={<Calendar className="h-6 w-6" />}
                        />
                        <ProcessStep
                            number="2"
                            title="Comprehensive Testing"
                            description="Complete fertility evaluation including hormone tests, ultrasounds, and semen analysis to understand your unique situation."
                            icon={<ClipboardCheck className="h-6 w-6" />}
                        />
                        <ProcessStep
                            number="3"
                            title="Personalized Treatment Plan"
                            description="Based on test results, we create a customized treatment protocol designed specifically for your needs and budget."
                            icon={<Target className="h-6 w-6" />}
                        />
                        <ProcessStep
                            number="4"
                            title="Begin Treatment"
                            description="Start your fertility journey with continuous monitoring, medication management, and emotional support throughout."
                            icon={<Activity className="h-6 w-6" />}
                        />
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section id="services" className="py-20 px-4 bg-muted/30">
                <div className="container mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Fertility Services</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Comprehensive fertility treatments tailored to your unique needs, backed by advanced
                            technology and compassionate care
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        <ServiceCard
                            icon={<HeartPulse className="h-8 w-8" />}
                            title="IVF (In Vitro Fertilization)"
                            description="Comprehensive IVF treatment management with advanced laboratory protocols and monitoring."
                            linkTo="/services/ivf"
                        />
                        <ServiceCard
                            icon={<UserCheck className="h-8 w-8" />}
                            title="IUI (Intrauterine Insemination)"
                            description="Efficient IUI procedure tracking and timing optimization for better success rates."
                            linkTo="/services/iui"
                        />
                        <ServiceCard
                            icon={<Database className="h-8 w-8" />}
                            title="Egg Freezing"
                            description="State-of-the-art egg freezing services with advanced vitrification technology."
                            linkTo="/services/egg-freezing"
                        />
                        <ServiceCard
                            icon={<FlaskConical className="h-8 w-8" />}
                            title="Embryo Freezing"
                            description="Secure embryo cryopreservation with comprehensive storage and monitoring."
                            linkTo="/services/embryo-freezing"
                        />
                        <ServiceCard
                            icon={<Shield className="h-8 w-8" />}
                            title="Fertility Preservation"
                            description="Comprehensive fertility preservation options for medical and personal reasons."
                            linkTo="/services/fertility-preservation"
                        />
                        <ServiceCard
                            icon={<UserCheck className="h-8 w-8" />}
                            title="Male Fertility"
                            description="Complete male fertility assessment and treatment solutions."
                            linkTo="/services/male-fertility"
                        />
                    </div>

                    {/* View All Services Link */}
                    <div className="text-center mt-12">
                        <Button variant="outline" size="lg" asChild>
                            <a href="#services">
                                View All Services
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </a>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-20 px-4">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Success Stories</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Real stories from families who achieved their dreams with our help
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        <TestimonialCard
                            quote="After years of trying, CryoBank gave us hope. The team was compassionate, professional, and we're now proud parents of twins!"
                            author="Sarah & Michael"
                            treatment="IVF Treatment"
                            rating={5}
                        />
                        <TestimonialCard
                            quote="The egg freezing process was smooth and empowering. I feel confident about my future family planning options."
                            author="Jennifer L."
                            treatment="Egg Freezing"
                            rating={5}
                        />
                        <TestimonialCard
                            quote="We appreciated the personalized care and clear communication throughout our fertility journey. Our son is the best gift ever!"
                            author="David & Emily"
                            treatment="IUI Treatment"
                            rating={5}
                        />
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-20 px-4 bg-muted/30">
                <div className="container mx-auto max-w-4xl">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
                        <p className="text-muted-foreground">
                            Common questions about fertility treatments and our services
                        </p>
                    </div>
                    <div className="space-y-6">
                        <FAQItem
                            question="What is the success rate of IVF treatment?"
                            answer="Success rates vary based on age and individual factors. For women under 35, our IVF success rate is approximately 45-50% per cycle. We provide personalized success rate estimates during your consultation based on your specific situation."
                        />
                        <FAQItem
                            question="How much does fertility treatment cost?"
                            answer="Costs vary depending on the treatment type. IUI typically ranges from $500-$2,500 per cycle, while IVF costs $15,000-$25,000 per cycle including medications. We offer payment plans, accept insurance, and provide transparent pricing during consultation."
                        />
                        <FAQItem
                            question="How long does the IVF process take?"
                            answer="A complete IVF cycle typically takes 4-6 weeks from start to pregnancy test. This includes 8-14 days of ovarian stimulation, egg retrieval, 3-6 days of embryo development, embryo transfer, and a 10-14 day wait before the pregnancy test."
                        />
                        <FAQItem
                            question="Is egg freezing right for me?"
                            answer="Egg freezing is ideal if you want to preserve your fertility for the future, whether for career, personal reasons, or medical conditions like cancer treatment. The best time to freeze eggs is in your 20s or early 30s when egg quality is highest."
                        />
                        <FAQItem
                            question="Do you accept insurance?"
                            answer="We work with most major insurance providers and will help you understand your coverage. Many insurance plans now cover fertility treatments, and we have a dedicated financial counselor to help maximize your benefits and explore financing options."
                        />
                        <FAQItem
                            question="What makes CryoBank different?"
                            answer="We combine cutting-edge technology with personalized care, offering success rates in the top 10% nationally. Our experienced team, state-of-the-art laboratory, comprehensive services, and patient-centered approach set us apart."
                        />
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 px-4">
                <div className="container mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose CryoBank</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Everything you need for a successful fertility journey
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        <FeatureItem
                            title="Advanced Security & Privacy"
                            description="HIPAA-compliant systems with end-to-end encryption ensure your medical information and samples are protected with the highest security standards."
                            icon={<Lock className="h-5 w-5" />}
                        />
                        <FeatureItem
                            title="24/7 Monitoring & Support"
                            description="Round-the-clock monitoring of cryogenic storage with instant alerts, emergency protocols, and backup systems to protect your precious samples."
                            icon={<Clock className="h-5 w-5" />}
                        />
                        <FeatureItem
                            title="Comprehensive Patient Portal"
                            description="Access test results, treatment schedules, educational resources, and communicate with your care team anytime through our secure online portal."
                            icon={<FileCheck className="h-5 w-5" />}
                        />
                        <FeatureItem
                            title="Transparent Reporting"
                            description="Detailed reports on treatment progress, success rates, and financial summaries. We believe in complete transparency throughout your journey."
                            icon={<Database className="h-5 w-5" />}
                        />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
                <div className="container mx-auto">
                    <Card className="max-w-4xl mx-auto text-center border-primary/20 bg-background/50 backdrop-blur">
                        <CardContent className="py-12 px-6">
                            <HeartPulse className="h-16 w-16 mx-auto mb-6 text-primary" />
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">
                                Ready to Start Your Fertility Journey?
                            </h2>
                            <p className="text-muted-foreground mb-8 text-lg max-w-2xl mx-auto">
                                Take the first step towards building your family. Our expert team is here to guide you
                                with personalized care, advanced treatments, and compassionate support every step of the
                                way.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                                <Button size="xl" asChild>
                                    <Link to="/login">
                                        Schedule Free Consultation
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Link>
                                </Button>
                                <Button size="xl" variant="outline" asChild>
                                    <a href="#services">Explore Treatment Options</a>
                                </Button>
                            </div>
                            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                    <span>Free Initial Consultation</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                    <span>Flexible Payment Plans</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                    <span>Insurance Accepted</span>
                                </div>
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
                            <h3 className="font-semibold mb-4">Services</h3>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>
                                    <Link to="/services/ivf" className="hover:text-primary transition-colors">
                                        IVF Treatment
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/services/iui" className="hover:text-primary transition-colors">
                                        IUI Treatment
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/services/egg-freezing" className="hover:text-primary transition-colors">
                                        Egg Freezing
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/services/embryo-freezing"
                                        className="hover:text-primary transition-colors"
                                    >
                                        Embryo Freezing
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/services/fertility-preservation"
                                        className="hover:text-primary transition-colors"
                                    >
                                        Fertility Preservation
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/services/male-fertility"
                                        className="hover:text-primary transition-colors"
                                    >
                                        Male Fertility
                                    </Link>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-4">Quick Links</h3>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>
                                    <a href="#about" className="hover:text-primary transition-colors">
                                        About Us
                                    </a>
                                </li>
                                <li>
                                    <a href="#features" className="hover:text-primary transition-colors">
                                        Features
                                    </a>
                                </li>
                                <li>
                                    <a href="#services" className="hover:text-primary transition-colors">
                                        Services
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

function ServiceCard({
    icon,
    title,
    description,
    linkTo,
}: {
    icon: React.ReactNode
    title: string
    description: string
    linkTo?: string
}) {
    const content = (
        <>
            <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                    {icon}
                </div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            {linkTo && (
                <CardContent className="pt-0">
                    <Button variant="ghost" size="sm" asChild className="group">
                        <Link to={linkTo}>
                            Learn More
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </Button>
                </CardContent>
            )}
        </>
    )

    return <Card className="hover:border-primary/40 transition-colors hover:shadow-lg">{content}</Card>
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

function ProcessStep({
    number,
    title,
    description,
    icon,
}: {
    number: string
    title: string
    description: string
    icon: React.ReactNode
}) {
    return (
        <Card className="text-center relative hover:shadow-lg transition-shadow">
            <CardContent className="pt-8 pb-6">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl shadow-lg">
                    {number}
                </div>
                <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 mt-2">
                    {icon}
                </div>
                <h3 className="font-semibold mb-2 text-lg">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    )
}

function TestimonialCard({
    quote,
    author,
    treatment,
    rating,
}: {
    quote: string
    author: string
    treatment: string
    rating: number
}) {
    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
                <Quote className="h-8 w-8 text-primary/20 mb-4" />
                <p className="text-muted-foreground mb-4 italic">&ldquo;{quote}&rdquo;</p>
                <div className="flex gap-1 mb-3">
                    {Array.from({ length: rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                </div>
                <div className="font-semibold">{author}</div>
                <div className="text-sm text-muted-foreground">{treatment}</div>
            </CardContent>
        </Card>
    )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
    return (
        <Card className="hover:border-primary/40 transition-colors">
            <CardHeader>
                <CardTitle className="text-lg flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                    {question}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">{answer}</p>
            </CardContent>
        </Card>
    )
}
