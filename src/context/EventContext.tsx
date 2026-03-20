import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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
  assignedFormulas: string[];
}

interface EventContextType {
  formulas: Formula[];
  vendors: Vendor[];
  contingencyPercent: number;
  targetMarginPercent: number;
  setFormulas: React.Dispatch<React.SetStateAction<Formula[]>>;
  setVendors: React.Dispatch<React.SetStateAction<Vendor[]>>;
  setContingencyPercent: (v: number) => void;
  setTargetMarginPercent: (v: number) => void;
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
  loading: boolean;
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

// Debounce helper
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function EventProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [formulas, setFormulas] = useState<Formula[]>(DEFAULT_FORMULAS);
  const [vendors, setVendors] = useState<Vendor[]>(DEFAULT_VENDORS);
  const [contingencyPercent, setContingencyPercentState] = useState(10);
  const [targetMarginPercent, setTargetMarginPercentState] = useState(15);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);
  const skipSave = useRef(true);

  // Load from DB
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      skipSave.current = true;
      const [formulasRes, vendorsRes, settingsRes] = await Promise.all([
        supabase.from("event_formulas").select("*").eq("user_id", user.id),
        supabase.from("event_vendors").select("*").eq("user_id", user.id),
        supabase.from("event_settings").select("*").eq("user_id", user.id).maybeSingle(),
      ]);

      if (formulasRes.data && formulasRes.data.length > 0) {
        setFormulas(formulasRes.data.map((f: any) => ({
          id: f.id, name: f.name, price: Number(f.price),
          maxCapacity: f.max_capacity, sold: f.sold, color: f.color,
        })));
      } else if (!initialized.current) {
        // First time: seed defaults
        await seedDefaults(user.id);
      }

      if (vendorsRes.data && vendorsRes.data.length > 0) {
        setVendors(vendorsRes.data.map((v: any) => ({
          id: v.id, name: v.name, category: v.category,
          costType: v.cost_type as Vendor["costType"],
          estimatedCost: Number(v.estimated_cost),
          actualCost: v.actual_cost != null ? Number(v.actual_cost) : null,
          status: v.status as Vendor["status"],
          assignedFormulas: v.assigned_formulas || [],
        })));
      }

      if (settingsRes.data) {
        setContingencyPercentState(Number(settingsRes.data.contingency_percent));
        setTargetMarginPercentState(Number(settingsRes.data.target_margin_percent));
      }

      initialized.current = true;
      setLoading(false);
      // Allow saves after a tick
      setTimeout(() => { skipSave.current = false; }, 500);
    };
    load();
  }, [user]);

  const seedDefaults = async (userId: string) => {
    await Promise.all([
      supabase.from("event_formulas").upsert(
        DEFAULT_FORMULAS.map(f => ({
          id: f.id, user_id: userId, name: f.name, price: f.price,
          max_capacity: f.maxCapacity, sold: f.sold, color: f.color,
        }))
      ),
      supabase.from("event_vendors").upsert(
        DEFAULT_VENDORS.map(v => ({
          id: v.id, user_id: userId, name: v.name, category: v.category,
          cost_type: v.costType, estimated_cost: v.estimatedCost,
          actual_cost: v.actualCost, status: v.status,
          assigned_formulas: v.assignedFormulas,
        }))
      ),
      supabase.from("event_settings").upsert({
        user_id: userId, contingency_percent: 10, target_margin_percent: 15,
      }),
    ]);
  };

  // Save formulas to DB (debounced)
  const debouncedFormulas = useDebounce(formulas, 800);
  useEffect(() => {
    if (!user || skipSave.current) return;
    supabase.from("event_formulas").upsert(
      debouncedFormulas.map(f => ({
        id: f.id, user_id: user.id, name: f.name, price: f.price,
        max_capacity: f.maxCapacity, sold: f.sold, color: f.color,
      }))
    ).then(() => {});
  }, [debouncedFormulas, user]);

  // Save vendors to DB (debounced)
  const debouncedVendors = useDebounce(vendors, 800);
  useEffect(() => {
    if (!user || skipSave.current) return;
    // First delete all then upsert to handle removals
    supabase.from("event_vendors").delete().eq("user_id", user.id).then(() => {
      if (debouncedVendors.length > 0) {
        supabase.from("event_vendors").upsert(
          debouncedVendors.map(v => ({
            id: v.id, user_id: user.id, name: v.name, category: v.category,
            cost_type: v.costType, estimated_cost: v.estimatedCost,
            actual_cost: v.actualCost, status: v.status,
            assigned_formulas: v.assignedFormulas,
          }))
        ).then(() => {});
      }
    });
  }, [debouncedVendors, user]);

  // Save settings
  const setContingencyPercent = useCallback((v: number) => {
    setContingencyPercentState(v);
    if (user && !skipSave.current) {
      supabase.from("event_settings").upsert({
        user_id: user.id, contingency_percent: v, target_margin_percent: targetMarginPercent,
      }).then(() => {});
    }
  }, [user, targetMarginPercent]);

  const setTargetMarginPercent = useCallback((v: number) => {
    setTargetMarginPercentState(v);
    if (user && !skipSave.current) {
      supabase.from("event_settings").upsert({
        user_id: user.id, contingency_percent: contingencyPercent, target_margin_percent: v,
      }).then(() => {});
    }
  }, [user, contingencyPercent]);

  // Computed values (same as before)
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
    const fixedCosts = vendors.filter(v => v.costType === "fixed").reduce((s, v) => s + (v.actualCost ?? v.estimatedCost), 0);
    const varCostPerPerson = vendors.filter(v => v.costType !== "fixed").reduce((s, v) => s + (v.actualCost ?? v.estimatedCost), 0);
    const contribution = avgPrice - varCostPerPerson;
    if (contribution <= 0) return Infinity;
    return Math.ceil(fixedCosts / contribution);
  }, [totalRevenue, totalParticipants, vendors]);

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
      loading,
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
