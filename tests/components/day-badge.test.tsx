import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import DayBadge, { DAY_LABELS, DAY_NAMES } from "@/components/DayBadge";

describe("DayBadge", () => {
  it("renders the correct single-letter label for each day", () => {
    const expected = ["S", "M", "T", "W", "T", "F", "S"];
    expected.forEach((letter, index) => {
      const { unmount } = render(<DayBadge day={index} active={false} />);
      expect(screen.getByText(letter)).toBeInTheDocument();
      unmount();
    });
  });

  it("shows full day name as tooltip via title attribute", () => {
    render(<DayBadge day={1} active={true} />);
    expect(screen.getByTitle("Monday")).toBeInTheDocument();
  });

  it("shows full day name as aria-label for accessibility", () => {
    render(<DayBadge day={3} active={true} />);
    expect(screen.getByLabelText("Wednesday")).toBeInTheDocument();
  });

  it("applies active styling when active is true", () => {
    render(<DayBadge day={0} active={true} />);
    const badge = screen.getByLabelText("Sunday");
    expect(badge.className).toContain("bg-violet-100");
    expect(badge.className).toContain("text-violet-600");
  });

  it("applies inactive styling when active is false", () => {
    render(<DayBadge day={0} active={false} />);
    const badge = screen.getByLabelText("Sunday");
    expect(badge.className).toContain("bg-slate-50");
    expect(badge.className).toContain("text-slate-300");
  });

  it("applies muted styling when active and muted", () => {
    render(<DayBadge day={2} active={true} muted={true} />);
    const badge = screen.getByLabelText("Tuesday");
    expect(badge.className).toContain("bg-violet-50");
    expect(badge.className).toContain("text-violet-500");
  });

  it("ignores muted when inactive", () => {
    render(<DayBadge day={4} active={false} muted={true} />);
    const badge = screen.getByLabelText("Thursday");
    expect(badge.className).toContain("bg-slate-50");
    expect(badge.className).toContain("text-slate-300");
  });

  it("exports DAY_LABELS and DAY_NAMES constants", () => {
    expect(DAY_LABELS).toEqual(["S", "M", "T", "W", "T", "F", "S"]);
    expect(DAY_NAMES).toEqual([
      "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
    ]);
  });
});
