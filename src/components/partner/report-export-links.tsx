import NextLink from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { PrintInvoiceButton } from "@/components/booking/print-invoice-button";

export async function ReportExportLinks({
  locale,
  hotelId,
  type,
}: {
  locale: string;
  hotelId: string;
  type: string;
}) {
  const t = await getTranslations("Pms");

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <Button
        variant="outline"
        render={
          <NextLink
            href={`/api/pms/reports/${type}/export?hotelId=${hotelId}&format=csv&locale=${locale}`}
          />
        }
      >
        {t("exportCsv")}
      </Button>
      <Button
        variant="outline"
        render={
          <NextLink
            href={`/api/pms/reports/${type}/export?hotelId=${hotelId}&format=excel&locale=${locale}`}
          />
        }
      >
        {t("exportExcel")}
      </Button>
      <PrintInvoiceButton label={t("printPdf")} />
    </div>
  );
}
