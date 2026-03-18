import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, User, FileText, MessageSquare, Phone, Mail, MapPin,
  Building2, Trash2, Edit, Calendar, Euro, Loader2
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type VendorContact = Tables<"vendor_contacts">;
type VendorContract = Tables<"vendor_contracts">;
type VendorExchange = Tables<"vendor_exchanges">;

const CATEGORIES = ["Salle", "Traiteur", "DJ", "Décoration", "Photo", "Vidéo", "Alcool", "Sécurité", "Autre"];
const CONTRACT_STATUSES = [
  { value: "draft", label: "Brouillon", color: "bg-muted text-muted-foreground" },
  { value: "sent", label: "Envoyé", color: "bg-blue-500/20 text-blue-400" },
  { value: "signed", label: "Signé", color: "bg-green-500/20 text-green-400" },
  { value: "expired", label: "Expiré", color: "bg-yellow-500/20 text-yellow-400" },
  { value: "cancelled", label: "Annulé", color: "bg-destructive/20 text-destructive" },
];
const EXCHANGE_TYPES = [
  { value: "email", label: "Email", icon: Mail },
  { value: "call", label: "Appel", icon: Phone },
  { value: "meeting", label: "Réunion", icon: Calendar },
  { value: "note", label: "Note", icon: MessageSquare },
];

