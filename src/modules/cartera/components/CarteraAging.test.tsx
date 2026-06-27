import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CarteraAging } from "./CarteraAging";
import { makeFakeAgingBucket } from "../application/__tests__/fakeCarteraPort";
import { AGING_BUCKET_ORDER } from "./lib/carteraUx";

const buckets = [
  makeFakeAgingBucket({ bucket: "0-30", saldo: "50000.00", conteo: 20 }),
  makeFakeAgingBucket({ bucket: "31-60", saldo: "20000.00", conteo: 8 }),
  makeFakeAgingBucket({ bucket: "90+", saldo: "5000.00", conteo: 3 }),
];

describe("CarteraAging", () => {
  it("renders a legend entry per present bucket", () => {
    render(<CarteraAging buckets={buckets} />);
    expect(screen.getByText("0-30")).toBeInTheDocument();
    expect(screen.getByText("31-60")).toBeInTheDocument();
    expect(screen.getByText("90+")).toBeInTheDocument();
    // 61-90 has no data → no legend entry.
    expect(screen.queryByText("61-90")).not.toBeInTheDocument();
  });

  it("shows an empty state when there are no buckets", () => {
    render(<CarteraAging buckets={[]} />);
    expect(screen.getByText(/sin datos/i)).toBeInTheDocument();
  });

  it("shows a loading skeleton instead of 'Sin datos' while fetching", () => {
    render(<CarteraAging buckets={[]} isLoading={true} />);
    expect(screen.queryByText(/sin datos/i)).not.toBeInTheDocument();
  });

  it("renders all four aging bucket labels when all buckets are present", () => {
    const allBuckets = AGING_BUCKET_ORDER.map((bucket, i) =>
      makeFakeAgingBucket({ bucket, saldo: String((i + 1) * 10000), conteo: i + 1 }),
    );
    render(<CarteraAging buckets={allBuckets} />);
    for (const label of AGING_BUCKET_ORDER) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });
});
