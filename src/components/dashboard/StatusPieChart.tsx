import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = {
  soumis: 'hsl(38, 92%, 50%)',
  verification: 'hsl(199, 89%, 48%)',
  valide: 'hsl(142, 76%, 36%)',
  paye: 'hsl(200, 100%, 43%)',
  rejete: 'hsl(0, 72%, 51%)',
};

const LABELS = {
  soumis: 'Soumis',
  verification: 'Vérification',
  valide: 'Validé',
  paye: 'Payé',
  rejete: 'Rejeté',
};

interface ReimbursementsByStatus {
  soumis: number;
  verification: number;
  valide: number;
  paye: number;
  rejete: number;
}

interface StatusPieChartProps {
  data: ReimbursementsByStatus;
}

export function StatusPieChart({ data }: StatusPieChartProps) {
  const chartData = Object.entries(data).map(([key, value]) => ({
    name: LABELS[key as keyof typeof LABELS],
    value,
    color: COLORS[key as keyof typeof COLORS],
  }));

  const totalCount = chartData.reduce((sum, item) => sum + item.value, 0);

  if (totalCount === 0) {
    return (
      <div className="h-[280px] w-full flex items-center justify-center">
        <p className="text-muted-foreground">Aucun remboursement</p>
      </div>
    );
  }

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => (
              <span className="text-xs text-muted-foreground">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
