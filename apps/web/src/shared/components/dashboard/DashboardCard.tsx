import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { Link } from '@tanstack/react-router'
import { LucideIcon } from 'lucide-react'

interface DashboardCardProps {
    title: string
    description: string
    icon: LucideIcon
    href: string
    onClick?: () => void
}

export function DashboardCard({ title, description, icon: Icon, href, onClick }: DashboardCardProps) {
    if (onClick) {
        return (
            <div
                onClick={onClick}
                className="cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onClick()
                    }
                }}
            >
                <Card className="hover:shadow-lg transition-shadow h-full group">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                                <Icon className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold mb-1">{title}</h3>
                                <p className="text-sm text-muted-foreground">{description}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <Link to={href} className="block">
            <Card className="hover:shadow-lg transition-shadow h-full group cursor-pointer">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                            <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold mb-1">{title}</h3>
                            <p className="text-sm text-muted-foreground">{description}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}
