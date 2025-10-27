import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@workspace/ui/components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import {
    FlaskConical,
    ArrowRight,
    Users,
    Heart,
    Shield,
    Activity,
    CheckCircle2,
    AlertCircle,
    DollarSign,
    TrendingUp,
    Microscope,
    Droplet,
    Snowflake,
} from 'lucide-react'
import { Badge } from '@workspace/ui/components/Badge'
import { Separator } from '@workspace/ui/components/Separator'

export const Route = createFileRoute('/services/male-fertility')({
    component: MaleFertilityPage,
})

function MaleFertilityPage() {
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
                            <Link to="/services/fertility-preservation">Fertility Preservation</Link>
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
                        <Users className="h-3 w-3 mr-1" />
                        Male Factor Infertility Solutions
                    </Badge>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Male Fertility Services</h1>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                        Comprehensive evaluation, treatment, and preservation options for male fertility. Male factors
                        contribute to 40-50% of infertility cases - you're not alone.
                    </p>
                </div>

                {/* Key Stats */}
                <div className="grid md:grid-cols-4 gap-6 mb-12">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                    <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">40-50%</p>
                                    <p className="text-sm text-muted-foreground">Of Cases</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                                    <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">90%</p>
                                    <p className="text-sm text-muted-foreground">Treatable</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                                    <Microscope className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">ICSI</p>
                                    <p className="text-sm text-muted-foreground">For Severe Cases</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                                    <Snowflake className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">Decades</p>
                                    <p className="text-sm text-muted-foreground">Storage Time</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Overview */}
                <Card className="mb-12">
                    <CardHeader>
                        <CardTitle>Understanding Male Infertility</CardTitle>
                        <CardDescription>Common causes and contributing factors</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="space-y-3">
                                <h4 className="font-semibold flex items-center gap-2">
                                    <Droplet className="h-5 w-5 text-blue-600" />
                                    Sperm Issues (90%)
                                </h4>
                                <ul className="space-y-2 text-sm text-muted-foreground ml-7">
                                    <li>• Low sperm count (oligospermia)</li>
                                    <li>• Poor motility (movement)</li>
                                    <li>• Abnormal morphology (shape)</li>
                                    <li>• No sperm (azoospermia)</li>
                                    <li>• DNA fragmentation</li>
                                </ul>
                            </div>

                            <div className="space-y-3">
                                <h4 className="font-semibold flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-purple-600" />
                                    Structural Issues
                                </h4>
                                <ul className="space-y-2 text-sm text-muted-foreground ml-7">
                                    <li>• Varicocele (enlarged veins)</li>
                                    <li>• Blocked vas deferens</li>
                                    <li>• Retrograde ejaculation</li>
                                    <li>• Erectile dysfunction</li>
                                    <li>• Hypogonadism (low testosterone)</li>
                                </ul>
                            </div>

                            <div className="space-y-3">
                                <h4 className="font-semibold flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5 text-orange-600" />
                                    Lifestyle & Medical
                                </h4>
                                <ul className="space-y-2 text-sm text-muted-foreground ml-7">
                                    <li>• Age (quality declines over time)</li>
                                    <li>• Smoking, alcohol, drugs</li>
                                    <li>• Obesity</li>
                                    <li>• Heat exposure (hot tubs, laptops)</li>
                                    <li>• Medications/steroids</li>
                                    <li>• Previous infections (STIs, mumps)</li>
                                    <li>• Cancer treatment</li>
                                    <li>• Genetic conditions</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Diagnostic Testing */}
                <Card className="mb-12">
                    <CardHeader>
                        <CardTitle>Comprehensive Diagnostic Testing</CardTitle>
                        <CardDescription>Understanding your fertility status</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <TestingStep
                                title="Semen Analysis (SA)"
                                description="The foundational test for male fertility evaluation"
                                details={[
                                    'Volume: 1.5-5 mL per ejaculation',
                                    'Count: 15+ million sperm/mL (normal)',
                                    'Motility: 40%+ moving forward',
                                    'Morphology: 4%+ normal shape',
                                    'pH, liquefaction, white blood cells',
                                ]}
                                cost="$100-$250"
                                timeframe="2-7 days abstinence, results in 1-3 days"
                                color="blue"
                            />

                            <TestingStep
                                title="Hormone Testing"
                                description="Blood tests to check testosterone, FSH, LH, and prolactin levels"
                                details={[
                                    'Testosterone (low can affect sperm production)',
                                    'FSH/LH (high may indicate testicular failure)',
                                    'Prolactin (high can reduce sperm)',
                                    'Estradiol levels',
                                ]}
                                cost="$200-$500"
                                timeframe="Blood draw, results in 3-7 days"
                                color="green"
                            />

                            <TestingStep
                                title="Genetic Testing"
                                description="For severe cases or unexplained infertility"
                                details={[
                                    'Karyotype (chromosome analysis)',
                                    'Y chromosome microdeletions',
                                    'Cystic fibrosis carrier screening',
                                    'DNA fragmentation test',
                                ]}
                                cost="$500-$2,000"
                                timeframe="Blood sample, results in 2-4 weeks"
                                color="purple"
                            />

                            <TestingStep
                                title="Physical Exam & Ultrasound"
                                description="Assess testicular size, varicocele, blockages"
                                details={[
                                    'Testicular exam (size, consistency)',
                                    'Scrotal ultrasound (varicocele detection)',
                                    'Transrectal ultrasound (blockage check)',
                                    'Post-ejaculation urinalysis (retrograde ejaculation)',
                                ]}
                                cost="$200-$800"
                                timeframe="Same day results"
                                color="cyan"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Treatment Options */}
                <Card className="mb-12">
                    <CardHeader>
                        <CardTitle>Treatment Options</CardTitle>
                        <CardDescription>From lifestyle changes to advanced procedures</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            <TreatmentOption
                                title="Lifestyle Modifications"
                                severity="Mild Issues"
                                successRate="20-40% improvement"
                                details={[
                                    'Quit smoking and reduce alcohol',
                                    'Lose weight if obese (BMI >30)',
                                    'Avoid hot tubs, saunas, tight underwear',
                                    'Reduce stress, improve sleep',
                                    'Healthy diet (antioxidants, vitamins)',
                                    'Avoid laptops on lap, long cycling',
                                    'Review medications with doctor',
                                ]}
                                timeframe="3-6 months to see improvement"
                                cost="Minimal"
                            />

                            <Separator />

                            <TreatmentOption
                                title="Medications"
                                severity="Hormonal Issues"
                                successRate="Varies by cause"
                                details={[
                                    'Clomiphene citrate (boosts testosterone, sperm)',
                                    'hCG injections (stimulates testosterone)',
                                    'Anastrozole (lowers estrogen)',
                                    'Antibiotics (if infection present)',
                                    'Antioxidants (vitamins C, E, CoQ10)',
                                ]}
                                timeframe="3-6 months of treatment"
                                cost="$50-$500/month"
                            />

                            <Separator />

                            <TreatmentOption
                                title="Surgical Intervention"
                                severity="Structural Problems"
                                successRate="50-80% improvement"
                                details={[
                                    'Varicocelectomy (repair varicocele) - most common',
                                    'Vasectomy reversal',
                                    'Sperm retrieval (TESE, MESA) for azoospermia',
                                    'Transurethral resection (clear blockages)',
                                ]}
                                timeframe="Recovery 2-6 weeks, sperm improvement 3-6 months"
                                cost="$3,000-$15,000"
                            />

                            <Separator />

                            <TreatmentOption
                                title="Assisted Reproductive Technology (ART)"
                                severity="Moderate to Severe"
                                successRate="40-70% pregnancy rate"
                                details={[
                                    'IUI with washed sperm (mild male factor)',
                                    'IVF with ICSI (severe male factor)',
                                    'ICSI: Single sperm injected into egg',
                                    'Sperm retrieval + ICSI (azoospermia)',
                                    'Donor sperm (if no viable sperm)',
                                ]}
                                timeframe="One cycle: 4-6 weeks"
                                cost="IUI: $500-$2,500 | IVF+ICSI: $15,000-$25,000"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* ICSI Explanation */}
                <Card className="mb-12 border-purple-200 dark:border-purple-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Microscope className="h-6 w-6 text-purple-600" />
                            ICSI (Intracytoplasmic Sperm Injection)
                        </CardTitle>
                        <CardDescription>The solution for severe male factor infertility</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <p className="text-muted-foreground">
                                ICSI is a specialized IVF technique where a single sperm is directly injected into an
                                egg. This bypasses the need for sperm to swim to and penetrate the egg naturally.
                            </p>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-semibold mb-3">ICSI is Recommended For:</h4>
                                    <ul className="space-y-2 text-sm">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                                            <span>Very low sperm count (&lt;5 million/mL)</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                                            <span>Poor sperm motility (&lt;10% moving)</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                                            <span>Abnormal sperm shape</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                                            <span>Previous IVF fertilization failure</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                                            <span>Surgical sperm retrieval (TESE, MESA)</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                                            <span>Using frozen sperm</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                                            <span>High DNA fragmentation</span>
                                        </li>
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="font-semibold mb-3">Success & Safety:</h4>
                                    <div className="space-y-3">
                                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                            <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">
                                                Fertilization Rate
                                            </p>
                                            <p className="text-2xl font-bold text-green-600">70-85%</p>
                                            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                                                Per mature egg injected
                                            </p>
                                        </div>

                                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                                                Pregnancy Rate
                                            </p>
                                            <p className="text-2xl font-bold text-blue-600">40-60%</p>
                                            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                                Per transfer (age-dependent)
                                            </p>
                                        </div>

                                        <p className="text-xs text-muted-foreground">
                                            * Babies born via ICSI have the same health outcomes as naturally conceived
                                            babies. Extensive research shows no increased risk of birth defects.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-muted rounded-lg mt-4">
                                <h4 className="font-semibold mb-2">Cost of ICSI:</h4>
                                <p className="text-sm text-muted-foreground">
                                    ICSI adds $1,500-$3,000 to the cost of IVF. Total IVF + ICSI cycle: $16,500-$28,000.
                                    Many insurance plans cover ICSI when medically necessary for male factor
                                    infertility.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Sperm Freezing */}
                <Card className="mb-12 border-cyan-200 dark:border-cyan-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Snowflake className="h-6 w-6 text-cyan-600" />
                            Sperm Freezing (Cryopreservation)
                        </CardTitle>
                        <CardDescription>Preserve your fertility for the future</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <h4 className="font-semibold mb-3">Common Reasons to Freeze Sperm:</h4>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-start gap-2">
                                        <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                                        <span>Before cancer treatment (chemo, radiation)</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                                        <span>Before vasectomy</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                                        <span>Before testicular/prostate surgery</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                                        <span>Declining sperm quality with age</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                                        <span>High-risk occupation (military, hazardous work)</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                                        <span>Gender transition (before hormone therapy)</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                                        <span>Difficulty producing sample on IVF egg retrieval day</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                                        <span>Progressive fertility decline (varicocele, etc.)</span>
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-semibold mb-3">The Process:</h4>
                                <div className="space-y-3">
                                    <div className="p-3 bg-muted rounded-lg">
                                        <p className="font-medium text-sm mb-1">Step 1: Screening</p>
                                        <p className="text-xs text-muted-foreground">
                                            Blood tests for HIV, Hepatitis B/C, and other infectious diseases (FDA
                                            requirement)
                                        </p>
                                    </div>
                                    <div className="p-3 bg-muted rounded-lg">
                                        <p className="font-medium text-sm mb-1">Step 2: Collection</p>
                                        <p className="text-xs text-muted-foreground">
                                            Semen sample via masturbation (private room) or surgical extraction if
                                            needed
                                        </p>
                                    </div>
                                    <div className="p-3 bg-muted rounded-lg">
                                        <p className="font-medium text-sm mb-1">Step 3: Analysis</p>
                                        <p className="text-xs text-muted-foreground">
                                            Lab analyzes sample to ensure adequate quality for freezing
                                        </p>
                                    </div>
                                    <div className="p-3 bg-muted rounded-lg">
                                        <p className="font-medium text-sm mb-1">Step 4: Freezing</p>
                                        <p className="text-xs text-muted-foreground">
                                            Sample mixed with cryoprotectant, divided into vials, flash frozen in liquid
                                            nitrogen (-196°C)
                                        </p>
                                    </div>
                                    <div className="p-3 bg-muted rounded-lg">
                                        <p className="font-medium text-sm mb-1">Step 5: Storage</p>
                                        <p className="text-xs text-muted-foreground">
                                            Secure storage in cryogenic tanks, can be stored for decades
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4 mt-6">
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                <DollarSign className="h-5 w-5 text-blue-600 mb-2" />
                                <p className="font-semibold text-sm mb-1">Cost</p>
                                <p className="text-2xl font-bold text-blue-600">$150-$1,000</p>
                                <p className="text-xs text-muted-foreground mt-1">Initial freezing + first year</p>
                                <p className="text-xs text-muted-foreground mt-2">$200-$500/year storage</p>
                            </div>

                            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                <Activity className="h-5 w-5 text-green-600 mb-2" />
                                <p className="font-semibold text-sm mb-1">Post-Thaw Survival</p>
                                <p className="text-2xl font-bold text-green-600">50-80%</p>
                                <p className="text-xs text-muted-foreground mt-1">Motile sperm survive thawing</p>
                                <p className="text-xs text-muted-foreground mt-2">Still enough for IUI or IVF</p>
                            </div>

                            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                                <Snowflake className="h-5 w-5 text-purple-600 mb-2" />
                                <p className="font-semibold text-sm mb-1">Storage Duration</p>
                                <p className="text-2xl font-bold text-purple-600">Unlimited</p>
                                <p className="text-xs text-muted-foreground mt-1">Indefinite storage possible</p>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Successful pregnancies after 20+ years
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-amber-600" />
                                For Cancer Patients: Act Quickly
                            </h4>
                            <p className="text-sm text-muted-foreground">
                                Chemotherapy and radiation can permanently damage sperm production. Freeze sperm BEFORE
                                starting treatment. Many clinics offer same-day emergency appointments. Financial
                                assistance programs available (Livestrong Fertility, Chick Mission).
                            </p>
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
                            question="How long does it take to improve sperm quality?"
                            answer="Sperm takes about 72 days to fully develop. So after making lifestyle changes or starting treatment, expect to wait 3 months for a new semen analysis to see improvement. This is why early intervention is important."
                        />
                        <FAQItem
                            question="Can I still father a child with low sperm count?"
                            answer="Yes! Even with very low counts, ICSI can achieve pregnancy using just a single sperm per egg. As long as there is at least one viable sperm (even surgically retrieved), there's hope. Natural conception is possible with counts as low as 5-10 million/mL."
                        />
                        <FAQItem
                            question="Does age affect male fertility?"
                            answer="Yes, though less dramatically than female fertility. Sperm quality, DNA integrity, and testosterone decline with age, especially after 40. Older fathers have slightly higher risks of autism, schizophrenia, and genetic mutations. Freezing sperm in your 20s-30s preserves younger, healthier sperm."
                        />
                        <FAQItem
                            question="What is the success rate of varicocele surgery?"
                            answer="Varicocelectomy improves sperm parameters in 60-80% of men. About 40-50% of couples achieve pregnancy within 1-2 years after surgery. It's most effective for men with palpable varicoceles and very low counts. Recovery takes 2-6 weeks, with sperm improvement seen in 3-6 months."
                        />
                        <FAQItem
                            question="Can I use frozen sperm for IUI or just IVF?"
                            answer="Frozen sperm can be used for both IUI and IVF/ICSI. For IUI, you'll need at least 5-10 million motile sperm post-thaw. For IVF with ICSI, you only need a few viable sperm. Multiple vials are usually frozen to ensure enough for several attempts."
                        />
                        <FAQItem
                            question="What if I have zero sperm in my ejaculate (azoospermia)?"
                            answer="Azoospermia affects 1% of men. It can be obstructive (blockage) or non-obstructive (production failure). Options include: surgical sperm retrieval (TESE, MESA, microTESE) + ICSI, hormonal treatment if appropriate, or donor sperm. About 60% of men with non-obstructive azoospermia can have sperm surgically retrieved."
                        />
                        <FAQItem
                            question="Is male fertility testing covered by insurance?"
                            answer="Many insurance plans cover initial semen analysis and hormone testing as part of infertility workup. Advanced testing and treatments vary widely. Check your specific plan. Even without insurance, semen analysis is affordable ($100-$250) and essential for diagnosis."
                        />
                    </CardContent>
                </Card>

                {/* CTA Section */}
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                    <CardContent className="py-12 text-center">
                        <Users className="h-16 w-16 mx-auto mb-4 text-primary" />
                        <h2 className="text-3xl font-bold mb-4">Take Control of Your Fertility</h2>
                        <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                            Male factor infertility is common and highly treatable. From simple lifestyle changes to
                            advanced treatments like ICSI, we have solutions. Start with a comprehensive evaluation.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button size="lg" asChild>
                                <Link to="/register">
                                    Schedule Male Fertility Evaluation
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
function TestingStep({
    title,
    description,
    details,
    cost,
    timeframe,
    color,
}: {
    title: string
    description: string
    details: string[]
    cost: string
    timeframe: string
    color: string
}) {
    const colorClasses = {
        blue: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
        green: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
        purple: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
        cyan: 'bg-cyan-100 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400',
    }

    return (
        <div className="p-4 border rounded-lg">
            <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
                    <Microscope className="h-6 w-6" />
                </div>
                <div className="flex-1">
                    <h4 className="font-semibold mb-1">{title}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{description}</p>

                    <div className="grid md:grid-cols-2 gap-4 mb-3">
                        <div className="text-sm">
                            <span className="font-medium">What's measured:</span>
                            <ul className="mt-1 space-y-1 ml-4">
                                {details.map((detail, index) => (
                                    <li key={index} className="text-muted-foreground">
                                        • {detail}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="space-y-2">
                            <div className="text-sm">
                                <span className="font-medium">Cost:</span> {cost}
                            </div>
                            <div className="text-sm">
                                <span className="font-medium">Timeframe:</span> {timeframe}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function TreatmentOption({
    title,
    severity,
    successRate,
    details,
    timeframe,
    cost,
}: {
    title: string
    severity: string
    successRate: string
    details: string[]
    timeframe: string
    cost: string
}) {
    return (
        <div>
            <div className="flex items-start justify-between mb-3">
                <div>
                    <h3 className="text-lg font-semibold mb-1">{title}</h3>
                    <div className="flex gap-2">
                        <Badge variant="outline">{severity}</Badge>
                        <Badge variant="secondary">{successRate}</Badge>
                    </div>
                </div>
            </div>

            <ul className="space-y-2 mb-4">
                {details.map((detail, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{detail}</span>
                    </li>
                ))}
            </ul>

            <div className="grid md:grid-cols-2 gap-3">
                <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">TIMEFRAME</p>
                    <p className="text-sm">{timeframe}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">COST</p>
                    <p className="text-sm">{cost}</p>
                </div>
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
