"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Bot,
  GraduationCap,
  LayoutDashboard,
  LibraryBig,
  Users,
} from "lucide-react";

import DadyoomLogo from "@/components/brand/DadyoomLogo";
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
  icon: React.ComponentType<{
    className?: string;
  }>;
};

const mainItems: MenuItem[] = [
  {
    title: "نظرة عامة",
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
    title: "بوابة المناهج",
    href: "/admin/curriculum",
    icon: LibraryBig,
  },
  {
    title: "الدروس",
    href: "/admin/lessons",
    icon: BookOpen,
  },
  {
    title: "مساعد المحتوى",
    href: "/admin/ai-lesson",
    icon: Bot,
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

    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>
        {label}
      </SidebarGroupLabel>

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
      className="border-l border-[#dfcfad]"
      dir="rtl"
    >
      <SidebarHeader className="border-b border-[#dfcfad] p-4">
        <DadyoomLogo />
      </SidebarHeader>

      <SidebarContent>
        <MenuSection
          label="الإدارة"
          items={mainItems}
          pathname={pathname}
        />

        <MenuSection
          label="المحتوى"
          items={contentItems}
          pathname={pathname}
        />
      </SidebarContent>

      <SidebarFooter className="border-t border-[#dfcfad] p-4 text-xs font-black text-[#796f62]">
        المنهج حزمة موثقة، والمعلم يضيف الإثراء.
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
