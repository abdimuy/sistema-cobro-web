import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { FailedIntentsTable } from "./FailedIntentsTable";
import { makeFakeIntent } from "../application/__tests__/fakeRepoPort";
import { IntentStatus } from "../domain/values";

describe("FailedIntentsTable", () => {
  it("renders one row per item with kind badge JSON / Multipart", () => {
    const items = [
      makeFakeIntent({ id: "a", hasBlob: false }),
      makeFakeIntent({ id: "b", hasBlob: true }),
    ];
    render(
      <FailedIntentsTable
        items={items}
        selectedId={null}
        isLoading={false}
        hasMore={false}
        onSelect={() => {}}
        onLoadMore={() => {}}
      />,
    );
    expect(screen.getByTestId("failed-intent-row-a")).toBeInTheDocument();
    expect(screen.getByTestId("failed-intent-row-b")).toBeInTheDocument();
    expect(screen.getByText("JSON")).toBeInTheDocument();
    expect(screen.getByText("Multipart")).toBeInTheDocument();
  });

  it("calls onSelect when a row is clicked", () => {
    const intent = makeFakeIntent({ id: "abc" });
    const onSelect = vi.fn();
    render(
      <FailedIntentsTable
        items={[intent]}
        selectedId={null}
        isLoading={false}
        hasMore={false}
        onSelect={onSelect}
        onLoadMore={() => {}}
      />,
    );
    fireEvent.click(screen.getByTestId("failed-intent-row-abc"));
    expect(onSelect).toHaveBeenCalledWith(intent);
  });

  it("highlights the selected row via data-selected", () => {
    const items = [makeFakeIntent({ id: "a" }), makeFakeIntent({ id: "b" })];
    render(
      <FailedIntentsTable
        items={items}
        selectedId="b"
        isLoading={false}
        hasMore={false}
        onSelect={() => {}}
        onLoadMore={() => {}}
      />,
    );
    expect(
      screen.getByTestId("failed-intent-row-b").getAttribute("data-selected"),
    ).toBe("true");
    expect(
      screen.getByTestId("failed-intent-row-a").getAttribute("data-selected"),
    ).toBe("false");
  });

  it("renders a pulsing dot only for `new` status rows", () => {
    const items = [
      makeFakeIntent({
        id: "new",
        status: IntentStatus.create("new") as IntentStatus,
      }),
      makeFakeIntent({
        id: "ignored",
        status: IntentStatus.create("ignored") as IntentStatus,
      }),
    ];
    render(
      <FailedIntentsTable
        items={items}
        selectedId={null}
        isLoading={false}
        hasMore={false}
        onSelect={() => {}}
        onLoadMore={() => {}}
      />,
    );
    const pulses = screen.getAllByTestId("status-pulse");
    expect(pulses).toHaveLength(1);
  });

  it("shows an empty state when items=[] and not loading", () => {
    render(
      <FailedIntentsTable
        items={[]}
        selectedId={null}
        isLoading={false}
        hasMore={false}
        onSelect={() => {}}
        onLoadMore={() => {}}
      />,
    );
    expect(screen.getByText(/sin intentos/i)).toBeInTheDocument();
  });

  it("renders Cargar más when hasMore=true", () => {
    const onLoadMore = vi.fn();
    render(
      <FailedIntentsTable
        items={[makeFakeIntent()]}
        selectedId={null}
        isLoading={false}
        hasMore={true}
        onSelect={() => {}}
        onLoadMore={onLoadMore}
      />,
    );
    fireEvent.click(screen.getByText(/cargar más/i));
    expect(onLoadMore).toHaveBeenCalled();
  });
});
