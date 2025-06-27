"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CATEGORY_LABELS,
  POPULAR_TIME_SLOTS,
  TIME_SLOTS_BY_CATEGORY,
  getTimeSlot,
  type TimeSlot,
} from "@/lib/train-config";
import { ChevronDown, ChevronUp, Clock, Star } from "lucide-react";
import { useState } from "react";

interface TimeSlotSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  showPopular?: boolean;
  compact?: boolean;
}

export function TimeSlotSelector({
  value,
  onChange,
  disabled = false,
  showPopular = true,
  compact = false,
}: TimeSlotSelectorProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["matin", "soir"]) // Catégories ouvertes par défaut
  );
  const [showAllCategories, setShowAllCategories] = useState(false);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handleTimeSlotClick = (timeSlot: TimeSlot) => {
    if (!disabled) {
      onChange(timeSlot.value);
    }
  };

  // Mode compact - select simple
  if (compact) {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:opacity-50"
      >
        <option value="">Choisir un créneau</option>
        {Object.entries(TIME_SLOTS_BY_CATEGORY).map(([category, slots]) => (
          <optgroup
            key={category}
            label={CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
          >
            {slots.map((slot) => (
              <option key={slot.value} value={slot.value}>
                {slot.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    );
  }

  // Mode étendu avec UI riche
  return (
    <div className="space-y-4">
      {/* Créneaux populaires */}
      {showPopular && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-yellow-400">
              <Star className="w-4 h-4" />
              Créneaux populaires
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {POPULAR_TIME_SLOTS.map((timeValue) => {
                const slot = getTimeSlot(timeValue);
                if (!slot) return null;

                return (
                  <Button
                    key={slot.value}
                    variant={value === slot.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTimeSlotClick(slot)}
                    disabled={disabled}
                    className={`justify-start text-left h-auto py-2 px-3 ${
                      value === slot.value
                        ? "bg-lastwar-orange text-black hover:bg-lastwar-orange/90"
                        : "bg-gray-700 border-gray-600 hover:bg-gray-600 text-white"
                    }`}
                  >
                    <div>
                      <div className="font-medium">{slot.value}</div>
                      <div className="text-xs opacity-75">
                        → {slot.realDepartureTime}
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Toutes les catégories */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2 text-white">
              <Clock className="w-4 h-4" />
              Tous les créneaux
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllCategories(!showAllCategories)}
              className="text-gray-400 hover:text-white"
            >
              {showAllCategories ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  Réduire
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  Voir tout
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(TIME_SLOTS_BY_CATEGORY).map(([category, slots]) => {
            const isExpanded = expandedCategories.has(category);
            const shouldShow = showAllCategories || isExpanded;

            return (
              <div key={category} className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleCategory(category)}
                  className="w-full justify-between text-gray-300 hover:text-white hover:bg-gray-700 p-2"
                >
                  <span className="font-medium">
                    {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {slots.length}
                    </Badge>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </Button>

                {shouldShow && (
                  <div className="grid grid-cols-1 gap-1 ml-4">
                    {slots.map((slot) => (
                      <Button
                        key={slot.value}
                        variant={value === slot.value ? "default" : "ghost"}
                        size="sm"
                        onClick={() => handleTimeSlotClick(slot)}
                        disabled={disabled}
                        className={`justify-start text-left h-auto py-2 px-3 ${
                          value === slot.value
                            ? "bg-lastwar-orange text-black hover:bg-lastwar-orange/90"
                            : "text-gray-300 hover:text-white hover:bg-gray-700"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div>
                            <span className="font-medium">{slot.value}</span>
                            <span className="text-xs ml-2 opacity-75">
                              → Départ {slot.realDepartureTime}
                            </span>
                          </div>
                          {POPULAR_TIME_SLOTS.includes(slot.value) && (
                            <Star className="w-3 h-3 text-yellow-400" />
                          )}
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
