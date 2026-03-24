import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Trash2, Shield, Loader2, Mail, Copy, RefreshCw, Eye, EyeOff } from "lucide-react";

interface AllowedEmail {
  id: string;
  email: string;
  invite_code: string | null;
  created_at: string;
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  let code = "";
  for (let i = 0; i < 16; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [emails, setEmails] = useState<AllowedEmail[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [visibleCodes, setVisibleCodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    checkAdmin();
  }, [user]);

  useEffect(() => {
    if (isAdmin) fetchEmails();
  }, [isAdmin]);

  const checkAdmin = async () => {
    if (!user) return;
    const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    setIsAdmin(!!data);
    setLoading(false);
  };

  const fetchEmails = async () => {
    const { data } = await supabase.from("allowed_emails").select("*").order("created_at", { ascending: false });
    if (data) setEmails(data as AllowedEmail[]);
  };

  const addEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setAdding(true);
    const code = generateCode();
    const { error } = await supabase.from("allowed_emails").insert({
      email: newEmail.toLowerCase().trim(),
      invited_by: user!.id,
      invite_code: code,
    });
    setAdding(false);
    if (error) {
      toast({ title: "Erreur", description: error.message.includes("duplicate") ? "Cet email est déjà autorisé." : error.message, variant: "destructive" });
    } else {
      toast({ title: "Invitation créée", description: `Code généré pour ${newEmail}. Copiez-le et envoyez-le.` });
      setNewEmail("");
      fetchEmails();
    }
  };

  const regenerateCode = async (id: string) => {
    const code = generateCode();
    const { error } = await supabase.from("allowed_emails").update({ invite_code: code }).eq("id", id);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Code régénéré" });
      fetchEmails();
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Code copié !" });
  };

  const toggleCodeVisibility = (id: string) => {
    setVisibleCodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const removeEmail = async (id: string, email: string) => {
    if (email === "cousinmathis31@gmail.com") {
      toast({ title: "Impossible", description: "Vous ne pouvez pas supprimer le compte administrateur principal.", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("allowed_emails").delete().eq("id", id);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Email supprimé" });
      fetchEmails();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Accès restreint</h2>
            <p className="text-muted-foreground">Seul l'administrateur peut accéder à cette page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Administration</h1>
        <p className="text-muted-foreground">Invitez des collaborateurs en générant un code d'accès unique.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Inviter un collaborateur
          </CardTitle>
          <CardDescription>Ajoutez un email pour générer un code d'invitation unique.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={addEmail} className="flex gap-3">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="collaborateur@email.com"
                className="pl-9"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={adding}>
              {adding && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Inviter
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Collaborateurs ({emails.length})</CardTitle>
          <CardDescription>Copiez le code et envoyez-le à la personne concernée.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Code d'invitation</TableHead>
                <TableHead>Ajouté le</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {emails.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {item.email}
                      {item.email === "cousinmathis31@gmail.com" && (
                        <Badge variant="secondary" className="text-xs">Admin</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.invite_code ? (
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                          {visibleCodes.has(item.id) ? item.invite_code : "••••••••••••••••"}
                        </code>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleCodeVisibility(item.id)}>
                          {visibleCodes.has(item.id) ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyCode(item.invite_code!)}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => regenerateCode(item.id)} title="Régénérer le code">
                          <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => regenerateCode(item.id)}>
                        Générer un code
                      </Button>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeEmail(item.id, item.email)}
                      disabled={item.email === "cousinmathis31@gmail.com"}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {emails.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Aucun collaborateur invité pour le moment.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
