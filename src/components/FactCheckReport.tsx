import { FactCheckItem } from '../types';

interface FactCheckReportProps {
  report?: FactCheckItem[];
  isOpen?: boolean;
  onClose: () => void;
}

export function FactCheckReport({ report, isOpen, onClose }: FactCheckReportProps) {
  if (!isOpen || !report) return null;

  const verifiedCount = report.filter(r => r.verdict === 'VERIFIED').length;
  const trustScore = report.length > 0 ? Math.round((verifiedCount / report.length) * 100) : 100;

  let scoreLabel = 'MOSTLY_RELIABLE';
  if (trustScore < 50) scoreLabel = 'HIGHLY_UNTASKED';
  else if (trustScore < 80) scoreLabel = 'MIXED_RELIABILITY';

  return (
    <div className="mt-2 border-l-[4px] border-[#FF2D00] pl-3">
      <div className="bg-black text-white font-mono font-bold text-xs uppercase p-2 border-[2px] border-black">
        {'>_FACT_CHECK_REPORT'}
      </div>
      <div className="border-[2px] border-t-0 border-black bg-white p-3 flex flex-col gap-3">
        {report.map((item, idx) => (
          <div key={idx} className="flex flex-col md:flex-row gap-2 border-b-[2px] border-dashed border-gray-300 pb-3 last:border-b-0 last:pb-0">
            <div className="flex-1">
              <span className="font-black text-[0.65rem] block mb-1">CLAIM:</span>
              <div className="font-mono text-xs">{item.claim}</div>
            </div>
            <div className="w-24 shrink-0">
              <span className="font-black text-[0.65rem] block mb-1">VERDICT:</span>
              <div>
                <span className={`border-[2px] border-black text-[0.6rem] px-1 font-black uppercase inline-block ${item.verdict === 'VERIFIED' ? 'bg-[#00FF00]' : item.verdict === 'DISPUTED' ? 'bg-[#FF2D00] text-white' : 'bg-[#FFE600]'}`}>
                  [{item.verdict}]
                </span>
              </div>
            </div>
            <div className="flex-1">
              <span className="font-black text-[0.65rem] block mb-1">REASON:</span>
              <div className="font-mono text-[0.65rem] text-gray-500">{item.reason}</div>
            </div>
          </div>
        ))}

        <div className="mt-2 pt-2 border-t-[2px] border-black flex flex-col gap-1">
          <div className="font-black text-xs uppercase">TRUST_SCORE: {trustScore}% — {scoreLabel}</div>
          <div className="h-3 border-[2px] border-black bg-gray-200">
            <div className={`h-full ${trustScore > 80 ? 'bg-green-500' : (trustScore >= 50 ? 'bg-[#FFE600]' : 'bg-[#FF2D00]')}`} style={{ width: `${trustScore}%` }}></div>
          </div>
        </div>

        <button onClick={onClose} className="mt-2 bg-black text-white px-3 py-2 font-black text-xs border-[2px] border-black hover:bg-white hover:text-black transition-colors cursor-pointer">
          [CLOSE_REPORT]
        </button>
      </div>
    </div>
  );
}
