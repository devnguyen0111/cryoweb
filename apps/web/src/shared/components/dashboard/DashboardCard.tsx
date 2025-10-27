import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { ReactNode } from 'react'
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
    const cardContent = (
        <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                        <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-1">{title}</h3>
                        <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )

    if (onClick) {
        return <div onClick={onClick}>{cardContent}</div>
    }

    return <Link to={href}>{cardContent}</Link>
}
