"use client";

import { Badge } from "@/components/ui/badge";
import { Translate } from "@/components/ui/translate";
import React, { useEffect, useState } from "react";

interface ReferenceOption {
  value: string;
  label: string;
  color?: string;
  icon?: string;
}

interface ReferenceSelectProps {
  category: string;
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  allowEmpty?: boolean;
  className?: string;
}

export function ReferenceSelect({
  category,
  value,
  onValueChange,
  placeholder = "Sélectionner...",
  disabled = false,
  allowEmpty = true,
  className = "",
}: ReferenceSelectProps) {
  const [options, setOptions] = useState<ReferenceOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOptions();
  }, [category]);

  const loadOptions = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/reference-data?category=${category}`
      );
      if (response.ok) {
        const data = await response.json();
        const formattedOptions = data.map((item: any) => ({
          value: item.key,
          label: item.label,
          color: item.color,
          icon: item.icon,
        }));
        setOptions(formattedOptions);
      }
    } catch (error) {
      console.error(
        `Erreur lors du chargement des options ${category}:`,
        error
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedOption = options.find((opt) => opt.value === value);

  if (loading) {
    return (
      <select
        disabled
        className={`w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white ${className}`}
      >
        <option>Chargement…</option>
      </select>
    );
  }

  return (
    <div className="relative">
      <select
        value={value || ""}
        onChange={(e) => onValueChange(e.target.value)}
        disabled={disabled}
        className={`w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 ${className}`}
      >
        {allowEmpty && (
          <option value="">
            <Translate>{placeholder}</Translate>
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            <Translate>{option.label}</Translate>
          </option>
        ))}
      </select>

      {/* Affichage de la couleur si sélectionnée */}
      {selectedOption?.color && (
        <div
          className="absolute right-8 top-1/2 transform -translate-y-1/2 w-4 h-4 rounded border"
          style={{ backgroundColor: selectedOption.color }}
        />
      )}
    </div>
  );
}

interface ReferenceMultiSelectProps {
  category: string;
  values: string[];
  onValuesChange: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function ReferenceMultiSelect({
  category,
  values,
  onValuesChange,
  placeholder = "Ajouter un tag...",
  disabled = false,
  className = "",
}: ReferenceMultiSelectProps) {
  const [options, setOptions] = useState<ReferenceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [newValue, setNewValue] = useState("");

  useEffect(() => {
    loadOptions();
  }, [category]);

  const loadOptions = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/reference-data?category=${category}`
      );
      if (response.ok) {
        const data = await response.json();
        const formattedOptions = data.map((item: any) => ({
          value: item.key,
          label: item.label,
          color: item.color,
          icon: item.icon,
        }));
        setOptions(formattedOptions);
      }
    } catch (error) {
      console.error(
        `Erreur lors du chargement des options ${category}:`,
        error
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddValue = (value: string) => {
    if (value && !values.includes(value)) {
      onValuesChange([...values, value]);
      setNewValue("");
    }
  };

  const handleRemoveValue = (valueToRemove: string) => {
    onValuesChange(values.filter((v) => v !== valueToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddValue(newValue);
    }
  };

  const getOptionByValue = (value: string) =>
    options.find((opt) => opt.value === value);

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Tags sélectionnés */}
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.map((value) => {
            const option = getOptionByValue(value);
            return (
              <Badge
                key={value}
                variant="secondary"
                style={
                  option?.color
                    ? { backgroundColor: option.color, color: "white" }
                    : undefined
                }
                className="flex items-center gap-1 cursor-pointer hover:opacity-80"
                onClick={() => handleRemoveValue(value)}
              >
                <Translate>{option?.label || value}</Translate>
                <span className="ml-1 text-xs">×</span>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Sélecteur */}
      <div className="flex gap-2">
        <select
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          disabled={disabled || loading}
          className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500"
        >
          <option value="">
            {loading ? "Chargement…" : <Translate>{placeholder}</Translate>}
          </option>
          {options
            .filter((option) => !values.includes(option.value))
            .map((option) => (
              <option key={option.value} value={option.value}>
                <Translate>{option.label}</Translate>
              </option>
            ))}
        </select>
        <button
          type="button"
          onClick={() => handleAddValue(newValue)}
          disabled={!newValue || disabled}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
}
