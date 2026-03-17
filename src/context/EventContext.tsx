import React, { createContext, useContext, useState, useCallback, useMemo } from "react";

export interface Formula {
  id: string;
  name: string;
  price: number;
  maxCapacity: number;
  sold: number;
  color: string;
}

export interface Vendor {
  id: string;
  name: string;
  category: string;
  costType: "fixed" | "variable" | "per-participant";
  estimatedCost: number;
  actualCost: number | null;
  status: "quote" | "confirmed" | "paid";
  assignedFormulas: string[]; // formula ids
}

interface EventContextType {
  formulas: Formula[];
  vendors: Vendor[];
  contingencyPercent: number;
  targetMarginPercent: number;
  setFormulas: React.Dispatch<React.SetStateAction<Formula[]>>;
  setVendors: React.Dispatch<React.SetStateAction<Vendor[]>>;
  setContingencyPercent: React.Dispatch<React.SetStateAction<number>>;
  setTargetMarginPercent: React.Dispatch<React.SetStateAction<number>>;
  // Computed
  totalParticipants: number;
  totalRevenue: number;
  totalEstimatedCost: number;
  totalActualCost: number;
  profit: number;
  margin: number;
  breakeven: number;
  fillRate: number;
  costPerFormula: (formulaId: string) => number;
  minPricePerFormula: (formulaId: string) => number;
  updateFormula: (id: string, updates: Partial<Formula>) => void;
  addVendor: (vendor: Omit<Vendor, "id">) => void;
  updateVendor: (id: string, updates: Partial<Vendor>) => void;
  removeVendor: (id: string) => void;
}

const EventContext = createContext<EventContextType | null>(null);

const DEFAULT_FORMULAS: Formula[] = [
  { id: "premium", name: "Premium", price: 85, maxCapacity: 120, sold: 45, color: "#7C3AED" },
  { id: "dinner", name: "Dîner", price: 55, maxCapacity: 80, sold: 32, color: "#10B981" },
  { id: "party", name: "Soirée", price: 30, maxCapacity: 200, sold: 78, color: "#F59E0B" },
];

const DEFAULT_VENDORS: Vendor[] = [
  { id: "v1", name: "Salle Le Château", category: "Salle", costType: "fixed", estimatedCost: 3500, actualCost: 3500, status: "confirmed", assignedFormulas: ["premium", "dinner", "party"] },
  { id: "v2", name: "Traiteur Excellence", category: "Traiteur", costType: "per-participant", estimatedCost: 35, actualCost: null, status: "quote", assignedFormulas: ["premium", "dinner"] },
  { id: "v3", name: "Cave Select", category: "Alcool", costType: "per-participant", estimatedCost: 15, actualCost: null, status: "quote", assignedFormulas: ["premium"] },
  { id: "v4", name: "DJ Maxime", category: "DJ", costType: "fixed", estimatedCost: 800, actualCost: 800, status: "paid", assignedFormulas: ["premium", "dinner", "party"] },
  { id: "v5", name: "Déco & Lumières", category: "Décoration", costType: "fixed", estimatedCost: 600, actualCost: null, status: "quote", assignedFormulas: ["premium", "dinner", "party"] },
  { id: "v6", name: "Photographe Pro", category: "Photo", costType: "fixed", estimatedCost: 450, actualCost: 450, status: "paid", assignedFormulas: ["premium", "dinner", "party"] },
];

