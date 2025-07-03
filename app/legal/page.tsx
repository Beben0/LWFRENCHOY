"use client";

import Link from "next/link";

export default function LegalPage() {
  return (
    <div className="prose dark:prose-invert max-w-2xl mx-auto">
      <h1>Mentions légales</h1>
      <p>
        Ce site est un outil communautaire destiné à la gestion de l'alliance
        Frenchoy sur le jeu <em>Last War: Survival</em>.
      </p>
      <h2>Éditeur</h2>
      <p>
        Webmaster : <strong>#1584 Beben0</strong> (
        <Link href="mailto:beben0@example.com">beben0@example.com</Link>)
      </p>
      <h2>Données collectées</h2>
      <p>
        Les informations enregistrées se limitent aux pseudonymes et adresses
        e-mail fournies lors de l'inscription, ainsi qu'aux statistiques de jeu
        nécessaires au fonctionnement de l'outil (trains, VS, Desert Storm…).
      </p>
      <p>
        Ces données ne sont utilisées qu'à des fins de gestion interne et ne
        sont en aucun cas partagées avec des tiers.
      </p>
      <h2>Droits d'accès et de suppression</h2>
      <p>
        Conformément au RGPD, vous pouvez demander la consultation, la
        rectification ou la suppression de vos données en contactant le
        webmaster à l'adresse ci-dessus.
      </p>
      <h2>Hébergement</h2>
      <p>Hébergé sur un serveur personnel (Freebox Delta) à Paris, France.</p>
      <p>
        <Link href="/">← Retour à l'accueil</Link>
      </p>
    </div>
  );
}
