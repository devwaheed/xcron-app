import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import EmptyState from "@/components/ui/EmptyState";

describe("EmptyState", () => {
  it("renders heading and description", () => {
    render(
      <EmptyState
        illustration="no-actions"
        heading="No actions yet"
        description="Create your first action."
      />
    );
    expect(screen.getByText("No actions yet")).toBeDefined();
    expect(screen.getByText("Create your first action.")).toBeDefined();
  });

  it("renders no-actions illustration with role=img and aria-label", () => {
    const { container } = render(
      <EmptyState
        illustration="no-actions"
        heading="Test"
        description="Desc"
      />
    );
    const svg = container.querySelector('svg[role="img"]');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute("aria-label")).toBe("No actions illustration");
  });

  it("renders no-runs illustration with role=img and aria-label", () => {
    const { container } = render(
      <EmptyState
        illustration="no-runs"
        heading="Test"
        description="Desc"
      />
    );
    const svg = container.querySelector('svg[role="img"]');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute("aria-label")).toBe("No runs illustration");
  });

  it("renders action button when action prop is provided", () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        illustration="no-actions"
        heading="Test"
        description="Desc"
        action={{ label: "Create Action", onClick }}
      />
    );
    const button = screen.getByText("Create Action");
    expect(button).toBeDefined();
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not render action button when action prop is omitted", () => {
    render(
      <EmptyState
        illustration="no-actions"
        heading="Test"
        description="Desc"
      />
    );
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("SVG illustrations use currentColor for strokes", () => {
    const { container } = render(
      <EmptyState
        illustration="no-actions"
        heading="Test"
        description="Desc"
      />
    );
    const svg = container.querySelector('svg[role="img"]');
    const strokeElements = svg?.querySelectorAll('[stroke="currentColor"]');
    expect(strokeElements!.length).toBeGreaterThan(0);
  });

  it("SVG illustrations use CSS custom properties for fills", () => {
    const { container } = render(
      <EmptyState
        illustration="no-actions"
        heading="Test"
        description="Desc"
      />
    );
    const svg = container.querySelector('svg[role="img"]');
    const html = svg?.innerHTML || "";
    expect(html).toContain("var(--color-primary");
  });
});
