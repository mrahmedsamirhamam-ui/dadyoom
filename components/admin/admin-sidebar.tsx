"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Bot,
  ChartNoAxesCombined,
  FileQuestion,
  GraduationCap,
  LayoutDashboard,
  LibraryBig,
  Map,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

type MenuItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const mainItems: MenuItem[] = [
  {
    title: "الرئيسية",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "الطلاب",
    href: "/admin/students",
    icon: GraduationCap,
  },
  {
    title: "المعلمون",
    href: "/admin/teachers",
    icon: Users,
  },
];

const contentItems: MenuItem[] = [
  {
    title: "الدول",
    href: "/admin/countries",
    icon: Map,
  },
  {
    title: "المناهج",
    href: "/admin/curricula",
    icon: LibraryBig,
  },
  {
    title: "الدروس",
    href: "/admin/lessons",
    icon: BookOpen,
  },
  {
    title: "الاختبارات",
    href: "/admin/questions",
    icon: FileQuestion,
  },
];

const systemItems: MenuItem[] = [
  {
    title: "ضاد الذكي",
    href: "/admin/ai",
    icon: Bot,
  },
  {
    title: "الإحصائيات",
    href: "/admin/analytics",
    icon: ChartNoAxesCombined,
  },
  {
    title: "الإعدادات",
    href: "/admin/settings",
    icon: Settings,
  },
];

function MenuSection({
  label,
  items,
  pathname,
}: {
  label: string;
  items: MenuItem[];
  pathname: string;
}) {
  function isActive(href: string) {
    if (href === "/admin") {
      return pathname === "/admin";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>

      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  render={<Link href={item.href} />}
                  isActive={isActive(item.href)}
                  tooltip={item.title}
                >
                  <Icon />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar
      side="right"
      collapsible="icon"
      className="border-l"
      dir="rtl"
    >
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
            ض
          </div>

          <div className="grid min-w-0 flex-1 text-right leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-bold">ضاديوم</span>
            <span className="truncate text-xs text-muted-foreground">
              بيت العربية الرقمي
            </span>
          </div>

          <Badge
            variant="secondary"
            className="group-data-[collapsible=icon]:hidden"
          >
            مدير
          </Badge>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <MenuSection
          label="الإدارة"
          items={mainItems}
          pathname={pathname}
        />

        <MenuSection
          label="المحتوى التعليمي"
          items={contentItems}
          pathname={pathname}
        />

        <MenuSection
          label="النظام"
          items={systemItems}
          pathname={pathname}
        />
      </SidebarContent>

      <SidebarFooter className="border-t p-3">
        <div className="flex items-center gap-3 rounded-lg p-2">
          <Avatar className="size-9 shrink-0">
            <AvatarFallback>أح</AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1 text-right group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-medium">
              أحمد سمير
            </p>
            <p className="truncate text-xs text-muted-foreground">
              مدير المنصة
            </p>
          </div>

          <ShieldCheck className="size-4 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" />
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}