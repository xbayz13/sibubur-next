'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SidebarContextType {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  collapseSidebar: () => void;
  expandSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Load saved state from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarCollapsed');
      if (saved !== null) {
        setIsCollapsed(saved === 'true');
      }
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarCollapsed', isCollapsed.toString());
    }
  }, [isCollapsed]);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => !prev);
  };

  const collapseSidebar = () => {
    setIsCollapsed(true);
  };

  const expandSidebar = () => {
    setIsCollapsed(false);
  };

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        toggleSidebar,
        collapseSidebar,
        expandSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}

