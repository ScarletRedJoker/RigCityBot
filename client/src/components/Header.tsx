import React, { useState, useEffect } from "react";
import { getTheme, setTheme, Theme } from "../lib/theme";
import { Sun, Moon, Monitor } from "lucide-react";

interface HeaderProps {
  title: string;
  totalTickets: number;
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFilterToggle: () => void;
  onNewTicket: () => void;
}

export default function Header({
  title,
  totalTickets,
  searchQuery,
  onSearchChange,
  onFilterToggle,
  onNewTicket
}: HeaderProps) {
  const [currentTheme, setCurrentTheme] = useState<Theme>(getTheme());
  
  // Apply theme changes
  useEffect(() => {
    setTheme(currentTheme);
  }, [currentTheme]);
  
  // Initialize theme on component mount
  useEffect(() => {
    setTheme(getTheme());
  }, []);

  // Function to cycle through themes
  const cycleTheme = () => {
    const themes: Theme[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setCurrentTheme(themes[nextIndex]);
  };
  
  return (
    <header className="bg-discord-background border-b border-discord-dark p-4">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center">
        <div className="flex items-center mb-4 md:mb-0">
          <h1 className="text-xl font-bold">{title}</h1>
          <span className="ml-3 bg-discord-dark text-discord-text text-sm px-2 py-1 rounded-full">
            {totalTickets} Total
          </span>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          {/* Search Box */}
          <div className="relative w-full sm:w-auto">
            <input 
              type="text" 
              placeholder="Search tickets..." 
              className="bg-discord-dark border-none text-discord-text w-full sm:w-64 pl-10 pr-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-discord-blue"
              value={searchQuery}
              onChange={onSearchChange}
            />
            <div className="absolute left-3 top-2.5 text-discord-muted">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          
          {/* Filter Button */}
          <button 
            className="flex items-center px-3 py-2 bg-discord-dark rounded-md hover:bg-gray-700 text-sm font-medium transition duration-150 ease-in-out"
            onClick={onFilterToggle}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
            </svg>
            Filter
          </button>
          
          {/* New Ticket Button */}
          <button 
            className="flex items-center px-3 py-2 bg-discord-blue hover:bg-discord-darkBlue rounded-md text-white text-sm font-medium transition duration-150 ease-in-out"
            onClick={onNewTicket}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            New Ticket
          </button>
          
          {/* Theme Toggle Button */}
          <button 
            className="flex items-center justify-center w-10 h-10 bg-discord-dark rounded-full hover:bg-gray-700 transition duration-150 ease-in-out"
            onClick={cycleTheme}
            aria-label="Toggle theme"
          >
            {currentTheme === 'light' && <Sun className="h-5 w-5" />}
            {currentTheme === 'dark' && <Moon className="h-5 w-5" />}
            {currentTheme === 'system' && <Monitor className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </header>
  );
}
