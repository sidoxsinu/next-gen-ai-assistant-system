import { Mode } from '../types';

interface NavTabProps {
  active: boolean;
  onClick: () => void;
  mode: Mode;
  label: string;
  badge?: string;
}

const MODE_CONFIG: Record<
  Mode,
  {
    icon: string;
    activeBg: string;
    activeText: string;
    activeBorder: string;
    hoverBg: string;
  }
> = {
  RESEARCH: {
    icon: '🔬',
    activeBg: 'bg-[#0047FF]',
    activeText: 'text-white',
    activeBorder: 'border-b-4 border-b-white',
    hoverBg: 'hover:bg-blue-50'
  },
  SUPPORT: {
    icon: '🎧',
    activeBg: 'bg-[#00CC44]',
    activeText: 'text-black',
    activeBorder: 'border-b-4 border-b-black',
    hoverBg: 'hover:bg-green-50'
  },
  WORKFLOW: {
    icon: '⚡',
    activeBg: 'bg-[#FFE600]',
    activeText: 'text-black',
    activeBorder: 'border-b-4 border-b-black',
    hoverBg: 'hover:bg-yellow-50'
  },
  KNOWLEDGE: {
    icon: '🧠',
    activeBg: 'bg-[#8B00FF]',
    activeText: 'text-white',
    activeBorder: 'border-b-4 border-b-white',
    hoverBg: 'hover:bg-purple-50'
  },
  DEBATE: {
    icon: '⚔️',
    activeBg: 'bg-[#FF2D00]',
    activeText: 'text-white',
    activeBorder: 'border-b-4 border-b-white',
    hoverBg: 'hover:bg-red-50'
  }
};

export function NavTab({ active, onClick, mode, label, badge }: NavTabProps) {
  const conf = MODE_CONFIG[mode];

  return (
    <button
      onClick={onClick}
      className={`p-3 md:p-4 text-center font-black uppercase cursor-pointer border-none text-[0.75rem] md:text-[0.8rem] transition-all flex items-center justify-center gap-2 select-none relative
        ${
          active
            ? `${conf.activeBg} ${conf.activeText} ${conf.activeBorder} shadow-[inset_0_3px_0_rgba(255,255,255,0.4)]`
            : `bg-white text-black ${conf.hoverBg} hover:opacity-90 active:shadow-[inset_4px_4px_0_#000]`
        }`}
    >
      <span className="text-base leading-none">{conf.icon}</span>
      <span className="tracking-wider">{label}</span>
      {badge && (
        <span className="text-[0.6rem] px-1 py-0.5 border border-black bg-black text-[#FFE600]">
          {badge}
        </span>
      )}
    </button>
  );
}
