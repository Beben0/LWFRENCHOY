import { auth } from "@/lib/auth";
import { getRedirectUrl } from "@/lib/redirect-utils";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  // Utiliser la logique de redirection basée sur le rôle
  const redirectUrl = getRedirectUrl(session);
  redirect(redirectUrl);
}
