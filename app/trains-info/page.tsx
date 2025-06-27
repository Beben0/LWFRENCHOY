import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Clock, Crown, Train, Users } from "lucide-react";

export default function TrainsInfoPage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Système de Trains - Guide Complet
        </h1>
        <p className="text-muted-foreground">
          Comprendre le fonctionnement des trains dans Last War
        </p>
      </div>

      <div className="space-y-6">
        {/* Principe de base */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Train className="w-5 h-5 text-blue-600" />
              Principe de Base
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm leading-relaxed">
                Le système de trains fonctionne avec{" "}
                <strong>un conducteur par jour</strong> qui spécifie un créneau
                de départ. Le train part ensuite <strong>4 heures après</strong>{" "}
                ce créneau, laissant aux autres membres le temps de s'inscrire
                comme passagers.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded border-l-4 border-blue-500">
                <h4 className="font-semibold text-blue-800 mb-1">Exemple</h4>
                <p className="text-sm text-blue-700">
                  Conducteur spécifie <strong>20:00</strong>
                  <br />→ Train part à <strong>00:00</strong>
                  <br />→ 4h d'inscription : 20:00 → 00:00
                </p>
              </div>
              <div className="bg-white p-3 rounded border-l-4 border-green-500">
                <h4 className="font-semibold text-green-800 mb-1">Avantage</h4>
                <p className="text-sm text-green-700">
                  Coordination simple avec un seul départ par jour
                  <br />
                  Temps suffisant pour organiser l'équipe
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rôles */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-500" />
                Conducteur
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Badge
                  variant="outline"
                  className="bg-yellow-50 text-yellow-700 border-yellow-300"
                >
                  Un par jour maximum
                </Badge>
                <p className="text-sm">Le conducteur est responsable de :</p>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• Choisir le créneau de départ</li>
                  <li>• Coordonner l'équipe</li>
                  <li>• Diriger les opérations</li>
                </ul>
              </div>

              <div className="bg-muted p-3 rounded">
                <p className="text-xs text-muted-foreground">
                  <strong>Note :</strong> Seuls les admins peuvent assigner des
                  conducteurs
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                Passagers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-300"
                >
                  Illimité (dans la limite de places)
                </Badge>
                <p className="text-sm">Les passagers peuvent :</p>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• S'inscrire pendant les 4h</li>
                  <li>• Se désinscrire si nécessaire</li>
                  <li>• Voir les autres participants</li>
                </ul>
              </div>

              <div className="bg-muted p-3 rounded">
                <p className="text-xs text-muted-foreground">
                  <strong>Astuce :</strong> Inscrivez-vous tôt pour sécuriser
                  votre place
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Planning type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-500" />
              Créneaux et Horaires
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Créneaux disponibles</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="font-medium">08:00</span>
                    <span className="text-sm text-muted-foreground">
                      → Départ 12:00
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="font-medium">12:00</span>
                    <span className="text-sm text-muted-foreground">
                      → Départ 16:00
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="font-medium">16:00</span>
                    <span className="text-sm text-muted-foreground">
                      → Départ 20:00
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="font-medium">20:00</span>
                    <span className="text-sm text-muted-foreground">
                      → Départ 00:00
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Timeline d'un train</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-sm">Annonce du créneau</p>
                      <p className="text-xs text-muted-foreground">
                        Le conducteur choisit l'heure
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-sm">
                        Période d'inscription
                      </p>
                      <p className="text-xs text-muted-foreground">
                        4h pour s'inscrire comme passager
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-sm">Départ du train</p>
                      <p className="text-xs text-muted-foreground">
                        Fermeture des inscriptions
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Règles importantes */}
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              Règles Importantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-orange-800">Restrictions</h4>
                <ul className="text-sm text-orange-700 space-y-1">
                  <li>• Un seul train par jour maximum</li>
                  <li>• Un seul conducteur par train</li>
                  <li>• Inscription impossible après le départ</li>
                  <li>• Seuls les membres actifs peuvent participer</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-orange-800">
                  Bonnes pratiques
                </h4>
                <ul className="text-sm text-orange-700 space-y-1">
                  <li>• Annoncer le train à l'avance</li>
                  <li>• Coordonner avec l'équipe</li>
                  <li>• Respecter les horaires</li>
                  <li>• Communiquer en cas de problème</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statuts et indicateurs */}
        <Card>
          <CardHeader>
            <CardTitle>Statuts et Indicateurs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <Badge className="mb-2">Ouvert</Badge>
                <p className="text-sm">Inscriptions en cours</p>
                <p className="text-xs text-muted-foreground">
                  Temps restant affiché
                </p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Badge variant="secondary" className="mb-2">
                  Fermé
                </Badge>
                <p className="text-sm">Train parti</p>
                <p className="text-xs text-muted-foreground">
                  Plus d'inscriptions
                </p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Badge variant="outline" className="mb-2">
                  Vide
                </Badge>
                <p className="text-sm">Pas de train</p>
                <p className="text-xs text-muted-foreground">Journée libre</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
