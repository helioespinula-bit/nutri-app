import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
const makeReadUrl = Deno.env.get("NUTRI_MAKE_READ_WEBHOOK_URL");
const makeWriteUrl = Deno.env.get("NUTRI_MAKE_WRITE_WEBHOOK_URL");

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase environment is not configured.");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ ok: false, error: "Método não permitido." }, 405);
  }

  const authHeader = req.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return json({ ok: false, error: "Não autenticado." }, 401);
  }

  const token = authHeader.replace("Bearer ", "").trim();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return json({ ok: false, error: "Sessão inválida." }, 401);
  }

  try {
    const body = await req.json();
    const operation = body?.operation;

    if (operation === "ler_historico") {
      if (!makeReadUrl) {
        return json(
          {
            ok: false,
            error: "Webhook de leitura do Make não configurado.",
          },
          503
        );
      }

      const from = body?.from;
      const to = body?.to;

      if (!from || !to) {
        return json(
          {
            ok: false,
            error: "Informe as datas 'from' e 'to'.",
          },
          400
        );
      }

      const makeResponse = await fetch(makeReadUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          app: "NuTri",
          version: 1,
          operation: "ler_historico",
          from,
          to,
          workbooks: [
            "Historico_NuTri.xlsx",
            "Arquivo Registro App.xlsx",
          ],
          user_id: user.id,
        }),
      });

      const text = await makeResponse.text();

      let data: unknown = text;

      try {
        data = JSON.parse(text);
      } catch {
        // Mantém a resposta como texto quando não for JSON.
      }

      return json(data, makeResponse.status);
    }

    if (operation === "registrar") {
      if (!makeWriteUrl) {
        return json(
          {
            ok: false,
            error: "Webhook de escrita do Make não configurado.",
          },
          503
        );
      }

      const payload = body?.payload;

      if (!payload || typeof payload !== "object") {
        return json(
          {
            ok: false,
            error: "Payload de registro ausente.",
          },
          400
        );
      }

      const makeResponse = await fetch(makeWriteUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          app: "NuTri",
          version: 1,
          operation: "registrar",
          user_id: user.id,
          payload,
        }),
      });

      const text = await makeResponse.text();

      let data: unknown = text;

      try {
        data = JSON.parse(text);
      } catch {
        // Mantém a resposta como texto quando não for JSON.
      }

      return json(data, makeResponse.status);
    }

    return json(
      {
        ok: false,
        error: "Operação não reconhecida.",
      },
      400
    );
  } catch (error) {
    console.error(error);

    return json(
      {
        ok: false,
        error: "Erro interno ao acessar o histórico.",
      },
      500
    );
  }
});