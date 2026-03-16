import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import RunHistoryEntry from "@/components/RunHistoryEntry";
import type { RunEntry } from "@/types";

const successRun: RunEntry = {
  id: 1,
  status: "success",
  timestamp: "2024-06-15T14:30:00Z",
  output: "Script completed successfully.\nAll tasks done.",
  trigger: "schedule",
};

const failureRun: RunEntry = {
  id: 2,
  status: "failure",
  timestamp: "2024-06-15T16:00:00Z",
  output: "Error: timeout after 30s",
  trigger: "workflow_dispatch",
};

describe("RunHistoryEntry", () => {
  it("renders the status badge for a successful run", () => {
    render(<RunHistoryEntry run={successRun} />);
    expect(screen.getByText("Success")).toBeInTheDocument();
  });

  it("renders the status badge for a failed run", () => {
    render(<RunHistoryEntry run={failureRun} />);
    expect(screen.getByText("Failure")).toBeInTheDocument();
  });

  it("applies green styling for success badge", () => {
    render(<RunHistoryEntry run={successRun} />);
    const badge = screen.getByText("Success");
    expect(badge.className).toContain("text-emerald-600");
  });

  it("applies red styling for failure badge", () => {
    render(<RunHistoryEntry run={failureRun} />);
    const badge = screen.getByText("Failure");
    expect(badge.className).toContain("text-red-600");
  });

  it("renders the formatted timestamp", () => {
    render(<RunHistoryEntry run={successRun} />);
    // The exact format depends on locale, but the date parts should be present
    const timeEl = screen.getByText(/Jun/);
    expect(timeEl).toBeInTheDocument();
  });

  it("shows 'Scheduled' for schedule trigger", () => {
    render(<RunHistoryEntry run={successRun} />);
    expect(screen.getByText("Scheduled")).toBeInTheDocument();
  });

  it("shows 'Manual' for workflow_dispatch trigger", () => {
    render(<RunHistoryEntry run={failureRun} />);
    expect(screen.getByText("Manual")).toBeInTheDocument();
  });

  it("does not show output by default", () => {
    render(<RunHistoryEntry run={successRun} />);
    expect(screen.queryByText(/Script completed/)).not.toBeInTheDocument();
  });

  it("expands output on click", () => {
    render(<RunHistoryEntry run={successRun} />);
    const toggle = screen.getByRole("button");
    fireEvent.click(toggle);
    expect(screen.getByText(/Script completed/)).toBeInTheDocument();
  });

  it("collapses output on second click", () => {
    render(<RunHistoryEntry run={successRun} />);
    const toggle = screen.getByRole("button");
    fireEvent.click(toggle);
    expect(screen.getByText(/Script completed/)).toBeInTheDocument();
    fireEvent.click(toggle);
    expect(screen.queryByText(/Script completed/)).not.toBeInTheDocument();
  });

  it("sets aria-expanded correctly", () => {
    render(<RunHistoryEntry run={successRun} />);
    const toggle = screen.getByRole("button");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });
});
