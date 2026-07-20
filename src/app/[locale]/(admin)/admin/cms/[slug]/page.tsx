import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { CmsContentEditor } from "@/components/admin/cms-content-editor";

export default async function AdminCmsEditPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  const page = await prisma.cmsPage.findUnique({ where: { slug } });
  if (!page) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">/{page.slug}</h1>
      <CmsContentEditor
        locale={locale}
        slug={page.slug}
        content={page.content as Record<string, unknown>}
      />
    </div>
  );
}
