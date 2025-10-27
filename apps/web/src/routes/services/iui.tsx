import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@workspace/ui/components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { FlaskConical, ArrowRight, Clock, DollarSign, CheckCircle2, Heart, TrendingUp, Users } from 'lucide-react'
import { Badge } from '@workspace/ui/components/Badge'
import { Separator } from '@workspace/ui/components/Separator'

export const Route = createFileRoute('/services/iui')({
    component: IUIPage,
})

function IUIPage() {
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
                            <Link to="/services/ivf">About IVF</Link>
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
                        Intrauterine Insemination
                    </Badge>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">What is IUI?</h1>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                        Intrauterine Insemination (IUI) is a fertility treatment where sperm is placed directly into the
                        uterus around the time of ovulation to facilitate fertilization.
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
                                    <p className="text-2xl font-bold">15-20%</p>
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
                                    <p className="text-2xl font-bold">2-3 weeks</p>
                                    <p className="text-sm text-muted-foreground">Per Cycle</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                                    <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">$500-1,500</p>
                                    <p className="text-sm text-muted-foreground">Per Cycle</p>
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
                                    <p className="text-2xl font-bold">3-6 cycles</p>
                                    <p className="text-sm text-muted-foreground">Recommended</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Overview */}
                <Card className="mb-12">
                    <CardHeader>
                        <CardTitle>How IUI Works</CardTitle>
                        <CardDescription>A less invasive fertility treatment option</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-muted-foreground">
                            IUI is often one of the first fertility treatments recommended for couples experiencing
                            infertility. The procedure involves placing specially prepared (washed) sperm directly into
                            the uterus, closer to the egg, to increase the chances of fertilization.
                        </p>
                        <div className="grid md:grid-cols-2 gap-6 mt-6">
                            <div className="space-y-2">
                                <h4 className="font-semibold flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    Best For:
                                </h4>
                                <ul className="space-y-1 text-sm text-muted-foreground ml-7">
                                    <li>• Unexplained infertility</li>
                                    <li>• Mild male factor infertility</li>
                                    <li>• Cervical mucus problems</li>
                                    <li>• Mild endometriosis</li>
                                    <li>• Ejaculation dysfunction</li>
                                    <li>• Single women or same-sex couples using donor sperm</li>
                                </ul>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-semibold flex items-center gap-2">
                                    <Heart className="h-5 w-5 text-blue-600" />
                                    Key Benefits:
                                </h4>
                                <ul className="space-y-1 text-sm text-muted-foreground ml-7">
                                    <li>• Less invasive than IVF</li>
                                    <li>• Lower cost per cycle</li>
                                    <li>• Minimal medication required</li>
                                    <li>• Quick, painless procedure</li>
                                    <li>• No anesthesia needed</li>
                                    <li>• Can be combined with fertility drugs</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* IUI Timeline */}
                <Card className="mb-12">
                    <CardHeader>
                        <CardTitle>IUI Treatment Timeline</CardTitle>
                        <CardDescription>What to expect during each cycle</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            <TimelineStep
                                number={1}
                                title="Ovulation Monitoring"
                                duration="Days 1-14 of cycle"
                                description="Track your menstrual cycle to predict ovulation. May use ovulation predictor kits or ultrasound monitoring."
                                details={[
                                    'Baseline ultrasound on day 2-3',
                                    'Ovulation tracking with LH surge test',
                                    'Optional: Follicle monitoring ultrasounds',
                                    'Optional: Ovulation stimulation medication',
                                ]}
                                color="blue"
                            />

                            <TimelineStep
                                number={2}
                                title="Ovulation Trigger (if using medication)"
                                duration="Day 12-14"
                                description="If using fertility medication, an HCG trigger shot may be given to precisely time ovulation."
                                details={[
                                    'Injection given when follicle is mature',
                                    'Ovulation occurs 36-40 hours after trigger',
                                    'IUI scheduled 24-36 hours after trigger',
                                ]}
                                color="purple"
                            />

                            <TimelineStep
                                number={3}
                                title="Sperm Preparation"
                                duration="2 hours before procedure"
                                description="Sperm sample is collected and processed in the lab to concentrate the healthiest, most motile sperm."
                                details={[
                                    'Fresh sample provided at clinic',
                                    'Or donor/frozen sperm thawed',
                                    'Sperm washing removes debris',
                                    'Best sperm concentrated for insemination',
                                ]}
                                color="green"
                            />

                            <TimelineStep
                                number={4}
                                title="IUI Procedure"
                                duration="5-10 minutes"
                                description="The prepared sperm is inserted directly into the uterus using a thin, flexible catheter."
                                details={[
                                    'No anesthesia needed',
                                    'Speculum inserted to visualize cervix',
                                    'Catheter threaded through cervix',
                                    'Sperm slowly injected into uterus',
                                    'Rest for 10-15 minutes after',
                                ]}
                                color="orange"
                            />

                            <TimelineStep
                                number={5}
                                title="Two-Week Wait"
                                duration="14 days after IUI"
                                description="Wait period before pregnancy testing. Resume normal activities with some modifications."
                                details={[
                                    'Progesterone support may be prescribed',
                                    'Avoid strenuous exercise for 24 hours',
                                    'Continue prenatal vitamins',
                                    'Watch for early pregnancy symptoms',
                                ]}
                                color="pink"
                            />

                            <TimelineStep
                                number={6}
                                title="Pregnancy Test"
                                duration="Day 14 after IUI"
                                description="Blood test (beta-hCG) to confirm pregnancy."
                                details={[
                                    'Blood test more accurate than home test',
                                    'Positive test followed by ultrasound',
                                    'Negative test: discuss next steps',
                                    'Most doctors recommend 3-6 IUI cycles',
                                ]}
                                color="red"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Success Factors */}
                <Card className="mb-12">
                    <CardHeader>
                        <CardTitle>Success Rates & Factors</CardTitle>
                        <CardDescription>Understanding what influences IUI outcomes</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h4 className="font-semibold">Success Rates by Age</h4>
                                <div className="space-y-3">
                                    <SuccessRateBar age="Under 35" rate={20} color="bg-green-500" />
                                    <SuccessRateBar age="35-40" rate={15} color="bg-blue-500" />
                                    <SuccessRateBar age="Over 40" rate={10} color="bg-orange-500" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-semibold">Cumulative Success Rates</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span>After 3 cycles</span>
                                        <span className="font-medium">30-40%</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>After 6 cycles</span>
                                        <span className="font-medium">40-50%</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-4">
                                        Most pregnancies from IUI occur within the first 3-4 cycles. If not successful
                                        after 3-6 cycles, IVF may be recommended.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Cost Comparison */}
                <Card className="mb-12">
                    <CardHeader>
                        <CardTitle>Cost Information</CardTitle>
                        <CardDescription>IUI vs IVF cost comparison</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h4 className="font-semibold flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-primary" />
                                    IUI Costs
                                </h4>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex justify-between">
                                        <span className="text-muted-foreground">Natural cycle IUI</span>
                                        <span className="font-medium">$300 - $800</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span className="text-muted-foreground">Medicated cycle IUI</span>
                                        <span className="font-medium">$500 - $1,500</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span className="text-muted-foreground">Medications (if needed)</span>
                                        <span className="font-medium">$50 - $500</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span className="text-muted-foreground">Monitoring ultrasounds</span>
                                        <span className="font-medium">$200 - $400</span>
                                    </li>
                                    <Separator />
                                    <li className="flex justify-between font-bold">
                                        <span>Total per cycle</span>
                                        <span className="text-primary">$500 - $2,500</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-semibold">Comparison with IVF</h4>
                                <div className="p-4 bg-muted rounded-lg space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>IUI (per cycle)</span>
                                        <span className="font-medium">$500 - $2,500</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>IVF (per cycle)</span>
                                        <span className="font-medium">$15,000 - $25,000</span>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    While IUI has a lower success rate per cycle, it's significantly more affordable.
                                    Many patients try 3-6 IUI cycles before considering IVF.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* IUI vs IVF Comparison Table */}
                <Card className="mb-12">
                    <CardHeader>
                        <CardTitle>IUI vs IVF Comparison</CardTitle>
                        <CardDescription>Which treatment is right for you?</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4 font-semibold">Factor</th>
                                        <th className="text-left py-3 px-4 font-semibold">IUI</th>
                                        <th className="text-left py-3 px-4 font-semibold">IVF</th>
                                    </tr>
                                </thead>
                                <tbody className="text-muted-foreground">
                                    <tr className="border-b">
                                        <td className="py-3 px-4 font-medium text-foreground">Success Rate</td>
                                        <td className="py-3 px-4">15-20% per cycle</td>
                                        <td className="py-3 px-4">40-50% per cycle</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-3 px-4 font-medium text-foreground">Cost per Cycle</td>
                                        <td className="py-3 px-4">$500-$2,500</td>
                                        <td className="py-3 px-4">$15,000-$25,000</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-3 px-4 font-medium text-foreground">Invasiveness</td>
                                        <td className="py-3 px-4">Minimal (no surgery)</td>
                                        <td className="py-3 px-4">Moderate (egg retrieval)</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-3 px-4 font-medium text-foreground">Medication</td>
                                        <td className="py-3 px-4">Optional, low dose</td>
                                        <td className="py-3 px-4">Required, higher dose</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-3 px-4 font-medium text-foreground">Time Commitment</td>
                                        <td className="py-3 px-4">2-3 weeks, few appointments</td>
                                        <td className="py-3 px-4">4-6 weeks, many appointments</td>
                                    </tr>
                                    <tr>
                                        <td className="py-3 px-4 font-medium text-foreground">Best For</td>
                                        <td className="py-3 px-4">Mild infertility, younger age</td>
                                        <td className="py-3 px-4">Complex infertility, older age</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* CTA Section */}
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                    <CardContent className="py-12 text-center">
                        <h2 className="text-3xl font-bold mb-4">Is IUI Right for You?</h2>
                        <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                            Schedule a consultation with our fertility specialists to discuss whether IUI is the best
                            option for your situation.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button size="lg" asChild>
                                <Link to="/register">
                                    Schedule Consultation
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                            <Button size="lg" variant="outline" asChild>
                                <Link to="/services/ivf">Learn About IVF</Link>
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
