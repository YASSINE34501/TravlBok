import { getTranslations } from "next-intl/server";
import { SearchX } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default async function DashboardNotFound() {
  const t = await getTranslations("Common");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <SearchX className="size-6" />
      </span>
      <div>
        <p className="font-medium text-foreground">{t("noResults")}</p>
      </div>
      <Button render={<Link href="/dashboard" />}>{t("back")}</Button>
    </div>
  );
}
