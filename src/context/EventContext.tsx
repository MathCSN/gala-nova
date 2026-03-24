import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Formula {
  id: string;
  name: string;
  price: number;
  maxCapacity: number;
  sold: number; // = places estimées dans l'UI
  color: string;
  order: number;
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
  website?: string;
  notes?: string;
  attachmentUrl?: string;
}

export const DEFAULT_CATEGORIES = ["Salle", "Traiteur", "Alcool", "DJ", "Décoration", "Photo", "Sécurité", "Autre"];

interface EventContextType {
  formulas: Formula[];
  vendors: Vendor[];
  categories: string[];
  contingencyPercent: number;
  targetMarginPercent: number;
  setFormulas: React.Dispatch<React.SetStateAction<Formula[]>>;
  setVendors: React.Dispatch<React.SetStateAction<Vendor[]>>;
  setCategories: (cats: string[]) => void;
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
  addFormula: (formula: Omit<Formula, "id" | "order">) => void;
  removeFormula: (id: string) => void;
  reorderFormulas: (newFormulas: Formula[]) => void;
  addVendor: (vendor: Omit<Vendor, "id">) => void;
  updateVendor: (id: string, updates: Partial<Vendor>) => void;
  removeVendor: (id: string) => void;
  loading: boolean;
}

const EventContext = createContext<EventContextType | null>(null);

const DEFAULT_FORMULAS: Formula[] = [
  { id: "premium", name: "Premium", price: 85, maxCapacity: 120, sold: 45, color: "#7C3AED", order: 0 },
  { id: "dinner", name: "Dîner", price: 55, maxCapacity: 80, sold: 32, color: "#10B981", order: 1 },
  { id: "party", name: "Soirée", price: 30, maxCapacity: 200, sold: 78, color: "#F59E0B", order: 2 },
];

