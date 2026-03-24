import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Utensils, Mail, Key, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Verify invite code via RPC
    const { data: valid, error: rpcError } = await supabase.rpc("verify_invite_code", {
      _email: email,
      _code: code,
    });

    if (rpcError || !valid) {
      setLoading(false);
      toast({ title: "Accès refusé", description: "Email ou code d'invitation invalide.", variant: "destructive" });
      return;
    }

    // Try sign in first
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password: code,
    });

    if (signInError) {
      // User doesn't exist yet, sign up with code as password
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password: code,
      });

      if (signUpError) {
        setLoading(false);
        toast({ title: "Erreur", description: signUpError.message, variant: "destructive" });
        return;
      }

      // Auto-confirm is enabled, sign in
      const { error: retryError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password: code,
      });

      if (retryError) {
        setLoading(false);
        toast({ title: "Erreur", description: retryError.message, variant: "destructive" });
        return;
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border/50">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Utensils className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Gala ENOVA</CardTitle>
          <CardDescription className="text-muted-foreground">
            Entrez votre email et le code d'invitation pour accéder à l'espace organisateur
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="vous@email.com"
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Code d'invitation</Label>
              <div className="relative">
                <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Votre code d'accès"
                  className="pl-9"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Se connecter
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Contactez l'administrateur pour obtenir un code d'invitation.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
