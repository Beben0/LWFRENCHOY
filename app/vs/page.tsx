"use client";

import { PermissionGuard } from "@/components/auth/permission-guard";
import { VSPageContent } from "@/components/vs/vs-page-content";

export default function VSPage() {
  return (
    <PermissionGuard permission="view_vs">
      <VSPageContent />
    </PermissionGuard>
  );
}
