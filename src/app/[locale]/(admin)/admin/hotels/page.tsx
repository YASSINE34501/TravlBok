import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ApprovalActions } from "@/components/admin/approval-actions";
import {
  approveHotelAction,
  rejectHotelAction,
  requestHotelChangesAction,
  suspendHotelAction,
  publishHotelAction,
  unpublishHotelAction,
} from "@/domains/admin/actions";

export default async function AdminHotelsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const hotels = await prisma.hotel.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { organization: true, city: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Hotels</h1>

      <div className="space-y-3">
        {hotels.map((hotel) => (
          <Card key={hotel.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
              <div>
                <p className="font-medium">{hotel.name}</p>
                <p className="text-sm text-muted-foreground">
                  {hotel.organization.displayName}
                </p>
              </div>
              <Badge variant="secondary">{hotel.status}</Badge>
              <ApprovalActions
                status={hotel.status}
                onApprove={approveHotelAction.bind(null, locale, hotel.id)}
                onReject={rejectHotelAction.bind(null, locale, hotel.id)}
                onRequestChanges={requestHotelChangesAction.bind(null, locale, hotel.id)}
                onSuspend={suspendHotelAction.bind(null, locale, hotel.id)}
                onPublish={publishHotelAction.bind(null, locale, hotel.id)}
                onUnpublish={unpublishHotelAction.bind(null, locale, hotel.id)}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
