import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@workspace/ui/components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import {
    FlaskConical,
    ArrowRight,
    Shield,
    Heart,
    Snowflake,
    Baby,
    Clock,
    Users,
    CheckCircle2,
    AlertCircle,
    DollarSign,
    Sparkles,
    TrendingUp,
} from 'lucide-react'
import { Badge } from '@workspace/ui/components/Badge'
import { Separator } from '@workspace/ui/components/Separator'

export const Route = createFileRoute('/services/fertility-preservation')({
    component: FertilityPreservationPage,
})

function FertilityPreservationPage() {
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
                            <Link to="/services/egg-freezing">Egg Freezing</Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                            <Link to="/services">All Services</Link>
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
                        <Shield className="h-3 w-3 mr-1" />
                        Protect Your Future
                    </Badge>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Fertility Preservation</h1>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                        Preserve your ability to have biological children in the future. Whether for medical reasons or
                        personal planning, we offer comprehensive fertility preservation options.
                    </p>
                </div>

                {/* Overview Cards */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    <Card className="border-blue-200 dark:border-blue-800">
                        <CardHeader>
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg w-fit">
                                <Heart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <CardTitle className="text-lg">Medical Reasons</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>• Cancer treatment (chemo/radiation)</li>
                                <li>• Autoimmune diseases</li>
                                <li>• Gender transition</li>
                                <li>• Upcoming surgery (ovaries/testes)</li>
                                <li>• Endometriosis</li>
                                <li>• Genetic conditions</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card className="border-purple-200 dark:border-purple-800">
                        <CardHeader>
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg w-fit">
                                <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <CardTitle className="text-lg">Social Reasons</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>• Career focus</li>
                                <li>• Education/training</li>
                                <li>• Not ready for children</li>
                                <li>• No current partner</li>
                                <li>• Financial planning</li>
                                <li>• Personal choice</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card className="border-green-200 dark:border-green-800">
                        <CardHeader>
                            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg w-fit">
                                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <CardTitle className="text-lg">Early Menopause Risk</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>• Family history of early menopause</li>
                                <li>• Low ovarian reserve</li>
                                <li>• BRCA gene mutations</li>
                                <li>• Turner syndrome</li>
                                <li>• Fragile X premutation</li>
                                <li>• Previous ovarian surgery</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                {/* Options Comparison */}
                <Card className="mb-12">
                    <CardHeader>
                        <CardTitle>Fertility Preservation Options</CardTitle>
                        <CardDescription>Choose the best option for your situation</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            <PreservationOption
                                icon={<Snowflake className="h-8 w-8 text-blue-600" />}
                                title="Egg Freezing (Oocyte Cryopreservation)"
                                bestFor="Women without a partner, social freezing"
                                process="Ovarian stimulation → Egg retrieval → Freeze unfertilized eggs"
                                successRate="30-50% pregnancy rate per egg retrieval cycle (age dependent)"
                                cost="$8,000-$15,000 per cycle + $500-$1,000/year storage"
                                pros={[
                                    'No partner or sperm needed',
                                    'Flexibility for future partner choice',
                                    'Can be done quickly (2-3 weeks)',
                                    'Proven technology',
                                ]}
                                cons={[
                                    'Success rates decline with age',
                                    'May need multiple cycles',
                                    'Requires hormone injections',
                                ]}
                                link="/services/egg-freezing"
                                color="blue"
                            />

                            <Separator />

                            <PreservationOption
                                icon={<Baby className="h-8 w-8 text-purple-600" />}
                                title="Embryo Freezing"
                                bestFor="Women with a partner, highest success rates"
                                process="IVF cycle → Fertilization with partner/donor sperm → Freeze embryos"
                                successRate="40-60% pregnancy rate per transfer (age dependent)"
                                cost="$15,000-$25,000 IVF + $500-$1,500 freezing + $600-$1,000/year storage"
                                pros={[
                                    'Highest success rates',
                                    'Embryos already fertilized',
                                    'Can do genetic testing (PGT-A)',
                                    'Similar to fresh IVF outcomes',
                                ]}
                                cons={[
                                    'Requires partner or sperm donor',
                                    'More expensive upfront',
                                    'Legal considerations (both partners)',
                                ]}
                                link="/services/embryo-freezing"
                                color="purple"
                            />

                            <Separator />

                            <PreservationOption
                                icon={<Sparkles className="h-8 w-8 text-pink-600" />}
                                title="Ovarian Tissue Freezing"
                                bestFor="Pre-pubertal girls, urgent cancer treatment, low ovarian reserve"
                                process="Surgical removal of ovarian tissue → Freeze tissue → Reimplant later"
                                successRate="130+ live births worldwide (experimental)"
                                cost="$8,000-$15,000 + surgery costs + storage"
                                pros={[
                                    'No hormone stimulation needed',
                                    'Can be done before puberty',
                                    'Can be done quickly (before chemo)',
                                    'Preserves both eggs and hormones',
                                ]}
                                cons={[
                                    'Still experimental',
                                    'Requires surgery (twice)',
                                    'Risk of reintroducing cancer cells',
                                    'Success rates still being established',
                                ]}
                                link="#"
                                color="pink"
                            />

                            <Separator />

                            <PreservationOption
                                icon={<Users className="h-8 w-8 text-cyan-600" />}
                                title="Sperm Freezing"
                                bestFor="Men facing cancer treatment, surgery, or personal reasons"
                                process="Semen collection → Analysis → Freeze sperm samples"
                                successRate="Similar to fresh sperm for IVF/IUI"
                                cost="$150-$1,000 initial + $200-$500/year storage"
                                pros={[
                                    'Simple and non-invasive',
                                    'Inexpensive compared to other options',
                                    'Can be done same day',
                                    'Sperm can be frozen for decades',
                                ]}
                                cons={[
                                    'May need multiple collections',
                                    'Some quality loss possible after thaw',
                                    'Partner still needs eggs when ready',
                                ]}
                                link="/services/male-fertility"
                                color="cyan"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Timeline for Medical Fertility Preservation */}
                <Card className="mb-12">
                    <CardHeader>
                        <CardTitle>Medical Fertility Preservation Timeline</CardTitle>
                        <CardDescription>For patients facing cancer treatment or surgery</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <TimelineItem
                                step="1"
                                title="Immediate Oncology Consultation"
                                description="Get oncologist approval and timeline for treatment"
                                timeframe="Day 1"
                                urgent
                            />
                            <TimelineItem
                                step="2"
                                title="Fertility Specialist Consultation"
                                description="Same or next day consultation with reproductive endocrinologist"
                                timeframe="Day 1-2"
                                urgent
                            />
                            <TimelineItem
                                step="3"
                                title="Choose Preservation Method"
                                description="Based on cancer type, treatment timeline, age, and partner status"
                                timeframe="Day 2-3"
                                urgent
                            />
                            <TimelineItem
                                step="4"
                                title="Begin Process"
                                description="Egg/embryo freezing: 2-3 weeks; Ovarian tissue: 1-2 days; Sperm: same day"
                                timeframe="Immediate"
                                urgent
                            />
                            <TimelineItem
                                step="5"
                                title="Complete Before Treatment"
                                description="Finish preservation before chemotherapy, radiation, or surgery"
                                timeframe="Before treatment starts"
                                urgent
                            />
                        </div>

                        <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <div className="flex gap-2">
                                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-red-900 dark:text-red-100 mb-1">
                                        Time-Sensitive for Cancer Patients
                                    </h4>
                                    <p className="text-sm text-red-800 dark:text-red-200">
                                        Fertility preservation should be discussed BEFORE starting cancer treatment.
                                        Chemotherapy and radiation can permanently damage eggs and sperm. Many clinics
                                        offer urgent/emergency appointments for cancer patients. Financial assistance
                                        and grants are often available.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Age-Specific Recommendations */}
                <Card className="mb-12">
                    <CardHeader>
                        <CardTitle>Age-Specific Recommendations</CardTitle>
                        <CardDescription>Best practices by age group</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <AgeRecommendation
                                ageRange="Under 30"
                                recommendation="Best time for egg freezing with highest success rates"
                                details={[
                                    'Freeze 10-15 eggs for one child',
                                    '85%+ success rate per egg retrieval',
                                    'Often only 1 cycle needed',
                                    'Eggs remain highest quality',
                                ]}
                                color="green"
                            />
                            <AgeRecommendation
                                ageRange="30-35"
                                recommendation="Still excellent outcomes, may need more eggs"
                                details={[
                                    'Freeze 15-20 eggs for one child',
                                    '75-80% success rate',
                                    'May need 1-2 cycles',
                                    'Good egg quality still',
                                ]}
                                color="blue"
                            />
                            <AgeRecommendation
                                ageRange="35-38"
                                recommendation="Strongly consider sooner rather than later"
                                details={[
                                    'Freeze 20-30 eggs for one child',
                                    '60-70% success rate',
                                    'Likely need 2+ cycles',
                                    'Egg quality declining',
                                ]}
                                color="yellow"
                            />
                            <AgeRecommendation
                                ageRange="38-40"
                                recommendation="Urgency increases, consider embryo freezing"
                                details={[
                                    'Freeze 30-40 eggs for one child',
                                    '40-50% success rate',
                                    'Likely need 3+ cycles',
                                    'Embryo freezing may be better option',
                                ]}
                                color="orange"
                            />
                            <AgeRecommendation
                                ageRange="Over 40"
                                recommendation="Consult specialist, consider donor eggs or embryos"
                                details={[
                                    'Success rates significantly lower',
                                    '30% or less per cycle',
                                    'May need 4+ cycles',
                                    'Discuss all options including donation',
                                ]}
                                color="red"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Insurance & Financial Aid */}
                <Card className="mb-12">
                    <CardHeader>
                        <CardTitle>Insurance & Financial Assistance</CardTitle>
                        <CardDescription>Help covering the costs</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-primary" />
                                    Insurance Coverage
                                </h4>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                                        <div>
                                            <strong>Medical necessity:</strong> Many insurance plans cover fertility
                                            preservation before cancer treatment
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                                        <div>
                                            <strong>State mandates:</strong> 20+ states require some IVF coverage
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                                        <div>
                                            <strong>Employer benefits:</strong> Growing number of companies cover
                                            egg/embryo freezing
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                                        <div>
                                            <strong>Transgender care:</strong> Some plans cover preservation before
                                            transition
                                        </div>
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-primary" />
                                    Financial Assistance Programs
                                </h4>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-start gap-2">
                                        <Heart className="h-4 w-4 text-blue-600 mt-0.5" />
                                        <div>
                                            <strong>Livestrong Fertility:</strong> Discounts for cancer patients
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Heart className="h-4 w-4 text-blue-600 mt-0.5" />
                                        <div>
                                            <strong>Chick Mission:</strong> Medication grants for cancer patients
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Heart className="h-4 w-4 text-blue-600 mt-0.5" />
                                        <div>
                                            <strong>Heartbeat Program:</strong> Free medications for qualifying patients
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Heart className="h-4 w-4 text-blue-600 mt-0.5" />
                                        <div>
                                            <strong>Military/VA:</strong> Coverage for service members
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Heart className="h-4 w-4 text-blue-600 mt-0.5" />
                                        <div>
                                            <strong>Clinic discounts:</strong> Many offer reduced rates for medical
                                            cases
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <h4 className="font-semibold mb-2">Cost-Saving Tips:</h4>
                            <ul className="space-y-1 text-sm">
                                <li>• Multi-cycle discounts (pay upfront for 2-3 cycles)</li>
                                <li>• Shared risk/refund programs</li>
                                <li>• Clinical trials or research studies</li>
                                <li>• Fertility medication discount programs (30-50% off)</li>
                                <li>• Check if HSA/FSA funds can be used</li>
                            </ul>
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
                            question="How do I choose between egg freezing and embryo freezing?"
                            answer="If you have a partner and are ready to commit to creating embryos together, embryo freezing has higher success rates. If you're single or want flexibility in future partner choice, egg freezing preserves your options. For cancer patients, consider your timeline - egg freezing is faster if you need to start treatment urgently."
                        />
                        <FAQItem
                            question="Can I still have children naturally after preservation?"
                            answer="Yes! Fertility preservation does not impact your ability to conceive naturally later. The egg retrieval doesn't use up your eggs faster - you would have ovulated and lost those eggs anyway. Think of it as rescuing eggs that would otherwise be lost that month."
                        />
                        <FAQItem
                            question="What if I have cancer and need to start treatment immediately?"
                            answer="For women: Random start protocols allow egg freezing to begin at any point in your cycle (within 3-5 days). Ovarian tissue freezing can be done within 1-2 days. For men: Sperm freezing can be done same-day. Many clinics offer emergency/urgent appointments. Speak with both your oncologist and a fertility specialist immediately."
                        />
                        <FAQItem
                            question="Are there age limits for fertility preservation?"
                            answer="Most clinics accept patients up to age 42-45 for egg/embryo freezing, though success rates decline with age. Younger is always better. Sperm freezing has no age limit. For medical preservation (cancer), age limits may be more flexible."
                        />
                        <FAQItem
                            question="What happens to my frozen eggs/embryos if I don't use them?"
                            answer="You have several options: continue storage indefinitely, donate to another person/couple trying to conceive, donate to research, or discard them. You make these decisions and can change your mind. There's no pressure to use them if your life circumstances change."
                        />
                        <FAQItem
                            question="Is fertility preservation right for me?"
                            answer="Consider preservation if: you're facing medical treatment that may harm fertility, you have a family history of early menopause, you're not ready for children but want biological kids someday, or you're over 30 and don't see having children in the next few years. A consultation with a fertility specialist can help you decide."
                        />
                    </CardContent>
                </Card>

                {/* CTA Section */}
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                    <CardContent className="py-12 text-center">
                        <Shield className="h-16 w-16 mx-auto mb-4 text-primary" />
                        <h2 className="text-3xl font-bold mb-4">Protect Your Fertility Future</h2>
                        <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                            Whether for medical necessity or personal planning, fertility preservation gives you control
                            over your reproductive future. Schedule a consultation to discuss your options.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button size="lg" asChild>
                                <Link to="/register">
                                    Schedule Consultation
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
function PreservationOption({
    icon,
    title,
    bestFor,
    process,
    successRate,
    cost,
    pros,
    cons,
    link,
    color,
}: {
    icon: React.ReactNode
    title: string
    bestFor: string
    process: string
    successRate: string
    cost: string
    pros: string[]
    cons: string[]
    link: string
    color: string
}) {
    return (
        <div className="space-y-4">
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0">{icon}</div>
                <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        <strong>Best for:</strong> {bestFor}
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                            <div className="p-3 bg-muted rounded-lg">
                                <p className="text-xs font-semibold text-muted-foreground mb-1">PROCESS</p>
                                <p className="text-sm">{process}</p>
                            </div>
                            <div className="p-3 bg-muted rounded-lg">
                                <p className="text-xs font-semibold text-muted-foreground mb-1">SUCCESS RATE</p>
                                <p className="text-sm">{successRate}</p>
                            </div>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                            <p className="text-xs font-semibold text-muted-foreground mb-1">COST</p>
                            <p className="text-sm">{cost}</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <h4 className="text-sm font-semibold text-green-600 mb-2">Pros:</h4>
                            <ul className="space-y-1">
                                {pros.map((pro, index) => (
                                    <li key={index} className="text-sm flex items-start gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                        <span>{pro}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-orange-600 mb-2">Cons:</h4>
                            <ul className="space-y-1">
                                {cons.map((con, index) => (
                                    <li key={index} className="text-sm flex items-start gap-2">
                                        <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                                        <span>{con}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {link !== '#' && (
                        <div className="mt-4">
                            <Button variant="outline" size="sm" asChild>
                                <Link to={link}>
                                    Learn More
                                    <ArrowRight className="ml-2 h-3 w-3" />
                                </Link>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function TimelineItem({
    step,
    title,
    description,
    timeframe,
    urgent = false,
}: {
    step: string
    title: string
    description: string
    timeframe: string
    urgent?: boolean
}) {
    return (
        <div className="flex gap-4">
            <div
                className={`flex-shrink-0 w-10 h-10 rounded-full ${urgent ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'bg-primary/10 text-primary'} flex items-center justify-center font-bold`}
            >
                {step}
            </div>
            <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold">{title}</h4>
                    <Badge variant={urgent ? 'destructive' : 'outline'} className="text-xs">
                        {timeframe}
                    </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
        </div>
    )
}

function AgeRecommendation({
    ageRange,
    recommendation,
    details,
    color,
}: {
    ageRange: string
    recommendation: string
    details: string[]
    color: string
}) {
    const colorClasses = {
        green: 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10',
        blue: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10',
        yellow: 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/10',
        orange: 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/10',
        red: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10',
    }

    return (
        <div className={`p-4 border rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
            <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">{ageRange}</h4>
                <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm mb-3">{recommendation}</p>
            <ul className="space-y-1">
                {details.map((detail, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{detail}</span>
                    </li>
                ))}
            </ul>
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
