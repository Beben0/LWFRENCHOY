import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";
import { getUserPermissionsAsync } from "./permissions";
import { prisma } from "./prisma";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const { email, password } = loginSchema.parse(credentials);

          // Rechercher l'utilisateur dans la base de données
          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user) {
            console.log("User not found:", email);
            throw new Error("Invalid credentials");
          }

          // Vérifier le mot de passe
          const isValidPassword = await bcrypt.compare(password, user.password);

          if (!isValidPassword) {
            console.log("Invalid password for user:", email);
            throw new Error("Invalid credentials");
          }

          console.log("User authenticated successfully:", email);
          return {
            id: user.id,
            email: user.email,
            pseudo: user.pseudo ?? undefined,
            role: user.role,
            allianceRole: user.allianceRole ?? undefined,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.pseudo = user.pseudo;
        token.allianceRole = user.allianceRole;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.pseudo = token.pseudo as string;
        session.user.allianceRole = token.allianceRole as string;

        // Récupérer les informations du membre si le pseudo existe
        if (session.user.pseudo) {
          try {
            const member = await prisma.member.findUnique({
              where: { pseudo: session.user.pseudo },
              select: {
                id: true,
                pseudo: true,
                allianceRole: true,
                power: true,
              },
            });

            if (member) {
              session.user.member = {
                id: member.id,
                pseudo: member.pseudo,
                allianceRole: member.allianceRole,
                power: member.power.toString(), // Convert BigInt to string
              };

              // Récupérer les permissions combinées
              const permissions = await getUserPermissionsAsync(session);
              session.user.permissions = permissions;
            }
          } catch (error) {
            console.error("Error loading member data in session:", error);
          }
        }
      }
      return session;
    },
  },
  trustHost: true,
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
});
