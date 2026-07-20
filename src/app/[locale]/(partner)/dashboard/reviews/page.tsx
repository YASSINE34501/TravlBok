import { getTranslations } from "next-intl/server";
import { getPartnerContext } from "@/lib/partner-context";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function PartnerReviewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Partner");
  const { organization } = await getPartnerContext(locale);

  const reviews = await prisma.review.findMany({
    where: {
      status: "APPROVED",
      OR: [
        { hotel: { organizationId: organization.id } },
        { vehicle: { organizationId: organization.id } },
      ],
    },
    include: {
      user: { select: { firstName: true, lastName: true } },
      hotel: { select: { name: true } },
      vehicle: { select: { brand: true, model: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("reviews")}</h1>

      {reviews.length === 0 ? (
        <p className="text-muted-foreground">{t("noReviewsYet")}</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="space-y-1 py-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">
                    {review.hotel?.name ?? `${review.vehicle?.brand} ${review.vehicle?.model}`}
                  </p>
                  <Badge variant="secondary">{"★".repeat(review.rating)}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {review.user.firstName} {review.user.lastName.charAt(0)}.
                </p>
                {review.comment && <p className="text-sm">{review.comment}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
