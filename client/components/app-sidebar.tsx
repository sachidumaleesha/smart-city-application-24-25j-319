"use client";

import * as React from "react";
import {
  CarTaxiFront,
  CircleParking,
  GalleryVerticalEnd,
  LayoutDashboard,
  LifeBuoy,
  PersonStanding,
  Send,
  Settings2,
  Trash,
  User,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavSecondary } from "./nav-secondary";
import { UserData } from "@/app/(dashboard)/layout";

const baseURL = "dashboard";

// This is sample data.
export const data = {
  teams: [
    {
      name: "Smart City 🏙️.",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
  ],
  adminNavMain: [
    {
      title: "Dashboard",
      url: "/admin",
      breadcrumb: "dashboard",
      icon: LayoutDashboard,
      items: [
        {
          title: "History",
          url: "#",
        },
        {
          title: "Starred",
          url: "#",
        },
        {
          title: "Settings",
          url: "#",
        },
      ],
    },
    {
      title: "Users",
      url: "/admin/users",
      breadcrumb: "users",
      icon: User,
    },
    {
      title: "Settings",
      url: "/admin/settings",
      breadcrumb: "settings",
      icon: Settings2,
    },
  ],
  userNavMain: [
    {
      title: "Dashboard",
      url: `/${baseURL}`,
      breadcrumb: "dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Add User",
      url: `/${baseURL}/add-user`,
      breadcrumb: "add-user",
      icon: User,
    },
    {
      title: "Surveillance Enhancement",
      url: `/${baseURL}/surveillance-enhancement`,
      breadcrumb: "surveillance-enhancement",
      icon: PersonStanding,
      items: [
        {
          title: "CCTV Control Panel",
          url: `/${baseURL}/surveillance-enhancement/controlPanel`,
        },
        {
          title: "Report Engine",
          url: `/${baseURL}/surveillance-enhancement/reportengine`,
        },
      ],
    },
    {
      title: "Waste Management",
      url: `/${baseURL}/waste-management`,
      breadcrumb: "waste-management",
      icon: Trash,
      items: [
        {
          title: "Analytics",
          url: `/${baseURL}/waste-management/analytics`,
        },
        {
          title: "Get Prediction",
          url: `/${baseURL}/waste-management/get-prediction`,
        },
      ],
    },
    {
      title: "Accident Detection",
      url: "/admin/accident-detection",
      breadcrumb: "accident detection",
      icon: CarTaxiFront,
      items: [
        {
          title: "Camera",
          url: `/${baseURL}/accident-detection/camera`,
        },
        {
          title: "Youtube Link",
          url: `/${baseURL}/accident-detection/youtube-link`,
        },
      ],
    },
    {
      title: "Parking Management",
      url: `/${baseURL}/parking-management`,
      breadcrumb: "parking-management",
      icon: CircleParking,
    },
    {
      title: "Settings",
      url: `/${baseURL}/settings`,
      icon: Settings2,
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "#",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "#",
      icon: Send,
    },
  ],
};

export function AppSidebar({
  user,
  role,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user: UserData; role: string }) {
  const navItems = role === "ADMIN" ? data.adminNavMain : data.userNavMain;
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
