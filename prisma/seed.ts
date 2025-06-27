import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // 1. Créer les données de référence pour les rôles d'alliance
  const allianceRoles = [
    { key: 'R5', label: 'R5 - Leader', description: 'Leader de l\'alliance', sortOrder: 1 },
    { key: 'R4', label: 'R4 - Officier', description: 'Officier de l\'alliance', sortOrder: 2 },
    { key: 'MEMBER', label: 'Membre', description: 'Membre standard', sortOrder: 3 },
  ]

  for (const role of allianceRoles) {
    await prisma.referenceData.upsert({
      where: {
        category_key: {
          category: 'ALLIANCE_ROLE',
          key: role.key,
        },
      },
      update: {},
      create: {
        category: 'ALLIANCE_ROLE',
        key: role.key,
        label: role.label,
        description: role.description,
        sortOrder: role.sortOrder,
        isActive: true,
        isSystem: true,
      },
    })
  }

  console.log('✅ Alliance roles reference data created')

  // 2. Initialiser les permissions par défaut pour les rôles
  const { initializeDefaultPermissions } = await import('../lib/role-permissions')
  await initializeDefaultPermissions()
  console.log('✅ Default role permissions initialized')

  // 3. Créer admin par défaut
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@alliance.gg' },
    update: {},
    create: {
      email: 'admin@alliance.gg',
      pseudo: 'Admin',
      password: hashedPassword,
      role: 'ADMIN',
      allianceRole: 'R5', // Admin peut aussi avoir un rôle d'alliance
    }
  })
  
  console.log('✅ Admin user created:', admin.email)

  // 4. Créer membres de démonstration
  const demoMembers = [
    { pseudo: 'DragonSlayer', level: 45, power: 2850000n, kills: 1250, specialty: 'Sniper', allianceRole: 'R5' as const },
    { pseudo: 'IronFist', level: 42, power: 2650000n, kills: 980, specialty: 'Tank', allianceRole: 'R4' as const },
    { pseudo: 'ShadowHunter', level: 40, power: 2400000n, kills: 845, specialty: 'Sniper', allianceRole: 'MEMBER' as const },
    { pseudo: 'FireStorm', level: 38, power: 2200000n, kills: 720, specialty: 'Farmer', allianceRole: 'MEMBER' as const },
    { pseudo: 'ThunderBolt', level: 41, power: 2550000n, kills: 1100, specialty: 'Defense', allianceRole: 'MEMBER' as const },
    { pseudo: 'PhoenixRising', level: 39, power: 2300000n, kills: 650, specialty: 'Support', allianceRole: 'MEMBER' as const },
    { pseudo: 'WolfPack', level: 37, power: 2000000n, kills: 580, specialty: 'Scout', allianceRole: 'MEMBER' as const },
    { pseudo: 'StormBreaker', level: 43, power: 2700000n, kills: 1050, specialty: 'Sniper', allianceRole: 'MEMBER' as const },
    { pseudo: 'NightMare', level: 36, power: 1850000n, kills: 420, specialty: 'Rookie', allianceRole: 'MEMBER' as const },
    { pseudo: 'BladeRunner', level: 44, power: 2750000n, kills: 1180, specialty: 'Tank', allianceRole: 'MEMBER' as const },
    { pseudo: 'StarGazer', level: 35, power: 1700000n, kills: 380, specialty: 'Farmer', allianceRole: 'MEMBER' as const },
    { pseudo: 'IceQueen', level: 40, power: 2350000n, kills: 790, specialty: 'Defense', allianceRole: 'MEMBER' as const },
    { pseudo: 'RocketLauncher', level: 41, power: 2450000n, kills: 920, specialty: 'Support', allianceRole: 'MEMBER' as const },
    { pseudo: 'GhostRider', level: 38, power: 2150000n, kills: 680, specialty: 'Scout', allianceRole: 'MEMBER' as const },
    { pseudo: 'CrimsonTide', level: 39, power: 2250000n, kills: 740, specialty: 'Sniper', allianceRole: 'MEMBER' as const }
  ]

  for (const memberData of demoMembers) {
    await prisma.member.upsert({
      where: { pseudo: memberData.pseudo },
      update: {},
      create: {
        ...memberData,
        tags: memberData.specialty === 'Rookie' ? ['new', 'training'] : 
              memberData.specialty === 'Sniper' ? ['veteran', 'pvp'] : 
              ['active']
      }
    })
  }

  console.log(`✅ Created ${demoMembers.length} demo members`)

  // 5. Créer créneaux de trains pour la semaine (un seul créneau par jour)
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  const defaultTime = '20:00' // Heure par défaut

  for (const day of days) {
    await prisma.trainSlot.upsert({
      where: {
        day: day
      },
      update: {},
      create: {
        day,
        departureTime: defaultTime
      }
    })
  }

  console.log('✅ Created train slots for the week')

  // 6. Créer quelques événements de démonstration
  const events = [
    {
      title: 'Guerre d\'Alliance vs RedPhoenix',
      description: 'Guerre importante - participation obligatoire',
      type: 'ALLIANCE_WAR' as const,
      startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // dans 2 jours
      endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000) // 2h plus tard
    },
    {
      title: 'Boss d\'Alliance Level 15',
      description: 'Tous les snipers et tanks requis',
      type: 'BOSS_FIGHT' as const,
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // demain
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000) // 1h plus tard
    },
    {
      title: 'Guerre de Serveur',
      description: 'Préparation pour la guerre cross-server',
      type: 'SERVER_WAR' as const,
      startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // dans 5 jours
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 24 * 60 * 60 * 1000) // 24h plus tard
    }
  ]

  for (const eventData of events) {
    await prisma.event.create({
      data: eventData
    })
  }

  console.log('✅ Created demo events')

  // 7. Créer stats d'alliance initiales
  const totalMembers = await prisma.member.count()
  const totalPowerResult = await prisma.member.aggregate({
    _sum: {
      power: true
    }
  })

  await prisma.allianceStats.create({
    data: {
      totalMembers,
      totalPower: totalPowerResult._sum.power || 0n,
      activeMembers: totalMembers,
      date: new Date()
    }
  })

  console.log('✅ Created initial alliance stats')
  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 