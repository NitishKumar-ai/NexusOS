'use client';
import { approveMission, rejectMission } from '../../lib/gateway';
import { useState } from 'react';

interface HITLGateProps {
  missionId: string;
  phase: string;
  plan?: string;
  onDecision: () => void;
}

export function HITLGate({ missionId, phase, plan, onDecision }: HITLGateProps) {
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');

  const handleApprove = async () => {
    setLoading(true);
    try {
      await approveMission(missionId, note || undefined);
      onDecision();
    } catch (err) {
      console.error('Failed to approve:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      await rejectMission(missionId, note || undefined);
      onDecision();
    } catch (err) {
      console.error('Failed to reject:', err);
    } finally {
      setLoading(false);
    }
  };

  const isP2 = phase.includes('P2');

  return (
    <div className="mt-4 p-6 glass border-violet-500/30 bg-violet-500/5 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
        </div>
        <h3 className="text-lg font-bold text-white">
          {isP2 ? 'Pipeline Paused: Review Plan' : 'Pipeline Paused: Final Approval'}
        </h3>
      </div>
      
      {plan && (
        <div className="mb-6 p-4 bg-black/40 rounded-xl border border-white/5 font-mono text-xs text-white/60 overflow-x-auto max-h-40">
          <pre>{plan}</pre>
        </div>
      )}

      <textarea
        placeholder="Add instructions or feedback for the agent..."
        value={note}
        onChange={e => setNote(e.target.value)}
        className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-1 ring-violet-500/50 mb-4 transition-all"
        rows={3}
      />

      <div className="flex gap-3">
        <button 
          onClick={handleApprove} 
          disabled={loading}
          className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] shadow-lg"
        >
          {loading ? 'Processing...' : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Approve Phase
            </>
          )}
        </button>
        <button 
          onClick={handleReject} 
          disabled={loading}
          className="flex-1 bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-400 border border-white/10 hover:border-red-500/30 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
        >
          {loading ? 'Processing...' : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              Reject Mission
            </>
          )}
        </button>
      </div>
    </div>
  );
}
