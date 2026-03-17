import { useEvent } from "@/context/EventContext";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

export default function Formulas() {
  const { formulas, updateFormula, costPerFormula, minPricePerFormula, vendors } = useEvent();

  const fmt = (n: number) => n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Formules</h1>
        <p className="text-sm text-muted-foreground">Gérez vos formules de participation et leur tarification</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {formulas.map((f, i) => {
          const revenue = f.price * f.sold;
          const cost = costPerFormula(f.id);
          const minPrice = minPricePerFormula(f.id);
          const profitF = revenue - cost;
          const fillPct = f.maxCapacity > 0 ? (f.sold / f.maxCapacity) * 100 : 0;
          const assignedVendors = vendors.filter(v => v.assignedFormulas.includes(f.id));

          return (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-lg border border-border bg-card p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: f.color }} />
                  <h3 className="font-semibold text-foreground">{f.name}</h3>
                </div>
                <span className="text-lg font-semibold text-foreground">{fmt(f.price)}</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{f.sold} / {f.maxCapacity} places</span>
                  <span>{fillPct.toFixed(0)}%</span>
                </div>
                <Progress value={fillPct} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs">CA</span>
                  <p className="font-medium text-foreground">{fmt(revenue)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Coût total</span>
                  <p className="font-medium text-foreground">{fmt(cost)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Résultat</span>
                  <p className={`font-medium ${profitF >= 0 ? "text-success" : "text-destructive"}`}>{fmt(profitF)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Prix min.</span>
                  <p className={`font-medium ${f.price >= minPrice ? "text-success" : "text-destructive"}`}>
                    {fmt(minPrice)}
                  </p>
                </div>
              </div>

              <div>
                <span className="text-xs font-medium text-muted-foreground">Prestations incluses</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {assignedVendors.map(v => (
                    <span key={v.id} className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                      {v.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <label className="flex-1 space-y-1">
                  <span className="text-xs text-muted-foreground">Prix (€)</span>
                  <input
                    type="number"
                    value={f.price}
                    onChange={e => updateFormula(f.id, { price: Number(e.target.value) })}
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </label>
                <label className="flex-1 space-y-1">
                  <span className="text-xs text-muted-foreground">Vendues</span>
                  <input
                    type="number"
                    value={f.sold}
                    onChange={e => updateFormula(f.id, { sold: Math.min(Number(e.target.value), f.maxCapacity) })}
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </label>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
