import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuthenticatedClient } from '@/lib/supabase-server';

/**
 * Validates an IANA timezone string.
 * Uses Intl.supportedValuesOf('timeZone') when available,
 * otherwise falls back to attempting Intl.DateTimeFormat construction.
 */
function isValidTimezone(tz: string): boolean {
  try {
    if (typeof Intl !== 'undefined' && 'supportedValuesOf' in Intl) {
      const supported = (Intl as unknown as { supportedValuesOf: (key: string) => string[] })
        .supportedValuesOf('timeZone');
      return supported.includes(tz);
    }
    // Fallback: try constructing a DateTimeFormat with the timezone
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * GET /api/profile
 * Returns the authenticated user's profile data including email from auth session.
 */
export async function GET() {
  let supabase;
  let userId: string;

  try {
    const cookieStore = await cookies();
    const auth = await getAuthenticatedClient(cookieStore);
    supabase = auth.supabase;
    userId = auth.userId;
  } catch {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    // Get email from auth session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch profile from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('display_name, timezone')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      email: user.email,
      displayName: profile.display_name,
      timezone: profile.timezone,
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/profile
 * Updates the authenticated user's display_name and/or timezone.
 */
export async function PUT(request: NextRequest) {
  let supabase;
  let userId: string;

  try {
    const cookieStore = await cookies();
    const auth = await getAuthenticatedClient(cookieStore);
    supabase = auth.supabase;
    userId = auth.userId;
  } catch {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { timezone, display_name } = body as {
      timezone?: string;
      display_name?: string;
    };

    // Build update object with only provided fields
    const updates: Record<string, string> = {};

    if (timezone !== undefined) {
      if (typeof timezone !== 'string' || !isValidTimezone(timezone)) {
        return NextResponse.json(
          { error: 'Invalid timezone' },
          { status: 400 }
        );
      }
      updates.timezone = timezone;
    }

    if (display_name !== undefined) {
      if (typeof display_name !== 'string' || display_name.length > 100) {
        return NextResponse.json(
          { error: 'Display name too long' },
          { status: 400 }
        );
      }
      updates.display_name = display_name;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select('display_name, timezone')
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    // Get email from auth session for consistent response shape
    const { data: { user } } = await supabase.auth.getUser();

    return NextResponse.json({
      email: user?.email,
      displayName: data.display_name,
      timezone: data.timezone,
    });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
