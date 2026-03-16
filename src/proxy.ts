import { NextRequest, NextResponse } from "next/server";

/**
 * Next.js 16 proxy — handles network-level routing concerns.
 * Auth is handled in dashboard/layout.tsx (Server Layout Guard).
 */
export function proxy(request: NextRequest) {
  return NextResponse.next();
}
