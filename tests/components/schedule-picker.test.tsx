import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import SchedulePicker, { TIMEZONES, getLocalTimezone } from "@/components/SchedulePicker";
import type { Schedule } from "@/types";

function makeSchedule(overrides: Partial<Schedule> = {}): Schedule {
  return {
    days: [1, 3, 5],
    hour: 9,
    minute: 30,
    period: "AM",
    timezone: "America/New_York",
    ...overrides,
  };
}

describe("SchedulePicker", () => {
  it("renders seven day buttons", () => {
    const onChange = vi.fn();
    render(<SchedulePicker schedule={makeSchedule()} onChange={onChange} />);

    const dayButtons = screen.getAllByRole("button", { pressed: undefined });
    // 7 day buttons + 1 AM/PM toggle = 8 buttons total
    expect(dayButtons.length).toBeGreaterThanOrEqual(7);
  });

  it("shows active state for selected days", () => {
    const onChange = vi.fn();
    render(<SchedulePicker schedule={makeSchedule({ days: [0, 6] })} onChange={onChange} />);

    const sunday = screen.getByRole("button", { name: "Sunday" });
    const saturday = screen.getByRole("button", { name: "Saturday" });
    expect(sunday).toHaveAttribute("aria-pressed", "true");
    expect(saturday).toHaveAttribute("aria-pressed", "true");

    const monday = screen.getByRole("button", { name: "Monday" });
    expect(monday).toHaveAttribute("aria-pressed", "false");
  });

  it("toggles a day on click", () => {
    const onChange = vi.fn();
    render(<SchedulePicker schedule={makeSchedule({ days: [1] })} onChange={onChange} />);

    // Add Wednesday (index 3)
    fireEvent.click(screen.getByRole("button", { name: "Wednesday" }));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ days: [1, 3] })
    );
  });

  it("removes a day on click if already selected", () => {
    const onChange = vi.fn();
    render(<SchedulePicker schedule={makeSchedule({ days: [1, 3, 5] })} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Monday" }));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ days: [3, 5] })
    );
  });

  it("renders hour and minute inputs with current values", () => {
    const onChange = vi.fn();
    render(<SchedulePicker schedule={makeSchedule({ hour: 10, minute: 5 })} onChange={onChange} />);

    const hourInput = screen.getByRole("spinbutton", { name: "Hour" });
    const minuteInput = screen.getByRole("spinbutton", { name: "Minute" });
    expect(hourInput).toHaveValue(10);
    expect(minuteInput).toHaveValue(5);
  });

  it("calls onChange when hour changes", () => {
    const onChange = vi.fn();
    render(<SchedulePicker schedule={makeSchedule({ hour: 9 })} onChange={onChange} />);

    const hourInput = screen.getByRole("spinbutton", { name: "Hour" });
    fireEvent.change(hourInput, { target: { value: "11" } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ hour: 11 })
    );
  });

  it("calls onChange when minute changes", () => {
    const onChange = vi.fn();
    render(<SchedulePicker schedule={makeSchedule({ minute: 30 })} onChange={onChange} />);

    const minuteInput = screen.getByRole("spinbutton", { name: "Minute" });
    fireEvent.change(minuteInput, { target: { value: "45" } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ minute: 45 })
    );
  });

  it("toggles AM/PM on click", () => {
    const onChange = vi.fn();
    render(<SchedulePicker schedule={makeSchedule({ period: "AM" })} onChange={onChange} />);

    const toggle = screen.getByText("AM");
    fireEvent.click(toggle);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ period: "PM" })
    );
  });

  it("renders timezone dropdown with current value", () => {
    const onChange = vi.fn();
    render(
      <SchedulePicker
        schedule={makeSchedule({ timezone: "Asia/Tokyo" })}
        onChange={onChange}
      />
    );

    const select = screen.getByRole("combobox", { name: "Timezone" });
    expect(select).toHaveValue("Asia/Tokyo");
  });

  it("calls onChange when timezone changes", () => {
    const onChange = vi.fn();
    render(<SchedulePicker schedule={makeSchedule()} onChange={onChange} />);

    const select = screen.getByRole("combobox", { name: "Timezone" });
    fireEvent.change(select, { target: { value: "Europe/London" } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ timezone: "Europe/London" })
    );
  });

  it("exports TIMEZONES list with common IANA timezones", () => {
    expect(TIMEZONES).toContain("UTC");
    expect(TIMEZONES).toContain("America/New_York");
    expect(TIMEZONES).toContain("Asia/Tokyo");
    expect(TIMEZONES.length).toBeGreaterThan(10);
  });

  it("getLocalTimezone returns a timezone from the list", () => {
    const tz = getLocalTimezone();
    expect(TIMEZONES).toContain(tz);
  });
});
