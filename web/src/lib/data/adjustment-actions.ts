"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { trimToNull } from "@/lib/domain";
import { requireActiveProfile } from "@/lib/data/auth";
import { isUuid, publicErrorMessage } from "@/lib/data/helpers";
import type { FormState } from "@/lib/data/types";

export async function saveAdjustmentsAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const tournamentId = String(formData.get("tournamentId") ?? "");
  if (!isUuid(tournamentId)) {
    return { formError: "大会が見つかりません。" };
  }

  let titles: string[] = [];
  let amountsByParticipant: Record<string, number[]> = {};
  try {
    titles = JSON.parse(String(formData.get("titles") ?? "[]")) as string[];
    amountsByParticipant = JSON.parse(
      String(formData.get("amounts") ?? "{}"),
    ) as Record<string, number[]>;
  } catch {
    return { formError: "入力を読み取れませんでした。" };
  }

  const paddedTitles = [
    trimToNull(titles[0] ?? ""),
    trimToNull(titles[1] ?? ""),
    trimToNull(titles[2] ?? ""),
    trimToNull(titles[3] ?? ""),
    trimToNull(titles[4] ?? ""),
  ];

  const { supabase } = await requireActiveProfile();
  const { error: tournamentError } = await supabase
    .from("tournaments")
    .update({
      adjustment_points_1_title: paddedTitles[0],
      adjustment_points_2_title: paddedTitles[1],
      adjustment_points_3_title: paddedTitles[2],
      adjustment_points_4_title: paddedTitles[3],
      adjustment_points_5_title: paddedTitles[4],
    })
    .eq("id", tournamentId);
  if (tournamentError) {
    return {
      formError: publicErrorMessage(
        tournamentError,
        "ポイントの補正を保存できませんでした。",
      ),
    };
  }

  for (const [participantId, amounts] of Object.entries(amountsByParticipant)) {
    if (!isUuid(participantId)) {
      continue;
    }
    const values = [
      Number(amounts[0] ?? 0) || 0,
      Number(amounts[1] ?? 0) || 0,
      Number(amounts[2] ?? 0) || 0,
      Number(amounts[3] ?? 0) || 0,
      Number(amounts[4] ?? 0) || 0,
    ];
    const { error } = await supabase
      .from("tournament_point_adjustments")
      .upsert(
        {
          tournament_participant_id: participantId,
          adjustment_points_1: values[0],
          adjustment_points_2: values[1],
          adjustment_points_3: values[2],
          adjustment_points_4: values[3],
          adjustment_points_5: values[4],
        },
        { onConflict: "tournament_participant_id" },
      );
    if (error) {
      return {
        formError: publicErrorMessage(
          error,
          "ポイントの補正を保存できませんでした。",
        ),
      };
    }
  }

  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath(`/tournaments/${tournamentId}/adjustments`);
  redirect(`/tournaments/${tournamentId}`);
}
