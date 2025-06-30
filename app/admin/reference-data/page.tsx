import { ReferenceDataManager } from "@/components/admin/reference-data-manager";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminReferenceDataPage() {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">
          Données de Référence
        </h1>
        <p className="text-gray-400">
          Gérer les catégories et éléments de référence
        </p>
      </div>

      <ReferenceDataManager />
    </div>
  );
}
