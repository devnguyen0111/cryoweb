import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@workspace/ui/components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import {
    FlaskConical,
    ArrowRight,
    Clock,
    Calendar,
    DollarSign,
    CheckCircle2,
    AlertCircle,
    Heart,
    Users,
    Activity,
    TrendingUp,
} from 'lucide-react'
import { Badge } from '@workspace/ui/components/Badge'
import { Separator } from '@workspace/ui/components/Separator'

export const Route = createFileRoute('/services/ivf')({
    component: IVFPage,
})

function IVFPage() {
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
                            <Link to="/services/iui">About IUI</Link>
                        </Button>
                        <Button size="sm" asChild>
                            <Link to="/register">Schedule Consultation</Link>
                        </Button>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-12 max-w-6xl">
                {/* Hero Section */}
                <div className="text-center mb-12">
                    <Badge variant="outline" className="mb-4">
                        In Vitro Fertilization
                    </Badge>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">What is IVF?</h1>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                        In Vitro Fertilization (IVF) is an advanced fertility treatment where eggs and sperm are
                        combined outside the body in a laboratory setting.
                    </p>
                </div>

                {/* Quick Stats */}
                <div className="grid md:grid-cols-4 gap-6 mb-12">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                                    <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">40-50%</p>
                                    <p className="text-sm text-muted-foreground">Success Rate</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                    <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">4-6 weeks</p>
                                    <p className="text-sm text-muted-foreground">Treatment Duration</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                                    <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">3-5 days</p>
                                    <p className="text-sm text-muted-foreground">Embryo Culture</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                                    <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">8M+</p>
                                    <p className="text-sm text-muted-foreground">Babies Born</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Overview */}
                <Card className="mb-12">
                    <CardHeader>
                        <CardTitle>How IVF Works</CardTitle>
                        <CardDescription>A comprehensive assisted reproductive technology procedure</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-muted-foreground">
                            IVF is one of the most effective and widely used fertility treatments available today. The
                            process involves stimulating the ovaries to produce multiple eggs, retrieving those eggs,
                            fertilizing them with sperm in a laboratory, and then transferring the resulting embryo(s)
                            back into the uterus.
                        </p>
                        <div className="grid md:grid-cols-2 gap-6 mt-6">
                            <div className="space-y-2">
                                <h4 className="font-semibold flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    Best For:
                                </h4>
                                <ul className="space-y-1 text-sm text-muted-foreground ml-7">
                                    <li>• Blocked or damaged fallopian tubes</li>
                                    <li>• Male factor infertility</li>
                                    <li>• Endometriosis</li>
                                    <li>• Unexplained infertility</li>
                                    <li>• Advanced maternal age (over 35)</li>
                                    <li>• Genetic disorders requiring testing</li>
                                </ul>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-semibold flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-blue-600" />
                                    Key Benefits:
                                </h4>
                                <ul className="space-y-1 text-sm text-muted-foreground ml-7">
                                    <li>• Higher success rates than other treatments</li>
                                    <li>• Genetic screening options (PGT-A)</li>
                                    <li>• Can use donor eggs or sperm</li>
                                    <li>• Extra embryos can be frozen</li>
                                    <li>• Option for single embryo transfer</li>
                                    <li>• Precise timing and control</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* IVF Timeline */}
                <Card className="mb-12">
                    <CardHeader>
                        <CardTitle>IVF Treatment Timeline</CardTitle>
                        <CardDescription>Step-by-step process from start to pregnancy test</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {/* Step 1 */}
                            <TimelineStep
                                number={1}
                                title="Ovarian Stimulation"
                                duration="8-14 days"
                                description="Daily hormone injections to stimulate the ovaries to produce multiple eggs instead of the single egg that normally develops each month."
                                details={[
                                    'Follicle Stimulating Hormone (FSH) injections',
                                    'Regular monitoring with ultrasounds',
                                    'Blood tests to check hormone levels',
                                    'Medication to prevent premature ovulation',
                                ]}
                                color="blue"
                            />

                            {/* Step 2 */}
                            <TimelineStep
                                number={2}
                                title="Trigger Shot & Egg Retrieval"
                                duration="36 hours + 20-30 min procedure"
                                description="Final hormone injection to mature eggs, followed by a minor surgical procedure to collect eggs from the ovaries."
                                details={[
                                    'HCG trigger shot administered',
                                    'Procedure done under sedation',
                                    'Eggs collected via ultrasound-guided needle',
                                    'Average 8-15 eggs retrieved',
                                ]}
                                color="purple"
                            />

                            {/* Step 3 */}
                            <TimelineStep
                                number={3}
                                title="Fertilization"
                                duration="Same day as retrieval"
                                description="Eggs are combined with sperm in the laboratory. Fertilization can occur through conventional IVF or ICSI (Intracytoplasmic Sperm Injection)."
                                details={[
                                    'Sperm sample provided or thawed',
                                    'Eggs and sperm combined in culture dish',
                                    'ICSI may be used for male factor issues',
                                    'Checked next day for fertilization',
                                ]}
                                color="green"
                            />

                            {/* Step 4 */}
                            <TimelineStep
                                number={4}
                                title="Embryo Development"
                                duration="3-6 days"
                                description="Fertilized eggs (embryos) are cultured in the lab. Embryologists monitor their growth and development daily."
                                details={[
                                    'Day 1: Check for fertilization',
                                    'Day 3: 6-8 cell embryo',
                                    'Day 5-6: Blastocyst stage (100+ cells)',
                                    'PGT-A genetic testing available',
                                ]}
                                color="orange"
                            />

                            {/* Step 5 */}
                            <TimelineStep
                                number={5}
                                title="Embryo Transfer"
                                duration="15-20 minutes"
                                description="One or more healthy embryos are transferred into the uterus. This is a simple, painless procedure that doesn't require anesthesia."
                                details={[
                                    'No anesthesia needed',
                                    'Catheter used to place embryo(s)',
                                    'Ultrasound guidance for placement',
                                    'Rest recommended after procedure',
                                ]}
                                color="pink"
                            />

                            {/* Step 6 */}
                            <TimelineStep
                                number={6}
                                title="Two-Week Wait & Pregnancy Test"
                                duration="10-14 days"
                                description="After embryo transfer, you'll wait approximately two weeks before taking a pregnancy test."
                                details={[
                                    'Progesterone support continued',
                                    'Blood test scheduled (beta-hCG)',
                                    'Symptoms may or may not occur',
                                    'Follow-up ultrasound if positive',
                                ]}
                                color="red"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Success Rates */}
                <Card className="mb-12">
                    <CardHeader>
                        <CardTitle>Success Rates by Age</CardTitle>
                        <CardDescription>Live birth rates per IVF cycle</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <SuccessRateBar age="Under 35" rate={50} color="bg-green-500" />
                            <SuccessRateBar age="35-37" rate={40} color="bg-blue-500" />
                            <SuccessRateBar age="38-40" rate={30} color="bg-yellow-500" />
                            <SuccessRateBar age="41-42" rate={20} color="bg-orange-500" />
                            <SuccessRateBar age="Over 42" rate={10} color="bg-red-500" />
                        </div>
                        <p className="text-sm text-muted-foreground mt-4">
                            * Success rates vary based on individual factors including fertility diagnosis, ovarian
                            reserve, sperm quality, and clinic-specific protocols.
                        </p>
                    </CardContent>
                </Card>

                {/* Cost Information */}
                <Card className="mb-12">
                    <CardHeader>
                        <CardTitle>Cost & Financial Considerations</CardTitle>
                        <CardDescription>Understanding IVF investment</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-primary" />
                                    Average Costs (Per Cycle)
                                </h4>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex justify-between">
                                        <span className="text-muted-foreground">IVF Base Treatment</span>
                                        <span className="font-medium">$12,000 - $15,000</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span className="text-muted-foreground">Medications</span>
                                        <span className="font-medium">$3,000 - $5,000</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span className="text-muted-foreground">ICSI (if needed)</span>
                                        <span className="font-medium">$1,500 - $2,000</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span className="text-muted-foreground">PGT-A Testing</span>
                                        <span className="font-medium">$3,000 - $5,000</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span className="text-muted-foreground">Embryo Freezing (1st year)</span>
                                        <span className="font-medium">$600 - $1,000</span>
                                    </li>
                                    <Separator />
                                    <li className="flex justify-between font-bold">
                                        <span>Total Estimated Cost</span>
                                        <span className="text-primary">$15,000 - $25,000</span>
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                    <Heart className="h-5 w-5 text-primary" />
                                    Financial Options
                                </h4>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium">Insurance Coverage</p>
                                            <p className="text-sm text-muted-foreground">
                                                Check with your insurance provider for fertility coverage
                                            </p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium">Payment Plans</p>
                                            <p className="text-sm text-muted-foreground">
                                                Flexible payment options and financing available
                                            </p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium">Multi-Cycle Packages</p>
                                            <p className="text-sm text-muted-foreground">
                                                Discounted rates for multiple cycles
                                            </p>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* CTA Section */}
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                    <CardContent className="py-12 text-center">
                        <h2 className="text-3xl font-bold mb-4">Ready to Start Your IVF Journey?</h2>
                        <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                            Schedule a consultation with our fertility specialists to discuss your options and create a
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
                                <Link to="/services/iui">Compare with IUI</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Footer */}
            <footer className="border-t py-8 px-4 bg-muted/30 mt-12">
                <div className="container mx-auto text-center text-sm text-muted-foreground">
                    <p>
                        This information is for educational purposes only and should not replace professional medical
                        advice.
                    </p>
                    <p className="mt-2">© 2024 CryoBank. All rights reserved.</p>
                </div>
            </footer>
        </div>
    )
}

// Helper Components
function TimelineStep({
    number,
    title,
    duration,
    description,
    details,
    color,
}: {
    number: number
    title: string
    duration: string
    description: string
    details: string[]
    color: string
}) {
    const colorClasses = {
        blue: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
        purple: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
        green: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
        orange: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
        pink: 'bg-pink-100 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400',
        red: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    }

    return (
        <div className="flex gap-4">
            <div
                className={`flex-shrink-0 w-12 h-12 rounded-full ${colorClasses[color as keyof typeof colorClasses]} flex items-center justify-center font-bold text-lg`}
            >
                {number}
            </div>
            <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <Badge variant="secondary" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {duration}
                    </Badge>
                </div>
                <p className="text-muted-foreground mb-3">{description}</p>
                <ul className="space-y-1">
                    {details.map((detail, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{detail}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}

function SuccessRateBar({ age, rate, color }: { age: string; rate: number; color: string }) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between text-sm">
                <span className="font-medium">{age} years</span>
                <span className="text-muted-foreground">{rate}%</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${rate}%` }} />
            </div>
        </div>
    )
}
