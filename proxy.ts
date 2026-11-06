import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { authorizeSession } from "@/lib/auth/authorization";

export async function proxy(request: NextRequest) {
  const pathname =
    request.nextUrl.pathname;

  const apiRoleRules = [
    { match: /^\/api\/admin(?:\/|$)/u, roles: ["admin"] },
    { match: /^\/api\/teacher(?:\/|$)/u, roles: ["teacher", "admin"] },
    { match: /^\/api\/school(?:\/|$)/u, roles: ["school", "admin"] },
    { match: /^\/api\/parent(?:\/|$)/u, roles: ["parent", "admin"] },
    { match: /^\/api\/student(?:\/|$)/u, roles: ["student", "child", "admin"] },
    { match: /^\/api\/child(?:\/|$)/u, roles: ["child", "admin"] },
  ] as const;
  const roles = apiRoleRules.find((rule) => rule.match.test(pathname))?.roles;

  // Gate privileged API namespaces before any handler can run.
  if (
    pathname.startsWith("/api/") && !roles
  ) {
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
    await supabase.auth.getUser();
  }

  return response;
}

export const config = {
  matcher: [
    "/api/admin/:path*",
    "/api/teacher/:path*",
    "/api/school/:path*",
    "/api/parent/:path*",
    "/api/student/:path*",
    "/api/child/:path*",
  ],
};
