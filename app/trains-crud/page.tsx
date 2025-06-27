import { TrainsWithCrud } from "@/components/trains/trains-with-crud";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function TrainsCrudPage() {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  return <TrainsWithCrud />;
}
