import { supabase } from "./lib/supabase";

export type NutriHistoryResponse = {
  ok: boolean;
  meals?: unknown[];
  weights?: unknown[];
  [key: string]: unknown;
};

async function invoke(operation: string, body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("nutri-history", {
    body: {
      operation,
      ...body,
    },
  });

  if (error) {
    throw new Error(
      error.message || "Não foi possível acessar o histórico."
    );
  }

  if (!data || data.ok === false) {
    throw new Error(
      typeof data?.error === "string"
        ? data.error
        : "Não foi possível acessar o histórico."
    );
  }

  return data;
}

export async function readNutriHistory(
  from: string,
  to: string
): Promise<NutriHistoryResponse> {
  return invoke("ler_historico", { from, to });
}

export async function registerNutriData(
  payload: Record<string, unknown>
) {
  return invoke("registrar", { payload });
}