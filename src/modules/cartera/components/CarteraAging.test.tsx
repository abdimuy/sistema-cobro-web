import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CarteraAging } from "./CarteraAging";
import { makeFakeAgingBucket } from "../application/__tests__/fakeCarteraPort";

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
});
