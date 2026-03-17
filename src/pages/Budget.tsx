import { useEvent, Vendor } from "@/context/EventContext";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORIES = ["Salle", "Traiteur", "Alcool", "DJ", "Décoration", "Photo", "Sécurité", "Autre"];
const COST_TYPES: { value: Vendor["costType"]; label: string }[] = [
  { value: "fixed", label: "Fixe" },
  { value: "variable", label: "Variable" },
  { value: "per-participant", label: "Par participant" },
];
const STATUSES: { value: Vendor["status"]; label: string; cls: string }[] = [
  { value: "quote", label: "Devis", cls: "bg-warning/10 text-warning" },
  { value: "confirmed", label: "Validé", cls: "bg-primary/10 text-primary" },
  { value: "paid", label: "Payé", cls: "bg-success/10 text-success" },
];

export default function BudgetPage() {
  const { vendors, formulas, addVendor, updateVendor, removeVendor, totalEstimatedCost, totalActualCost } = useEvent();
  const [showForm, setShowForm] = useState(false);
  const [newVendor, setNewVendor] = useState({
    name: "", category: "Salle", costType: "fixed" as Vendor["costType"],
    estimatedCost: 0, actualCost: null as number | null, status: "quote" as Vendor["status"],
    assignedFormulas: [] as string[],
  });

  const fmt = (n: number) => n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

  const handleAdd = () => {
    if (!newVendor.name) return;
    addVendor(newVendor);
    setNewVendor({ name: "", category: "Salle", costType: "fixed", estimatedCost: 0, actualCost: null, status: "quote", assignedFormulas: [] });
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Budget & Prestataires</h1>
          <p className="text-sm text-muted-foreground">
            Prévisionnel: {fmt(totalEstimatedCost)} · Réel: {fmt(totalActualCost)}
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Ajouter
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-lg border border-border bg-card p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <input placeholder="Nom" value={newVendor.name} onChange={e => setNewVendor(p => ({ ...p, name: e.target.value }))} className="col-span-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              <select value={newVendor.category} onChange={e => setNewVendor(p => ({ ...p, category: e.target.value }))} className="rounded-md border border-input bg-background px-3 py-1.5 text-sm">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <select value={newVendor.costType} onChange={e => setNewVendor(p => ({ ...p, costType: e.target.value as Vendor["costType"] }))} className="rounded-md border border-input bg-background px-3 py-1.5 text-sm">
                {COST_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <input type="number" placeholder="Montant prévu" value={newVendor.estimatedCost || ""} onChange={e => setNewVendor(p => ({ ...p, estimatedCost: Number(e.target.value) }))} className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              <div className="flex flex-wrap gap-1 col-span-2 items-center">
                {formulas.map(f => (
                  <label key={f.id} className="flex items-center gap-1 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newVendor.assignedFormulas.includes(f.id)}
                      onChange={e => {
                        setNewVendor(p => ({
                          ...p,
                          assignedFormulas: e.target.checked
                            ? [...p.assignedFormulas, f.id]
                            : p.assignedFormulas.filter(id => id !== f.id),
                        }));
                      }}
                      className="rounded"
                    />
                    <span>{f.name}</span>
                  </label>
                ))}
              </div>
              <Button onClick={handleAdd} size="sm">Ajouter</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary">
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Prestataire</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Catégorie</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Type</th>
              <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Prévu</th>
              <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Réel</th>
              <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Statut</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Formules</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {vendors.map(v => {
              const statusInfo = STATUSES.find(s => s.value === v.status)!;
              return (
                <tr key={v.id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{v.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{v.category}</td>
                  <td className="px-4 py-3 text-muted-foreground">{COST_TYPES.find(c => c.value === v.costType)?.label}</td>
                  <td className="px-4 py-3 text-right font-medium text-foreground">{fmt(v.estimatedCost)}</td>
                  <td className="px-4 py-3 text-right">
                    <input
                      type="number"
                      value={v.actualCost ?? ""}
                      placeholder="—"
                      onChange={e => updateVendor(v.id, { actualCost: e.target.value ? Number(e.target.value) : null })}
                      className="w-20 text-right rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <select
                      value={v.status}
                      onChange={e => updateVendor(v.id, { status: e.target.value as Vendor["status"] })}
                      className={`rounded-full px-2 py-0.5 text-xs font-medium border-0 ${statusInfo.cls}`}
                    >
                      {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {v.assignedFormulas.map(fid => {
                        const f = formulas.find(x => x.id === fid);
                        return f ? (
                          <span key={fid} className="inline-block rounded px-1.5 py-0.5 text-xs font-medium" style={{ backgroundColor: f.color + "20", color: f.color }}>{f.name}</span>
                        ) : null;
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => removeVendor(v.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
