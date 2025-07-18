import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

const AnalyticsCard = ({ title, value, icon: Icon, description }: { title: string, value: string, icon: React.ElementType, description: string }) => (
  <Card className="bg-slate-50 border-slate-100">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
      <Icon className="h-5 w-5 text-slate-400" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <p className="text-xs text-slate-500 pt-1">{description}</p>
    </CardContent>
  </Card>
);

export { AnalyticsCard };