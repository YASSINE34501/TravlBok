import { DollarSign, CalendarCheck } from "lucide-react";
import { getPartnerContext } from "@/lib/partner-context";
import { getPropertyComparison } from "@/domains/hotels/analytics";
import { formatMoney } from "@/lib/currency/format";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import { DataTableShell } from "@/components/ui/data-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@/i18n/navigation";

export default async function PropertyComparisonPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { organization } = await getPartnerContext(locale);

  const rows = await getPropertyComparison(organization.id);
  const totalRevenue = rows.reduce((sum, r) => sum + r.revenue, 0);
  const totalBookings = rows.reduce((sum, r) => sum + r.bookingCount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Property comparison"
        description={
          <>
            Central reservations and availability are already consolidated across every property
            in{" "}
            <Link href="/dashboard/bookings" className="text-primary hover:underline">
              Bookings
            </Link>{" "}
            (org-wide by design). Staff are managed centrally in{" "}
            <Link href="/dashboard/staff" className="text-primary hover:underline">
              Staff
            </Link>{" "}
            and this organization&apos;s single subscription already covers every property below
            (&quot;group subscription&quot;).
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <MetricCard
          label="Consolidated revenue"
          value={formatMoney(String(totalRevenue), organization.baseCurrency, locale)}
          icon={DollarSign}
        />
        <MetricCard label="Total bookings" value={totalBookings} icon={CalendarCheck} />
      </div>

      <DataTableShell>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead>Room types</TableHead>
              <TableHead>Bookings</TableHead>
              <TableHead>Revenue</TableHead>
              <TableHead>ADR</TableHead>
              <TableHead>Avg. rating</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.hotelId}>
                <TableCell>
                  <Link
                    href={`/dashboard/properties/${row.hotelId}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {row.name}
                  </Link>
                </TableCell>
                <TableCell>{row.roomTypeCount}</TableCell>
                <TableCell>{row.bookingCount}</TableCell>
                <TableCell>
                  {formatMoney(String(row.revenue), organization.baseCurrency, locale)}
                </TableCell>
                <TableCell>
                  {formatMoney(String(row.adr), organization.baseCurrency, locale)}
                </TableCell>
                <TableCell>
                  {row.averageRating != null ? row.averageRating.toFixed(1) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataTableShell>
    </div>
  );
}
