"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface RegisterPageProps {
  params: Promise<{ token: string }>;
}

export default function RegisterPage({ params }: RegisterPageProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [inviteInfo, setInviteInfo] = useState<any>(null);
  const [error, setError] = useState("");
  const [token, setToken] = useState<string>("");
  const [formData, setFormData] = useState({
    email: "",
    pseudo: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const initParams = async () => {
      const resolvedParams = await params;
      setToken(resolvedParams.token);
    };
    initParams();
  }, [params]);

  useEffect(() => {
    if (token) {
      validateInvite();
    }
  }, [token]);

  const validateInvite = async () => {
    try {
      const response = await fetch(`/api/invite/${token}/validate`);

      if (response.ok) {
        const data = await response.json();
        setInviteInfo(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error);
      }
    } catch (error) {
      setError("Erreur lors de la validation du lien");
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          pseudo: formData.pseudo,
          password: formData.password,
          inviteToken: token,
        }),
      });

      if (response.ok) {
        router.push("/auth/signin?message=registered");
      } else {
        const errorData = await response.json();
        setError(errorData.error);
      }
    } catch (error) {
      setError("Erreur lors de l'inscription");
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-black to-red-900">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
              <p className="mt-4 text-sm text-muted-foreground">
                Validation du lien d'invitation...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !inviteInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-black to-red-900">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-500">
              ❌ Invitation invalide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground mb-4">{error}</p>
            <Button
              onClick={() => router.push("/auth/signin")}
              className="w-full"
              variant="outline"
            >
              Retour à la connexion
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-black to-red-900">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">🎯 Rejoindre l'Alliance</CardTitle>
          <CardDescription className="text-center">
            Créez votre compte pour accéder au centre d'information de
            l'Alliance FROY !
          </CardDescription>
          {inviteInfo && (
            <div className="text-xs text-muted-foreground text-center space-y-1">
              {inviteInfo.maxUses && (
                <p>
                  Utilisations: {inviteInfo.usedCount}/{inviteInfo.maxUses}
                </p>
              )}
              {inviteInfo.expiresAt && (
                <p>
                  Expire le:{" "}
                  {new Date(inviteInfo.expiresAt).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="votre@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Pseudo *</label>
              <input
                type="text"
                value={formData.pseudo}
                onChange={(e) =>
                  setFormData({ ...formData, pseudo: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="VotrePseudo"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Mot de passe *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Confirmer le mot de passe *
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700"
              disabled={isLoading}
            >
              {isLoading ? "Inscription..." : "Créer mon compte"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Déjà membre ?{" "}
              <button
                onClick={() => router.push("/auth/signin")}
                className="text-red-400 hover:text-red-300"
              >
                Se connecter
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
