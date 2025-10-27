import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@workspace/ui/components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { HeartPulse, CheckCircle2, ArrowRight, Building2, Rocket, Zap } from 'lucide-react'
import { Badge } from '@workspace/ui/components/Badge'

export const Route = createFileRoute('/pricing')({
    component: PricingPage,
})

function PricingPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
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
                            <Link to="/register">Get Started</Link>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="py-20 px-4 bg-gradient-to-b from-primary/5 to-background">
                <div className="container mx-auto text-center max-w-4xl">
                    <Badge variant="outline" className="mb-4">
                        Simple, Transparent Pricing
                    </Badge>
                    <h1 className="text-5xl md:text-6xl font-bold mb-6">Choose the Right Plan for Your Clinic</h1>
                    <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                        Start with a 30-day free trial. No credit card required. Cancel anytime.
                    </p>
                </div>
            </section>

            {/* Pricing Tiers */}
            <section className="py-20 px-4">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid md:grid-cols-3 gap-8">
                        <PricingCard
                            name="Starter"
                            price="$499"
                            period="month"
                            description="Perfect for small clinics getting started"
                            icon={<Rocket className="h-8 w-8" />}
                            features={[
                                'Up to 500 samples',
                                '5 user accounts',
                                'Basic sample tracking',
                                'Patient portal',
                                'Email support',
                                'Mobile app access',
                                '10 GB storage',
                                'Standard reports',
                            ]}
                            buttonText="Start Free Trial"
                            buttonVariant="outline"
                        />

                        <PricingCard
                            name="Professional"
                            price="$999"
                            period="month"
                            description="For growing clinics with advanced needs"
                            icon={<Zap className="h-8 w-8" />}
                            features={[
                                'Up to 5,000 samples',
                                '20 user accounts',
                                'Advanced sample tracking',
                                'Patient portal',
                                'Priority email & phone support',
                                'Mobile app access',
                                '100 GB storage',
                                'Advanced analytics',
                                'API access',
                                'Custom workflows',
                                'Integration support',
                            ]}
                            buttonText="Start Free Trial"
                            buttonVariant="default"
                            popular
                        />

                        <PricingCard
                            name="Enterprise"
                            price="Custom"
                            period="contact us"
                            description="For large institutions with complex requirements"
                            icon={<Building2 className="h-8 w-8" />}
                            features={[
                                'Unlimited samples',
                                'Unlimited users',
                                'Full feature access',
                                'White-label patient portal',
                                'Dedicated account manager',
                                'Phone & video support',
                                'Unlimited storage',
                                'Custom integrations',
                                'On-premise deployment option',
                                'SLA guarantee',
                                'Training & onboarding',
                                'Regulatory consulting',
                            ]}
                            buttonText="Contact Sales"
                            buttonVariant="outline"
                        />
                    </div>
                </div>
            </section>

            {/* Feature Comparison */}
            <section className="py-20 px-4 bg-muted/30">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Feature Comparison</h2>
                        <p className="text-muted-foreground">See what's included in each plan</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse bg-background rounded-lg overflow-hidden shadow">
                            <thead>
                                <tr className="bg-muted">
                                    <th className="text-left py-4 px-4 font-semibold">Feature</th>
                                    <th className="text-center py-4 px-4 font-semibold">Starter</th>
                                    <th className="text-center py-4 px-4 font-semibold">Professional</th>
                                    <th className="text-center py-4 px-4 font-semibold">Enterprise</th>
                                </tr>
                            </thead>
                            <tbody>
                                <ComparisonRow
                                    feature="Sample Storage"
                                    starter="500"
                                    professional="5,000"
                                    enterprise="Unlimited"
                                />
                                <ComparisonRow
                                    feature="User Accounts"
                                    starter="5"
                                    professional="20"
                                    enterprise="Unlimited"
                                />
                                <ComparisonRow
                                    feature="Storage Space"
                                    starter="10 GB"
                                    professional="100 GB"
                                    enterprise="Unlimited"
                                />
                                <ComparisonRow feature="Patient Portal" starter professional enterprise />
                                <ComparisonRow feature="Mobile App" starter professional enterprise />
                                <ComparisonRow feature="Basic Reports" starter professional enterprise />
                                <ComparisonRow feature="Advanced Analytics" starter={false} professional enterprise />
                                <ComparisonRow feature="API Access" starter={false} professional enterprise />
                                <ComparisonRow feature="Custom Workflows" starter={false} professional enterprise />
                                <ComparisonRow
                                    feature="White-label Portal"
                                    starter={false}
                                    professional={false}
                                    enterprise
                                />
                                <ComparisonRow
                                    feature="Dedicated Support"
                                    starter={false}
                                    professional={false}
                                    enterprise
                                />
                                <ComparisonRow
                                    feature="SLA Guarantee"
                                    starter={false}
                                    professional={false}
                                    enterprise
                                />
                                <ComparisonRow
                                    feature="On-premise Option"
                                    starter={false}
                                    professional={false}
                                    enterprise
                                />
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* Add-ons */}
            <section className="py-20 px-4">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Optional Add-ons</h2>
                        <p className="text-muted-foreground">Enhance your plan with additional services</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Additional Storage</CardTitle>
                                <CardDescription>$50/month per 100 GB</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Expand your storage capacity for documents, images, and reports
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Extra User Licenses</CardTitle>
                                <CardDescription>$25/month per user</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Add more team members with full access to the platform
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Custom Integration</CardTitle>
                                <CardDescription>Starting at $2,000</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    One-time fee for custom integration with your existing systems
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-20 px-4 bg-muted/30">
                <div className="container mx-auto max-w-4xl">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Pricing FAQs</h2>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">What happens after the free trial?</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    After 30 days, you can choose to upgrade to a paid plan. If you don't select a plan,
                                    your account will be downgraded to a read-only mode where you can export your data
                                    but not make changes.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Can I change plans later?</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Yes! You can upgrade or downgrade at any time. Upgrades take effect immediately, and
                                    downgrades take effect at the end of your current billing period.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Is there a contract or commitment?</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    No long-term contracts required. All plans are month-to-month. We offer annual
                                    billing with a 20% discount for those who prefer to pay yearly.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">What payment methods do you accept?</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    We accept all major credit cards (Visa, Mastercard, American Express) and ACH
                                    transfers for annual plans. Enterprise customers can also pay by wire transfer or
                                    check.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-4">
                <div className="container mx-auto max-w-4xl text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
                    <p className="text-muted-foreground mb-8 text-lg">
                        Start your free 30-day trial today. No credit card required.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" asChild>
                            <Link to="/register">
                                Start Free Trial
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" asChild>
                            <Link to="/contact">Contact Sales</Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t py-8 px-4 bg-muted/30">
                <div className="container mx-auto text-center text-sm text-muted-foreground">
                    <p>© 2025 CryoBank. All rights reserved.</p>
                </div>
            </footer>
        </div>
    )
}

