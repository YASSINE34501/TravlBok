import { getPartnerContext } from "@/lib/partner-context";
import { prisma } from "@/lib/db";
import { hasFeature } from "@/domains/subscriptions/limits";
import { getChannelConnectionsForOrganization } from "@/domains/channel-manager/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ConnectChannelForm } from "@/components/partner/connect-channel-form";
import { ChannelConnectionActions } from "@/components/partner/channel-connection-actions";
import { RoomMappingForm } from "@/components/partner/room-mapping-form";
import { DeleteRoomMappingButton } from "@/components/partner/delete-room-mapping-button";
import { SimulateReservationForm } from "@/components/partner/simulate-reservation-form";
import { ResolveChannelConflictButton } from "@/components/partner/resolve-channel-conflict-button";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { CHANNEL_CONNECTION_STATUS_TONE } from "@/lib/status-tones";
import { Radio } from "lucide-react";

export default async function ChannelsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { organization } = await getPartnerContext(locale);

  const enabled = await hasFeature(organization.id, "featureChannelManager");
  if (!enabled) {
    return (
      <div className="space-y-4">
        <PageHeader title="Channel Manager" />
        <p className="text-sm text-muted-foreground">
          The Channel Manager is not included in your current subscription plan. Upgrade your plan
          to connect Booking.com, Expedia, Airbnb, and other channels.
        </p>
      </div>
    );
  }

  const [hotels, connections] = await Promise.all([
    prisma.hotel.findMany({
      where: { organizationId: organization.id, deletedAt: null },
      include: { roomTypes: { where: { isActive: true } } },
    }),
    getChannelConnectionsForOrganization(organization.id),
  ]);

  const conflicts = await prisma.channelReservationImport.findMany({
    where: { hasConflict: true, channelConnection: { organizationId: organization.id } },
    include: { reservation: true, channelConnection: { include: { hotel: true } } },
    orderBy: { importedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Channel Manager" />

      {conflicts.length > 0 && (
        <Card className="rounded-2xl border-destructive/40 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-base text-destructive">
              Conflicts needing review ({conflicts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {conflicts.map((conflict) => (
              <div
                key={conflict.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <span>
                  {conflict.channelConnection.hotel.name} · {conflict.reservation?.bookingReference} ·{" "}
                  {conflict.conflictNotes}
                </span>
                <ResolveChannelConflictButton
                  locale={locale}
                  organizationId={organization.id}
                  channelReservationImportId={conflict.id}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Connect a channel</CardTitle>
        </CardHeader>
        <CardContent>
          <ConnectChannelForm
            locale={locale}
            organizationId={organization.id}
            hotels={hotels.map((h) => ({ id: h.id, name: h.name }))}
          />
        </CardContent>
      </Card>

      <div className="space-y-4">
        {connections.map((connection) => {
          const hotel = hotels.find((h) => h.id === connection.hotelId);
          return (
            <Card key={connection.id} className="rounded-2xl">
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base">
                  {connection.hotel.name} · {connection.provider}
                </CardTitle>
                <StatusBadge tone={CHANNEL_CONNECTION_STATUS_TONE[connection.status]}>
                  {connection.status}
                </StatusBadge>
              </CardHeader>
              <CardContent className="space-y-4">
                {connection.lastErrorMessage && (
                  <p className="text-sm text-destructive">{connection.lastErrorMessage}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Last synced: {connection.lastSyncedAt?.toLocaleString() ?? "never"} ·{" "}
                  {connection._count.syncJobs} sync job(s) · {connection._count.reservationImports}{" "}
                  imported reservation(s)
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  render={<Link href={`/dashboard/channels/${connection.id}/sync-jobs`} />}
                >
                  View sync history
                </Button>

                <ChannelConnectionActions
                  locale={locale}
                  organizationId={organization.id}
                  connectionId={connection.id}
                  autoSyncEnabled={connection.autoSyncEnabled}
                />

                <div>
                  <h3 className="text-sm font-semibold">Room mapping</h3>
                  <div className="mt-2 space-y-1">
                    {connection.roomMappings.map((mapping) => (
                      <div
                        key={mapping.id}
                        className="flex items-center justify-between rounded border px-2 py-1 text-sm"
                      >
                        <span>
                          {mapping.roomType.name} → {mapping.externalRoomId}
                          {mapping.externalRatePlanId ? ` (${mapping.externalRatePlanId})` : ""}
                        </span>
                        <DeleteRoomMappingButton
                          locale={locale}
                          organizationId={organization.id}
                          mappingId={mapping.id}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-2">
                    <RoomMappingForm
                      locale={locale}
                      organizationId={organization.id}
                      channelConnectionId={connection.id}
                      roomTypes={(hotel?.roomTypes ?? []).map((rt) => ({ id: rt.id, name: rt.name }))}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold">Simulate incoming reservation</h3>
                  <div className="mt-2">
                    <SimulateReservationForm
                      locale={locale}
                      organizationId={organization.id}
                      channelConnectionId={connection.id}
                      mappings={connection.roomMappings.map((m) => ({
                        externalRoomId: m.externalRoomId,
                        label: `${m.roomType.name} (${m.externalRoomId})`,
                      }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {connections.length === 0 && (
          <EmptyState icon={Radio} title="No channels connected yet" />
        )}
      </div>
    </div>
  );
}
