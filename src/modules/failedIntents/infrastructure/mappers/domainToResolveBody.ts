import type { ResolveInput } from "../../application/dto";

// The PATCH /{id}/resolve body is `{ status, notes }`. We never send the
// intent ID in the body — it lives in the URL.
export function domainToResolveBody(input: ResolveInput): {
  status: string;
  notes: string;
} {
  return {
    status: input.status,
    notes: input.notes,
  };
}
