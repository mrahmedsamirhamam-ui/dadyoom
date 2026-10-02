import { redirect } from "next/navigation";

export default function PayPalDisabledPage() {
  redirect("/pricing?payment=cards-only");
}
