import * as React from "react";
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  UsersRound,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  MessageCircle,
  Icon,
  FileText,
  UserRound,
  User,
  UserCircle,
  CreditCard,
} from "lucide-react";

import { NavMain } from "@/components/common/nav-main";
import { NavProjects } from "@/components/common/nav-projects";
import { NavUser } from "@/components/common/nav-user";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
// import { TeamSwitcher } from "@/components/common/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { appName } from "@/config";

// This is sample data.
const initialData = {
  roles: {
    
    admin: {
      projects: [
        // {
        //   name: "Dashboard",
        //   url: "/dashboard",
        //   icon: UsersRound, 
        // },
        
        {
          name: "Party",
          url: "/parties",
          icon: UsersRound,
        },
        {
          name: "Loan",
          url: "/loans",
          icon: UsersRound,
        },
      
      ],

     
    },
 
  },
  user: {
    name: "",
    email: "",
    avatar: "",
    avatarName: "",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
};

function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [data, setData] = React.useState({
    ...initialData,
    projects: [] as typeof initialData.roles.admin.projects,
    navMain: [] as typeof initialData.roles.admin.projects,
  });

  React.useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        parsedUser.avatarName = parsedUser.name?.charAt(0).toUpperCase() || "U";

        // Default to admin if no role is specified, then fallback to super_admin for safety
        let role =
          (parsedUser.role as keyof typeof initialData.roles) || "admin";

        // If role doesn't exist in our initialData, default to super_admin
        if (!initialData.roles[role]) {
          role = "admin";
        }

        const roleData = initialData.roles[role];

        setData((prevData) => ({
          ...prevData,
          projects: roleData?.projects || [],
          user: parsedUser,
        }));
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        // If there's an error, set default projects for navigation
        setData((prevData) => ({
          ...prevData,
          projects: initialData.roles.admin.projects,
         }));
      }
    } else {
      // No user in localStorage, show default navigation
      setData((prevData) => ({
        ...prevData,
        projects: initialData.roles.admin.projects,
      }));
    }
  }, []);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {/* <TeamSwitcher teams={data.teams} /> */}
        <SidebarMenu className="flex  ">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
             <div className="flex items-center gap-2  justify-between">
             <a
              className="flex items-center gap-2"
              href="/loans"
              >
                <img src="/credisphere-logo.svg" alt="CrediSphere logo" className="h-6 w-6" />
                <span className="text-base font-semibold">{appName}</span>
              </a>
              <a
              className="flex items-center gap-2"
              href="/member/search">
                
               </a>
              
             </div>
            </SidebarMenuButton>
            
          </SidebarMenuItem>
          {/* <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1 bg-white"
            >
              <a href="/dashboard">
                <Search className="h-5 w-5 " />
                <Input placeholder="Search" className="border-0 " />
               </a>
              
            </SidebarMenuButton>
            
          </SidebarMenuItem> */}
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavProjects projects={data.projects || []} />
        <NavMain items={data.navMain || []} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export { AppSidebar };
