import { useState } from "react";
import { CheckCircle2, Circle, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface Task {
  id: string;
  title: string;
  assignee: string;
  deadline: string;
  status: "todo" | "in-progress" | "done";
}

const STATUS_CONFIG = {
  todo: { label: "À faire", icon: Circle, cls: "text-muted-foreground" },
  "in-progress": { label: "En cours", icon: Clock, cls: "text-warning" },
  done: { label: "Terminé", icon: CheckCircle2, cls: "text-success" },
};

const INITIAL_TASKS: Task[] = [
  { id: "t1", title: "Confirmer le traiteur", assignee: "Alice", deadline: "2026-04-01", status: "done" },
  { id: "t2", title: "Valider le plan de salle", assignee: "Bob", deadline: "2026-04-10", status: "in-progress" },
  { id: "t3", title: "Commander les boissons", assignee: "Claire", deadline: "2026-04-15", status: "todo" },
  { id: "t4", title: "Tester le son et lumières", assignee: "David", deadline: "2026-04-18", status: "todo" },
  { id: "t5", title: "Envoyer les invitations", assignee: "Alice", deadline: "2026-03-25", status: "done" },
  { id: "t6", title: "Briefing équipe bénévoles", assignee: "Bob", deadline: "2026-04-20", status: "todo" },
];

export default function Logistics() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [showForm, setShowForm] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", assignee: "", deadline: "" });

  const handleAdd = () => {
    if (!newTask.title) return;
    setTasks(prev => [...prev, { ...newTask, id: `t${Date.now()}`, status: "todo" }]);
    setNewTask({ title: "", assignee: "", deadline: "" });
    setShowForm(false);
  };

  const cycleStatus = (id: string) => {
    const order: Task["status"][] = ["todo", "in-progress", "done"];
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const next = order[(order.indexOf(t.status) + 1) % 3];
      return { ...t, status: next };
    }));
  };

  const grouped = {
    todo: tasks.filter(t => t.status === "todo"),
    "in-progress": tasks.filter(t => t.status === "in-progress"),
    done: tasks.filter(t => t.status === "done"),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Logistique</h1>
          <p className="text-sm text-muted-foreground">Planning et suivi des tâches</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Tâche
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="rounded-lg border border-border bg-card p-4 flex flex-wrap gap-3">
              <input placeholder="Titre" value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))} className="flex-1 min-w-[200px] rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              <input placeholder="Assigné à" value={newTask.assignee} onChange={e => setNewTask(p => ({ ...p, assignee: e.target.value }))} className="w-32 rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              <input type="date" value={newTask.deadline} onChange={e => setNewTask(p => ({ ...p, deadline: e.target.value }))} className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              <Button onClick={handleAdd} size="sm">Ajouter</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Object.keys(grouped) as Task["status"][]).map(status => {
          const config = STATUS_CONFIG[status];
          const Icon = config.icon;
          return (
            <div key={status} className="space-y-3">
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${config.cls}`} />
                <h2 className="text-sm font-medium text-foreground">{config.label}</h2>
                <span className="text-xs text-muted-foreground">({grouped[status].length})</span>
              </div>
              {grouped[status].map(t => (
                <motion.div
                  key={t.id}
                  layout
                  className="rounded-lg border border-border bg-card p-3 space-y-2 cursor-pointer hover:border-primary/30 transition-colors"
                  onClick={() => cycleStatus(t.id)}
                >
                  <p className="text-sm font-medium text-foreground">{t.title}</p>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t.assignee}</span>
                    <span>{t.deadline}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
