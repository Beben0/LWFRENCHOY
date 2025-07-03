import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="w-full border-t border-border mt-auto py-4 text-center text-sm text-muted-foreground">
      © {year} Frenchoy Alliance Manager — Webmaster{" "}
      <span className="font-medium">#1584 Beben0</span> —{" "}
      <Link href="/legal" className="underline hover:text-primary">
        Mentions légales
      </Link>
    </footer>
  );
}
