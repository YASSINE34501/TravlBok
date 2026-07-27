"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { connectChannelAction } from "@/domains/channel-manager/actions";
import { useRouter } from "@/i18n/navigation";
import type { ChannelProviderCode } from "@/generated/prisma/client";

type HotelOption = { id: string; name: string };

const PROVIDER_ITEMS: Record<ChannelProviderCode, string> = {
  BOOKING_COM: "Booking.com",
  EXPEDIA: "Expedia",
  AIRBNB: "Airbnb",
  AGODA: "Agoda",
  HOTELS_COM: "Hotels.com",
  VRBO: "Vrbo",
  MOCK_SANDBOX: "Sandbox (testing)",
};

export function ConnectChannelForm({
  locale,
  organizationId,
  hotels,
}: {
  locale: string;
  organizationId: string;
  hotels: HotelOption[];
}) {
  const router = useRouter();
  const t = useTranslations("Partner");
  const [hotelId, setHotelId] = useState(hotels[0]?.id ?? "");
  const [provider, setProvider] = useState<ChannelProviderCode>("MOCK_SANDBOX");
  const [externalHotelId, setExternalHotelId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!hotelId || !apiKey) return;
    setIsSubmitting(true);
    try {
      const result = await connectChannelAction(locale, organizationId, {
        hotelId,
        provider,
        externalHotelId: externalHotelId || undefined,
        credentials: { apiKey, apiSecret: apiSecret || undefined },
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(t("channelConnected"));
      setApiKey("");
      setApiSecret("");
      setExternalHotelId("");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  const hotelItems = Object.fromEntries(hotels.map((h) => [h.id, h.name]));

  return (
    <div className="space-y-3 rounded-md border p-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <Select items={hotelItems} value={hotelId} onValueChange={(v) => v && setHotelId(v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {hotels.map((hotel) => (
              <SelectItem key={hotel.id} value={hotel.id}>
                {hotel.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          items={PROVIDER_ITEMS}
          value={provider}
          onValueChange={(v) => v && setProvider(v as ChannelProviderCode)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PROVIDER_ITEMS).map(([code, label]) => (
              <SelectItem key={code} value={code}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <Input
          placeholder="External hotel/property ID"
          value={externalHotelId}
          onChange={(e) => setExternalHotelId(e.target.value)}
        />
        <Input placeholder="API key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
        <Input
          placeholder="API secret (optional)"
          type="password"
          value={apiSecret}
          onChange={(e) => setApiSecret(e.target.value)}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        No live credentials are required to test the pipeline — pick &quot;Sandbox (testing)&quot; and
        any API key value. Named channels run in the same simulated mode until real partner
        credentials are configured (none of them offer a public self-serve API).
      </p>
      <Button disabled={isSubmitting || !hotelId || !apiKey} onClick={handleSubmit}>
        Connect channel
      </Button>
    </div>
  );
}
