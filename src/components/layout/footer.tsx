import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export async function Footer() {
  const t = await getTranslations("Footer");
  const tCommon = await getTranslations("Common");

  const columns = [
    {
      title: t("company"),
      links: [
        { href: "/about", label: t("about") },
        { href: "/contact", label: t("contact") },
        { href: "/become-a-partner", label: t("becomeAPartner") },
        { href: "/affiliate", label: t("affiliateProgram") },
      ],
    },
    {
      title: t("support"),
      links: [
        { href: "/faq", label: t("faq") },
        { href: "/contact", label: t("helpCenter") },
      ],
    },
    {
      title: t("legal"),
      links: [
        { href: "/terms", label: t("terms") },
        { href: "/privacy", label: t("privacy") },
      ],
    },
  ];

  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-2">
            <p className="text-xl font-semibold text-primary">
              {tCommon("brand")}
            </p>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              {t("newsletterDescription")}
            </p>
            <form className="mt-4 flex max-w-sm gap-2">
              <Input type="email" placeholder={t("newsletterPlaceholder")} />
              <Button type="submit" variant="secondary">
                {t("newsletterSubscribe")}
              </Button>
            </form>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold">{column.title}</h3>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t pt-6 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} {tCommon("brand")}. {t("rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
