import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Theme } from "../../theme";
import ProgressBarDemo from "./ProgressBar.demo";
import {
  clampValue,
  formatNumber,
  formatPercent,
  loadingLabelFor,
  validMax,
} from "./format";
import { ProgressBar } from "./index";

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="progress-bar"]');
  if (!el) throw new Error("no progress bar rendered");
  return el;
}

function part(el: HTMLElement, name: string): HTMLElement | null {
  return el.querySelector<HTMLElement>(`[data-part="${name}"]`);
}

describe("ProgressBar", () => {
  it("renders a labelled progressbar with the anatomy and the default axes", () => {
    const { container } = render(
      <ProgressBar value={46} label="Uploading files" />,
    );
    const el = root(container);
    const bar = screen.getByRole("progressbar", { name: "Uploading files" });
    expect(bar).toBe(el);
    expect(el.getAttribute("data-size")).toBe("md");
    expect(el.getAttribute("data-tone")).toBe("accent");
    expect(el.getAttribute("data-state")).toBe("loading");
    expect(el.getAttribute("aria-valuenow")).toBe("46");
    expect(el.getAttribute("aria-valuemin")).toBe("0");
    expect(el.getAttribute("aria-valuemax")).toBe("100");
    expect(el.getAttribute("aria-valuetext")).toBe("46%");
    expect(part(el, "label")?.textContent).toBe("Uploading files");
    expect(part(el, "value")?.textContent).toBe("46%");
    const indicator = part(el, "indicator");
    expect(indicator?.parentElement).toBe(part(el, "track"));
    expect(indicator?.style.getPropertyValue("--_progress-bar-fraction")).toBe(
      "0.46",
    );
  });

  it("says complete at max and clamps values out of range", () => {
    const done = root(
      render(<ProgressBar value={100} label="Done" />).container,
    );
    expect(done.getAttribute("data-state")).toBe("complete");
    const over = root(
      render(<ProgressBar value={140} label="Over" />).container,
    );
    expect(over.getAttribute("aria-valuenow")).toBe("100");
    expect(over.getAttribute("data-state")).toBe("complete");
    const under = root(
      render(<ProgressBar value={-5} label="Under" />).container,
    );
    expect(under.getAttribute("aria-valuenow")).toBe("0");
    expect(
      part(under, "indicator")?.style.getPropertyValue(
        "--_progress-bar-fraction",
      ),
    ).toBe("0");
  });

  it("is indeterminate without a value and says Loading", () => {
    const el = root(render(<ProgressBar label="Preparing export" />).container);
    expect(el.getAttribute("data-state")).toBe("indeterminate");
    expect(el.hasAttribute("aria-valuenow")).toBe(false);
    expect(el.getAttribute("aria-valuetext")).toBe("Loading");
    expect(part(el, "value")?.textContent).toBe("Loading");
    expect(part(el, "indicator")?.getAttribute("data-state")).toBe(
      "indeterminate",
    );
  });

  it("formats in Arabic with Western digits and Arabic loading words", () => {
    const { container } = render(
      <Theme lang="ar">
        <ProgressBar value={46} label="رفع الملفات" />
        <ProgressBar label="مزامنة" />
      </Theme>,
    );
    const [determinate, busy] = Array.from(
      container.querySelectorAll<HTMLElement>('[data-ds="progress-bar"]'),
    );
    expect(part(determinate!, "value")?.textContent).toMatch(/46/);
    expect(part(determinate!, "value")?.textContent).not.toMatch(/[٠-٩]/);
    expect(busy!.getAttribute("aria-valuetext")).toBe("جار التحميل");
  });

  it("takes a custom max, value text, size, tone and loading label", () => {
    const el = root(
      render(
        <ProgressBar
          value={3}
          max={10}
          valueText={(v, m) => `${v} of ${m} files`}
          label="Copying"
          size="lg"
          tone="danger"
        />,
      ).container,
    );
    expect(el.getAttribute("aria-valuemax")).toBe("10");
    expect(el.getAttribute("aria-valuetext")).toBe("3 of 10 files");
    expect(part(el, "value")?.textContent).toBe("3 of 10 files");
    expect(el.getAttribute("data-size")).toBe("lg");
    expect(el.getAttribute("data-tone")).toBe("danger");
    const busy = root(
      render(<ProgressBar label="Busy" loadingLabel="Preparing" />).container,
    );
    expect(busy.getAttribute("aria-valuetext")).toBe("Preparing");
  });

  it("hides the value on request and uses aria-label without a visible label", () => {
    const el = root(
      render(
        <ProgressBar
          value={60}
          aria-label="Import progress"
          showValue={false}
        />,
      ).container,
    );
    expect(part(el, "value")).toBeNull();
    expect(part(el, "label")).toBeNull();
    expect(el.hasAttribute("aria-labelledby")).toBe(false);
    expect(screen.getByRole("progressbar", { name: "Import progress" })).toBe(
      el,
    );
  });

  it("passes the ref and other props to the root", () => {
    const ref = createRef<HTMLDivElement>();
    const el = root(
      render(
        <ProgressBar
          ref={ref}
          value={1}
          label="x"
          className="c"
          data-testid="p"
        />,
      ).container,
    );
    expect(ref.current).toBe(el);
    expect(el.className).toBe("c");
    expect(el.getAttribute("data-testid")).toBe("p");
  });

  it("renders every demo case, with Arabic in the variants case", () => {
    const { container } = render(<ProgressBarDemo />);
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

describe("progress format helpers", () => {
  it("formats percents and numbers with Western digits", () => {
    expect(formatPercent(0.456, "en")).toBe("45%");
    expect(formatPercent(0.996, "en")).toBe("99%");
    expect(formatPercent(0.29, "en")).toBe("29%");
    expect(formatPercent(0.456, "ar")).not.toMatch(/[٠-٩]/);
    expect(formatNumber(1234.5, "en")).toBe("1,234.5");
    expect(formatNumber(1234.5, "ar")).not.toMatch(/[٠-٩]/);
    expect(formatPercent(0.5, "not a tag !")).toBe("50%");
  });

  it("clamps, validates max and picks the loading words", () => {
    expect(clampValue(undefined, 0, 10)).toBeNull();
    expect(clampValue(Number.NaN, 0, 10)).toBeNull();
    expect(clampValue(12, 0, 10)).toBe(10);
    expect(clampValue(-1, 0, 10)).toBe(0);
    expect(validMax(0, 0, 100)).toBe(100);
    expect(validMax(Number.POSITIVE_INFINITY, 0, 100)).toBe(100);
    expect(validMax(5, 0, 100)).toBe(5);
    expect(loadingLabelFor("ar-SA")).toBe("جار التحميل");
    expect(loadingLabelFor("en")).toBe("Loading");
  });
});
