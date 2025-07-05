import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const ThemeToggle = ({ isDarkMode, toggleDarkMode }: ThemeToggleProps) => {
  return (
    <button
      onClick={toggleDarkMode}
      className="relative flex items-center justify-between w-16 h-7 px-1 bg-gray-200 dark:bg-gray-800 rounded-full cursor-pointer"
    >
      <div
        className={`absolute left-1 top-1 flex items-center justify-center w-6 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${isDarkMode ? 'translate-x-8' : 'translate-x-0'}`}>
        {isDarkMode ? <Moon className="h-3 w-3 text-gray-800" /> : <Sun className="h-3 w-3 text-yellow-500" />}
      </div>
      <span className={`ml-1 text-[11px] font-medium ${isDarkMode ? 'text-white' : 'text-transparent'}`}>Dark</span>
      <span className={`mr-1 text-[11px] font-medium ${!isDarkMode ? 'text-gray-800' : 'text-transparent'}`}>Light</span>
    </button>
  );
};
