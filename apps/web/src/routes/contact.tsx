import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@workspace/ui/components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { Input } from '@workspace/ui/components/Input'
import { Textarea } from '@workspace/ui/components/Textarea'
import { HeartPulse, Mail, Phone, MapPin, Clock, Send } from 'lucide-react'
import { Badge } from '@workspace/ui/components/Badge'

export const Route = createFileRoute('/contact')({
    component: ContactPage,
})

function ContactPage() {
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
                            <Link to="/register">Get Started</Link>
                        </Button>
                    </div>
                </div>
            </header>

            <section className="py-20 px-4 bg-gradient-to-b from-primary/5 to-background">
                <div className="container mx-auto text-center max-w-4xl">
                    <Badge variant="outline" className="mb-4">
                        Get in Touch
                    </Badge>
                    <h1 className="text-5xl md:text-6xl font-bold mb-6">Contact Us</h1>
                    <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                        Have questions? We're here to help. Reach out and we'll get back to you within 24 hours.
                    </p>
                </div>
            </section>

            <section className="py-20 px-4">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid md:grid-cols-2 gap-12">
                        <div>
                            <h2 className="text-3xl font-bold mb-6">Send Us a Message</h2>
                            <form className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="firstName" className="text-sm font-medium">
                                            First Name
                                        </label>
                                        <Input id="firstName" placeholder="John" />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="lastName" className="text-sm font-medium">
                                            Last Name
                                        </label>
                                        <Input id="lastName" placeholder="Doe" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-medium">
                                        Email
                                    </label>
                                    <Input id="email" type="email" placeholder="john@example.com" />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="phone" className="text-sm font-medium">
                                        Phone Number
                                    </label>
                                    <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="subject" className="text-sm font-medium">
                                        Subject
                                    </label>
                                    <Input id="subject" placeholder="How can we help?" />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="message" className="text-sm font-medium">
                                        Message
                                    </label>
                                    <Textarea id="message" placeholder="Tell us more about your inquiry..." rows={6} />
                                </div>

                                <Button size="lg" className="w-full">
                                    <Send className="mr-2 h-4 w-4" />
                                    Send Message
                                </Button>
                            </form>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h2 className="text-3xl font-bold mb-6">Contact Information</h2>
                                <div className="space-y-4">
                                    <ContactMethod
                                        icon={<Mail className="h-5 w-5" />}
                                        title="Email"
                                        value="support@cryobank.com"
                                        description="We'll respond within 24 hours"
                                    />
                                    <ContactMethod
                                        icon={<Phone className="h-5 w-5" />}
                                        title="Phone"
                                        value="+1 (800) 123-4567"
                                        description="Mon-Fri, 8am-6pm EST"
                                    />
                                    <ContactMethod
                                        icon={<MapPin className="h-5 w-5" />}
                                        title="Address"
                                        value="123 Medical Plaza, Suite 400"
                                        description="San Francisco, CA 94105"
                                    />
                                </div>
                            </div>

                            <Card>
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-5 w-5 text-primary" />
                                        <CardTitle>Office Hours</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Monday - Friday</span>
                                        <span className="font-medium">8:00 AM - 6:00 PM EST</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Saturday</span>
                                        <span className="font-medium">9:00 AM - 3:00 PM EST</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Sunday</span>
                                        <span className="font-medium">Closed</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Frequently Asked Questions</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <h4 className="font-semibold mb-1">How quickly do you respond?</h4>
                                        <p className="text-sm text-muted-foreground">
                                            We aim to respond to all inquiries within 24 hours during business days.
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-1">Do you offer demos?</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Yes! We offer personalized demos for clinics interested in our platform.
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-1">What support do you provide?</h4>
                                        <p className="text-sm text-muted-foreground">
                                            We offer email, phone, and video support depending on your plan level.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="border-t py-8 px-4 bg-muted/30">
                <div className="container mx-auto text-center text-sm text-muted-foreground">
                    <p>© 2025 CryoBank. All rights reserved.</p>
                </div>
            </footer>
        </div>
    )
}

function ContactMethod({
    icon,
    title,
    value,
    description,
}: {
    icon: React.ReactNode
    title: string
    value: string
    description: string
}) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-start gap-3">
                    <div className="mt-1 text-primary">{icon}</div>
                    <div>
                        <CardTitle className="text-base">{title}</CardTitle>
                        <p className="font-semibold mt-1">{value}</p>
                        <CardDescription className="mt-1">{description}</CardDescription>
                    </div>
                </div>
            </CardHeader>
        </Card>
    )
}
