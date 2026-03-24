import { useEvent } from "@/context/EventContext";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, GripVertical, Check, X, TrendingUp, TrendingDown } from "lucide-react";

const COLORS = ["#7C3AED", "#10B981", "#F59E0B", "#EF4444", "#3B82F6", "#EC4899", "#14B8A6", "#F97316"];

interface NewFormulaState {
  name: string;
  price: number;
  maxCapacity: number;
  sold: number;
  color: string;
}

export default function Formulas() {
  const { formulas, updateFormula, addFormula, removeFormula, reorderFormulas, costPerFormula, minPricePerFormula, vendors } = useEvent();

  const [editingName, setEditingName] = useState<string | null>(null);
  const [nameValue, setNameValue] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFormula, setNewFormula] = useState<NewFormulaState>({
    name: "", price: 50, maxCapacity: 100, sold: 0, color: COLORS[0],
  });

  // Drag state
  const dragId = useRef<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const fmt = (n: number) => n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

  const sortedFormulas = [...formulas].sort((a, b) => a.order - b.order);

  const startEdit = (id: string, name: string) => {
    setEditingName(id);
    setNameValue(name);
  };

  const confirmEdit = (id: string) => {
    if (nameValue.trim()) updateFormula(id, { name: nameValue.trim() });
    setEditingName(null);
  };

  const handleDragStart = (id: string) => { dragId.current = id; };
  const handleDragOver = (e: React.DragEvent, id: string) => { e.preventDefault(); setDragOverId(id); };
  const handleDrop = (targetId: string) => {
    if (!dragId.current || dragId.current === targetId) { setDragOverId(null); return; }
    const from = sortedFormulas.findIndex(f => f.id === dragId.current);
    const to = sortedFormulas.findIndex(f => f.id === targetId);
    const reordered = [...sortedFormulas];
    const [item] = reordered.splice(from, 1);
    reordered.splice(to, 0, item);
    reorderFormulas(reordered);
    dragId.current = null;
    setDragOverId(null);
  };
  const handleDragEnd = () => { dragId.current = null; setDragOverId(null); };

  const handleAdd = () => {
    if (!newFormula.name.trim()) return;
    addFormula({ ...newFormula, name: newFormula.name.trim() });
    setNewFormula({ name: "", price: 50, maxCapacity: 100, sold: 0, color: COLORS[0] });
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Formules</h1>
          <p className="text-sm text-muted-foreground">Glissez pour réordonner · Cliquez sur le nom pour le modifier</p>
        </div>
        <Button onClick={() => setShowAddForm(v => !v)} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Nouvelle formule
        </Button>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <h3 className="text-sm font-medium text-foreground">Nouvelle formule</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <input
                  placeholder="Nom de la formule"
                  value={newFormula.name}
                  onChange={e => setNewFormula(p => ({ ...p, name: e.target.value }))}
                  className="col-span-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <label className="space-y-0.5">
                  <span className="text-xs text-muted-foreground">Prix (€)</span>
                  <input type="number" value={newFormula.price} onChange={e => setNewFormula(p => ({ ...p, price: Number(e.target.value) }))}
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </label>
                <label className="space-y-0.5">
                  <span className="text-xs text-muted-foreground">Capacité max</span>
                  <input type="number" value={newFormula.maxCapacity} onChange={e => setNewFormula(p => ({ ...p, maxCapacity: Number(e.target.value) }))}
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </label>
                <label className="space-y-0.5">
                  <span className="text-xs text-muted-foreground">Places estimées</span>
                  <input type="number" value={newFormula.sold} onChange={e => setNewFormula(p => ({ ...p, sold: Number(e.target.value) }))}
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </label>
                <label className="space-y-0.5">
                  <span className="text-xs text-muted-foreground">Couleur</span>
                  <div className="flex gap-1 flex-wrap mt-1">
                    {COLORS.map(c => (
                      <button key={c} onClick={() => setNewFormula(p => ({ ...p, color: c }))}
                        className="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110"
                        style={{ backgroundColor: c, borderColor: newFormula.color === c ? "#fff" : "transparent", outline: newFormula.color === c ? `2px solid ${c}` : "none" }}
                      />
                    ))}
                  </div>
                </label>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAdd} size="sm">Ajouter</Button>
                <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>Annuler</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Formula cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sortedFormulas.map((f, i) => {
          const revenue = f.price * f.sold;
          const cost = costPerFormula(f.id);
          const minPrice = minPricePerFormula(f.id);
          const profitF = revenue - cost;
          const fillPct = f.maxCapacity > 0 ? (f.sold / f.maxCapacity) * 100 : 0;
          const priceOk = f.price >= minPrice;
          const assignedVendors = vendors.filter(v => v.assignedFormulas.includes(f.id));
          const isDragOver = dragOverId === f.id;

          return (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              draggable
              onDragStart={() => handleDragStart(f.id)}
              onDragOver={e => handleDragOver(e, f.id)}
              onDrop={() => handleDrop(f.id)}
              onDragEnd={handleDragEnd}
              className={`rounded-lg border bg-card p-5 space-y-4 transition-all cursor-grab active:cursor-grabbing ${
                isDragOver ? "border-primary shadow-lg scale-[1.02]" : "border-border"
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                  {/* Color picker */}
                  <div className="relative shrink-0">
                    <div className="h-3 w-3 rounded-full cursor-pointer" style={{ backgroundColor: f.color }} />
                    <input
                      type="color"
                      value={f.color}
                      onChange={e => updateFormula(f.id, { color: e.target.value })}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      title="Changer la couleur"
                    />
                  </div>
                  {/* Name editable */}
                  {editingName === f.id ? (
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        autoFocus
                        value={nameValue}
                        onChange={e => setNameValue(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") confirmEdit(f.id); if (e.key === "Escape") setEditingName(null); }}
                        className="flex-1 min-w-0 rounded border border-ring bg-background px-2 py-0.5 text-sm font-semibold focus:outline-none"
                      />
                      <button onClick={() => confirmEdit(f.id)} className="text-success hover:text-success/80"><Check className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setEditingName(null)} className="text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  ) : (
                    <h3
                      className="font-semibold text-foreground truncate cursor-text hover:text-primary transition-colors"
                      onClick={() => startEdit(f.id, f.name)}
                      title="Cliquer pour renommer"
                    >
                      {f.name}
                    </h3>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-lg font-semibold text-foreground">{fmt(f.price)}</span>
                  <button onClick={() => removeFormula(f.id)} className="text-muted-foreground hover:text-destructive transition-colors ml-1">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{f.sold} / {f.maxCapacity} places</span>
                  <span>{fillPct.toFixed(0)}%</span>
                </div>
                <Progress value={fillPct} className="h-2" />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs">CA estimé</span>
                  <p className="font-medium text-foreground">{fmt(revenue)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Coût total</span>
                  <p className="font-medium text-foreground">{fmt(cost)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Résultat</span>
                  <p className={`font-medium flex items-center gap-1 ${profitF >= 0 ? "text-success" : "text-destructive"}`}>
                    {profitF >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {fmt(profitF)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Prix min. conseillé</span>
                  <p className={`font-medium text-sm ${priceOk ? "text-success" : "text-destructive"}`}>
                    {fmt(minPrice)}
                    {!priceOk && <span className="text-xs ml-1">⚠️</span>}
                  </p>
                </div>
              </div>

              {/* Rentabilité indicator */}
              {f.sold > 0 && (
                <div className={`rounded-md px-3 py-2 text-xs font-medium flex items-center justify-between ${priceOk ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                  <span>{priceOk ? "✓ Prix rentable" : "✗ Prix insuffisant"}</span>
                  <span>{priceOk ? `+${fmt(f.price - minPrice)}/place` : `-${fmt(minPrice - f.price)}/place`}</span>
                </div>
              )}

              {/* Vendors */}
              {assignedVendors.length > 0 && (
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
              )}

              {/* Inputs */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <label className="space-y-1">
                  <span className="text-xs text-muted-foreground">Prix (€)</span>
                  <input
                    type="number"
                    value={f.price}
                    onChange={e => updateFormula(f.id, { price: Number(e.target.value) })}
                    className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-muted-foreground">Estimées</span>
                  <input
                    type="number"
                    value={f.sold}
                    onChange={e => updateFormula(f.id, { sold: Math.min(Number(e.target.value), f.maxCapacity) })}
                    className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-muted-foreground">Capacité</span>
                  <input
                    type="number"
                    value={f.maxCapacity}
                    onChange={e => updateFormula(f.id, { maxCapacity: Number(e.target.value) })}
                    className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
