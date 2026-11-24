import type { FormState } from "../form/parse"
import type { VisionEstimate } from "./types"

/** Copia só os campos que a visão realmente devolveu. O resto fica como está. */
export function formPatchFromEstimate(estimate: VisionEstimate): Partial<FormState> {
  const patch: Partial<FormState> = {}
  if (estimate.heightMm != null && Number.isFinite(estimate.heightMm)) patch.heightMm = String(estimate.heightMm)
  if (estimate.widthMm != null && Number.isFinite(estimate.widthMm)) patch.widthMm = String(estimate.widthMm)
  if (estimate.depthMm != null && Number.isFinite(estimate.depthMm)) patch.depthMm = String(estimate.depthMm)
  if (estimate.drawerCount != null && Number.isFinite(estimate.drawerCount)) {
    patch.drawerCount = String(estimate.drawerCount)
  }
  return patch
}
