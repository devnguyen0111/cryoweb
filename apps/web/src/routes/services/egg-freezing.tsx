import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@workspace/ui/components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import {
    FlaskConical,
    ArrowRight,
    Clock,
    DollarSign,
    CheckCircle2,
    AlertCircle,
    Heart,
    TrendingUp,
    Snowflake,
    Calendar,
    Users,
    Award,
} from 'lucide-react'
import { Badge } from '@workspace/ui/components/Badge'
import { Separator } from '@workspace/ui/components/Separator'

export const Route = createFileRoute('/services/egg-freezing')({
    component: EggFreezingPage,
})

function EggFreezingPage() {
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
                        <Button variant="ghost" size="sm" asChild>
                            <Link to="/services">All Services</Link>
                        </Button>
                        <Button size="sm" asChild>
                            <Link to="/login">Sign In to Book</Link>
                        </Button>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-12 max-w-6xl">
                {/* Hero Section */}
                <div className="text-center mb-12">
                    <Badge variant="outline" className="mb-4">
                        <Snowflake className="h-3 w-3 mr-1" />
                        Oocyte Cryopreservation
                    </Badge>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Egg Freezing</h1>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                        Preserve your fertility and take control of your reproductive future. Egg freezing allows you to
                        store your eggs at their peak quality for future use.
                    </p>
                </div>

                {/* Quick Stats */}
                <div className="grid md:grid-cols-4 gap-6 mb-12">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                    <Snowflake className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">95%+</p>
                                    <p className="text-sm text-muted-foreground">Survival Rate</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                                    <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">2-3 weeks</p>
                                    <p className="text-sm text-muted-foreground">Process Time</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                                    <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">Indefinite</p>
                                    <p className="text-sm text-muted-foreground">Storage Time</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                                    <Award className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">Best: &lt;35</p>
                                    <p className="text-sm text-muted-foreground">Optimal Age</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Overview */}
                <Card className="mb-12">
                    <CardHeader>
                        <CardTitle>What is Egg Freezing?</CardTitle>
                        <CardDescription>Preserve your fertility for the future</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-muted-foreground">
                            Egg freezing, also known as oocyte cryopreservation, is a method used to preserve a woman's
                            ability to get pregnant in the future. Eggs are extracted, frozen, and stored for later use.
                            When you are ready to use them, the eggs are thawed, fertilized with sperm, and transferred
                            to your uterus.
                        </p>
                        <div className="grid md:grid-cols-2 gap-6 mt-6">
                            <div className="space-y-2">
                                <h4 className="font-semibold flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    Why Consider Egg Freezing:
                                </h4>
                                <ul className="space-y-1 text-sm text-muted-foreground ml-7">
                                    <li>• Not ready to have children but want to preserve fertility</li>
                                    <li>• Focusing on career or education</li>
                                    <li>• Haven't found the right partner yet</li>
                                    <li>• Medical reasons (cancer treatment, surgery)</li>
                                    <li>• Family history of early menopause</li>
                                    <li>• Religious or ethical reasons to avoid embryo freezing</li>
                                </ul>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-semibold flex items-center gap-2">
                                    <Heart className="h-5 w-5 text-blue-600" />
                                    Key Benefits:
                                </h4>
                                <ul className="space-y-1 text-sm text-muted-foreground ml-7">
                                    <li>• Preserve eggs at their current quality</li>
                                    <li>• Reduce age-related fertility decline</li>
                                    <li>• Flexibility in family planning timeline</li>
                                    <li>• Higher pregnancy success rates than older eggs</li>
                                    <li>• Peace of mind about future fertility</li>
                                    <li>• No need for partner or sperm donor</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Process Timeline */}
                <Card className="mb-12">
                    <CardHeader>
                        <CardTitle>Egg Freezing Process</CardTitle>
                        <CardDescription>Step-by-step guide to preserving your eggs</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            <TimelineStep
                                number={1}
                                title="Initial Consultation & Testing"
                                duration="1-2 weeks"
                                description="Meet with fertility specialist to assess your ovarian reserve and overall reproductive health."
                                details={[
                                    'Blood tests (AMH, FSH, estradiol)',
                                    'Transvaginal ultrasound (antral follicle count)',
                                    'Medical history review',
                                    'Discuss goals and expected outcomes',
                                    'Financial counseling and consent forms',
                                ]}
                                color="blue"
                            />

                            <TimelineStep
                                number={2}
                                title="Ovarian Stimulation"
                                duration="10-14 days"
                                description="Daily hormone injections to stimulate your ovaries to produce multiple eggs."
                                details={[
                                    'Self-administered hormone injections',
                                    'Monitoring appointments every 2-3 days',
                                    'Blood tests and ultrasounds',
                                    'Medication adjustments as needed',
                                    'Trigger shot when eggs are mature',
                                ]}
                                color="purple"
                            />

                            <TimelineStep
                                number={3}
                                title="Egg Retrieval"
                                duration="30 minutes procedure"
                                description="Minor surgical procedure to collect mature eggs from your ovaries."
                                details={[
                                    'Performed under IV sedation (twilight anesthesia)',
                                    'Ultrasound-guided needle aspiration',
                                    'Eggs collected from follicles',
                                    'Average 10-20 eggs retrieved per cycle',
                                    'Recovery time: 1-2 hours at clinic',
                                    'Rest at home for remainder of day',
                                ]}
                                color="green"
                            />

                            <TimelineStep
                                number={4}
                                title="Egg Freezing (Vitrification)"
                                duration="Same day as retrieval"
                                description="Eggs are rapidly frozen using advanced vitrification technology."
                                details={[
                                    'Only mature eggs are frozen',
                                    'Flash-freezing prevents ice crystal formation',
                                    'Eggs stored in liquid nitrogen at -196°C',
                                    'Each egg individually labeled and tracked',
                                    'Can be stored indefinitely',
                                ]}
                                color="cyan"
                            />

                            <TimelineStep
                                number={5}
                                title="Storage & Annual Fees"
                                duration="As long as needed"
                                description="Your eggs are safely stored in our state-of-the-art cryostorage facility."
                                details={[
                                    '24/7 monitoring and security',
                                    'Backup power and alarm systems',
                                    'Annual storage fees apply',
                                    'You maintain complete control',
                                    'Can be used whenever you are ready',
                                ]}
                                color="orange"
                            />

                            <TimelineStep
                                number={6}
                                title="Future Use (When Ready)"
                                duration="IVF process (4-6 weeks)"
                                description="When you are ready to use your eggs, they will be thawed and fertilized through IVF."
                                details={[
                                    'Eggs thawed in lab (95%+ survival rate)',
                                    'Fertilized with partner or donor sperm',
                                    'Embryos cultured for 3-6 days',
                                    'Best embryo(s) transferred to uterus',
                                    'Pregnancy test 2 weeks later',
                                ]}
                                color="pink"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Age & Success Rates */}
                <Card className="mb-12">
                    <CardHeader>
                        <CardTitle>Success Rates by Age at Freezing</CardTitle>
                        <CardDescription>
                            Likelihood of live birth per egg frozen (when used in future IVF)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <SuccessRateBar age="Under 30" rate={85} eggsNeeded="15-20 eggs" color="bg-green-500" />
                                <SuccessRateBar age="30-34" rate={75} eggsNeeded="15-20 eggs" color="bg-blue-500" />
                                <SuccessRateBar age="35-37" rate={60} eggsNeeded="20-25 eggs" color="bg-yellow-500" />
                                <SuccessRateBar age="38-40" rate={45} eggsNeeded="25-30 eggs" color="bg-orange-500" />
                                <SuccessRateBar age="Over 40" rate={30} eggsNeeded="30-40 eggs" color="bg-red-500" />
                            </div>
                            <div className="p-4 bg-muted rounded-lg">
                                <p className="text-sm text-muted-foreground">
                                    <strong>Important:</strong> These are general estimates. Your personal success rate
                                    depends on egg quality, quantity, and overall health. Younger age at freezing =
                                    better outcomes. Most doctors recommend freezing eggs before age 35 for optimal
                                    results.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* How Many Eggs to Freeze */}
                <Card className="mb-12">
                    <CardHeader>
                        <CardTitle>How Many Eggs Should I Freeze?</CardTitle>
                        <CardDescription>Recommendations based on age and family goals</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h4 className="font-semibold">For One Child</h4>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex justify-between p-3 bg-muted rounded-lg">
                                        <span>Age &lt;35:</span>
                                        <span className="font-medium">10-15 eggs</span>
                                    </li>
                                    <li className="flex justify-between p-3 bg-muted rounded-lg">
                                        <span>Age 35-37:</span>
                                        <span className="font-medium">15-20 eggs</span>
                                    </li>
                                    <li className="flex justify-between p-3 bg-muted rounded-lg">
                                        <span>Age 38-40:</span>
                                        <span className="font-medium">25-30 eggs</span>
                                    </li>
                                    <li className="flex justify-between p-3 bg-muted rounded-lg">
                                        <span>Age &gt;40:</span>
                                        <span className="font-medium">30-40 eggs</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-semibold">For Two Children</h4>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex justify-between p-3 bg-muted rounded-lg">
                                        <span>Age &lt;35:</span>
                                        <span className="font-medium">20-25 eggs</span>
                                    </li>
                                    <li className="flex justify-between p-3 bg-muted rounded-lg">
                                        <span>Age 35-37:</span>
                                        <span className="font-medium">25-35 eggs</span>
                                    </li>
                                    <li className="flex justify-between p-3 bg-muted rounded-lg">
                                        <span>Age 38-40:</span>
                                        <span className="font-medium">35-45 eggs</span>
                                    </li>
                                    <li className="flex justify-between p-3 bg-muted rounded-lg">
                                        <span>Age &gt;40:</span>
                                        <span className="font-medium">45-60 eggs</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-4">
                            * Most women need 2-3 egg freezing cycles to reach recommended numbers. Your doctor will
                            create a personalized plan based on your ovarian reserve testing.
                        </p>
                    </CardContent>
                </Card>

                {/* Cost Information */}
                <Card className="mb-12">
                    <CardHeader>
                        <CardTitle>Cost & Financial Planning</CardTitle>
                        <CardDescription>Investment in your future fertility</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-primary" />
                                    One-Time Costs (Per Cycle)
                                </h4>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex justify-between">
                                        <span className="text-muted-foreground">Initial consultation & testing</span>
                                        <span className="font-medium">$500 - $1,000</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span className="text-muted-foreground">Egg freezing cycle</span>
                                        <span className="font-medium">$8,000 - $12,000</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span className="text-muted-foreground">Medications</span>
                                        <span className="font-medium">$3,000 - $5,000</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span className="text-muted-foreground">Anesthesia & facility fees</span>
                                        <span className="font-medium">$500 - $1,500</span>
                                    </li>
                                    <Separator />
                                    <li className="flex justify-between font-bold">
                                        <span>Total Per Cycle</span>
                                        <span className="text-primary">$12,000 - $19,500</span>
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-semibold mb-3">Ongoing Costs</h4>
                                <ul className="space-y-2 text-sm mb-6">
                                    <li className="flex justify-between p-3 bg-muted rounded-lg">
                                        <span>Annual storage fee</span>
                                        <span className="font-medium">$500 - $1,000/year</span>
                                    </li>
                                    <li className="flex justify-between p-3 bg-muted rounded-lg">
                                        <span>Future IVF (when using eggs)</span>
                                        <span className="font-medium">$5,000 - $7,000</span>
                                    </li>
                                </ul>

                                <h4 className="font-semibold mb-3">Financial Options</h4>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                                        <span>Multi-cycle discount packages</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                                        <span>Flexible payment plans</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                                        <span>Employer fertility benefits</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                                        <span>FSA/HSA eligible</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Risks & Considerations */}
                <Card className="mb-12">
                    <CardHeader>
                        <CardTitle>Important Considerations</CardTitle>
                        <CardDescription>What you should know before egg freezing</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <h4 className="font-semibold flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5 text-orange-600" />
                                    Risks & Limitations
                                </h4>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex items-start gap-2">
                                        <span className="text-orange-600 mt-1">•</span>
                                        <span>No guarantee of future pregnancy</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-orange-600 mt-1">•</span>
                                        <span>Not all eggs survive thawing (typically 85-95% do)</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-orange-600 mt-1">•</span>
                                        <span>OHSS (Ovarian Hyperstimulation Syndrome) risk</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-orange-600 mt-1">•</span>
                                        <span>Egg retrieval procedure risks (bleeding, infection - rare)</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-orange-600 mt-1">•</span>
                                        <span>Emotional and physical demands</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-orange-600 mt-1">•</span>
                                        <span>Ongoing storage costs</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="space-y-3">
                                <h4 className="font-semibold flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    Benefits & Success Factors
                                </h4>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-600 mt-1">•</span>
                                        <span>Preserves eggs at current age/quality</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-600 mt-1">•</span>
                                        <span>Advanced vitrification technology (95%+ survival)</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-600 mt-1">•</span>
                                        <span>Flexibility in family planning</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-600 mt-1">•</span>
                                        <span>Peace of mind about future fertility</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-600 mt-1">•</span>
                                        <span>No time limit on storage</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-600 mt-1">•</span>
                                        <span>Better than using older eggs in future</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* FAQs */}
                <Card className="mb-12">
                    <CardHeader>
                        <CardTitle>Frequently Asked Questions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FAQItem
                            question="What is the best age to freeze my eggs?"
                            answer="The ideal age is before 35, when egg quality and quantity are typically at their best. However, women up to their early 40s can still benefit. The younger you are when you freeze, the better your chances of success when you use them later."
                        />
                        <FAQItem
                            question="How long can eggs be frozen?"
                            answer="Eggs can be stored indefinitely. Studies show eggs frozen for 10+ years have similar success rates as recently frozen eggs. The freezing process stops all biological activity, so eggs don't age while frozen."
                        />
                        <FAQItem
                            question="Will freezing my eggs damage them?"
                            answer="With modern vitrification (flash-freezing) technology, 90-95% of eggs survive the thaw process. This is a significant improvement over older slow-freezing methods. Frozen eggs have similar fertilization and pregnancy rates as fresh eggs."
                        />
                        <FAQItem
                            question="How many cycles will I need?"
                            answer="Most women need 1-3 cycles to collect enough eggs. The number depends on your age, ovarian reserve, and how many children you hope to have. Your doctor will recommend a target number based on your individual situation."
                        />
                        <FAQItem
                            question="Can I still get pregnant naturally after freezing eggs?"
                            answer="Yes! Egg freezing does not affect your natural fertility. You'll still ovulate normally and can try to conceive naturally at any time. Egg freezing is simply an insurance policy for your future."
                        />
                        <FAQItem
                            question="Is the egg retrieval painful?"
                            answer="The retrieval is performed under IV sedation, so you won't feel pain during the procedure. Afterward, you may experience mild cramping, bloating, or discomfort for a few days, similar to menstrual cramps. Most women return to normal activities within 1-2 days."
                        />
                        <FAQItem
                            question="What happens if I never use my frozen eggs?"
                            answer="You have several options: keep them frozen indefinitely, donate them to another woman, donate to research, or have them discarded. Many women keep their eggs as 'insurance' and end up conceiving naturally, which is wonderful!"
                        />
                    </CardContent>
                </Card>

                {/* CTA Section */}
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                    <CardContent className="py-12 text-center">
                        <Snowflake className="h-16 w-16 mx-auto mb-4 text-primary" />
                        <h2 className="text-3xl font-bold mb-4">Ready to Preserve Your Fertility?</h2>
                        <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                            Schedule a consultation to learn more about egg freezing and whether it's right for you. Our
                            fertility specialists will answer all your questions and create a personalized plan.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button size="lg" asChild>
                                <Link to="/login">
                                    Sign In to Book Consultation
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                            <Button size="lg" variant="outline" asChild>
                                <Link to="/services">View All Services</Link>
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
        cyan: 'bg-cyan-100 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400',
        orange: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
        pink: 'bg-pink-100 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400',
    }

    return (
        <div className="flex gap-4">
            <div
                className={`flex-shrink-0 w-12 h-12 rounded-full ${colorClasses[color as keyof typeof colorClasses]} flex items-center justify-center font-bold text-lg`}
            >
                {number}
            </div>
            <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
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

function SuccessRateBar({
    age,
    rate,
    eggsNeeded,
    color,
}: {
    age: string
    rate: number
    eggsNeeded: string
    color: string
}) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between text-sm">
                <span className="font-medium">{age} years</span>
                <div className="flex gap-4">
                    <span className="text-muted-foreground">{eggsNeeded} recommended</span>
                    <span className="font-medium">{rate}% success per egg</span>
                </div>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${rate}%` }} />
            </div>
        </div>
    )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
    return (
        <div className="space-y-2">
            <h4 className="font-semibold">{question}</h4>
            <p className="text-sm text-muted-foreground">{answer}</p>
        </div>
    )
}
