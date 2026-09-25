import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { authorizeSession } from "@/lib/auth/authorization";
import {
  SUPABASE_PUBLIC_KEY,
  SUPABASE_PUBLIC_URL,
} from "@/lib/supabase/public-config";

type AllowedRoles =
  readonly string[];

function rolesForPath(
  pathname: string,
): AllowedRoles | undefined {
  if (
    /^\/api\/admin(?:\/|$)/u.test(
      pathname,
    ) ||
    /^\/admin(?:\/|$)/u.test(
      pathname,
    )
  ) {
    return ["admin"];
  }

  if (
    /^\/api\/teacher(?:\/|$)/u.test(
      pathname,
    ) ||
    /^\/teacher(?:\/|$)/u.test(
      pathname,
    )
  ) {
    return [
      "teacher",
      "admin",
    ];
  }

  if (
    /^\/student(?:\/|$)/u.test(
      pathname,
    )
  ) {
    return [
      "student",
      "admin",
    ];
  }

  if (
    /^\/child(?:\/|$)/u.test(
      pathname,
    )
  ) {
    return [
      "child",
      "admin",
    ];
  }

  if (
    /^\/parent(?:\/|$)/u.test(
      pathname,
    )
  ) {
    return [
      "parent",
      "admin",
    ];
  }

  if (
    /^\/school(?:\/|$)/u.test(
      pathname,
    )
  ) {
    return [
      "school",
      "admin",
    ];
  }

  return undefined;
}

function isApiPath(
  pathname: string,
) {
  return pathname.startsWith(
    "/api/",
  );
}

export async function proxy(
  request: NextRequest,
) {
  const pathname =
    request.nextUrl.pathname;

  const roles =
    rolesForPath(
      pathname,
    );

  /*
   * Keep public pages outside Supabase proxy auth on Cloudflare.
   * Only authenticated role portals and privileged role APIs pass here.
   *
   * This is intentionally narrower than a global matcher: public home,
   * login, OAuth callback, static assets and ordinary APIs must remain
   * independent from auth refresh.
   */
  if (!roles) {
    return NextResponse.next();
  }

  let response =
    NextResponse.next({
      request: {
        headers:
          request.headers,
      },
    });

  const supabase =
    createServerClient(
      SUPABASE_PUBLIC_URL,
      SUPABASE_PUBLIC_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },

          setAll(
            cookiesToSet,
            headers,
          ) {
            cookiesToSet.forEach(
              ({
                name,
                value,
              }) => {
                request.cookies.set(
                  name,
                  value,
                );
              },
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
                  options,
                );
              },
            );

            if (
              headers &&
              typeof headers ===
                "object"
            ) {
              for (
                const [
                  key,
                  value,
                ]
                of Object.entries(
                  headers,
                )
              ) {
                response.headers.set(
                  key,
                  String(value),
                );
              }
            }
          },
        },
      },
    );

  /*
   * Supabase SSR requires a single refresh point before Server Components.
   * getClaims() refreshes an expired token when needed and writes the new
   * cookies to both the request and response. This prevents parallel Server
   * Components from racing to refresh the same token (refresh-token storm).
   */
  const claims =
    await supabase.auth
      .getClaims();

  if (
    claims.error ||
    !claims.data?.claims
  ) {
    if (
      isApiPath(
        pathname,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "UNAUTHORIZED",
        },
        {
          status: 401,
          headers: {
            "Cache-Control":
              "no-store",
          },
        },
      );
    }

    const login =
      request.nextUrl.clone();

    login.pathname =
      "/login";

    login.search =
      "";

    login.searchParams.set(
      "next",
      pathname +
        request.nextUrl.search,
    );

    const redirect =
      NextResponse.redirect(
        login,
      );

    for (
      const cookie
      of response.cookies.getAll()
    ) {
      redirect.cookies.set(
        cookie,
      );
    }

    return redirect;
  }

  const access =
    await authorizeSession(
      supabase,
      roles,
    );

  if (!access.ok) {
    if (
      isApiPath(
        pathname,
      )
    ) {
      const denied =
        NextResponse.json(
          {
            error:
              access.error,
          },
          {
            status:
              access.status,
            headers: {
              "Cache-Control":
                "no-store",
            },
          },
        );

      for (
        const cookie
        of response.cookies.getAll()
      ) {
        denied.cookies.set(
          cookie,
        );
      }

      return denied;
    }

    const fallback =
      request.nextUrl.clone();

    fallback.pathname =
      "/login";

    fallback.search =
      "";

    const denied =
      NextResponse.redirect(
        fallback,
      );

    for (
      const cookie
      of response.cookies.getAll()
    ) {
      denied.cookies.set(
        cookie,
      );
    }

    return denied;
  }

  response.headers.set(
    "Cache-Control",
    "no-store",
  );

  return response;
}

export const config = {
  matcher: [
    "/student/:path*",
    "/child/:path*",
    "/teacher/:path*",
    "/parent/:path*",
    "/school/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/teacher/:path*",
  ],
};
