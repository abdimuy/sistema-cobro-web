// ResolveInput is the input the resolver use case accepts. Status is
// constrained to the two manual-resolution states the backend allows
// for PATCH /{id}/resolve — `ignored` (false alarm, no further action)
// and `resolved_manual` (the operator fixed it outside the system).
export type ResolveStatus = "ignored" | "resolved_manual";

export type ResolveInput = {
  intentId: string;
  status: ResolveStatus;
  notes: string;
};