const DEFAULT_VENDORS: Vendor[] = [
  { id: "v1", name: "Salle Le Château", category: "Salle", costType: "fixed", estimatedCost: 3500, actualCost: 3500, status: "confirmed", assignedFormulas: ["premium", "dinner", "party"] },
  { id: "v2", name: "Traiteur Excellence", category: "Traiteur", costType: "per-participant", estimatedCost: 35, actualCost: null, status: "quote", assignedFormulas: ["premium", "dinner"] },
  { id: "v3", name: "Cave Select", category: "Alcool", costType: "per-participant", estimatedCost: 15, actualCost: null, status: "quote", assignedFormulas: ["premium"] },
  { id: "v4", name: "DJ Maxime", category: "DJ", costType: "fixed", estimatedCost: 800, actualCost: 800, status: "paid", assignedFormulas: ["premium", "dinner", "party"] },
  { id: "v5", name: "Déco & Lumières", category: "Décoration", costType: "fixed", estimatedCost: 600, actualCost: null, status: "quote", assignedFormulas: ["premium", "dinner", "party"] },
  { id: "v6", name: "Photographe Pro", category: "Photo", costType: "fixed", estimatedCost: 450, actualCost: 450, status: "paid", assignedFormulas: ["premium", "dinner", "party"] },
];

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
  const [categories, setCategoriesState] = useState<string[]>(DEFAULT_CATEGORIES);
  const [contingencyPercent, setContingencyPercentState] = useState(10);
  const [targetMarginPercent, setTargetMarginPercentState] = useState(15);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);
  const skipSave = useRef(true);

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
        const loaded = formulasRes.data.map((f: any) => ({
          id: f.id, name: f.name, price: Number(f.price),
          maxCapacity: f.max_capacity, sold: f.sold, color: f.color,
          order: f.sort_order ?? 0,
        }));
        setFormulas(loaded.sort((a: Formula, b: Formula) => a.order - b.order));
      } else if (!initialized.current) {
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
          website: v.website ?? undefined,
          notes: v.notes ?? undefined,
          attachmentUrl: v.attachment_url ?? undefined,
        })));
      }

      if (settingsRes.data) {
        setContingencyPercentState(Number(settingsRes.data.contingency_percent));
        setTargetMarginPercentState(Number(settingsRes.data.target_margin_percent));
        const cats = (settingsRes.data as any).custom_categories;
        if (cats && cats.length > 0) setCategoriesState(cats);
      }

      initialized.current = true;
      setLoading(false);
      setTimeout(() => { skipSave.current = false; }, 500);
    };
    load();
  }, [user]);

  const seedDefaults = async (userId: string) => {
    await Promise.all([
      supabase.from("event_formulas").upsert(
        DEFAULT_FORMULAS.map(f => ({
          id: f.id, user_id: userId, name: f.name, price: f.price,
          max_capacity: f.maxCapacity, sold: f.sold, color: f.color, sort_order: f.order,
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
      supabase.from("event_settings").upsert({ user_id: userId, contingency_percent: 10, target_margin_percent: 15 }),
    ]);
  };

  const debouncedFormulas = useDebounce(formulas, 800);
  useEffect(() => {
    if (!user || skipSave.current) return;
    supabase.from("event_formulas").upsert(
      debouncedFormulas.map(f => ({
        id: f.id, user_id: user.id, name: f.name, price: f.price,
        max_capacity: f.maxCapacity, sold: f.sold, color: f.color, sort_order: f.order,
      }))
    ).then(() => {});
  }, [debouncedFormulas, user]);

  const debouncedVendors = useDebounce(vendors, 800);
  useEffect(() => {
    if (!user || skipSave.current) return;
    supabase.from("event_vendors").delete().eq("user_id", user.id).then(() => {
      if (debouncedVendors.length > 0) {
        supabase.from("event_vendors").upsert(
          debouncedVendors.map(v => ({
            id: v.id, user_id: user.id, name: v.name, category: v.category,
            cost_type: v.costType, estimated_cost: v.estimatedCost,
            actual_cost: v.actualCost, status: v.status,
            assigned_formulas: v.assignedFormulas,
            website: v.website ?? null,
            notes: v.notes ?? null,
            attachment_url: v.attachmentUrl ?? null,
          }))
        ).then(() => {});
      }
    });
  }, [debouncedVendors, user]);

  const saveSettings = useCallback((contingency: number, margin: number, cats: string[]) => {
    if (!user || skipSave.current) return;
    (supabase.from("event_settings") as any).upsert({
      user_id: user.id,
      contingency_percent: contingency,
      target_margin_percent: margin,
      custom_categories: cats,
    }).then(() => {});
  }, [user]);

  const setContingencyPercent = useCallback((v: number) => {
    setContingencyPercentState(v);
    saveSettings(v, targetMarginPercent, categories);
  }, [saveSettings, targetMarginPercent, categories]);

  const setTargetMarginPercent = useCallback((v: number) => {
    setTargetMarginPercentState(v);
    saveSettings(contingencyPercent, v, categories);
  }, [saveSettings, contingencyPercent, categories]);

  const setCategories = useCallback((cats: string[]) => {
    setCategoriesState(cats);
    saveSettings(contingencyPercent, targetMarginPercent, cats);
  }, [saveSettings, contingencyPercent, targetMarginPercent]);

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
        const totalForVendor = formulas.filter(f => v.assignedFormulas.includes(f.id)).reduce((s, f) => s + f.sold, 0);
        if (totalForVendor > 0) total += (cost / totalForVendor) * formula.sold;
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
        const participants = formulas.filter(f => v.assignedFormulas.includes(f.id)).reduce((s, f) => s + f.sold, 0);
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
        const participants = formulas.filter(f => v.assignedFormulas.includes(f.id)).reduce((s, f) => s + f.sold, 0);
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

  const addFormula = useCallback((formula: Omit<Formula, "id" | "order">) => {
    setFormulas(prev => {
      const maxOrder = prev.reduce((m, f) => Math.max(m, f.order), -1);
      return [...prev, { ...formula, id: `f${Date.now()}`, order: maxOrder + 1 }];
    });
  }, []);

  const removeFormula = useCallback((id: string) => {
    setFormulas(prev => prev.filter(f => f.id !== id));
    setVendors(prev => prev.map(v => ({ ...v, assignedFormulas: v.assignedFormulas.filter(fid => fid !== id) })));
    if (user) supabase.from("event_formulas").delete().eq("id", id).then(() => {});
  }, [user]);

  const reorderFormulas = useCallback((newFormulas: Formula[]) => {
    setFormulas(newFormulas.map((f, i) => ({ ...f, order: i })));
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
      formulas, vendors, categories,
      contingencyPercent, targetMarginPercent,
      setFormulas, setVendors, setCategories,
      setContingencyPercent, setTargetMarginPercent,
      totalParticipants, totalRevenue, totalEstimatedCost, totalActualCost,
      profit, margin, breakeven, fillRate,
      costPerFormula, minPricePerFormula,
      updateFormula, addFormula, removeFormula, reorderFormulas,
      addVendor, updateVendor, removeVendor,
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
