'use client';

import { useState, ReactNode } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
  placement?: 'top' | 'right' | 'bottom' | 'left';
}

export default function Tooltip({
  content,
  children,
  placement = 'right',
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const placementClasses = {
    right: 'left-full ml-2 top-1/2 -translate-y-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>

      {isVisible && (
        <div
          className={`absolute whitespace-nowrap bg-gray-900 text-white text-xs px-2 py-1 rounded z-50 ${
            placementClasses[placement]
          }`}
        >
          {content}
        </div>
      )}
    </div>
  );
}
