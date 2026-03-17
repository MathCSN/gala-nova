import { Users, DollarSign, TrendingUp, Target, BarChart3, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import MetricCard from "@/components/MetricCard";
import { useEvent } from "@/context/EventContext";

export default function Dashboard() {
  const {
    formulas, totalParticipants, totalRevenue, totalActualCost,
    profit, margin, breakeven, fillRate,
  } = useEvent();

  const salesData = formulas.map(f => ({
    name: f.name,
    vendu: f.sold,
    max: f.maxCapacity,
    revenue: f.price * f.sold,
    fill: f.color,
  }));

  const pieData = formulas.map(f => ({
    name: f.name,
    value: f.price * f.sold,
    color: f.color,
  }));

  const fmt = (n: number) => n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Vue d'ensemble de votre événement</p>
      </div>

      {/* Big numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={DollarSign} label="Chiffre d'affaires" value={fmt(totalRevenue)} variant="default" />
        <MetricCard icon={TrendingUp} label="Marge" value={`${margin.toFixed(1)}%`} subValue={fmt(profit)} variant={margin > 10 ? "success" : margin > 0 ? "warning" : "destructive"} />
        <MetricCard icon={Users} label="Participants" value={totalParticipants.toString()} subValue={`Taux: ${fillRate.toFixed(0)}%`} />
        <MetricCard icon={Target} label="Seuil rentabilité" value={breakeven === Infinity ? "—" : `${breakeven} pers.`} variant={totalParticipants >= breakeven ? "success" : "warning"} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-medium text-foreground mb-4">Ventes par formule</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={salesData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(215 14% 45%)" }} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(215 14% 45%)" }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid hsl(220 13% 91%)", fontSize: 12 }}
              />
              <Bar dataKey="vendu" name="Vendues" radius={[4, 4, 0, 0]}>
                {salesData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
              <Bar dataKey="max" name="Capacité" radius={[4, 4, 0, 0]} fillOpacity={0.15}>
                {salesData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-medium text-foreground mb-4">Répartition CA</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: 8, border: "1px solid hsl(220 13% 91%)", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-1 mt-2">
            {pieData.map(p => (
              <div key={p.name} className="flex items-center gap-2 text-xs">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="text-muted-foreground">{p.name}</span>
                <span className="ml-auto font-medium text-foreground">{fmt(p.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Risk monitor */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <h2 className="text-sm font-medium text-foreground">Moniteur de risque</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Budget prévisionnel</span>
            <p className="font-semibold text-foreground">{fmt(useEvent().totalEstimatedCost)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Budget réel</span>
            <p className="font-semibold text-foreground">{fmt(totalActualCost)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Écart</span>
            <p className={`font-semibold ${totalActualCost <= useEvent().totalEstimatedCost ? "text-success" : "text-destructive"}`}>
              {fmt(totalActualCost - useEvent().totalEstimatedCost)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
