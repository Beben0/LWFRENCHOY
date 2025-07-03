"use client";

import { Button } from "@/components/ui/button";
import { Translate } from "@/components/ui/translate";
import Link from "next/link";

export default function WelcomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-8 space-y-6">
      <h1 className="text-4xl font-bold lastwar-gradient bg-clip-text text-transparent">
        <Translate>Bienvenue sur Frenchoy Alliance Manager</Translate>
      </h1>
      <p className="text-muted-foreground max-w-md">
        <Translate>
          Connectez-vous pour accéder à votre tableau de bord ou explorez les
          pages publiques.
        </Translate>
      </p>
      <div className="flex gap-4">
        <Link href="/auth/signin">
          <Button>
            <Translate>Connexion</Translate>
          </Button>
        </Link>
      </div>
    </div>
  );
}
