import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

describe("zero-cost billing and marketplace response boundary", () => {
  test("live Paddle checkout is always paused", () => {
    const code = readFileSync("app/api/payments/paddle/config/route.ts", "utf8");
    const guard = code.indexOf('environment() !== "sandbox"');
    expect(guard).toBeGreaterThan(-1);
    expect(code).toContain('DADYOOM_SANDBOX_CHECKOUT_ENABLED !== "true"');
    expect(code).toContain('error: "PAYMENTS_PAUSED"');
    expect(guard).toBeLessThan(code.indexOf("const supabase = await createClient()", code.indexOf("export async function POST()")));
  });

  test("pricing cannot start a new checkout but preserves management for existing subscribers", () => {
    const code = readFileSync("components/billing/PricingClient.tsx", "utf8");
    expect(code).not.toContain("<CheckoutButtons");
    expect(code).toContain("<PaddleManageSubscription");
    expect(code).toContain("لا يوجد شراء أو اشتراك مدفوع حاليًا");
  });

  test("marketplace course creation replies after persistence, not synchronous revalidations", () => {
    const code = readFileSync("features/marketplace/actions.ts", "utf8");
    const block = code.split("export async function createMarketplaceCourse")[1].split("export async function addMarketplaceLesson")[0];
    expect(block).toContain('await db');
    expect(block).toContain('after(() => {');
    expect(block.indexOf('after(() => {')).toBeGreaterThan(block.indexOf('.insert({'));
    expect(block).toContain('revalidatePath("/marketplace")');
  });
});
