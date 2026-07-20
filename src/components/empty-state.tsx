import { getTranslations } from "next-intl/server";
import { SearchX } from "lucide-react";

export async function EmptyState() {
  const t = await getTranslations("Common");

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-20 text-center">
      <SearchX className="size-8 text-muted-foreground" />
      <p className="text-muted-foreground">{t("noResults")}</p>
    </div>
  );
}
