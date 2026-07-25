import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { MapPin, Star, BedDouble, Users } from "lucide-react";
import { getHotelById } from "@/domains/hotels/queries";
import { getDisplayCurrencyContext, formatFromBase } from "@/lib/currency/display";
import { pickLocaleText } from "@/lib/i18n/locale-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; hotelId: string }>;
}): Promise<Metadata> {
  const { locale, hotelId } = await params;
  const hotel = await getHotelById(hotelId);
  if (!hotel) return {};
  const description = pickLocaleText(hotel.description as Record<string, unknown>, locale);
  return {
    title: hotel.name,
    description: description?.slice(0, 160),
  };
}

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
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{hotel.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-muted-foreground">
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
        <div className="mt-6 grid grid-cols-4 gap-2 overflow-hidden rounded-2xl">
          <div className="relative col-span-4 aspect-[16/9] bg-muted sm:col-span-2 sm:row-span-2">
            <Image
              src={galleryImages[0].url}
              alt={hotel.name}
              fill
              priority
              sizes="(min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          {galleryImages.slice(1, 5).map((media) => (
            <div key={media.id} className="relative hidden aspect-square bg-muted sm:block">
              <Image src={media.url} alt="" fill sizes="25vw" className="object-cover" />
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
        <div className="space-y-10">
          {description && (
            <section>
              <h2 className="text-xl font-semibold tracking-tight">{t("viewDetails")}</h2>
              <p className="mt-3 whitespace-pre-line text-muted-foreground">
                {description}
              </p>
            </section>
          )}

          {hotel.amenities.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold tracking-tight">{tSearch("amenities")}</h2>
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
            <h2 className="text-xl font-semibold tracking-tight">{t("rooms")}</h2>
            <div className="mt-4 space-y-4">
              {hotel.roomTypes.map((room) => {
                const roomDescription = pickLocaleText(
                  room.description as Record<string, unknown>,
                  locale
                );
                const roomImage = room.media[0]?.url;
                return (
                  <Card
                    key={room.id}
                    className="overflow-hidden rounded-2xl py-0 sm:flex-row"
                  >
                    <div className="flex flex-col sm:flex-row">
                      {roomImage && (
                        <div className="relative h-40 w-full shrink-0 bg-muted sm:h-auto sm:w-48">
                          <Image
                            src={roomImage}
                            alt={room.name}
                            fill
                            sizes="192px"
                            className="object-cover"
                          />
                        </div>
                      )}
                      <CardContent className="flex flex-1 flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium text-foreground">{room.name}</p>
                          {roomDescription && (
                            <p className="mt-1 line-clamp-2 max-w-md text-sm text-muted-foreground">
                              {roomDescription}
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="size-3.5" />
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
                          <p className="text-lg font-semibold text-foreground">
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
                    </div>
                  </Card>
                );
              })}
              {hotel.roomTypes.length === 0 && (
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-12 text-center text-muted-foreground">
                  <BedDouble className="size-6" />
                  <p className="text-sm">{t("noResults")}</p>
                </div>
              )}
            </div>
          </section>

          {hotel.reviews.length > 0 && (
            <section>
              <Separator className="mb-8" />
              <h2 className="text-xl font-semibold tracking-tight">{tHome("reviews")}</h2>
              <div className="mt-4 space-y-5">
                {hotel.reviews.map((review) => {
                  const initials = `${review.user.firstName.charAt(0)}${review.user.lastName.charAt(0)}`.toUpperCase();
                  return (
                    <div key={review.id} className="flex gap-3 border-b pb-5 last:border-0">
                      <Avatar className="size-9 shrink-0">
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">
                            {review.user.firstName} {review.user.lastName.charAt(0)}.
                          </span>
                          <span className="flex items-center text-accent">
                            {Array.from({ length: review.rating }).map((_, i) => (
                              <Star key={i} className="size-3.5 fill-accent" />
                            ))}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {review.comment}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
