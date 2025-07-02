import { MembersHeader } from "@/components/members/members-header";
import { MembersTable } from "@/components/members/members-table";
import { Card } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { mockData } from "@/lib/mock-data";
import { redirect } from "next/navigation";

interface SearchParams {
  search?: string;
  specialty?: string;
  status?: string;
  role?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: string;
}

interface MembersPageProps {
  searchParams: Promise<SearchParams>;
}

async function getMembers(searchParams: SearchParams) {
  const {
    search,
    specialty,
    status,
    role,
    sortBy = "power",
    sortOrder = "desc",
    page = "1",
  } = searchParams;

  const pageNumber = parseInt(page) || 1;
  const pageSize = 20;
  const skip = (pageNumber - 1) * pageSize;

  // Try to use Prisma if available, fallback to mock data
  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();

    const where: any = {};

    // Filtres
    if (search) {
      where.pseudo = {
        contains: search,
        mode: "insensitive",
      };
    }

    if (specialty) {
      where.specialty = specialty;
    }

    if (status) {
      where.status = status;
    }

    if (role) {
      where.allianceRole = role;
    }

    // Tri
    const orderBy: any = {};
    if (sortBy === "power") {
      orderBy.power = sortOrder;
    } else if (sortBy === "level") {
      orderBy.level = sortOrder;
    } else if (sortBy === "kills") {
      orderBy.kills = sortOrder;
    } else if (sortBy === "lastActive") {
      orderBy.lastActive = sortOrder;
    } else {
      orderBy.pseudo = sortOrder;
    }

    const [members, totalCount] = await Promise.all([
      prisma.member.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
      }),
      prisma.member.count({ where }),
    ]);

    await prisma.$disconnect();

    return {
      members,
      totalCount,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalCount / pageSize),
    };
  } catch (error) {
    console.log(
      "Prisma not available, using mock data:",
      error instanceof Error ? error.message : String(error)
    );

    // Fallback to mock data with client-side filtering
    let { members } = mockData;

    // Apply filters
    if (search) {
      members = members.filter((m) =>
        m.pseudo.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (specialty) {
      members = members.filter((m) => m.specialty === specialty);
    }

    if (status) {
      members = members.filter((m) => m.status === status);
    }

    if (role) {
      members = members.filter((m) => m.allianceRole === role);
    }

    // Apply sorting
    members.sort((a, b) => {
      let aValue, bValue;

      if (sortBy === "power") {
        aValue = Number(a.power);
        bValue = Number(b.power);
      } else if (sortBy === "level") {
        aValue = a.level;
        bValue = b.level;
      } else if (sortBy === "kills") {
        aValue = a.kills;
        bValue = b.kills;
      } else if (sortBy === "lastActive") {
        aValue = new Date(a.lastActive).getTime();
        bValue = new Date(b.lastActive).getTime();
      } else {
        aValue = a.pseudo;
        bValue = b.pseudo;
      }

      if (sortOrder === "desc") {
        return bValue > aValue ? 1 : -1;
      } else {
        return aValue > bValue ? 1 : -1;
      }
    });

    // Apply pagination
    const totalCount = members.length;
    const paginatedMembers = members.slice(skip, skip + pageSize);

    return {
      members: paginatedMembers,
      totalCount,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalCount / pageSize),
    };
  }
}

async function getFilterOptions() {
  // Try to use Prisma if available, fallback to mock data
  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();

    const [specialties, roles] = await Promise.all([
      prisma.member.findMany({
        select: { specialty: true },
        where: { specialty: { not: null } },
        distinct: ["specialty"],
      }),
      prisma.member.findMany({
        select: { allianceRole: true },
        distinct: ["allianceRole"],
      }),
    ]);

    await prisma.$disconnect();

    return {
      specialties: specialties.map((s) => s.specialty!).filter(Boolean),
      roles: roles.map((r) => r.allianceRole),
    };
  } catch (error) {
    console.log(
      "Prisma not available for filters, using mock data:",
      error instanceof Error ? error.message : String(error)
    );

    // Fallback to mock data
    const { members } = mockData;
    const specialties = [
      ...new Set(members.map((m) => m.specialty).filter(Boolean)),
    ];
    const roles = [...new Set(members.map((m) => m.allianceRole))];

    return {
      specialties,
      roles,
    };
  }
}

export default async function MembersPage({ searchParams }: MembersPageProps) {
  const session = await auth();

  const { hasPermissionAsync } = await import("@/lib/permissions");
  const canView = await hasPermissionAsync(session, "view_members");

  if (!canView) {
    redirect("/auth/signin");
  }

  // Temporarily allow all authenticated users to access members page
  // if (session.user.role !== "ADMIN") {
  //   redirect("/dashboard");
  // }

  const resolvedSearchParams = await searchParams;
  const [membersData, filterOptions] = await Promise.all([
    getMembers(resolvedSearchParams),
    getFilterOptions(),
  ]);

  return (
    <div className="space-y-6">
      <MembersHeader
        totalMembers={membersData.totalCount}
        filterOptions={filterOptions}
      />

      <Card>
        <MembersTable
          members={membersData.members}
          currentPage={membersData.currentPage}
          totalPages={membersData.totalPages}
          totalCount={membersData.totalCount}
        />
      </Card>
    </div>
  );
}