function PricingCard({
    name,
    price,
    period,
    description,
    icon,
    features,
    buttonText,
    buttonVariant,
    popular = false,
}: {
    name: string
    price: string
    period: string
    description: string
    icon: React.ReactNode
    features: string[]
    buttonText: string
    buttonVariant: 'default' | 'outline'
    popular?: boolean
}) {
    return (
        <Card className={`relative ${popular ? 'border-primary shadow-lg' : ''}`}>
            {popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary">Most Popular</Badge>
                </div>
            )}
            <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-xl text-primary w-fit">{icon}</div>
                <CardTitle className="text-2xl mb-2">{name}</CardTitle>
                <div className="mb-2">
                    <span className="text-4xl font-bold">{price}</span>
                    {period !== 'contact us' && <span className="text-muted-foreground">/{period}</span>}
                </div>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Button className="w-full" variant={buttonVariant} size="lg" asChild>
                    <Link to="/register">{buttonText}</Link>
                </Button>
                <ul className="space-y-3">
                    {features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                            <span>{feature}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    )
}

function ComparisonRow({
    feature,
    starter,
    professional,
    enterprise,
}: {
    feature: string
    starter: boolean | string
    professional: boolean | string
    enterprise: boolean | string
}) {
    const renderCell = (value: boolean | string) => {
        if (typeof value === 'boolean') {
            return value ? (
                <CheckCircle2 className="h-5 w-5 text-primary mx-auto" />
            ) : (
                <span className="text-muted-foreground">—</span>
            )
        }
        return <span className="text-sm">{value}</span>
    }

    return (
        <tr className="border-b">
            <td className="py-3 px-4 font-medium">{feature}</td>
            <td className="py-3 px-4 text-center">{renderCell(starter)}</td>
            <td className="py-3 px-4 text-center">{renderCell(professional)}</td>
            <td className="py-3 px-4 text-center">{renderCell(enterprise)}</td>
        </tr>
    )
}
