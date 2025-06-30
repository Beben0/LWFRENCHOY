import InviteManager from "@/components/admin/invite-manager";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminInvitesPage() {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">
          Gestion des Invitations
        </h1>
        <p className="text-gray-400">
          Créer et gérer les invitations pour nouveaux membres
        </p>
      </div>

      <InviteManager />
    </div>
  );
}
