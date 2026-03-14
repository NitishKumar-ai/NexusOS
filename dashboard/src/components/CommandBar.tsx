'use client';

import { useState } from 'react';
import { submitMission } from '../../lib/gateway';

export default function CommandBar() {
  const [command, setCommand] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!command.trim()) return;

    setIsLoading(true);
    try {
      const data = await submitMission({ instruction: command });
      console.log('Task accepted:', data);
      setCommand('');
    } catch (err) {
      console.error('Failed to trigger agent:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      <form onSubmit={handleSubmit} className="glass rounded-2xl p-2 flex items-center gap-3 shadow-2xl focus-within:ring-2 ring-violet-500/50 transition-all duration-300">
        <div className="pl-3 text-violet-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </div>
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Command your agent (e.g., 'Refactor auth logic')"
          className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/40 py-3 text-lg"
        />
        <button
          type="submit"
          disabled={isLoading}
          className={`bg-violet-600 hover:bg-violet-500 text-white px-5 py-2.5 rounded-xl font-medium transition-colors duration-200 flex items-center gap-2 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? 'Triggering...' : 'Execute'}
        </button>
      </form>
      <div className="mt-4 flex gap-4 justify-center text-xs text-white/40 uppercase tracking-widest font-semibold">
        <span className="hover:text-white cursor-pointer transition-colors">P0 Trigger</span>
        <span>•</span>
        <span className="hover:text-white cursor-pointer transition-colors">Context Pull</span>
        <span>•</span>
        <span className="hover:text-white cursor-pointer transition-colors">Planning</span>
      </div>
    </div>
  );
}