export function EventProvider({ children }: { children: React.ReactNode }) {
  const [formulas, setFormulas] = useState<Formula[]>(DEFAULT_FORMULAS);
  const [vendors, setVendors] = useState<Vendor[]>(DEFAULT_VENDORS);
  const [contingencyPercent, setContingencyPercent] = useState(10);
  const [targetMarginPercent, setTargetMarginPercent] = useState(15);

  const totalParticipants = useMemo(() => formulas.reduce((s, f) => s + f.sold, 0), [formulas]);
  const totalRevenue = useMemo(() => formulas.reduce((s, f) => s + f.price * f.sold, 0), [formulas]);
  const totalMaxCapacity = useMemo(() => formulas.reduce((s, f) => s + f.maxCapacity, 0), [formulas]);
  const fillRate = totalMaxCapacity > 0 ? (totalParticipants / totalMaxCapacity) * 100 : 0;

  const costPerFormula = useCallback((formulaId: string) => {
    const formula = formulas.find(f => f.id === formulaId);
    if (!formula) return 0;
    let total = 0;
    vendors.forEach(v => {
      if (!v.assignedFormulas.includes(formulaId)) return;
      const cost = v.actualCost ?? v.estimatedCost;
      if (v.costType === "fixed") {
        const totalParticipantsForVendor = formulas
          .filter(f => v.assignedFormulas.includes(f.id))
          .reduce((s, f) => s + f.sold, 0);
        if (totalParticipantsForVendor > 0) {
          total += (cost / totalParticipantsForVendor) * formula.sold;
        }
      } else {
        total += cost * formula.sold;
      }
    });
    return total;
  }, [formulas, vendors]);

  const totalEstimatedCost = useMemo(() => {
    let total = 0;
    vendors.forEach(v => {
      if (v.costType === "fixed") {
        total += v.estimatedCost;
      } else {
        const participants = formulas
          .filter(f => v.assignedFormulas.includes(f.id))
          .reduce((s, f) => s + f.sold, 0);
        total += v.estimatedCost * participants;
      }
    });
    return total;
  }, [vendors, formulas]);

  const totalActualCost = useMemo(() => {
    let total = 0;
    vendors.forEach(v => {
      const cost = v.actualCost ?? v.estimatedCost;
      if (v.costType === "fixed") {
        total += cost;
      } else {
        const participants = formulas
          .filter(f => v.assignedFormulas.includes(f.id))
          .reduce((s, f) => s + f.sold, 0);
        total += cost * participants;
      }
    });
    return total;
  }, [vendors, formulas]);

  const profit = totalRevenue - totalActualCost;
  const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
  const breakeven = useMemo(() => {
    if (totalParticipants === 0) return 0;
    const avgPrice = totalRevenue / totalParticipants;
    const avgCost = totalActualCost / totalParticipants;
    if (avgPrice <= avgCost) return Infinity;
    const fixedCosts = vendors.filter(v => v.costType === "fixed").reduce((s, v) => s + (v.actualCost ?? v.estimatedCost), 0);
    return Math.ceil(fixedCosts / (avgPrice - avgCost + (avgCost - (vendors.filter(v => v.costType !== "fixed").reduce((s, v) => s + (v.actualCost ?? v.estimatedCost), 0) / (totalParticipants || 1))))));
  }, [totalRevenue, totalActualCost, totalParticipants, vendors]);

  const minPricePerFormula = useCallback((formulaId: string) => {
    const formula = formulas.find(f => f.id === formulaId);
    if (!formula || formula.sold === 0) return 0;
    const cost = costPerFormula(formulaId);
    const withContingency = cost * (1 + contingencyPercent / 100);
    const withMargin = withContingency / (1 - targetMarginPercent / 100);
    return withMargin / formula.sold;
  }, [formulas, costPerFormula, contingencyPercent, targetMarginPercent]);

  const updateFormula = useCallback((id: string, updates: Partial<Formula>) => {
    setFormulas(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  }, []);

  const addVendor = useCallback((vendor: Omit<Vendor, "id">) => {
    setVendors(prev => [...prev, { ...vendor, id: `v${Date.now()}` }]);
  }, []);

  const updateVendor = useCallback((id: string, updates: Partial<Vendor>) => {
    setVendors(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
  }, []);

  const removeVendor = useCallback((id: string) => {
    setVendors(prev => prev.filter(v => v.id !== id));
  }, []);

  return (
    <EventContext.Provider value={{
      formulas, vendors, contingencyPercent, targetMarginPercent,
      setFormulas, setVendors, setContingencyPercent, setTargetMarginPercent,
      totalParticipants, totalRevenue, totalEstimatedCost, totalActualCost,
      profit, margin, breakeven, fillRate,
      costPerFormula, minPricePerFormula,
      updateFormula, addVendor, updateVendor, removeVendor,
    }}>
      {children}
    </EventContext.Provider>
  );
}

export function useEvent() {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error("useEvent must be used within EventProvider");
  return ctx;
}
