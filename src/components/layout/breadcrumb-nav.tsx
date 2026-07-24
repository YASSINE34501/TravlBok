import { Link } from "@/i18n/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface BreadcrumbNavItem {
  label: string;
  href?: string;
}

function BreadcrumbNav({ items }: { items: BreadcrumbNavItem[] }) {
  return (
    <Breadcrumb>
      <BreadcrumbList className="flex-nowrap overflow-hidden">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <span key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              <BreadcrumbItem className="min-w-0">
                {isLast || !item.href ? (
                  <BreadcrumbPage className="truncate">{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link href={item.href} className="truncate" />}>
                    {item.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </span>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export { BreadcrumbNav };
export type { BreadcrumbNavItem };
