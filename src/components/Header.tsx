import { Bell, Home, Menu, MessageSquare, User } from 'lucide-react';
import GlobalSearch from './GlobalSearch';
import { useState } from 'react';

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-[1200px] mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left Section - Logo */}
        <div className="flex items-center">
          <a href="/" className="text-2xl font-bold text-blue-600 mr-6">CrediSphere</a>
          <div className="hidden md:block">
            <GlobalSearch />
          </div>
        </div>

        {/* Middle Section - Navigation (Desktop) */}
        <div className="hidden md:flex items-center space-x-1">
          <NavButton icon={<Home className="h-6 w-6" />} active />
          <NavButton icon={<User className="h-6 w-6" />} />
          <NavButton icon={<MessageSquare className="h-6 w-6" />} />
          <NavButton icon={<Bell className="h-6 w-6" />} />
        </div>

        {/* Right Section - Mobile Menu Toggle & Profile */}
        <div className="flex items-center">
          <div className="md:hidden mr-4">
            <GlobalSearch />
          </div>
          
          <button
            className="md:hidden p-2 rounded-full hover:bg-gray-200"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="hidden md:block">
            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden cursor-pointer">
              <img
                src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=100&h=100"
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      {menuOpen && (
        <div className="md:hidden bg-white shadow-lg absolute w-full">
          <div className="flex flex-col p-4 space-y-3">
            <MobileNavItem icon={<Home className="h-5 w-5" />} label="Home" active />
            <MobileNavItem icon={<User className="h-5 w-5" />} label="Profile" />
            <MobileNavItem icon={<MessageSquare className="h-5 w-5" />} label="Messages" />
            <MobileNavItem icon={<Bell className="h-5 w-5" />} label="Notifications" />
          </div>
        </div>
      )}
    </header>
  );
};

interface NavButtonProps {
  icon: React.ReactNode;
  active?: boolean;
}

const NavButton = ({ icon, active }: NavButtonProps) => {
  return (
    <button
      className={`p-2 rounded-md hover:bg-gray-100 ${
        active ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
      }`}
    >
      {icon}
    </button>
  );
};

interface MobileNavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

const MobileNavItem = ({ icon, label, active }: MobileNavItemProps) => {
  return (
    <a
      href="#"
      className={`flex items-center space-x-3 p-3 rounded-md ${
        active ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </a>
  );
};

export default Header; 