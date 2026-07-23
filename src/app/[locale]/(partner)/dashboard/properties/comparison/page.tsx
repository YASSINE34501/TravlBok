import { getPartnerContext } from "@/lib/partner-context";
import { getPropertyComparison } from "@/domains/hotels/analytics";
import { formatMoney } from "@/lib/currency/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <h1 className="text-2xl font-semibold">Property comparison</h1>
      <p className="text-sm text-muted-foreground">
        Central reservations and availability are already consolidated across every property in{" "}
        <Link href="/dashboard/bookings" className="underline">
          Bookings
        </Link>{" "}
        (org-wide by design). Staff are managed centrally in{" "}
        <Link href="/dashboard/staff" className="underline">
          Staff
        </Link>{" "}
        and this organization&apos;s single subscription already covers every property below
        (&quot;group subscription&quot;).
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Consolidated revenue</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatMoney(String(totalRevenue), organization.baseCurrency, locale)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total bookings</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{totalBookings}</CardContent>
        </Card>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-3 py-2">Property</th>
              <th className="px-3 py-2">Room types</th>
              <th className="px-3 py-2">Bookings</th>
              <th className="px-3 py-2">Revenue</th>
              <th className="px-3 py-2">ADR</th>
              <th className="px-3 py-2">Avg. rating</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.hotelId} className="border-t">
                <td className="px-3 py-1.5">
                  <Link href={`/dashboard/properties/${row.hotelId}`} className="underline">
                    {row.name}
                  </Link>
                </td>
                <td className="px-3 py-1.5">{row.roomTypeCount}</td>
                <td className="px-3 py-1.5">{row.bookingCount}</td>
                <td className="px-3 py-1.5">
                  {formatMoney(String(row.revenue), organization.baseCurrency, locale)}
                </td>
                <td className="px-3 py-1.5">
                  {formatMoney(String(row.adr), organization.baseCurrency, locale)}
                </td>
                <td className="px-3 py-1.5">
                  {row.averageRating != null ? row.averageRating.toFixed(1) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
