import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { authorizeSession } from "@/lib/auth/authorization";
import {
  SUPABASE_PUBLIC_KEY,
  SUPABASE_PUBLIC_URL,
} from "@/lib/supabase/public-config";

export async function proxy(request: NextRequest) {
  const pathname =
    request.nextUrl.pathname;

  const roles = /^\/api\/admin(?:\/|$)/u.test(pathname)
    ? ["admin"]
    : /^\/api\/teacher(?:\/|$)/u.test(pathname)
      ? ["teacher", "admin"]
      : undefined;

  // Cloudflare/Vinext: only privileged API namespaces need proxy auth.
  // Public pages and ordinary APIs must not depend on Supabase runtime env
  // before the actual route/page executes.
  if (!roles) {
    return NextResponse.next();
  }

  const supabaseUrl = SUPABASE_PUBLIC_URL;
  const supabaseAnonKey = SUPABASE_PUBLIC_KEY;

  let response =
    NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

  const supabase =
    createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },

          setAll(cookiesToSet) {
            cookiesToSet.forEach(
              ({
                name,
                value,
              }) => {
                request.cookies.set(
                  name,
                  value
                );
              }
            );

            response =
              NextResponse.next({
                request: {
                  headers:
                    request.headers,
                },
              });

            cookiesToSet.forEach(
              ({
                name,
                value,
                options,
              }) => {
                response.cookies.set(
                  name,
                  value,
                  options
                );
              }
            );
          },
        },
      }
    );

  const access = await authorizeSession(supabase, roles);
  if (!access.ok) {
    const denied = NextResponse.json(
      { error: access.error },
      { status: access.status, headers: { "Cache-Control": "no-store" } },
    );
    for (const cookie of response.cookies.getAll()) {
      denied.cookies.set(cookie);
    }
    return denied;
  }

  response.headers.set("Cache-Control", "no-store");
  return response;
}

export const config = {
  matcher: [
    "/api/admin/:path*",
    "/api/teacher/:path*",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
