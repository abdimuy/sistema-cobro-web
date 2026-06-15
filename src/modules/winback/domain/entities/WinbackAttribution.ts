// WinbackAttribution holds the A/B uplift measurement between the treatment
// group (clients contacted for winback) and the control group (clients not
// contacted). Rates and uplift are decimal strings matching the API response.
export type WinbackAttribution = {
  readonly treatmentTotal: number;
  readonly treatmentConvertidos: number;
  readonly controlTotal: number;
  readonly controlConvertidos: number;
  // Decimal as string — do not parse to number; use Intl for display.
  readonly tasaTreatment: string;
  readonly tasaControl: string;
  readonly uplift: string;
};
