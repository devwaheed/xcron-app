import React from "react";

export interface IconProps {
  size?: number;
  color?: string;
  className?: string;
  accessibleLabel?: string;
}

function svgProps(props: IconProps): React.SVGProps<SVGSVGElement> {
  const size = props.size != null && props.size > 0 && !Number.isNaN(props.size) ? props.size : 20;
  const color = props.color || "currentColor";
  const base: React.SVGProps<SVGSVGElement> = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: props.className,
  };
  if (props.accessibleLabel) {
    return { ...base, role: "img", "aria-label": props.accessibleLabel };
  }
  return { ...base, "aria-hidden": true as unknown as React.AriaAttributes["aria-hidden"] };
}

export function ClockIcon(props: IconProps) {
  return React.createElement("svg", svgProps(props),
    React.createElement("circle", { cx: 12, cy: 12, r: 10 }),
    React.createElement("polyline", { points: "12 6 12 12 16 14" }),
  );
}

export function CalendarIcon(props: IconProps) {
  return React.createElement("svg", svgProps(props),
    React.createElement("rect", { x: 3, y: 4, width: 18, height: 18, rx: 2, ry: 2 }),
    React.createElement("line", { x1: 16, y1: 2, x2: 16, y2: 6 }),
    React.createElement("line", { x1: 8, y1: 2, x2: 8, y2: 6 }),
    React.createElement("line", { x1: 3, y1: 10, x2: 21, y2: 10 }),
  );
}

export function PlayIcon(props: IconProps) {
  return React.createElement("svg", svgProps(props),
    React.createElement("polygon", { points: "5 3 19 12 5 21 5 3" }),
  );
}

export function PauseIcon(props: IconProps) {
  return React.createElement("svg", svgProps(props),
    React.createElement("rect", { x: 6, y: 4, width: 4, height: 16 }),
    React.createElement("rect", { x: 14, y: 4, width: 4, height: 16 }),
  );
}

export function BoltIcon(props: IconProps) {
  return React.createElement("svg", svgProps(props),
    React.createElement("polygon", { points: "13 2 3 14 12 14 11 22 21 10 12 10 13 2" }),
  );
}

export function CodeIcon(props: IconProps) {
  return React.createElement("svg", svgProps(props),
    React.createElement("polyline", { points: "16 18 22 12 16 6" }),
    React.createElement("polyline", { points: "8 6 2 12 8 18" }),
  );
}

export function ShieldIcon(props: IconProps) {
  return React.createElement("svg", svgProps(props),
    React.createElement("path", { d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" }),
  );
}

export function ChartIcon(props: IconProps) {
  return React.createElement("svg", svgProps(props),
    React.createElement("line", { x1: 18, y1: 20, x2: 18, y2: 10 }),
    React.createElement("line", { x1: 12, y1: 20, x2: 12, y2: 4 }),
    React.createElement("line", { x1: 6, y1: 20, x2: 6, y2: 14 }),
  );
}

export function PlusIcon(props: IconProps) {
  return React.createElement("svg", svgProps(props),
    React.createElement("line", { x1: 12, y1: 5, x2: 12, y2: 19 }),
    React.createElement("line", { x1: 5, y1: 12, x2: 19, y2: 12 }),
  );
}

export function EditIcon(props: IconProps) {
  return React.createElement("svg", svgProps(props),
    React.createElement("path", { d: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" }),
    React.createElement("path", { d: "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" }),
  );
}

export function TrashIcon(props: IconProps) {
  return React.createElement("svg", svgProps(props),
    React.createElement("polyline", { points: "3 6 5 6 21 6" }),
    React.createElement("path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" }),
  );
}

export function ChevronRightIcon(props: IconProps) {
  return React.createElement("svg", svgProps(props),
    React.createElement("polyline", { points: "9 18 15 12 9 6" }),
  );
}

export function ChevronDownIcon(props: IconProps) {
  return React.createElement("svg", svgProps(props),
    React.createElement("polyline", { points: "6 9 12 15 18 9" }),
  );
}

export function CheckIcon(props: IconProps) {
  return React.createElement("svg", svgProps(props),
    React.createElement("polyline", { points: "20 6 9 17 4 12" }),
  );
}

export function XCloseIcon(props: IconProps) {
  return React.createElement("svg", svgProps(props),
    React.createElement("line", { x1: 18, y1: 6, x2: 6, y2: 18 }),
    React.createElement("line", { x1: 6, y1: 6, x2: 18, y2: 18 }),
  );
}

export function SearchIcon(props: IconProps) {
  return React.createElement("svg", svgProps(props),
    React.createElement("circle", { cx: 11, cy: 11, r: 8 }),
    React.createElement("line", { x1: 21, y1: 21, x2: 16.65, y2: 16.65 }),
  );
}

export function CommandIcon(props: IconProps) {
  return React.createElement("svg", svgProps(props),
    React.createElement("path", { d: "M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z" }),
  );
}

export function SettingsIcon(props: IconProps) {
  return React.createElement("svg", svgProps(props),
    React.createElement("circle", { cx: 12, cy: 12, r: 3 }),
    React.createElement("path", { d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" }),
  );
}

export function SunIcon(props: IconProps) {
  return React.createElement("svg", svgProps(props),
    React.createElement("circle", { cx: 12, cy: 12, r: 5 }),
    React.createElement("line", { x1: 12, y1: 1, x2: 12, y2: 3 }),
    React.createElement("line", { x1: 12, y1: 21, x2: 12, y2: 23 }),
    React.createElement("line", { x1: 4.22, y1: 4.22, x2: 5.64, y2: 5.64 }),
    React.createElement("line", { x1: 18.36, y1: 18.36, x2: 19.78, y2: 19.78 }),
    React.createElement("line", { x1: 1, y1: 12, x2: 3, y2: 12 }),
    React.createElement("line", { x1: 21, y1: 12, x2: 23, y2: 12 }),
    React.createElement("line", { x1: 4.22, y1: 19.78, x2: 5.64, y2: 18.36 }),
    React.createElement("line", { x1: 18.36, y1: 5.64, x2: 19.78, y2: 4.22 }),
  );
}

export function MoonIcon(props: IconProps) {
  return React.createElement("svg", svgProps(props),
    React.createElement("path", { d: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" }),
  );
}

export function UploadIcon(props: IconProps) {
  return React.createElement("svg", svgProps(props),
    React.createElement("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
    React.createElement("polyline", { points: "17 8 12 3 7 8" }),
    React.createElement("line", { x1: 12, y1: 3, x2: 12, y2: 15 }),
  );
}

export function ExternalLinkIcon(props: IconProps) {
  return React.createElement("svg", svgProps(props),
    React.createElement("path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" }),
    React.createElement("polyline", { points: "15 3 21 3 21 9" }),
    React.createElement("line", { x1: 10, y1: 14, x2: 21, y2: 3 }),
  );
}

export function AlertTriangleIcon(props: IconProps) {
  return React.createElement("svg", svgProps(props),
    React.createElement("path", { d: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" }),
    React.createElement("line", { x1: 12, y1: 9, x2: 12, y2: 13 }),
    React.createElement("line", { x1: 12, y1: 17, x2: 12.01, y2: 17 }),
  );
}
