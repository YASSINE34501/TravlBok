import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { StarRating } from "@/components/ui/star-rating";
import { ReviewModerationActions } from "@/components/admin/review-moderation-actions";

export default async function AdminReviewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Admin");

  const reviews = await prisma.review.findMany({
    where: { status: "PENDING" },
    include: {
      user: { select: { firstName: true, lastName: true } },
      hotel: { select: { name: true } },
      vehicle: { select: { brand: true, model: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("reviewsAwaitingModeration")}</h1>

      {reviews.length === 0 ? (
        <p className="text-muted-foreground">{t("nothingPending")}</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <div>
                  <p className="font-medium">
                    {review.hotel?.name ?? `${review.vehicle?.brand} ${review.vehicle?.model}`}
                  </p>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    {review.user.firstName} {review.user.lastName}
                    <StarRating rating={review.rating} size="sm" />
                  </div>
                  {review.comment && <p className="mt-1 text-sm">{review.comment}</p>}
                </div>
                <ReviewModerationActions locale={locale} reviewId={review.id} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
