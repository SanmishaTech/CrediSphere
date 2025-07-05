



import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";

import { AppNavbar } from "@/components/common/app-navbar";



export default function MainLayout() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      return savedTheme === "dark";
    }
    // If no saved preference, check system preference
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Effect to sync dark mode state with HTML class
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  // Retrieve user data from localStorage
  const storedUserData = localStorage.getItem("user");
  const userData = storedUserData ? JSON.parse(storedUserData) : null;

  // Effect to listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("theme")) {
        setIsDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);



  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem("theme", newDarkMode ? "dark" : "light");
  };

  return (
    <div className="min-h-screen w-full">
      <AppNavbar userData={userData} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

      {/* Content Area */}
      <main className="p-4 pt-9">
        {/* Add padding to prevent content from being hidden */}
        <Outlet />
      </main>
    </div>
  );
}
