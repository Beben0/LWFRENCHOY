"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Maximize2,
  Move,
  RotateCcw,
  Target,
  Users,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FixedSizeGrid as Grid } from "react-window";

interface Member {
  id: string;
  pseudo: string;
  allianceRole: string;
  isEvent?: boolean;
}

interface CellData {
  member?: Member;
  isCapitol?: boolean;
}

interface GridData {
  cells: CellData[][];
  selectedMemberId: string;
  hoverPos: { x: number; y: number } | null;
  onCellClick: (x: number, y: number, e: React.MouseEvent) => void;
  onCellHover: (x: number, y: number) => void;
  onCellLeave: () => void;
  isHoverHighlight: (x: number, y: number) => boolean;
  scale: number;
}

const html2canvasPromise = () => import("html2canvas").then((m) => m.default);

const HiveSimulatorPage = () => {
  // Constants
  const GRID_SIZE = 150;
  const BASE_SIZE = 3;
  const CAPITOL_SIZE = 30;
  const CELL_SIZE = 20;

  // State
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(
    null
  );
  const [membersLoading, setMembersLoading] = useState(true);
  const [scale, setScale] = useState(0.8);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Refs
  const gridRef = useRef<Grid>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generic safe scroll that retries until grid is ready
  const safeScrollTo = useCallback((col: number, row: number, retries = 20) => {
    const attempt = (left: number, top: number, r: number) => {
      const g: any = gridRef.current;
      if (g?.scrollToItem) {
        g.scrollToItem({ columnIndex: left, rowIndex: top, align: "center" });
      } else if (r > 0) {
        setTimeout(() => attempt(left, top, r - 1), 100);
      }
    };
    attempt(col, row, retries);
  }, []);

  // Initialize grid data
  const initializeCells = useCallback(() => {
    const center = Math.floor(GRID_SIZE / 2) - Math.floor(CAPITOL_SIZE / 2);
    console.log(
      "Initializing grid with center at:",
      center,
      "Capitol size:",
      CAPITOL_SIZE
    );

    const cells: CellData[][] = Array.from({ length: GRID_SIZE }, (_, y) =>
      Array.from({ length: GRID_SIZE }, (_, x) => ({
        isCapitol:
          x >= center &&
          x < center + CAPITOL_SIZE &&
          y >= center &&
          y < center + CAPITOL_SIZE,
      }))
    );

    console.log("Grid initialized:", {
      totalCells: GRID_SIZE * GRID_SIZE,
      capitolCells: CAPITOL_SIZE * CAPITOL_SIZE,
      centerRange: `${center} to ${center + CAPITOL_SIZE - 1}`,
      sampleCell: cells[Math.floor(GRID_SIZE / 2)][Math.floor(GRID_SIZE / 2)],
    });

    return cells;
  }, []);

  const [cells, setCells] = useState<CellData[][]>(initializeCells);

  // Load members
  useEffect(() => {
    const loadMembers = async () => {
      try {
        setMembersLoading(true);
        console.log("Loading members...");

        const res = await fetch("/api/members?limit=500");
        console.log("Response status:", res.status);

        if (res.ok) {
          const raw = await res.json();
          console.log("Raw response:", raw);

          // Handle different response formats
          let data = [];
          if (Array.isArray(raw)) {
            data = raw;
          } else if (raw.members && Array.isArray(raw.members)) {
            data = raw.members;
          } else if (raw.data && Array.isArray(raw.data)) {
            data = raw.data;
          }

          console.log("Parsed members:", data);

          const membersWithMarshal = [
            ...data,
            {
              id: "MARSHAL",
              pseudo: "Maréchal",
              allianceRole: "EVENT",
              isEvent: true,
            },
          ];

          setMembers(membersWithMarshal);
          console.log("Total members loaded:", membersWithMarshal.length);
        } else {
          console.error(
            "Failed to fetch members:",
            res.status,
            await res.text()
          );
        }
      } catch (error) {
        console.error("Error loading members:", error);
      } finally {
        setMembersLoading(false);
      }
    };
    loadMembers();
  }, []);

  // Center on capitol when grid is ready
  useEffect(() => {
    if (gridRef.current) {
      const timer = setTimeout(() => {
        const centerX = Math.floor(GRID_SIZE / 2);
        const centerY = Math.floor(GRID_SIZE / 2);
        console.log("Centering on capitol at:", centerX, centerY);
        gridRef.current?.scrollToItem({
          columnIndex: centerX,
          rowIndex: centerY,
          align: "center",
        });
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [gridRef.current, isFullscreen]);

  // Handle fullscreen escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isFullscreen]);

  // Grid operations
  const canPlace = useCallback(
    (cells: CellData[][], x0: number, y0: number) => {
      if (
        x0 + BASE_SIZE > GRID_SIZE ||
        y0 + BASE_SIZE > GRID_SIZE ||
        x0 < 0 ||
        y0 < 0
      )
        return false;

      for (let dy = 0; dy < BASE_SIZE; dy++) {
        for (let dx = 0; dx < BASE_SIZE; dx++) {
          const cell = cells[y0 + dy]?.[x0 + dx];
          if (!cell || cell.member || cell.isCapitol) return false;
        }
      }
      return true;
    },
    []
  );

  const occupy = useCallback(
    (cells: CellData[][], member: Member, x0: number, y0: number) => {
      for (let dy = 0; dy < BASE_SIZE; dy++) {
        for (let dx = 0; dx < BASE_SIZE; dx++) {
          if (cells[y0 + dy]?.[x0 + dx]) {
            cells[y0 + dy][x0 + dx].member = member;
          }
        }
      }
    },
    []
  );

  // Auto placement
  const placeAutomatically = useCallback(() => {
    const marshal = members.find((m) => m.id === "MARSHAL");
    if (!marshal) return;

    // Deep copy cells
    const newCells = cells.map((row) => row.map((c) => ({ ...c })));

    // 1️⃣ Clear existing regular members
    for (const row of newCells) {
      for (const cell of row) {
        if (cell.member && !cell.member.isEvent) cell.member = undefined;
      }
    }

    // 2️⃣ Build priority list
    const regular = members.filter((m) => !m.isEvent);
    const sortedMembers = [
      ...regular.filter((m) => m.allianceRole === "R5"),
      ...regular.filter((m) => m.allianceRole === "R4"),
      ...regular.filter((m) => !["R5", "R4"].includes(m.allianceRole)),
    ];

    // 3️⃣ Locate or place Marshal (top-left coordinate of his 3×3)
    let marshalX: number | undefined;
    let marshalY: number | undefined;

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (newCells[y][x].member?.id === "MARSHAL") {
          marshalX = x - (x % BASE_SIZE);
          marshalY = y - (y % BASE_SIZE);
          break;
        }
      }
      if (marshalX !== undefined) break;
    }

    if (marshalX === undefined || marshalY === undefined) {
      const defaultX = Math.floor(GRID_SIZE / 2) - Math.floor(BASE_SIZE / 2);
      const defaultY =
        Math.floor(GRID_SIZE / 2) -
        Math.floor(CAPITOL_SIZE / 2) -
        BASE_SIZE -
        2;
      marshalX = defaultX;
      marshalY = defaultY;
      if (!canPlace(newCells, marshalX, marshalY)) {
        console.warn("Cannot place Marshal at default position");
        return;
      }
      occupy(newCells, marshal, marshalX, marshalY);
    }

    // Helper to place a block safely
    let idx = 0;
    const tryPlace = (bx: number, by: number) => {
      if (idx >= sortedMembers.length) return;
      if (!canPlace(newCells, bx, by)) return;
      occupy(newCells, sortedMembers[idx], bx, by);
      idx++;
    };

    // 4️⃣ Ring 1 (8 neighbours)
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        tryPlace(marshalX + dx * BASE_SIZE, marshalY + dy * BASE_SIZE);
      }
    }

    // 5️⃣ Build candidate positions list sorted by distance
    const maxDist = 50;
    const candidates: { x: number; y: number; d: number }[] = [];
    for (let dx = -maxDist; dx <= maxDist; dx++) {
      for (let dy = -maxDist; dy <= maxDist; dy++) {
        if (dx === 0 && dy === 0) continue; // marshal block already occupied
        const bx = marshalX + dx * BASE_SIZE;
        const by = marshalY + dy * BASE_SIZE;
        if (canPlace(newCells, bx, by)) {
          candidates.push({ x: bx, y: by, d: Math.hypot(dx, dy) });
        }
      }
    }

    candidates.sort((a, b) => a.d - b.d);

    for (const pos of candidates) {
      if (idx >= sortedMembers.length) break;
      if (!canPlace(newCells, pos.x, pos.y)) continue;
      occupy(newCells, sortedMembers[idx], pos.x, pos.y);
      idx++;
    }

    setCells(newCells);
  }, [members, cells, canPlace, occupy]);

  // Cell click handler
  const handleCellClick = useCallback(
    (x: number, y: number, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (cells[y][x].isCapitol) return;

      const x0 = Math.floor(x / BASE_SIZE) * BASE_SIZE;
      const y0 = Math.floor(y / BASE_SIZE) * BASE_SIZE;

      // Check capitol overlap
      const overlapsCapitol = (x0: number, y0: number) => {
        for (let dy = 0; dy < BASE_SIZE; dy++) {
          for (let dx = 0; dx < BASE_SIZE; dx++) {
            if (cells[y0 + dy]?.[x0 + dx]?.isCapitol) return true;
          }
        }
        return false;
      };

      if (overlapsCapitol(x0, y0)) return;

      const newCells = cells.map((row) => row.map((c) => ({ ...c })));

      if (e.type === "contextmenu") {
        // Clear base
        for (let dy = 0; dy < BASE_SIZE; dy++) {
          for (let dx = 0; dx < BASE_SIZE; dx++) {
            if (newCells[y0 + dy]?.[x0 + dx]) {
              newCells[y0 + dy][x0 + dx].member = undefined;
            }
          }
        }
      } else if (selectedMemberId) {
        const member = members.find((m) => m.id === selectedMemberId);
        if (member) {
          // Remove from previous location
          for (const row of newCells) {
            for (const c of row) {
              if (c.member?.id === member.id) c.member = undefined;
            }
          }

          // Place at new location
          for (let dy = 0; dy < BASE_SIZE; dy++) {
            for (let dx = 0; dx < BASE_SIZE; dx++) {
              if (newCells[y0 + dy]?.[x0 + dx]) {
                newCells[y0 + dy][x0 + dx].member = member;
              }
            }
          }
        }
      }
      setCells(newCells);
    },
    [cells, members, selectedMemberId]
  );

  // Hover highlight
  const isHoverHighlight = useCallback(
    (x: number, y: number): boolean => {
      if (!hoverPos || !selectedMemberId) return false;
      const x0 = Math.floor(hoverPos.x / BASE_SIZE) * BASE_SIZE;
      const y0 = Math.floor(hoverPos.y / BASE_SIZE) * BASE_SIZE;
      return x >= x0 && x < x0 + BASE_SIZE && y >= y0 && y < y0 + BASE_SIZE;
    },
    [hoverPos, selectedMemberId]
  );

  // Available members
  const availableMembers = useMemo(() => {
    const placedIds = new Set();
    for (const row of cells) {
      for (const cell of row) {
        if (cell.member) placedIds.add(cell.member.id);
      }
    }
    // Exclure le Maréchal de la liste déroulante
    return members.filter(
      (m) => !placedIds.has(m.id) && !m.isEvent && m.id !== "MARSHAL"
    );
  }, [members, cells]);

  // Load saved layout from DB once members are available
  useEffect(() => {
    if (members.length === 0) return; // wait until members fetched
    (async () => {
      try {
        const res = await fetch("/api/hive-layout");
        if (!res.ok) return;
        const data: {
          id: string;
          memberId: string | null;
          x: number;
          y: number;
        }[] = await res.json();
        if (data.length === 0) return;
        const grid = initializeCells();
        for (const p of data) {
          const targetId = p.memberId || p.id; // support marshal row (memberId null, id="MARSHAL")
          const m = members.find((mem) => mem.id === targetId);
          if (m) occupy(grid, m, p.x, p.y);
        }
        // ensure marshal placed
        const marshal = members.find((m) => m.id === "MARSHAL");
        if (marshal) {
          let hasMarshal = false;
          for (const row of grid) {
            for (const c of row) {
              if (c.member?.id === "MARSHAL") {
                hasMarshal = true;
                break;
              }
            }
            if (hasMarshal) break;
          }
          if (!hasMarshal) {
            const defaultX =
              Math.floor(GRID_SIZE / 2) - Math.floor(BASE_SIZE / 2);
            const defaultY =
              Math.floor(GRID_SIZE / 2) -
              Math.floor(CAPITOL_SIZE / 2) -
              BASE_SIZE -
              2;
            if (canPlace(grid, defaultX, defaultY))
              occupy(grid, marshal, defaultX, defaultY);
          }
        }
        setCells(grid);
      } catch (err) {
        console.error("Load hive layout error", err);
      }
    })();
  }, [members]);

  // Reset grid
  const resetGrid = useCallback(() => {
    setCells(initializeCells());
    setSelectedMemberId("");
  }, [initializeCells]);

  // Grid item component
  const Cell = React.memo(
    ({
      columnIndex,
      rowIndex,
      style,
      data,
    }: {
      columnIndex: number;
      rowIndex: number;
      style: React.CSSProperties;
      data: GridData;
    }) => {
      const {
        cells,
        onCellClick,
        onCellHover,
        onCellLeave,
        isHoverHighlight,
        scale,
      } = data;

      // Direct calculation for safety
      const center = Math.floor(GRID_SIZE / 2) - Math.floor(CAPITOL_SIZE / 2);
      const isCapitolCell =
        columnIndex >= center &&
        columnIndex < center + CAPITOL_SIZE &&
        rowIndex >= center &&
        rowIndex < center + CAPITOL_SIZE;

      // Get cell data with fallback
      const cell = cells[rowIndex]?.[columnIndex] || {
        isCapitol: isCapitolCell,
      };

      const getBgColor = () => {
        if (cell.isCapitol || isCapitolCell) return "#dc2626"; // red-600
        if (cell.member?.isEvent) return "#9333ea"; // purple-600
        if (cell.member) return "#2563eb"; // blue-600
        if (isHoverHighlight(columnIndex, rowIndex)) return "#22c55e"; // green-500
        return "#1f2937"; // gray-800
      };

      const getBorderColor = () => {
        if (cell.isCapitol || isCapitolCell) return "#f87171"; // red-400
        if (cell.member?.isEvent) return "#a855f7"; // purple-400
        if (cell.member) return "#60a5fa"; // blue-400
        if (isHoverHighlight(columnIndex, rowIndex)) return "#4ade80"; // green-400
        return "#4b5563"; // gray-600
      };

      const showText =
        cell.member &&
        columnIndex % BASE_SIZE === 1 &&
        rowIndex % BASE_SIZE === 1;
      const fontSize = Math.max(8, CELL_SIZE * scale * 0.4);

      // Get role display info
      const getRoleInfo = (member: Member) => {
        if (member.isEvent) return { icon: "👑", color: "#9333ea" };
        if (member.allianceRole === "R5")
          return { icon: "⭐", color: "#facc15" };
        if (member.allianceRole === "R4")
          return { icon: "🛡️", color: "#fb923c" };
        return { icon: "👤", color: "#3b82f6" };
      };

      const maxChars = Math.max(2, Math.floor(scale * 10));

      return (
        <div
          style={{
            ...style,
            backgroundColor: getBgColor(),
            border: `1px solid ${getBorderColor()}`,
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontSize: `${fontSize}px`,
            fontWeight: "bold",
            color: "white",
            userSelect: "none",
            overflow: showText ? "visible" : "hidden",
            boxShadow: cell.member
              ? `inset 0 0 0 2px ${getRoleInfo(cell.member).color}55`
              : undefined,
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onCellClick(columnIndex, rowIndex, e);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onCellClick(columnIndex, rowIndex, e);
          }}
          onMouseEnter={() => onCellHover(columnIndex, rowIndex)}
          onMouseLeave={onCellLeave}
          title={
            cell.member
              ? `${cell.member.pseudo} (${cell.member.allianceRole}) - ${columnIndex},${rowIndex}`
              : `${columnIndex},${rowIndex}`
          }
        >
          {showText && cell.member && (
            <>
              <div style={{ fontSize: `${fontSize + 2}px`, lineHeight: 1 }}>
                {getRoleInfo(cell.member).icon}
              </div>
              <span
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  minWidth: `${CELL_SIZE * BASE_SIZE * scale}px`,
                  whiteSpace: "nowrap",
                  textAlign: "center",
                  fontSize: `${Math.max(6, fontSize - 2)}px`,
                  lineHeight: 1,
                  textShadow: "0 0 2px #000",
                  pointerEvents: "none",
                  zIndex: 10,
                }}
              >
                {cell.member.pseudo}
              </span>
            </>
          )}
        </div>
      );
    }
  );

  Cell.displayName = "GridCell";

  // Grid data
  const gridData: GridData = useMemo(
    () => ({
      cells,
      selectedMemberId,
      hoverPos,
      onCellClick: handleCellClick,
      onCellHover: (x, y) => setHoverPos({ x, y }),
      onCellLeave: () => setHoverPos(null),
      isHoverHighlight,
      scale,
    }),
    [
      cells,
      selectedMemberId,
      hoverPos,
      handleCellClick,
      isHoverHighlight,
      scale,
    ]
  );

  // Center on capitol
  const centerOnCapitol = useCallback(() => {
    const centerX = Math.floor(GRID_SIZE / 2);
    const centerY = Math.floor(GRID_SIZE / 2);
    safeScrollTo(centerX, centerY);
  }, [safeScrollTo]);

  // after centerOnCapitol define centerOnMarshal
  const centerOnMarshal = useCallback(() => {
    let mx: number | null = null;
    let my: number | null = null;
    outer: for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (cells[y][x].member?.id === "MARSHAL") {
          mx = x;
          my = y;
          break outer;
        }
      }
    }
    if (mx !== null && my !== null) {
      safeScrollTo(mx + 1, my + 1);
    }
  }, [cells, safeScrollTo]);

  // Export layout JSON
  const exportLayout = useCallback(() => {
    const placements: { id: string; pseudo: string; x: number; y: number }[] =
      [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const m = cells[y][x].member;
        if (m && !placements.find((p) => p.id === m.id)) {
          placements.push({ id: m.id, pseudo: m.pseudo, x, y });
        }
      }
    }
    const blob = new Blob([JSON.stringify({ placements }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hive-layout.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [cells]);

  // Screenshot
  const takeScreenshot = useCallback(async () => {
    if (!gridContainerRef.current) return;
    const html2canvas = await html2canvasPromise();
    const canvas = await html2canvas(gridContainerRef.current, {
      backgroundColor: null,
      scale: 2,
    } as any);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "hive-screenshot.png";
      a.click();
      URL.revokeObjectURL(url);
    });
  }, []);

  // after takeScreenshot add
  const saveToDB = useCallback(() => {
    const placements: any[] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const m = cells[y][x].member;
        if (
          m &&
          (!m.isEvent || m.id === "MARSHAL") &&
          !placements.find((p) => p.id === m.id)
        ) {
          placements.push({ id: m.id, x, y });
        }
      }
    }
    fetch("/api/hive-layout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placements }),
    });
  }, [cells]);

  // Zoom functions
  const zoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev * 1.2, 3));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev / 1.2, 0.2));
  }, []);

  // Stats
  const placedCount = useMemo(() => {
    const uniqueMembers = new Set();
    for (const row of cells) {
      for (const cell of row) {
        if (cell.member) {
          uniqueMembers.add(cell.member.id);
        }
      }
    }
    return uniqueMembers.size;
  }, [cells]);

  // Get grid dimensions for different modes
  const getGridDimensions = () => {
    if (isFullscreen) {
      return {
        width: typeof window !== "undefined" ? window.innerWidth : 1920,
        height: typeof window !== "undefined" ? window.innerHeight : 1080,
      };
    }
    return {
      width:
        typeof window !== "undefined"
          ? Math.min(1200, window.innerWidth - 100)
          : 1200,
      height: 700,
    };
  };

  const gridDimensions = getGridDimensions();

  // Fullscreen controls component
  const FullscreenControls = () => (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex flex-wrap gap-2">
      <Button
        onClick={() => setIsFullscreen(false)}
        variant="outline"
        size="sm"
        className="bg-black/70 text-white border-gray-600"
      >
        <X className="w-4 h-4" />
        Quitter plein écran (ESC)
      </Button>
      <Button
        onClick={centerOnCapitol}
        variant="outline"
        size="sm"
        className="bg-black/70 text-white border-gray-600"
      >
        <Target className="w-4 h-4" />
        Centrer
      </Button>
      <Button
        onClick={centerOnMarshal}
        variant="outline"
        size="sm"
        className="bg-black/70 text-white border-gray-600 flex items-center gap-1"
      >
        👑 Maréchal
      </Button>
      <Button
        onClick={() => setSelectedMemberId("MARSHAL")}
        variant="outline"
        size="sm"
        className="bg-black/70 text-white border-gray-600 flex items-center gap-1"
      >
        👑 Placer
      </Button>
      <Button
        onClick={zoomIn}
        variant="outline"
        size="sm"
        className="bg-black/70 text-white border-gray-600"
      >
        <ZoomIn className="w-4 h-4" />
      </Button>
      <Button
        onClick={zoomOut}
        variant="outline"
        size="sm"
        className="bg-black/70 text-white border-gray-600"
      >
        <ZoomOut className="w-4 h-4" />
      </Button>
      <Button
        onClick={placeAutomatically}
        variant="outline"
        size="sm"
        className="bg-black/70 text-white border-gray-600 flex items-center gap-1"
      >
        <Users className="w-4 h-4" /> Auto
      </Button>
      <Button
        onClick={resetGrid}
        variant="outline"
        size="sm"
        className="bg-black/70 text-white border-gray-600"
      >
        <RotateCcw className="w-4 h-4" />
      </Button>
      <Button
        onClick={exportLayout}
        variant="outline"
        size="sm"
        className="flex items-center gap-1"
      >
        💾 Export JSON
      </Button>
      <Button
        onClick={takeScreenshot}
        variant="outline"
        size="sm"
        className="flex items-center gap-1"
      >
        📸 Screenshot
      </Button>
      <Button
        onClick={saveToDB}
        variant="outline"
        size="sm"
        className="flex items-center gap-1"
      >
        💾 Sauvegarder
      </Button>
      <Button
        onClick={() => fileInputRef.current?.click()}
        variant="outline"
        size="sm"
        className="bg-black/70 text-white border-gray-600 flex items-center gap-1"
      >
        📂 Import
      </Button>
    </div>
  );

  // Import JSON
  const importJSON = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const json = JSON.parse(reader.result as string);
          if (!Array.isArray(json.placements)) return;
          const newCells = initializeCells();
          for (const p of json.placements) {
            const member = members.find((m) => m.id === p.id);
            if (member) {
              occupy(newCells, member, p.x, p.y);
            }
          }
          setCells(newCells);
        } catch (err) {
          alert("Fichier invalide");
        }
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    [members, initializeCells, occupy]
  );

  // Fullscreen mode
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <FullscreenControls />

        <div
          ref={gridContainerRef}
          className="w-full h-full border border-gray-600 bg-gray-900"
        >
          <Grid
            ref={gridRef}
            height={gridDimensions.height}
            width={gridDimensions.width}
            columnCount={GRID_SIZE}
            rowCount={GRID_SIZE}
            columnWidth={CELL_SIZE * scale}
            rowHeight={CELL_SIZE * scale}
            itemData={gridData}
            style={{ backgroundColor: "#111827" }}
            initialScrollLeft={
              (GRID_SIZE / 2) * CELL_SIZE * scale - gridDimensions.width / 2
            }
            initialScrollTop={
              (GRID_SIZE / 2) * CELL_SIZE * scale - gridDimensions.height / 2
            }
            overscanColumnCount={5}
            overscanRowCount={5}
          >
            {Cell}
          </Grid>
        </div>

        <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-2 rounded text-sm">
          Zoom: {Math.round(scale * 100)}% • Placés: {placedCount}/
          {members.length}
        </div>
      </div>
    );
  }

  // Normal mode
  return (
    <div className="container mx-auto px-4 py-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-8 h-8" />
            Simulateur de Ruche
            <span className="text-sm font-normal text-gray-400">
              (Virtualisé - {GRID_SIZE}×{GRID_SIZE})
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Controls */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={placeAutomatically}
              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
              disabled={membersLoading || members.length === 0}
            >
              <Users className="w-4 h-4" />
              Placement Auto (R5→R4→Autres)
            </Button>

            <Button
              onClick={() => setSelectedMemberId("MARSHAL")}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              👑 Sélection Maréchal
            </Button>

            <Button
              onClick={resetGrid}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>

            <Button onClick={zoomIn} variant="outline" size="sm">
              <ZoomIn className="w-4 h-4" />
            </Button>

            <Button onClick={zoomOut} variant="outline" size="sm">
              <ZoomOut className="w-4 h-4" />
            </Button>

            <Button onClick={centerOnCapitol} variant="outline" size="sm">
              <Target className="w-4 h-4" />
              Centrer Capitol
            </Button>

            <Button
              onClick={centerOnMarshal}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              👑 Centrer Maréchal
            </Button>

            <Button
              onClick={() => setIsFullscreen(true)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Maximize2 className="w-4 h-4" />
              Plein écran
            </Button>

            <Button
              onClick={exportLayout}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              💾 Export JSON
            </Button>

            <Button
              onClick={takeScreenshot}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              📸 Screenshot
            </Button>

            <Button
              onClick={saveToDB}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              💾 Sauvegarder
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={importJSON}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              📂 Import JSON
            </Button>
          </div>

          {/* Member Selection & Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Sélectionner un membre ({availableMembers.length} disponibles)
                {membersLoading && (
                  <span className="text-yellow-400"> - Chargement...</span>
                )}
              </label>

              {membersLoading ? (
                <div className="bg-gray-700 rounded-md px-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    Chargement des membres...
                  </div>
                </div>
              ) : (
                <select
                  className="w-full bg-gray-700 text-sm rounded-md px-3 py-2 border border-gray-600"
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                >
                  <option value="">-- Choisir un membre --</option>
                  {availableMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.pseudo} (
                      {member.isEvent ? "EVENT" : member.allianceRole})
                    </option>
                  ))}
                </select>
              )}

              {!membersLoading && members.length === 1 && (
                <div className="mt-2 text-sm text-yellow-400">
                  ⚠️ Seul le Maréchal est disponible. Vérifiez l'API
                  /api/members
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Statistiques & Contrôles
              </label>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="bg-gray-700 px-2 py-1 rounded">
                  Total: {members.length}
                </div>
                <div className="bg-gray-700 px-2 py-1 rounded">
                  Placés: {placedCount}
                </div>
                <div className="bg-gray-700 px-2 py-1 rounded">
                  Zoom: {Math.round(scale * 100)}%
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-gray-800 p-3 rounded-lg text-sm space-y-1">
            <div className="flex items-center gap-2">
              <Move className="w-4 h-4" />
              <span>
                Clic gauche: placer • Clic droit: effacer • Scroll: naviguer
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Maximize2 className="w-4 h-4" />
              <span>
                Mode plein écran disponible pour une meilleure visibilité
              </span>
            </div>
          </div>

          {/* Virtualized Grid */}
          <div
            ref={gridContainerRef}
            className="border-2 border-gray-600 bg-gray-900 rounded-lg overflow-hidden"
          >
            <Grid
              ref={gridRef}
              height={gridDimensions.height}
              width={gridDimensions.width}
              columnCount={GRID_SIZE}
              rowCount={GRID_SIZE}
              columnWidth={CELL_SIZE * scale}
              rowHeight={CELL_SIZE * scale}
              itemData={gridData}
              style={{ backgroundColor: "#111827" }}
              initialScrollLeft={(GRID_SIZE / 2) * CELL_SIZE * scale - 600}
              initialScrollTop={(GRID_SIZE / 2) * CELL_SIZE * scale - 350}
              overscanColumnCount={5}
              overscanRowCount={5}
            >
              {Cell}
            </Grid>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HiveSimulatorPage;
