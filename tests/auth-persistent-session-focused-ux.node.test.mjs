import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("Direct /login and /signup visits bypass forms when there is a valid retained session", () => {
  for (const path of ["app/login/page.tsx", "app/signup/page.tsx"]) {
    const page = read(path);
    assert.match(page, /export const dynamic = "force-dynamic"/);
    assert.match(page, /await supabase\.auth\.getUser\(\)/);
    assert.match(page, /if \(!error && user\) redirect\("\/my"\)/);
    assert.match(page, /<EmailPasswordAuthForm/);
    assert.doesNotMatch(page, /getSession\(|user_metadata|localStorage|sessionStorage/);
  }
});

test("Refreshing an existing session happens on visits to page routes, not just privileged API namespaces", () => {
  const proxy = read("proxy.ts");
  assert.match(proxy, /const roles =/);
  assert.match(proxy, /authorizeSession\(supabase, roles\)/);
  assert.match(proxy, /\/api\/admin\/:path\*/);
  assert.match(proxy, /\/api\/teacher\/:path\*/);
  assert.match(proxy, /_next\/static/);
  assert.match(proxy, /_next\/image/);
  assert.match(proxy, /matcher: \[/);
  assert.match(proxy, /await supabase\.auth\.getUser\(\)/);
  assert.match(proxy, /request\.cookies\.set/);
  assert.match(proxy, /response\.cookies\.set/);
  assert.match(proxy, /private, no-store/);
  assert.doesNotMatch(proxy, /setInterval|setTimeout|persistSession:\s*false/);
  const browser = read("lib/auth/supabase-browser.ts");
  assert.match(browser, /createBrowserClient/);
  assert.doesNotMatch(browser, /persistSession:\s*false|window\.localStorage\.setItem\(.+password/);
});

test("Public entry / still sends logged-in users to their own trusted role dashboard", () => {
  const home = read("app/page.tsx");
  const my = read("app/my/page.tsx");
  assert.match(home, /supabase\.auth\.getUser\(\)/);
  assert.match(home, /redirect\(destinationForStoredRole\(profile\.role\)\)/);
  assert.match(my, /redirect\(destinationForStoredRole\(profile\.role\)\)/);
  assert.match(my, /redirect\("\/onboarding"\)/);
  assert.match(my, /redirect\("\/login"\)/);
});

test("Focused login and signup use one primary form button with visibly separated secondary routes", () => {
  const form = read("components/auth/EmailPasswordAuthForm.tsx");
  const shell = read("components/auth/AuthShell.tsx");
  assert.doesNotMatch(form, /aria-label="طرق الدخول"/);
  assert.match(form, /<button type="submit" disabled=\{busy\}/);
  assert.match(form, /border-t border-\[#e4e9df\] pt-6/);
  assert.match(form, /href=\{signup \? "\/login" : "\/signup"\}/);
  assert.match(form, /ليس لدي حساب — إنشاء حساب جديد/);
  assert.match(form, /لدي حساب بالفعل — تسجيل الدخول/);
  assert.match(form, /<GoogleAuthButton/);
  assert.match(form, /نسيت كلمة المرور/);
  assert.match(form, /space-y-7/);
  assert.doesNotMatch(form, /grid grid-cols-2 gap-2 rounded-2xl bg-\[#f0f4ee\]/);
  assert.match(shell, /max-w-xl/);
  assert.match(shell, /auth-heading/);
  assert.doesNotMatch(shell, /lg:grid-cols|عندما لا يتوفر|تجربة عربية من البداية/);
});

test("Guest home and shared navigation avoid duplicating a sign-up link beside the login button", () => {
  const home = read("app/page.tsx");
  const navbar = read("components/Navbar.tsx");
  assert.match(home, /href="\/try"/);
  assert.match(home, /href="\/signup"/);
  assert.match(home, /href="\/login"/);
  const head = home.slice(home.indexOf("<header"), home.indexOf("</header>"));
  assert.match(head, /href="\/login"/);
  assert.doesNotMatch(head, /href="\/signup"/);
  const guest = navbar.slice(navbar.indexOf("        ) : ("), navbar.lastIndexOf("        )}"));
  assert.match(guest, /href="\/login"/);
  assert.doesNotMatch(guest, /href="\/signup"/);
  assert.match(home, /mt-8 flex flex-col gap-4 sm:flex-row/);
});

test("Exit explicitly ends the session; closing a lesson or returning to the site never calls signOut", () => {
  const logout = read("components/auth/LogoutButton.tsx");
  const my = read("app/my/page.tsx");
  const home = read("app/page.tsx");
  const form = read("components/auth/EmailPasswordAuthForm.tsx");
  assert.match(logout, /supabase\.auth\.signOut\(\)/);
  assert.doesNotMatch(my, /signOut/);
  assert.doesNotMatch(home, /signOut/);
  assert.doesNotMatch(form, /signOut/);
});

test("Compact mobile navigation keeps two high-value links and accessible More for others", () => {
  const navbar = read("components/Navbar.tsx");
  assert.match(navbar, /aria-label="تنقل مختصر"/);
  assert.match(navbar, /mobilePrimary\.map\(item =>/);
  assert.match(navbar, /<details/);
  assert.match(navbar, /<summary/);
  assert.match(navbar, /mobileMore\.map\(item =>/);
  assert.match(navbar, /aria-label="التنقل الرئيسي"/);
  assert.match(navbar, /lg:hidden/);
  assert.match(navbar, /lg:flex/);
  assert.match(navbar, /role === "teacher" \|\| role === "school"/);
  assert.match(navbar, /\["\/courses", "\/ask"\]/);
  assert.match(navbar, /\["\/courses", "\/journey"\]/);
  assert.match(navbar, /\["\/courses", "\/skills"\]/);
  assert.match(navbar, /\{user && <NotificationBell \/>\}/);
});
