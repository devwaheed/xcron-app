import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ActionCard from "@/components/ActionCard";
import type { Action } from "@/types";

const baseAction: Action = {
  id: "abc-123",
  name: "Daily Scraper",
  scriptContent: "console.log('hello');",
  schedule: {
    days: [1, 3, 5],
    hour: 9,
    minute: 30,
    period: "AM",
    timezone: "America/New_York",
  },
  status: "active",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

const pausedAction: Action = {
  ...baseAction,
  id: "def-456",
  name: "Paused Job",
  status: "paused",
};

describe("ActionCard", () => {
  const noop = vi.fn();

  it("renders the action name", () => {
    render(
      <ActionCard action={baseAction} onToggle={noop} onTrigger={noop} onDelete={noop} />
    );
    expect(screen.getByText("Daily Scraper")).toBeInTheDocument();
  });

  it("renders time display", () => {
    render(
      <ActionCard action={baseAction} onToggle={noop} onTrigger={noop} onDelete={noop} />
    );
    expect(screen.getByText("9:30 AM New York")).toBeInTheDocument();
  });

  it("renders day badges for all 7 days", () => {
    render(
      <ActionCard action={baseAction} onToggle={noop} onTrigger={noop} onDelete={noop} />
    );
    // 7 day badges total (S, M, T, W, T, F, S)
    const badges = screen.getAllByLabelText(/day$/i);
    expect(badges).toHaveLength(7);
  });

  it("shows Active badge for active actions", () => {
    render(
      <ActionCard action={baseAction} onToggle={noop} onTrigger={noop} onDelete={noop} />
    );
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.queryByText("Paused")).not.toBeInTheDocument();
  });

  it("shows Paused badge and muted styling for paused actions", () => {
    const { container } = render(
      <ActionCard action={pausedAction} onToggle={noop} onTrigger={noop} onDelete={noop} />
    );
    expect(screen.getByText("Paused")).toBeInTheDocument();
    expect(screen.queryByText("Active")).not.toBeInTheDocument();
    // The GlassCard wrapper should have opacity-60 class
    const card = container.firstElementChild;
    expect(card?.className).toContain("opacity-60");
  });

  it("shows Pause button for active actions", () => {
    render(
      <ActionCard action={baseAction} onToggle={noop} onTrigger={noop} onDelete={noop} />
    );
    expect(screen.getByText("Pause")).toBeInTheDocument();
  });

  it("shows Resume button for paused actions", () => {
    render(
      <ActionCard action={pausedAction} onToggle={noop} onTrigger={noop} onDelete={noop} />
    );
    expect(screen.getByText("Resume")).toBeInTheDocument();
  });

  it("calls onToggle when toggle button is clicked", () => {
    const onToggle = vi.fn();
    render(
      <ActionCard action={baseAction} onToggle={onToggle} onTrigger={noop} onDelete={noop} />
    );
    fireEvent.click(screen.getByText("Pause"));
    expect(onToggle).toHaveBeenCalledWith("abc-123");
  });

  it("renders Run Now button and calls onTrigger", () => {
    const onTrigger = vi.fn();
    render(
      <ActionCard action={baseAction} onToggle={noop} onTrigger={onTrigger} onDelete={noop} />
    );
    fireEvent.click(screen.getByText("Run Now"));
    expect(onTrigger).toHaveBeenCalledWith("abc-123");
  });

  it("renders Edit link pointing to the correct route", () => {
    render(
      <ActionCard action={baseAction} onToggle={noop} onTrigger={noop} onDelete={noop} />
    );
    const editLink = screen.getByRole("link", { name: "Edit action" });
    expect(editLink).toHaveAttribute("href", "/dashboard/abc-123/edit");
  });

  it("calls onDelete immediately on single click", () => {
    const onDelete = vi.fn();
    render(
      <ActionCard action={baseAction} onToggle={noop} onTrigger={noop} onDelete={onDelete} />
    );
    fireEvent.click(screen.getByLabelText("Delete action"));
    expect(onDelete).toHaveBeenCalledWith("abc-123");
  });

  it("has a tooltip with full schedule details on day badges container", () => {
    render(
      <ActionCard action={baseAction} onToggle={noop} onTrigger={noop} onDelete={noop} />
    );
    const dayContainer = screen.getByTitle(
      "Monday, Wednesday, Friday at 9:30 AM (America/New_York)"
    );
    expect(dayContainer).toBeInTheDocument();
  });
});
