'use client';

interface CartFloatingButtonProps {
  cartCount: number;
  onClick: () => void;
}

export default function CartFloatingButton({ cartCount, onClick }: CartFloatingButtonProps) {
  return (
    <button
      className="lg:hidden fixed bottom-4 right-4 bg-brand-500 text-white px-6 py-3 rounded-full shadow-theme-lg flex items-center gap-2 z-40 hover:bg-brand-600 transition-colors"
      onClick={onClick}
      aria-label={`View cart with ${cartCount} items`}
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
      <span className="font-semibold">Keranjang</span>
      {cartCount > 0 && (
        <span className="bg-white text-brand-500 px-2 py-0.5 rounded-full text-xs font-bold">
          {cartCount}
        </span>
      )}
    </button>
  );
}
