'use client';

import { useState, useEffect } from 'react';
import { createWebSocket, type MissionEvent } from '../../lib/gateway';

interface LogEntry {
  id: string;
  phase: string;
  message: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export default function LiveFeed() {
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: '1',
      phase: 'P0',
      message: 'NexusOS Gateway initialized. Awaiting commands.',
      timestamp: new Date().toLocaleTimeString(),
      type: 'success',
    },
  ]);
  const [status, setStatus] = useState<'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING'>('DISCONNECTED');

  useEffect(() => {
    const ws = createWebSocket((event: MissionEvent) => {
      const newLog: LogEntry = {
        id: Math.random().toString(36).substr(2, 9),
        phase: event.phase,
        message: event.message,
        timestamp: new Date(event.timestamp).toLocaleTimeString(),
        type: 'info',
      };
      setLogs(prev => [newLog, ...prev]);
    });

    ws.onopen = () => setStatus('CONNECTED');
    ws.onclose = () => setStatus('DISCONNECTED');

    return () => ws.close();
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto mt-12 px-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gradient">Live Mission Stream</h2>
        <div className="flex items-center gap-2 text-xs text-white/50 bg-white/5 px-3 py-1 rounded-full border border-white/10">
          <div className={`w-2 h-2 rounded-full animate-pulse ${status === 'CONNECTED' ? 'bg-green-500' : 'bg-red-500'}`}></div>
          {status} TO AGENT
        </div>
      </div>
      
      <div className="glass rounded-2xl overflow-hidden min-h-[400px] flex flex-col">
        <div className="flex-1 p-6 space-y-4 font-mono text-sm overflow-y-auto max-h-[600px]">
          {logs.map((log: LogEntry) => (
            <div key={log.id} className="flex gap-4 group">
              <span className="text-white/20 whitespace-nowrap">{log.timestamp}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold h-fit ${
                log.phase === 'P0' ? 'bg-blue-500/20 text-blue-400' : 'bg-violet-500/20 text-violet-400'
              }`}>
                {log.phase}
              </span>
              <span className="text-white/80 leading-relaxed">{log.message}</span>
            </div>
          ))}
          <div className="animate-pulse flex gap-4">
            <span className="text-white/10">•</span>
            <span className="text-white/10">Awaiting stream...</span>
          </div>
        </div>
        
        <div className="border-t border-white/10 p-4 bg-white/5 flex gap-4 text-[10px] text-white/30 uppercase tracking-widest font-bold">
          <span>Active Tasks: 0</span>
          <span>Pipeline: Stopped</span>
        </div>
      </div>
    </div>
  );
}
