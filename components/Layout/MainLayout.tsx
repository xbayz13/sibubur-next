'use client';

import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">{children}</main>
      </div>
    </div>
  );
}

