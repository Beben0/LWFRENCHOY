import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      pseudo?: string;
      role: string;
      allianceRole?: string;
      member?: {
        id: string;
        pseudo: string;
        allianceRole: string;
        power: string;
      };
      permissions?: string[];
    };
  }

  interface User {
    id: string;
    email: string;
    pseudo?: string;
    role: string;
    allianceRole?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    pseudo?: string;
    allianceRole?: string;
  }
}
