'use client';

import { useState, useEffect } from 'react';

interface MissionTask {
  id: string;
  instruction: string;
  repo_url: string | null;
  phase: string;
}

export default function AuditLog() {
  const [missions, setMissions] = useState<MissionTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMissions();
    // Refresh history every 30 seconds
    const interval = setInterval(fetchMissions, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchMissions = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/v1/missions');
      const data = await response.json();
      setMissions(data);
    } catch (err) {
      console.error('Failed to fetch mission history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-12 px-4 mb-20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gradient">Mission Audit Archive</h2>
        <button 
          onClick={fetchMissions}
          className="text-xs text-white/40 hover:text-white/80 transition-colors uppercase tracking-widest font-bold"
        >
          Refresh Archive
        </button>
      </div>

      <div className="glass rounded-2xl overflow-hidden border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest">Instruction</th>
                <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest text-center">Final Phase</th>
                <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest text-right">ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-white/20 italic">Loading mission history...</td>
                </tr>
              ) : missions.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-white/20 italic">No archived missions found.</td>
                </tr>
              ) : (
                missions.map((mission) => (
                  <tr key={mission.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="text-sm text-white/80 line-clamp-1">{mission.instruction}</div>
                      {mission.repo_url && (
                        <div className="text-[10px] text-white/20 font-mono mt-1">{mission.repo_url}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 text-[10px] font-bold border border-violet-500/20">
                        {mission.phase}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-[10px] font-mono text-white/20 group-hover:text-white/40">
                      {mission.id.slice(0, 8)}...
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
