import { Info } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Alert, AlertDescription } from "@/components/ui/alert";

/** The honest "recently found / cached, confirm on partner site" disclosure — reused on every Flights content page (destination, route, deals, airline, offer detail) so the wording can't drift between them. */
export async function CachedPriceNotice({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "Flights" });
  return (
    <Alert>
      <Info />
      <AlertDescription>{t("staleNotice")}</AlertDescription>
    </Alert>
  );
}
