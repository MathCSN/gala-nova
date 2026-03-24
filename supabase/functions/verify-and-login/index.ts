import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, code } = await req.json();
    const normalizedEmail = email.toLowerCase().trim();

    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify invite code
    const { data: valid } = await supabaseAdmin.rpc("verify_invite_code", {
      _email: normalizedEmail,
      _code: code,
    });

    if (!valid) {
      return new Response(
        JSON.stringify({ error: "Email ou code d'invitation invalide." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user exists
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = users?.users?.find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    if (existingUser) {
      // Update password to the invite code and generate session
      await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        password: code,
      });

      // Generate a session token
      const { data: session, error: sessionError } =
        await supabaseAdmin.auth.admin.generateLink({
          type: "magiclink",
          email: normalizedEmail,
        });

      if (sessionError) {
        return new Response(
          JSON.stringify({ error: sessionError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ action: "sign_in", email: normalizedEmail }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // Create user with invite code as password
      const { error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password: code,
        email_confirm: true,
      });

      if (createError) {
        return new Response(
          JSON.stringify({ error: createError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ action: "sign_in", email: normalizedEmail }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
