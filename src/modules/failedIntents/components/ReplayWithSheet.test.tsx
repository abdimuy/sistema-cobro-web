import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ReplayWithSheet } from "./ReplayWithSheet";
import { makeFakeIntent } from "../application/__tests__/fakeRepoPort";

describe("ReplayWithSheet", () => {
  it("does not render for blob intents (defensive guard)", () => {
    const intent = makeFakeIntent({ hasBlob: true });
    const { container } = render(
      <ReplayWithSheet
        intent={intent}
        open
        pending={false}
        onSubmit={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("seeds the editor with the pretty-printed original body", () => {
    const intent = makeFakeIntent({
      hasBlob: false,
      body: { cliente: "Carlos" },
    });
    render(
      <ReplayWithSheet
        intent={intent}
        open
        pending={false}
        onSubmit={() => {}}
        onCancel={() => {}}
      />,
    );
    const ta = screen.getByTestId("replay-with-textarea") as HTMLTextAreaElement;
    expect(JSON.parse(ta.value)).toEqual({ cliente: "Carlos" });
  });

  it("disables submit while the body is unchanged", () => {
    const intent = makeFakeIntent({
      hasBlob: false,
      body: { cliente: "Carlos" },
    });
    render(
      <ReplayWithSheet
        intent={intent}
        open
        pending={false}
        onSubmit={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByTestId("replay-with-submit")).toBeDisabled();
  });

  it("shows a parse error and disables submit on invalid JSON", async () => {
    const user = userEvent.setup();
    const intent = makeFakeIntent({ hasBlob: false, body: { a: 1 } });
    render(
      <ReplayWithSheet
        intent={intent}
        open
        pending={false}
        onSubmit={() => {}}
        onCancel={() => {}}
      />,
    );
    const ta = screen.getByTestId("replay-with-textarea");
    await user.clear(ta);
    await user.click(ta);
    await user.paste("{ not valid");
    expect(
      screen.getByTestId("replay-with-parse-error"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("replay-with-submit")).toBeDisabled();
  });

  it("submits the parsed body when the editor changes to valid JSON", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const intent = makeFakeIntent({
      hasBlob: false,
      body: { cliente: "Carlos" },
    });
    render(
      <ReplayWithSheet
        intent={intent}
        open
        pending={false}
        onSubmit={onSubmit}
        onCancel={() => {}}
      />,
    );
    const ta = screen.getByTestId("replay-with-textarea") as HTMLTextAreaElement;
    await user.clear(ta);
    // userEvent.type interprets `{` specially — use paste for literal text.
    await user.click(ta);
    await user.paste('{"cliente":"FIXED"}');

    const submit = screen.getByTestId("replay-with-submit");
    expect(submit).not.toBeDisabled();
    await user.click(submit);

    expect(onSubmit).toHaveBeenCalledWith({ cliente: "FIXED" });
  });
});
