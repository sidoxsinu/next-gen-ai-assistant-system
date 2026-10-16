import React from 'react';

interface NavTabProps {
  active: boolean;
  onClick: () => void;
  label: string;
}

export function NavTab({ active, onClick, label }: NavTabProps) {
  return (
    <button
      onClick={onClick}
      className={`p-4 text-center font-bold uppercase cursor-pointer border-none text-[0.8rem] transition-all
        ${active ? 'bg-[#0047FF] text-white' : 'bg-white hover:bg-[#FFE600] active:shadow-[inset_4px_4px_0_#000]'}`}
    >
      {label}
    </button>
  );
}