export default function CRM() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<VendorContact[]>([]);
  const [contracts, setContracts] = useState<VendorContract[]>([]);
  const [exchanges, setExchanges] = useState<VendorExchange[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<VendorContact | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showContractForm, setShowContractForm] = useState(false);
  const [showExchangeForm, setShowExchangeForm] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [c1, c2, c3] = await Promise.all([
      supabase.from("vendor_contacts").select("*").eq("user_id", user.id).order("name"),
      supabase.from("vendor_contracts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("vendor_exchanges").select("*").eq("user_id", user.id).order("exchange_date", { ascending: false }),
    ]);
    if (c1.data) setContacts(c1.data);
    if (c2.data) setContracts(c2.data);
    if (c3.data) setExchanges(c3.data);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const contactContracts = contracts.filter(c => c.vendor_contact_id === selectedContact?.id);
  const contactExchanges = exchanges.filter(e => e.vendor_contact_id === selectedContact?.id);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">CRM Prestataires</h1>
          <p className="text-sm text-muted-foreground">{contacts.length} contact(s)</p>
        </div>
        <Dialog open={showContactForm} onOpenChange={setShowContactForm}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> Ajouter un contact</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nouveau contact prestataire</DialogTitle></DialogHeader>
            <ContactForm
              userId={user!.id}
              onSaved={() => { setShowContactForm(false); fetchAll(); }}
              toast={toast}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact list */}
        <div className="space-y-2">
          {contacts.length === 0 ? (
            <Card className="border-dashed border-border/50">
              <CardContent className="py-8 text-center text-muted-foreground">
                <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Aucun contact prestataire</p>
              </CardContent>
            </Card>
          ) : contacts.map(contact => (
            <Card
              key={contact.id}
              className={`cursor-pointer transition-colors hover:border-primary/50 ${selectedContact?.id === contact.id ? "border-primary bg-primary/5" : "border-border/50"}`}
              onClick={() => setSelectedContact(contact)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{contact.name}</p>
                    {contact.company && <p className="text-xs text-muted-foreground">{contact.company}</p>}
                  </div>
                  <Badge variant="secondary" className="text-xs">{contact.category}</Badge>
                </div>
                <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                  {contact.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{contact.email}</span>}
                  {contact.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{contact.phone}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-2">
          {!selectedContact ? (
            <Card className="border-border/50">
              <CardContent className="py-16 text-center text-muted-foreground">
                <Building2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>Sélectionnez un contact pour voir ses détails</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Contact header */}
              <Card className="border-border/50">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-foreground">{selectedContact.name}</h2>
                      {selectedContact.company && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Building2 className="h-3.5 w-3.5" />{selectedContact.company}
                        </p>
                      )}
                      <Badge variant="secondary" className="mt-2">{selectedContact.category}</Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={async () => {
                        await supabase.from("vendor_contacts").delete().eq("id", selectedContact.id);
                        setSelectedContact(null);
                        fetchAll();
                        toast({ title: "Contact supprimé" });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-sm">
                    {selectedContact.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4 text-primary" />{selectedContact.email}
                      </div>
                    )}
                    {selectedContact.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4 text-primary" />{selectedContact.phone}
                      </div>
                    )}
                    {selectedContact.address && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4 text-primary" />{selectedContact.address}
                      </div>
                    )}
                  </div>
                  {selectedContact.notes && (
                    <p className="mt-3 text-sm text-muted-foreground border-t border-border/50 pt-3">{selectedContact.notes}</p>
                  )}
                </CardContent>
              </Card>

              {/* Tabs: Contracts & Exchanges */}
              <Tabs defaultValue="contracts">
                <TabsList>
                  <TabsTrigger value="contracts" className="gap-1">
                    <FileText className="h-3.5 w-3.5" /> Contrats ({contactContracts.length})
                  </TabsTrigger>
                  <TabsTrigger value="exchanges" className="gap-1">
                    <MessageSquare className="h-3.5 w-3.5" /> Échanges ({contactExchanges.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="contracts" className="space-y-3 mt-3">
                  <Dialog open={showContractForm} onOpenChange={setShowContractForm}>
                    <DialogTrigger asChild>
                      <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nouveau contrat</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Nouveau contrat</DialogTitle></DialogHeader>
                      <ContractForm
                        userId={user!.id}
                        vendorContactId={selectedContact.id}
                        onSaved={() => { setShowContractForm(false); fetchAll(); }}
                        toast={toast}
                      />
                    </DialogContent>
                  </Dialog>

                  {contactContracts.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">Aucun contrat</p>
                  ) : contactContracts.map(contract => {
                    const statusInfo = CONTRACT_STATUSES.find(s => s.value === contract.status);
                    return (
                      <Card key={contract.id} className="border-border/50">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-foreground">{contract.title}</p>
                              <p className="text-lg font-bold text-primary mt-1">{Number(contract.amount).toLocaleString("fr-FR")} €</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={statusInfo?.color}>{statusInfo?.label}</Badge>
                              <Button
                                variant="ghost" size="icon"
                                className="text-destructive hover:text-destructive h-8 w-8"
                                onClick={async () => {
                                  await supabase.from("vendor_contracts").delete().eq("id", contract.id);
                                  fetchAll();
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                            {contract.start_date && <span>Début: {format(new Date(contract.start_date), "dd MMM yyyy", { locale: fr })}</span>}
                            {contract.end_date && <span>Fin: {format(new Date(contract.end_date), "dd MMM yyyy", { locale: fr })}</span>}
                          </div>
                          {contract.notes && <p className="text-sm text-muted-foreground mt-2">{contract.notes}</p>}
                        </CardContent>
                      </Card>
                    );
                  })}
                </TabsContent>

                <TabsContent value="exchanges" className="space-y-3 mt-3">
                  <Dialog open={showExchangeForm} onOpenChange={setShowExchangeForm}>
                    <DialogTrigger asChild>
                      <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nouvel échange</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Nouvel échange</DialogTitle></DialogHeader>
                      <ExchangeForm
                        userId={user!.id}
                        vendorContactId={selectedContact.id}
                        onSaved={() => { setShowExchangeForm(false); fetchAll(); }}
                        toast={toast}
                      />
                    </DialogContent>
                  </Dialog>

                  {contactExchanges.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">Aucun échange</p>
                  ) : (
                    <div className="relative border-l-2 border-border/50 ml-4 space-y-4">
                      {contactExchanges.map(exchange => {
                        const typeInfo = EXCHANGE_TYPES.find(t => t.value === exchange.type);
                        const Icon = typeInfo?.icon ?? MessageSquare;
                        return (
                          <div key={exchange.id} className="relative pl-6">
                            <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                              <Icon className="h-2.5 w-2.5 text-primary-foreground" />
                            </div>
                            <Card className="border-border/50">
                              <CardContent className="p-3">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">{typeInfo?.label}</Badge>
                                      <span className="text-xs text-muted-foreground">
                                        {format(new Date(exchange.exchange_date), "dd MMM yyyy HH:mm", { locale: fr })}
                                      </span>
                                    </div>
                                    <p className="font-medium text-foreground mt-1">{exchange.subject}</p>
                                    {exchange.content && <p className="text-sm text-muted-foreground mt-1">{exchange.content}</p>}
                                  </div>
                                  <Button
                                    variant="ghost" size="icon"
                                    className="text-destructive hover:text-destructive h-7 w-7"
                                    onClick={async () => {
                                      await supabase.from("vendor_exchanges").delete().eq("id", exchange.id);
                                      fetchAll();
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Sub-forms ── */

function ContactForm({ userId, onSaved, toast }: { userId: string; onSaved: () => void; toast: any }) {
  const [form, setForm] = useState({ name: "", company: "", category: "Autre", email: "", phone: "", address: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("vendor_contacts").insert({ ...form, user_id: userId });
    setSaving(false);
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Contact ajouté" });
    onSaved();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1"><Label>Nom *</Label><Input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
        <div className="space-y-1"><Label>Entreprise</Label><Input value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} /></div>
      </div>
      <div className="space-y-1">
        <Label>Catégorie</Label>
        <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
        <div className="space-y-1"><Label>Téléphone</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
      </div>
      <div className="space-y-1"><Label>Adresse</Label><Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} /></div>
      <div className="space-y-1"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
      <Button type="submit" className="w-full" disabled={saving}>
        {saving && <Loader2 className="h-4 w-4 animate-spin" />} Ajouter
      </Button>
    </form>
  );
}

function ContractForm({ userId, vendorContactId, onSaved, toast }: { userId: string; vendorContactId: string; onSaved: () => void; toast: any }) {
  const [form, setForm] = useState({ title: "", amount: 0, status: "draft", start_date: "", end_date: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("vendor_contracts").insert({
      ...form,
      user_id: userId,
      vendor_contact_id: vendorContactId,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
    });
    setSaving(false);
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Contrat ajouté" });
    onSaved();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1"><Label>Titre *</Label><Input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1"><Label>Montant (€)</Label><Input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: Number(e.target.value) }))} /></div>
        <div className="space-y-1">
          <Label>Statut</Label>
          <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{CONTRACT_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1"><Label>Date début</Label><Input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} /></div>
        <div className="space-y-1"><Label>Date fin</Label><Input type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} /></div>
      </div>
      <div className="space-y-1"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
      <Button type="submit" className="w-full" disabled={saving}>
        {saving && <Loader2 className="h-4 w-4 animate-spin" />} Ajouter
      </Button>
    </form>
  );
}

function ExchangeForm({ userId, vendorContactId, onSaved, toast }: { userId: string; vendorContactId: string; onSaved: () => void; toast: any }) {
  const [form, setForm] = useState({ type: "note", subject: "", content: "" });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("vendor_exchanges").insert({
      ...form,
      user_id: userId,
      vendor_contact_id: vendorContactId,
    });
    setSaving(false);
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Échange ajouté" });
    onSaved();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <Label>Type</Label>
        <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{EXCHANGE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-1"><Label>Sujet *</Label><Input required value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} /></div>
      <div className="space-y-1"><Label>Contenu</Label><Textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} /></div>
      <Button type="submit" className="w-full" disabled={saving}>
        {saving && <Loader2 className="h-4 w-4 animate-spin" />} Ajouter
      </Button>
    </form>
  );
}
