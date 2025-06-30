"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, Users } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { redirect, useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface VSWeek {
  id: string;
  weekNumber: number;
  year: number;
  startDate: string;
  endDate: string;
  title?: string;
  enemyName?: string;
  status: string;
  result?: string;
}

interface DayResult {
  dayNumber: number;
  date: string;
  mvpPoints: number;
  kills: number;
  deaths: number;
  powerGain: string;
  powerLoss: string;
  attacks: number;
  defenses: number;
  participated: boolean;
  notes?: string;
}

interface Participation {
  id: string;
  memberPseudo: string;
  week: VSWeek;
  dailyResults: DayResult[];
}

export default function MemberVSHistoryPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const memberId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<Participation[]>([]);
  const [pseudo, setPseudo] = useState<string>("");

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      redirect("/auth/signin");
      return;
    }
    loadHistory();
  }, [session, status]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/vs/member/${memberId}/history`);
      const data = await res.json();
      setHistory(data);
      if (data.length > 0) setPseudo(data[0].memberPseudo);
    } catch (e) {
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p>Chargement de l'historique...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <Link
          href="/admin/vs/history"
          className="text-blue-400 flex items-center gap-1 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Retour à l'historique VS
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Historique VS de <span className="text-yellow-400">{pseudo}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 && (
            <div className="text-center text-gray-400">
              Aucune participation VS trouvée.
            </div>
          )}
          {history.map((part) => (
            <div key={part.id} className="mb-8 border-b border-gray-700 pb-6">
              <div className="flex items-center gap-4 mb-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="font-semibold">
                  {part.week.title || `Semaine ${part.week.weekNumber}`} (
                  {part.week.year} - S{part.week.weekNumber})
                </span>
                <span className="ml-2 text-gray-400">
                  VS {part.week.enemyName}
                </span>
                <span className="ml-2 text-xs px-2 py-1 rounded-full bg-gray-700 text-white">
                  {part.week.status}
                </span>
                {part.week.result && (
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      part.week.result === "VICTORY"
                        ? "bg-green-600"
                        : part.week.result === "DEFEAT"
                        ? "bg-red-600"
                        : "bg-yellow-600"
                    } text-white`}
                  >
                    {part.week.result === "VICTORY"
                      ? "Victoire"
                      : part.week.result === "DEFEAT"
                      ? "Défaite"
                      : "Égalité"}
                  </span>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="p-2">Jour</th>
                      <th className="p-2">Date</th>
                      <th className="p-2">Points</th>
                      <th className="p-2">Kills</th>
                      <th className="p-2">Morts</th>
                      <th className="p-2">Gain Puissance</th>
                      <th className="p-2">Perte Puissance</th>
                      <th className="p-2">Attaques</th>
                      <th className="p-2">Défenses</th>
                      <th className="p-2">Présent</th>
                      <th className="p-2">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {part.dailyResults.map((day) => (
                      <tr
                        key={day.dayNumber}
                        className="border-b border-gray-800"
                      >
                        <td className="p-2 text-center">{day.dayNumber}</td>
                        <td className="p-2 text-center">
                          {new Date(day.date).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="p-2 text-center text-yellow-400 font-bold">
                          {day.mvpPoints}
                        </td>
                        <td className="p-2 text-center">{day.kills}</td>
                        <td className="p-2 text-center">{day.deaths}</td>
                        <td className="p-2 text-center">
                          {Number(day.powerGain).toLocaleString()}
                        </td>
                        <td className="p-2 text-center">
                          {Number(day.powerLoss).toLocaleString()}
                        </td>
                        <td className="p-2 text-center">{day.attacks}</td>
                        <td className="p-2 text-center">{day.defenses}</td>
                        <td className="p-2 text-center">
                          {day.participated ? "✅" : ""}
                        </td>
                        <td className="p-2">{day.notes || ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
