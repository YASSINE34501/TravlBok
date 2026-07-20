import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { MapPin, Star } from "lucide-react";
import { getHotelById } from "@/domains/hotels/queries";
import { getDisplayCurrencyContext, formatFromBase } from "@/lib/currency/display";
import { pickLocaleText } from "@/lib/i18n/locale-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/navigation";

export default async function HotelDetailPage({
  params,
}: {
  params: Promise<{ locale: string; hotelId: string }>;
}) {
  const { locale, hotelId } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Common");
  const tSearch = await getTranslations("Search");
  const tBooking = await getTranslations("Booking");
  const tHome = await getTranslations("Home");

  const hotel = await getHotelById(hotelId);
  if (!hotel) notFound();

  const { currency, rates } = await getDisplayCurrencyContext();
  const cityName = hotel.city
    ? pickLocaleText(hotel.city.name as Record<string, unknown>, locale)
    : null;
  const description = pickLocaleText(
    hotel.description as Record<string, unknown>,
    locale
  );

  const galleryImages = hotel.media.length
    ? hotel.media
    : hotel.mainImageUrl
      ? [{ id: "main", url: hotel.mainImageUrl }]
      : [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">{hotel.name}</h1>
          <div className="mt-1 flex items-center gap-3 text-muted-foreground">
            {cityName && (
              <span className="flex items-center gap-1 text-sm">
                <MapPin className="size-4" />
                {cityName}
              </span>
            )}
            {hotel.starRating ? (
              <span className="flex items-center gap-1 text-sm">
                <Star className="size-4 fill-accent text-accent" />
                {hotel.starRating}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {galleryImages.length > 0 && (
        <div className="mt-6 grid grid-cols-4 gap-2 overflow-hidden rounded-xl">
          <div className="col-span-4 aspect-[16/9] bg-muted sm:col-span-2 sm:row-span-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={galleryImages[0].url}
              alt={hotel.name}
              className="h-full w-full object-cover"
            />
          </div>
          {galleryImages.slice(1, 5).map((media) => (
            <div key={media.id} className="hidden aspect-square bg-muted sm:block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={media.url} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          {description && (
            <section>
              <h2 className="text-xl font-semibold">{t("viewDetails")}</h2>
              <p className="mt-2 whitespace-pre-line text-muted-foreground">
                {description}
              </p>
            </section>
          )}

          {hotel.amenities.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold">{tSearch("amenities")}</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {hotel.amenities.map((amenity) => (
                  <Badge key={amenity.id} variant="secondary">
                    {pickLocaleText(amenity.name as Record<string, unknown>, locale)}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-xl font-semibold">{t("rooms")}</h2>
            <div className="mt-4 space-y-4">
              {hotel.roomTypes.map((room) => {
                const roomDescription = pickLocaleText(
                  room.description as Record<string, unknown>,
                  locale
                );
                return (
                  <Card key={room.id}>
                    <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium">{room.name}</p>
                        {roomDescription && (
                          <p className="mt-1 line-clamp-2 max-w-md text-sm text-muted-foreground">
                            {roomDescription}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>
                            {t("adults")}: {room.maxAdults}
                          </span>
                          {room.breakfastIncluded && (
                            <span>{tSearch("breakfastIncluded")}</span>
                          )}
                          {room.refundable && (
                            <span>{tSearch("freeCancellation")}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-start gap-2 sm:items-end">
                        <p className="text-lg font-semibold">
                          {formatFromBase(
                            room.basePrice.toString(),
                            room.currency,
                            currency,
                            rates,
                            locale
                          )}
                          <span className="ms-1 text-sm font-normal text-muted-foreground">
                            {t("perNight")}
                          </span>
                        </p>
                        <Button
                          render={
                            <Link
                              href={`/hotels/${hotel.id}/book?roomTypeId=${room.id}`}
                            />
                          }
                        >
                          {tBooking("confirmBooking")}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {hotel.reviews.length > 0 && (
            <section>
              <Separator className="mb-6" />
              <h2 className="text-xl font-semibold">{tHome("reviews")}</h2>
              <div className="mt-4 space-y-4">
                {hotel.reviews.map((review) => (
                  <div key={review.id} className="border-b pb-4 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {review.user.firstName} {review.user.lastName.charAt(0)}.
                      </span>
                      <span className="text-sm text-accent">
                        {"★".repeat(review.rating)}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {review.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
