import { getTranslations } from "next-intl/server";
import { Star } from "lucide-react";
import { getPartnerContext } from "@/lib/partner-context";
import { prisma } from "@/lib/db";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/ui/page-header";
import { DataTableShell } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";

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
      <PageHeader title={t("reviews")} />

      <DataTableShell>
        {reviews.length === 0 ? (
          <EmptyState icon={Star} title={t("noReviewsYet")} className="border-0 py-12" />
        ) : (
          <div className="divide-y">
            {reviews.map((review) => {
              const initials =
                `${review.user.firstName.charAt(0)}${review.user.lastName.charAt(0)}`.toUpperCase();
              return (
                <div key={review.id} className="flex gap-3 px-4 py-4 sm:px-5">
                  <Avatar className="size-9 shrink-0">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-foreground">
                        {review.hotel?.name ?? `${review.vehicle?.brand} ${review.vehicle?.model}`}
                      </p>
                      <span className="flex items-center text-accent">
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <Star key={i} className="size-3.5 fill-accent" />
                        ))}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {review.user.firstName} {review.user.lastName.charAt(0)}.
                    </p>
                    {review.comment && (
                      <p className="mt-1 text-sm text-foreground">{review.comment}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DataTableShell>
    </div>
  );
}
