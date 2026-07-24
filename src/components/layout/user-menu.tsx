"use client";

import { useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import { LayoutDashboard, LogOut, User as UserIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "@/i18n/navigation";

type Props = {
  name: string;
  email: string;
  image?: string | null;
  isPartnerOrStaff: boolean;
  dashboardHref: string;
};

export function UserMenu({
  name,
  email,
  image,
  isPartnerOrStaff,
  dashboardHref,
}: Props) {
  const t = useTranslations("Nav");
  const initials = name
    .split(" ")
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Avatar className="size-8">
              {image ? <AvatarImage src={image} alt={name} /> : null}
              <AvatarFallback>{initials || <UserIcon className="size-4" />}</AvatarFallback>
            </Avatar>
          </button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-1.5 py-1">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="truncate text-xs font-normal text-muted-foreground">
            {email}
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/account/bookings" />}>
          {t("myBookings")}
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/account/security" />}>
          {t("security")}
        </DropdownMenuItem>
        {isPartnerOrStaff && (
          <DropdownMenuItem render={<Link href={dashboardHref} />}>
            <LayoutDashboard />
            {t("dashboard")}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => signOut()}>
          <LogOut />
          {t("logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
