import { Link, useNavigate } from "react-router-dom";
import { LogOut, Menu, Trash } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/common/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

interface AppNavbarProps {
  userData: {
    name: string;
    email: string;
  } | null;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const AppNavbar = ({ userData, isDarkMode, toggleDarkMode }: AppNavbarProps) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };
  
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("");
  };

  return (
    <header className="bg-card/75 backdrop-blur-lg sticky top-4 z-50 flex h-12 shrink-0 items-center justify-between rounded-xl border shadow-lg px-4 mx-2 md:mx-auto w-[calc(100%-1rem)] md:w-[calc(100%-19rem)]">
      <div className="flex items-center gap-4">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2">
          <img src="/credisphere-logo.svg" alt="CrediSphere Logo" className="h-8 w-8" />
          <span className="font-bold text-lg hidden md:block lg:block">CrediSphere</span>
        </Link>
        
        {/* Navigation */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            
         
           
           
            <NavigationMenuItem>
              <NavigationMenuLink asChild className={`${navigationMenuTriggerStyle()} bg-transparent hover:bg-transparent focus:bg-transparent`}>
                <Link to="/parties">Party</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild className={`${navigationMenuTriggerStyle()} bg-transparent hover:bg-transparent focus:bg-transparent`}>
                <Link to="/loans">Loan</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-2">
        
       
                <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col gap-y-4 p-4 pt-10">
                <Link to="/parties" className="text-lg font-medium p-2 hover:bg-muted rounded-md">Party</Link>
                <Link to="/loans" className="text-lg font-medium p-2 hover:bg-muted rounded-md">Loan</Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
        
        <ThemeToggle isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
        
        {/* Recycle Bin */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Link 
              to="/recycle-bin"
              className="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Trash className="h-4 w-4" />
              <span className="sr-only">Recycle Bin</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent sideOffset={4}>Recycle Bin</TooltipContent>
        </Tooltip>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src="/avatars/01.png" alt="@shadcn" />
                <AvatarFallback>{userData ? getInitials(userData.name) : "U"}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userData?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {userData?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
            </DropdownMenuGroup>
             <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
