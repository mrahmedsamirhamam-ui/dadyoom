import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { authorizeSession } from "@/lib/auth/authorization";
import { rolesForProtectedApiPath } from "@/lib/auth/api-role-guard.mjs";

export async function proxy(request: NextRequest) {
  const pathname =
    request.nextUrl.pathname;

  const roles = rolesForProtectedApiPath(pathname);

  // Gate privileged API namespaces before any handler can run.
  if (
    pathname.startsWith("/api/") && !roles
  ) {
    return NextResponse.next();
  }

  // CI's publicly accessible Arabic learning labs intentionally run without
  // Supabase credentials. Preserve anonymous content when env is absent while
  // failing closed for privileged APIs. With real config, existing sessions
  // still refresh through Supabase SSR as normal.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    if (roles) {
      return NextResponse.json({ error: "AUTH_UNAVAILABLE" }, {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      });
    }
    return NextResponse.next();
  }

  let response =
    NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

  const supabase =
    createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  if (roles) {
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
  } else {
    // Refresh expiring access tokens on every page visit and carry the new
    // cookies into the current server-rendered request and browser response.
    // A session is never silently created for a guest.
    await supabase.auth.getUser();
  }

  if (["/", "/login", "/signup", "/my", "/onboarding"].includes(pathname)) {
    response.headers.set("Cache-Control", "private, no-store");
  }
  return response;
}

export const config = {
  // @supabase/ssr uses request cookies + response cookies to refresh retained
  // sessions. Server Components cannot reliably persist refreshed cookies.
  // Apply this to page requests (including /, /login, /signup and /my) while
  // leaving static files and unrelated API routes alone.
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff2?|ttf|otf|txt|json|xml|webmanifest)$).*)",
    "/api/admin/:path*",
    "/api/teacher/:path*",
    "/api/parent/:path*",
    "/api/school/:path*",
    "/api/student/:path*",
    "/api/child/:path*",
  ],
};
