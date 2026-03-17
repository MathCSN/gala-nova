import { useState, useMemo } from "react";
import { useEvent } from "@/context/EventContext";
import { Slider } from "@/components/ui/slider";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function Simulation() {
  const { formulas, vendors, contingencyPercent, targetMarginPercent } = useEvent();

  const [simFormulas, setSimFormulas] = useState(
    formulas.map(f => ({ id: f.id, name: f.name, participants: f.sold, price: f.price, color: f.color, max: f.maxCapacity }))
  );
  const [simContingency, setSimContingency] = useState(contingencyPercent);
  const [simMargin, setSimMargin] = useState(targetMarginPercent);

  const results = useMemo(() => {
    const totalRevenue = simFormulas.reduce((s, f) => s + f.price * f.participants, 0);
    let totalCost = 0;
    vendors.forEach(v => {
      const cost = v.actualCost ?? v.estimatedCost;
      if (v.costType === "fixed") {
        totalCost += cost;
      } else {
        const parts = simFormulas.filter(f => v.assignedFormulas.includes(f.id)).reduce((s, f) => s + f.participants, 0);
        totalCost += cost * parts;
      }
    });
    const withContingency = totalCost * (1 + simContingency / 100);
    const profit = totalRevenue - withContingency;
    const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

    // Recommended prices
    const recommended = simFormulas.map(f => {
      let formulaCost = 0;
      vendors.forEach(v => {
        if (!v.assignedFormulas.includes(f.id)) return;
        const cost = v.actualCost ?? v.estimatedCost;
        if (v.costType === "fixed") {
          const totalParts = simFormulas.filter(sf => v.assignedFormulas.includes(sf.id)).reduce((s, sf) => s + sf.participants, 0);
          if (totalParts > 0) formulaCost += (cost / totalParts) * f.participants;
        } else {
          formulaCost += cost * f.participants;
        }
      });
      const withC = formulaCost * (1 + simContingency / 100);
      const recPrice = f.participants > 0 ? (withC / f.participants) / (1 - simMargin / 100) : 0;
      return { ...f, recommendedPrice: recPrice, cost: formulaCost };
    });

    // Scenarios
    const pessimistic = profit * 0.6;
    const realistic = profit;
    const optimistic = profit * 1.3;

    return { totalRevenue, totalCost: withContingency, profit, margin, recommended, pessimistic, realistic, optimistic };
  }, [simFormulas, vendors, simContingency, simMargin]);

  const fmt = (n: number) => n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

  const updateSim = (id: string, key: "participants" | "price", value: number) => {
    setSimFormulas(prev => prev.map(f => f.id === id ? { ...f, [key]: value } : f));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Simulation</h1>
        <p className="text-sm text-muted-foreground">Modifiez les paramètres pour voir l'impact financier en temps réel</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="space-y-5">
          <div className="rounded-lg border border-border bg-card p-5 space-y-5">
            <h2 className="text-sm font-medium text-foreground">Paramètres généraux</h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Imprévus</span><span>{simContingency}%</span>
                </div>
                <Slider value={[simContingency]} onValueChange={([v]) => setSimContingency(v)} min={0} max={30} step={1} />
              </div>
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Marge souhaitée</span><span>{simMargin}%</span>
                </div>
                <Slider value={[simMargin]} onValueChange={([v]) => setSimMargin(v)} min={0} max={40} step={1} />
              </div>
            </div>
          </div>

          {simFormulas.map(f => (
            <div key={f.id} className="rounded-lg border border-border bg-card p-5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: f.color }} />
                <h3 className="text-sm font-medium text-foreground">{f.name}</h3>
              </div>
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Participants</span><span>{f.participants} / {f.max}</span>
                </div>
                <Slider value={[f.participants]} onValueChange={([v]) => updateSim(f.id, "participants", v)} min={0} max={f.max} step={1} />
              </div>
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Prix</span><span>{fmt(f.price)}</span>
                </div>
                <Slider value={[f.price]} onValueChange={([v]) => updateSim(f.id, "price", v)} min={10} max={200} step={5} />
              </div>
            </div>
          ))}
        </div>

        {/* Results */}
        <div className="space-y-5">
          <motion.div
            key={results.profit}
            className="rounded-lg border border-border bg-card p-5 space-y-4 metric-flash"
          >
            <h2 className="text-sm font-medium text-foreground">Résultats en direct</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-muted-foreground">CA total</span>
                <p className="text-xl font-semibold text-foreground">{fmt(results.totalRevenue)}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Coûts (+ imprévus)</span>
                <p className="text-xl font-semibold text-foreground">{fmt(results.totalCost)}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Bénéfice</span>
                <p className={`text-xl font-semibold ${results.profit >= 0 ? "text-success" : "text-destructive"}`}>{fmt(results.profit)}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Marge</span>
                <p className={`text-xl font-semibold ${results.margin >= simMargin ? "text-success" : "text-warning"}`}>{results.margin.toFixed(1)}%</p>
              </div>
            </div>
          </motion.div>

          <div className="rounded-lg border border-border bg-card p-5 space-y-3">
            <h2 className="text-sm font-medium text-foreground">Prix recommandés</h2>
            {results.recommended.map(f => (
              <div key={f.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: f.color }} />
                  <span className="text-sm text-foreground">{f.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-primary">{fmt(f.recommendedPrice)}</span>
                  <span className="text-xs text-muted-foreground ml-2">actuel: {fmt(f.price)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-border bg-card p-5 space-y-3">
            <h2 className="text-sm font-medium text-foreground">Scénarios</h2>
            <div className="space-y-2">
              {[
                { label: "Pessimiste", value: results.pessimistic, icon: TrendingDown, cls: "text-destructive" },
                { label: "Réaliste", value: results.realistic, icon: Minus, cls: "text-foreground" },
                { label: "Optimiste", value: results.optimistic, icon: TrendingUp, cls: "text-success" },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <s.icon className={`h-4 w-4 ${s.cls}`} />
                    <span className="text-sm text-muted-foreground">{s.label}</span>
                  </div>
                  <span className={`text-sm font-semibold ${s.cls}`}>{fmt(s.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
