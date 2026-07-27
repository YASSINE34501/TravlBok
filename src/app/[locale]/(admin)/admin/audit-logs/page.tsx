import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AdminAuditLogsPage() {
  const t = await getTranslations("Admin");

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { actor: { select: { firstName: true, lastName: true, email: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("auditLogs")}</h1>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("date")}</TableHead>
              <TableHead>{t("actor")}</TableHead>
              <TableHead>{t("action")}</TableHead>
              <TableHead>{t("entity")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  {log.createdAt.toLocaleString()}
                </TableCell>
                <TableCell>{log.actor?.email ?? t("system")}</TableCell>
                <TableCell>{log.action}</TableCell>
                <TableCell>
                  {log.entityType} {log.entityId ? `#${log.entityId.slice(0, 8)}` : ""}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
