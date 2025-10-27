import { Card, CardContent } from '@workspace/ui/components/Card'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { ReactNode } from 'react'

interface StatCardProps {
    title: string
    value: string | number
    change?: string
    icon: ReactNode
    trend?: 'up' | 'down' | 'neutral'
}

export function StatCard({ title, value, change, icon, trend = 'neutral' }: StatCardProps) {
    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">{title}</span>
                    <div className="text-primary">{icon}</div>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{value}</span>
                    {change && (
                        <div
                            className={`flex items-center text-sm ${
                                trend === 'up'
                                    ? 'text-green-600 dark:text-green-400'
                                    : trend === 'down'
                                      ? 'text-red-600 dark:text-red-400'
                                      : 'text-muted-foreground'
                            }`}
                        >
                            {trend === 'up' && <TrendingUp className="h-4 w-4 mr-1" />}
                            {trend === 'down' && <TrendingDown className="h-4 w-4 mr-1" />}
                            <span>{change}</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
