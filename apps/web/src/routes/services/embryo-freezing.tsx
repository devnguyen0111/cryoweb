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
    Baby,
    Users,
    Shield,
} from 'lucide-react'
import { Badge } from '@workspace/ui/components/Badge'
import { Separator } from '@workspace/ui/components/Separator'

export const Route = createFileRoute('/services/embryo-freezing')({
    component: EmbryoFreezingPage,
})

function EmbryoFreezingPage() {
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
                        Embryo Cryopreservation
                    </Badge>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Embryo Freezing</h1>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                        Preserve embryos from your IVF cycle for future pregnancy attempts. The most successful method
                        of fertility preservation for couples.
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
                                    <p className="text-2xl font-bold">95-98%</p>
                                    <p className="text-sm text-muted-foreground">Survival Rate</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                    <Baby className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">40-60%</p>
                                    <p className="text-sm text-muted-foreground">Pregnancy Rate</p>
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
                                    <p className="text-2xl font-bold">Unlimited</p>
                                    <p className="text-sm text-muted-foreground">Storage Time</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                                    <Shield className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">Same</p>
                                    <p className="text-sm text-muted-foreground">As Fresh</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Overview */}
                <Card className="mb-12">
                    <CardHeader>
                        <CardTitle>What is Embryo Freezing?</CardTitle>
                        <CardDescription>Preserve embryos for future family building</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-muted-foreground">
                            Embryo freezing (cryopreservation) is the process of freezing and storing embryos created
                            through IVF for future use. This is often done when there are extra high-quality embryos
                            after a fresh IVF transfer, or when you want to preserve embryos before medical treatment,
                            or for family planning purposes.
                        </p>
                        <div className="grid md:grid-cols-2 gap-6 mt-6">
                            <div className="space-y-2">
                                <h4 className="font-semibold flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    Common Reasons:
                                </h4>
                                <ul className="space-y-1 text-sm text-muted-foreground ml-7">
                                    <li>• Extra embryos from IVF cycle</li>
                                    <li>• Want to space out pregnancies</li>
                                    <li>• Before cancer treatment (chemo/radiation)</li>
                                    <li>• Medical conditions requiring treatment</li>
                                    <li>• Risk of OHSS (delay fresh transfer)</li>
                                    <li>• Embryo banking for multiple children</li>
                                    <li>• Genetic testing results pending (PGT-A)</li>
                                </ul>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-semibold flex items-center gap-2">
                                    <Heart className="h-5 w-5 text-blue-600" />
                                    Key Advantages:
                                </h4>
                                <ul className="space-y-1 text-sm text-muted-foreground ml-7">
                                    <li>• Highest success rates of all frozen options</li>
                                    <li>• Already fertilized and developing</li>
                                    <li>• Can be genetically tested before freezing</li>
                                    <li>• More cost-effective than repeated IVF</li>
                                    <li>• Future pregnancies without ovarian stimulation</li>
                                    <li>• Proven track record (40+ years)</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Embryo Freezing vs Egg Freezing */}
                <Card className="mb-12">
                    <CardHeader>
                        <CardTitle>Embryo Freezing vs Egg Freezing</CardTitle>
                        <CardDescription>Understanding the differences</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4">Factor</th>
                                        <th className="text-left py-3 px-4">Embryo Freezing</th>
                                        <th className="text-left py-3 px-4">Egg Freezing</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b">
                                        <td className="py-3 px-4 font-medium">Requires Partner/Donor</td>
                                        <td className="py-3 px-4">✅ Yes (sperm needed)</td>
                                        <td className="py-3 px-4">❌ No</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-3 px-4 font-medium">Survival Rate After Thaw</td>
                                        <td className="py-3 px-4">95-98%</td>
                                        <td className="py-3 px-4">90-95%</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-3 px-4 font-medium">Success Rate (Pregnancy)</td>
                                        <td className="py-3 px-4">40-60% per transfer</td>
                                        <td className="py-3 px-4">30-50% (after IVF)</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-3 px-4 font-medium">Genetic Testing Option</td>
                                        <td className="py-3 px-4">✅ Yes (PGT-A)</td>
                                        <td className="py-3 px-4">❌ No (not yet fertilized)</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-3 px-4 font-medium">Legal/Ethical Complexity</td>
                                        <td className="py-3 px-4">Higher (both partners' consent)</td>
                                        <td className="py-3 px-4">Lower (single person)</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-3 px-4 font-medium">Best For</td>
                                        <td className="py-3 px-4">Couples, medical necessity</td>
                                        <td className="py-3 px-4">Single women, social freezing</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Process */}
                <Card className="mb-12">
                    <CardHeader>
                        <CardTitle>The Embryo Freezing Process</CardTitle>
                        <CardDescription>From IVF to cryopreservation</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            <ProcessStep
                                number={1}
                                title="IVF Cycle"
                                description="Complete IVF cycle with ovarian stimulation and egg retrieval."
                                details={[
                                    'Ovarian stimulation (10-14 days)',
                                    'Egg retrieval procedure',
                                    'Sperm collection or thaw',
                                    'Fertilization in lab (IVF or ICSI)',
                                ]}
                                color="blue"
                            />

                            <ProcessStep
                                number={2}
                                title="Embryo Development"
                                description="Embryos are cultured in the lab for 5-6 days to reach blastocyst stage."
                                details={[
                                    'Day 1: Check for fertilization',
                                    'Day 3: 6-8 cell embryo',
                                    'Day 5-6: Blastocyst stage (optimal for freezing)',
                                    'Embryologist grades quality',
                                ]}
                                color="green"
                            />

                            <ProcessStep
                                number={3}
                                title="Genetic Testing (Optional)"
                                description="PGT-A testing can be performed before freezing to check for chromosomal abnormalities."
                                details={[
                                    'Embryo biopsy (few cells removed)',
                                    'Cells sent for genetic analysis',
                                    'Results in 1-2 weeks',
                                    'Only chromosomally normal embryos frozen',
                                ]}
                                color="purple"
                            />

                            <ProcessStep
                                number={4}
                                title="Vitrification (Flash Freezing)"
                                description="Embryos are frozen using advanced vitrification technology."
                                details={[
                                    'Ultra-rapid freezing prevents ice crystals',
                                    'Frozen to -196°C in liquid nitrogen',
                                    '95-98% survival rate upon thaw',
                                    'Each embryo individually labeled and stored',
                                ]}
                                color="cyan"
                            />

                            <ProcessStep
                                number={5}
                                title="Storage"
                                description="Embryos are stored in secure cryogenic tanks indefinitely."
                                details={[
                                    '24/7 monitoring and security',
                                    'Backup systems in place',
                                    'Annual storage fees apply',
                                    'Can be stored for decades',
                                ]}
                                color="orange"
                            />

                            <ProcessStep
                                number={6}
                                title="Future Use (Frozen Embryo Transfer - FET)"
                                description="When ready, embryo is thawed and transferred to uterus."
                                details={[
                                    'Endometrial preparation (2-3 weeks)',
                                    'Embryo thawed on transfer day',
                                    'Simple transfer procedure (5-10 minutes)',
                                    'Pregnancy test 10-14 days later',
                                ]}
                                color="pink"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Success Rates */}
                <Card className="mb-12">
                    <CardHeader>
                        <CardTitle>Frozen Embryo Transfer Success Rates</CardTitle>
                        <CardDescription>Pregnancy rates per transfer by age</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <SuccessBar age="Under 35" rate={60} color="bg-green-500" />
                            <SuccessBar age="35-37" rate={50} color="bg-blue-500" />
                            <SuccessBar age="38-40" rate={40} color="bg-yellow-500" />
                            <SuccessBar age="41-42" rate={30} color="bg-orange-500" />
                            <SuccessBar age="Over 42" rate={20} color="bg-red-500" />
                        </div>
                        <div className="mt-6 p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">
                                <strong>Important:</strong> These rates are based on the woman's age when the embryos
                                were created, not her age at transfer. Frozen embryos from younger eggs have the same
                                success rates as fresh embryos. Some studies show FET may have slightly better outcomes
                                than fresh transfers due to optimal uterine conditions.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Cost */}
                <Card className="mb-12">
                    <CardHeader>
                        <CardTitle>Cost Information</CardTitle>
                        <CardDescription>Investment in embryo preservation</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-primary" />
                                    Initial Costs
                                </h4>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex justify-between">
                                        <span className="text-muted-foreground">Embryo freezing fee</span>
                                        <span className="font-medium">$500 - $1,500</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span className="text-muted-foreground">First year storage</span>
                                        <span className="font-medium">$600 - $1,000</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span className="text-muted-foreground">PGT-A testing (optional)</span>
                                        <span className="font-medium">$3,000 - $5,000</span>
                                    </li>
                                    <Separator />
                                    <li className="flex justify-between font-bold">
                                        <span>Total (without PGT-A)</span>
                                        <span className="text-primary">$1,100 - $2,500</span>
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-semibold mb-3">Ongoing & Future Costs</h4>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex justify-between p-3 bg-muted rounded-lg">
                                        <span>Annual storage fee</span>
                                        <span className="font-medium">$600 - $1,000/year</span>
                                    </li>
                                    <li className="flex justify-between p-3 bg-muted rounded-lg">
                                        <span>Future FET cycle</span>
                                        <span className="font-medium">$3,000 - $5,000</span>
                                    </li>
                                </ul>
                                <p className="text-sm text-muted-foreground mt-4">
                                    * FET is significantly less expensive than a full IVF cycle because it doesn't
                                    require ovarian stimulation, egg retrieval, or fertilization.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Legal & Ethical */}
                <Card className="mb-12">
                    <CardHeader>
                        <CardTitle>Legal & Ethical Considerations</CardTitle>
                        <CardDescription>Important decisions and consent</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-amber-600" />
                                Consent & Decision Making
                            </h4>
                            <ul className="space-y-2 text-sm text-muted-foreground ml-7">
                                <li>• Both partners must consent to create and freeze embryos</li>
                                <li>• Decision about disposition if relationship ends</li>
                                <li>• What happens if one partner passes away</li>
                                <li>• How long to store embryos</li>
                                <li>• Option to donate to another couple, science, or discard</li>
                            </ul>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 mt-6">
                            <div>
                                <h4 className="font-semibold mb-3">Your Options for Unused Embryos:</h4>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                                        <span>Continue storage</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                                        <span>Donate to another couple/person</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                                        <span>Donate to research</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                                        <span>Thaw and discard</span>
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-semibold mb-3">Legal Protections:</h4>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-start gap-2">
                                        <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                                        <span>Detailed consent forms signed by both partners</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                                        <span>Regular renewal of storage agreements</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                                        <span>Clear documentation of embryo ownership</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                                        <span>Secure chain of custody</span>
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
                            question="How long can embryos be frozen?"
                            answer="Embryos can be stored indefinitely. The longest recorded successful pregnancy from a frozen embryo was after 27 years of storage. The freezing process completely stops all biological activity, so embryos don't age while frozen."
                        />
                        <FAQItem
                            question="Are babies from frozen embryos healthy?"
                            answer="Yes! Extensive research shows no increased risk of birth defects or developmental issues with babies born from frozen embryos. In fact, some studies suggest slightly better outcomes with frozen embryo transfers due to optimal uterine conditions."
                        />
                        <FAQItem
                            question="What if my partner and I separate?"
                            answer="This is covered in your initial consent forms. Typically, both partners must agree to use the embryos. If you can't agree, options include continued storage, donation, or disposal. Some couples create legal agreements before freezing to address this scenario."
                        />
                        <FAQItem
                            question="Can I ship embryos to another clinic?"
                            answer="Yes, frozen embryos can be shipped to other fertility clinics using specialized cryogenic shipping containers. This allows you to move, change clinics, or access certain treatments while keeping your embryos."
                        />
                        <FAQItem
                            question="What's the difference between Day 3 and Day 5 (blastocyst) embryo freezing?"
                            answer="Day 5-6 blastocysts are more developed and have better survival rates after thawing (95-98%) compared to Day 3 embryos (85-90%). Blastocysts also have higher pregnancy rates. Most clinics now preferentially freeze blastocysts when possible."
                        />
                        <FAQItem
                            question="How many embryos should I freeze?"
                            answer="This depends on your family goals. Many couples aim for 2-3 high-quality embryos per desired child. If you want 2 children, you might freeze 4-6 embryos. Your doctor will discuss realistic expectations based on your embryo quality."
                        />
                    </CardContent>
                </Card>

                {/* CTA Section */}
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                    <CardContent className="py-12 text-center">
                        <Snowflake className="h-16 w-16 mx-auto mb-4 text-primary" />
                        <h2 className="text-3xl font-bold mb-4">Ready to Preserve Your Embryos?</h2>
                        <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                            Whether you have extra embryos from IVF or want to freeze embryos before medical treatment,
                            we're here to help you preserve your family-building options.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button size="lg" asChild>
                                <Link to="/login">
                                    Sign In to Book Consultation
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
function ProcessStep({
    number,
    title,
    description,
    details,
    color,
}: {
    number: number
    title: string
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
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
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

function SuccessBar({ age, rate, color }: { age: string; rate: number; color: string }) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between text-sm">
                <span className="font-medium">{age} (age when embryos created)</span>
                <span className="text-muted-foreground">{rate}% per transfer</span>
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
