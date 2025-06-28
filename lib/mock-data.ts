// Mock data for FROY Frenchoy
export const mockMembers = [
  {
    id: "1",
    pseudo: "DragonSlayer",
    level: 45,
    power: BigInt(12500000),
    kills: 1250,
    specialty: "Infantry",
    allianceRole: "R5" as const,
    status: "ACTIVE" as const,
    tags: ["Leader", "Active"],
    lastActive: new Date("2024-01-20T10:00:00"),
  },
  {
    id: "2",
    pseudo: "SteelWarrior",
    level: 43,
    power: BigInt(11800000),
    kills: 1180,
    specialty: "Vehicles",
    allianceRole: "R4" as const,
    status: "ACTIVE" as const,
    tags: ["Officer", "Recruiter"],
    lastActive: new Date("2024-01-20T09:30:00"),
  },
  {
    id: "3",
    pseudo: "IronFist",
    level: 41,
    power: BigInt(10200000),
    kills: 950,
    specialty: "Infantry",
    allianceRole: "MEMBER" as const,
    status: "ACTIVE" as const,
    tags: ["Veteran"],
    lastActive: new Date("2024-01-20T08:00:00"),
  },
  {
    id: "4",
    pseudo: "ThunderStrike",
    level: 40,
    power: BigInt(9800000),
    kills: 890,
    specialty: "Air Force",
    allianceRole: "MEMBER" as const,
    status: "ACTIVE" as const,
    tags: ["Pilot"],
    lastActive: new Date("2024-01-20T07:15:00"),
  },
  {
    id: "5",
    pseudo: "ShadowHunter",
    level: 38,
    power: BigInt(8500000),
    kills: 780,
    specialty: "Navy",
    allianceRole: "MEMBER" as const,
    status: "INACTIVE" as const,
    tags: ["Scout"],
    lastActive: new Date("2024-01-18T20:00:00"),
  },
];

export const mockEvents = [
  {
    id: "1",
    title: "Guerre Alliance vs RedStorm",
    description: "Bataille décisive pour le contrôle du secteur 7",
    type: "ALLIANCE_WAR" as const,
    startDate: new Date("2024-01-22T20:00:00"),
    endDate: new Date("2024-01-22T22:00:00"),
  },
  {
    id: "2",
    title: "Boss Fight - Titan Mécanique",
    description: "Boss niveau 50 - Récompenses rares",
    type: "BOSS_FIGHT" as const,
    startDate: new Date("2024-01-21T19:00:00"),
    endDate: new Date("2024-01-21T19:30:00"),
  },
];

export const mockTrainSlots = [
  {
    id: "1",
    day: "MONDAY" as const,
    departureTime: "12:00" as const, // 08:00 + 4h
    conductorId: null,
    conductor: null,
    passengers: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    day: "MONDAY" as const,
    departureTime: "00:00" as const, // 20:00 + 4h
    conductorId: "1",
    conductor: {
      id: "1",
      pseudo: "DragonSlayer",
      level: 45,
      specialty: "Infantry",
      allianceRole: "R5" as const,
    },
    passengers: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    day: "TUESDAY" as const,
    departureTime: "16:00" as const, // 12:00 + 4h
    conductorId: null,
    conductor: null,
    passengers: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const mockUser = {
  id: "admin",
  email: "admin@beben0.com",
  role: "ADMIN" as const,
  password: "$2a$10$hash", // admin123 hashed
};

// Grouped export for easier import
export const mockData = {
  members: mockMembers,
  events: mockEvents,
  trainSlots: mockTrainSlots,
  user: mockUser,
};
