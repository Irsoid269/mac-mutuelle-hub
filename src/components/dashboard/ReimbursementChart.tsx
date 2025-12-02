import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { mockDashboardStats } from '@/data/mockData';

export function ReimbursementChart() {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={mockDashboardStats.monthlyTrends}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorSubscriptions" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(200, 100%, 43%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(200, 100%, 43%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorReimbursements" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(50, 100%, 50%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(50, 100%, 50%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
          />
          <Area
            type="monotone"
            dataKey="subscriptions"
            name="Souscriptions"
            stroke="hsl(200, 100%, 43%)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorSubscriptions)"
          />
          <Area
            type="monotone"
            dataKey="reimbursements"
            name="Remboursements"
            stroke="hsl(50, 100%, 50%)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorReimbursements)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
