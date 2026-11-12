import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Theme } from "../../theme";
import ProgressCircleDemo from "./ProgressCircle.demo";
import { ProgressCircle } from "./index";

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>(
    '[data-ds="progress-circle"]',
  );
  if (!el) throw new Error("no progress circle rendered");
  return el;
}

const part = (el: HTMLElement, name: string) =>
  el.querySelector<HTMLElement>(`[data-part="${name}"]`);

describe("ProgressCircle", () => {
  it("renders a named progressbar with the anatomy and the default axes", () => {
    const el = root(
      render(<ProgressCircle value={46} label="Uploading files" />).container,
    );
    expect(screen.getByRole("progressbar", { name: "Uploading files" })).toBe(
      el,
    );
    expect(el.getAttribute("data-size")).toBe("md");
    expect(el.getAttribute("data-tone")).toBe("accent");
    expect(el.getAttribute("data-state")).toBe("loading");
    expect(el.getAttribute("aria-valuenow")).toBe("46");
    expect(el.getAttribute("aria-valuetext")).toBe("46%");
    expect(part(el, "track")).not.toBeNull();
    expect(
      part(el, "indicator")?.style.getPropertyValue(
        "--_progress-circle-fraction",
      ),
    ).toBe("0.46");
    expect(part(el, "value")?.textContent).toBe("46%");
    expect(part(el, "value")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("shows the value only at md and lg unless told otherwise", () => {
    for (const size of ["xs", "sm"] as const) {
      expect(
        part(
          root(
            render(<ProgressCircle size={size} value={5} label="x" />)
              .container,
          ),
          "value",
        ),
      ).toBeNull();
    }
    expect(
      part(
        root(
          render(<ProgressCircle size="lg" value={5} label="x" />).container,
        ),
        "value",
      ),
    ).not.toBeNull();
    expect(
      part(
        root(
          render(<ProgressCircle size="sm" value={5} label="x" showValue />)
            .container,
        ),
        "value",
      ),
    ).not.toBeNull();
    expect(
      part(
        root(
          render(
            <ProgressCircle size="md" value={5} label="x" showValue={false} />,
          ).container,
        ),
        "value",
      ),
    ).toBeNull();
  });

  it("is indeterminate without a value, says Loading, and shows no value text", () => {
    const el = root(
      render(<ProgressCircle label="Preparing export" />).container,
    );
    expect(el.getAttribute("data-state")).toBe("indeterminate");
    expect(el.getAttribute("aria-valuetext")).toBe("Loading");
    expect(part(el, "value")).toBeNull();
  });

  it("completes at max, clamps, and formats Arabic with Western digits", () => {
    expect(
      root(
        render(<ProgressCircle value={150} label="x" />).container,
      ).getAttribute("data-state"),
    ).toBe("complete");
    const { container } = render(
      <Theme lang="ar">
        <ProgressCircle value={46} label="رفع" />
        <ProgressCircle label="مزامنة" />
      </Theme>,
    );
    const [a, b] = Array.from(
      container.querySelectorAll<HTMLElement>('[data-ds="progress-circle"]'),
    );
    expect(a!.getAttribute("aria-valuetext")).not.toMatch(/[٠-٩]/);
    expect(b!.getAttribute("aria-valuetext")).toBe("جار التحميل");
  });

  it("takes size, tone, max and value text, and passes the ref and props", () => {
    const ref = createRef<HTMLDivElement>();
    const el = root(
      render(
        <ProgressCircle
          ref={ref}
          size="lg"
          tone="danger"
          value={7}
          max={12}
          valueText={(v, m) => `${v}/${m}`}
          label="Copying"
          data-testid="c"
        />,
      ).container,
    );
    expect(ref.current).toBe(el);
    expect(el.getAttribute("data-tone")).toBe("danger");
    expect(el.getAttribute("aria-valuemax")).toBe("12");
    expect(el.getAttribute("aria-valuetext")).toBe("7/12");
    expect(el.getAttribute("data-testid")).toBe("c");
  });

  it("renders every demo case, with Arabic in the variants case", () => {
    const { container } = render(<ProgressCircleDemo />);
    for (const id of [
      "variants",
      "empty",
      "one",
      "many",
      "long-text",
      "long-arabic",
      "loading",
      "error",
    ]) {
      expect(
        container.querySelector(`[data-demo-case="${id}"]`),
      ).not.toBeNull();
    }
    expect(
      container.querySelector(
        '[data-demo-case="variants"] [data-ds="theme"][lang="ar"]',
      ),
    ).not.toBeNull();
  });
});
