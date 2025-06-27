"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Train, TrendingUp, Users } from "lucide-react";

interface TrainStats {
  totalSlots: number;
  occupiedSlots: number;
  availableSlots: number;
  coverage: number;
}

interface TrainHeaderProps {
  stats: TrainStats;
}

export function TrainHeader({ stats }: TrainHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Train className="w-8 h-8 text-lastwar-orange" />
          Planning des Trains
        </h1>
        <p className="text-muted-foreground">
          Gestion des conducteurs de trains pour votre alliance
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Créneaux Totaux
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.totalSlots}
            </div>
            <p className="text-xs text-muted-foreground">
              7 jours × 5 créneaux
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Créneaux Assignés
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {stats.occupiedSlots}
            </div>
            <p className="text-xs text-muted-foreground">
              Conducteurs assignés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Créneaux Libres
            </CardTitle>
            <Train className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-lastwar-red">
              {stats.availableSlots}
            </div>
            <p className="text-xs text-muted-foreground">
              Nécessitent un conducteur
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Couverture</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-lastwar-orange">
              {stats.coverage}%
            </div>
            <p className="text-xs text-muted-foreground">Taux de couverture</p>
          </CardContent>
        </Card>
      </div>

      {/* Coverage Progress Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Progression de la couverture
            </span>
            <span className="text-sm text-muted-foreground">
              {stats.coverage}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-gradient-to-r from-lastwar-red via-lastwar-orange to-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${stats.coverage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
