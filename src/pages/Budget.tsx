import { useEvent, Vendor, DEFAULT_CATEGORIES } from "@/context/EventContext";
import { useState } from "react";
import { Plus, Trash2, ExternalLink, Paperclip, ChevronDown, ChevronUp, Settings2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

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

const emptyVendor = {
  name: "", category: "Salle", costType: "fixed" as Vendor["costType"],
  estimatedCost: 0, actualCost: null as number | null, status: "quote" as Vendor["status"],
  assignedFormulas: [] as string[],
  website: "", notes: "", attachmentUrl: "",
};

export default function BudgetPage() {
  const { vendors, formulas, categories, setCategories, addVendor, updateVendor, removeVendor, totalEstimatedCost, totalActualCost } = useEvent();

  const [showForm, setShowForm] = useState(false);
  const [newVendor, setNewVendor] = useState({ ...emptyVendor });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [editingCat, setEditingCat] = useState<{ idx: number; val: string } | null>(null);

  const fmt = (n: number) => n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

  const handleAdd = () => {
    if (!newVendor.name) return;
    addVendor({
      ...newVendor,
      website: newVendor.website || undefined,
      notes: newVendor.notes || undefined,
      attachmentUrl: newVendor.attachmentUrl || undefined,
    });
    setNewVendor({ ...emptyVendor });
    setShowForm(false);
  };

  const addCategory = () => {
    const name = newCatName.trim();
    if (!name || categories.includes(name)) return;
    setCategories([...categories, name]);
    setNewCatName("");
  };

  const renameCategory = (idx: number, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || categories.includes(trimmed)) return;
    const oldName = categories[idx];
    const updated = categories.map((c, i) => i === idx ? trimmed : c);
    setCategories(updated);
    // Update vendors with old category
    vendors.filter(v => v.category === oldName).forEach(v => updateVendor(v.id, { category: trimmed }));
    setEditingCat(null);
  };

  const removeCategory = (idx: number) => {
    const name = categories[idx];
    setCategories(categories.filter((_, i) => i !== idx));
    // Move vendors to "Autre"
    vendors.filter(v => v.category === name).forEach(v => updateVendor(v.id, { category: "Autre" }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Budget & Prestataires</h1>
          <p className="text-sm text-muted-foreground">
            Prévisionnel: {fmt(totalEstimatedCost)} · Réel: {fmt(totalActualCost)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowCategoryManager(v => !v)}>
            <Settings2 className="h-4 w-4 mr-1" /> Catégories
          </Button>
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Ajouter
          </Button>
        </div>
      </div>

      {/* Category Manager */}
      <AnimatePresence>
        {showCategoryManager && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <h3 className="text-sm font-medium text-foreground">Gérer les catégories</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat, idx) => (
                  <div key={cat} className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1">
                    {editingCat?.idx === idx ? (
                      <>
                        <input
                          autoFocus
                          value={editingCat.val}
                          onChange={e => setEditingCat({ idx, val: e.target.value })}
                          onKeyDown={e => { if (e.key === "Enter") renameCategory(idx, editingCat.val); if (e.key === "Escape") setEditingCat(null); }}
                          className="w-24 bg-transparent text-sm focus:outline-none"
                        />
                        <button onClick={() => renameCategory(idx, editingCat.val)} className="text-success"><Check className="h-3 w-3" /></button>
                        <button onClick={() => setEditingCat(null)} className="text-muted-foreground"><X className="h-3 w-3" /></button>
                      </>
                    ) : (
                      <>
                        <span
                          className="text-sm cursor-pointer hover:text-primary"
                          onClick={() => setEditingCat({ idx, val: cat })}
                        >{cat}</span>
                        <button onClick={() => removeCategory(idx)} className="text-muted-foreground hover:text-destructive ml-1">
                          <X className="h-3 w-3" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  placeholder="Nouvelle catégorie…"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") addCategory(); }}
                  className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-48"
                />
                <Button size="sm" onClick={addCategory}><Plus className="h-4 w-4" /></Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add vendor form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <h3 className="text-sm font-medium text-foreground">Nouveau prestataire</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <input
                  placeholder="Nom du prestataire"
                  value={newVendor.name}
                  onChange={e => setNewVendor(p => ({ ...p, name: e.target.value }))}
                  className="col-span-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <select value={newVendor.category} onChange={e => setNewVendor(p => ({ ...p, category: e.target.value }))}
                  className="rounded-md border border-input bg-background px-3 py-1.5 text-sm">
                  {categories.map(c => <option key={c}>{c}</option>)}
                </select>
                <select value={newVendor.costType} onChange={e => setNewVendor(p => ({ ...p, costType: e.target.value as Vendor["costType"] }))}
                  className="rounded-md border border-input bg-background px-3 py-1.5 text-sm">
                  {COST_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <input
                  type="number"
                  placeholder="Montant prévu (€)"
                  value={newVendor.estimatedCost || ""}
                  onChange={e => setNewVendor(p => ({ ...p, estimatedCost: Number(e.target.value) }))}
                  className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <input
                  placeholder="Site web (https://...)"
                  value={newVendor.website}
                  onChange={e => setNewVendor(p => ({ ...p, website: e.target.value }))}
                  className="col-span-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <input
                  placeholder="Lien devis / pièce jointe"
                  value={newVendor.attachmentUrl}
                  onChange={e => setNewVendor(p => ({ ...p, attachmentUrl: e.target.value }))}
                  className="col-span-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <textarea
                  placeholder="Notes…"
                  value={newVendor.notes}
                  onChange={e => setNewVendor(p => ({ ...p, notes: e.target.value }))}
                  rows={2}
                  className="col-span-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
                <div className="col-span-2 flex flex-wrap gap-2 items-center">
                  <span className="text-xs text-muted-foreground">Formules :</span>
                  {formulas.map(f => (
                    <label key={f.id} className="flex items-center gap-1 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newVendor.assignedFormulas.includes(f.id)}
                        onChange={e => setNewVendor(p => ({
                          ...p,
                          assignedFormulas: e.target.checked
                            ? [...p.assignedFormulas, f.id]
                            : p.assignedFormulas.filter(id => id !== f.id),
                        }))}
                        className="rounded"
                      />
                      <span style={{ color: f.color }}>{f.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAdd} size="sm">Ajouter</Button>
                <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Annuler</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vendor table */}
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
              <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">Liens</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {vendors.map(v => {
              const statusInfo = STATUSES.find(s => s.value === v.status)!;
              const isExpanded = expandedId === v.id;

              return (
                <>
                  <tr
                    key={v.id}
                    className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors"
                  >
                    {/* Name - editable */}
                    <td className="px-4 py-3">
                      <input
                        value={v.name}
                        onChange={e => updateVendor(v.id, { name: e.target.value })}
                        className="font-medium text-foreground bg-transparent border-0 border-b border-transparent hover:border-border focus:border-ring focus:outline-none w-full"
                      />
                    </td>
                    {/* Category */}
                    <td className="px-4 py-3">
                      <select
                        value={v.category}
                        onChange={e => updateVendor(v.id, { category: e.target.value })}
                        className="text-muted-foreground bg-transparent border-0 text-sm focus:outline-none cursor-pointer"
                      >
                        {categories.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </td>
                    {/* Cost type */}
                    <td className="px-4 py-3">
                      <select
                        value={v.costType}
                        onChange={e => updateVendor(v.id, { costType: e.target.value as Vendor["costType"] })}
                        className="text-muted-foreground bg-transparent border-0 text-sm focus:outline-none cursor-pointer"
                      >
                        {COST_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </td>
                    {/* Estimated cost */}
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        value={v.estimatedCost}
                        onChange={e => updateVendor(v.id, { estimatedCost: Number(e.target.value) })}
                        className="w-24 text-right font-medium text-foreground bg-transparent border-0 border-b border-transparent hover:border-border focus:border-ring focus:outline-none"
                      />
                    </td>
                    {/* Actual cost */}
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        value={v.actualCost ?? ""}
                        placeholder="—"
                        onChange={e => updateVendor(v.id, { actualCost: e.target.value ? Number(e.target.value) : null })}
                        className="w-20 text-right rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3 text-center">
                      <select
                        value={v.status}
                        onChange={e => updateVendor(v.id, { status: e.target.value as Vendor["status"] })}
                        className={`rounded-full px-2 py-0.5 text-xs font-medium border-0 cursor-pointer ${statusInfo.cls}`}
                      >
                        {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </td>
                    {/* Formulas */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {formulas.map(f => {
                          const assigned = v.assignedFormulas.includes(f.id);
                          return (
                            <button
                              key={f.id}
                              onClick={() => updateVendor(v.id, {
                                assignedFormulas: assigned
                                  ? v.assignedFormulas.filter(id => id !== f.id)
                                  : [...v.assignedFormulas, f.id],
                              })}
                              title={assigned ? "Retirer" : "Assigner"}
                              className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium transition-opacity ${assigned ? "" : "opacity-30"}`}
                              style={{ backgroundColor: f.color + "20", color: f.color }}
                            >
                              {f.name}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    {/* Links */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {v.website && (
                          <a href={v.website} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" title="Site web">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        {v.attachmentUrl && (
                          <a href={v.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" title="Devis / pièce jointe">
                            <Paperclip className="h-4 w-4" />
                          </a>
                        )}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : v.id)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          title="Plus de détails"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                    {/* Delete */}
                    <td className="px-4 py-3">
                      <button onClick={() => removeVendor(v.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>

                  {/* Expanded row */}
                  {isExpanded && (
                    <tr key={`${v.id}-expanded`} className="border-b border-border bg-secondary/30">
                      <td colSpan={9} className="px-4 py-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          <label className="space-y-1">
                            <span className="text-xs font-medium text-muted-foreground">Site web</span>
                            <div className="flex gap-1">
                              <input
                                placeholder="https://..."
                                value={v.website ?? ""}
                                onChange={e => updateVendor(v.id, { website: e.target.value || undefined })}
                                className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                              />
                              {v.website && (
                                <a href={v.website} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center px-2 rounded-md border border-input bg-background hover:bg-secondary text-muted-foreground hover:text-primary transition-colors">
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              )}
                            </div>
                          </label>
                          <label className="space-y-1">
                            <span className="text-xs font-medium text-muted-foreground">Lien devis / pièce jointe</span>
                            <div className="flex gap-1">
                              <input
                                placeholder="https://..."
                                value={v.attachmentUrl ?? ""}
                                onChange={e => updateVendor(v.id, { attachmentUrl: e.target.value || undefined })}
                                className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                              />
                              {v.attachmentUrl && (
                                <a href={v.attachmentUrl} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center px-2 rounded-md border border-input bg-background hover:bg-secondary text-muted-foreground hover:text-primary transition-colors">
                                  <Paperclip className="h-3.5 w-3.5" />
                                </a>
                              )}
                            </div>
                          </label>
                          <label className="space-y-1">
                            <span className="text-xs font-medium text-muted-foreground">Notes</span>
                            <textarea
                              placeholder="Notes, conditions, contacts…"
                              value={v.notes ?? ""}
                              onChange={e => updateVendor(v.id, { notes: e.target.value || undefined })}
                              rows={2}
                              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                            />
                          </label>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
