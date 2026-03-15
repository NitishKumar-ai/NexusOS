'use client';
import { useEffect, useState } from 'react';
import { healthCheck, openClawHealth } from '../../lib/gateway';

export function GatewayHealth() {
  const [gatewayOk, setGatewayOk] = useState(false);
  const [openclawOk, setOpenclawOk] = useState(false);

  useEffect(() => {
    const check = async () => {
      const gw = await healthCheck();
      const oc = await openClawHealth();
      setGatewayOk(gw.status === 'ok');
      setOpenclawOk(oc.connected);
    };
    check();
    const interval = setInterval(check, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider">
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10">
        <div className={`w-1.5 h-1.5 rounded-full ${gatewayOk ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}></div>
        <span className={gatewayOk ? 'text-emerald-400' : 'text-red-400'}>Gateway:3000</span>
      </div>
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10">
        <div className={`w-1.5 h-1.5 rounded-full ${openclawOk ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}></div>
        <span className={openclawOk ? 'text-emerald-400' : 'text-red-400'}>OpenClaw:18789</span>
      </div>
    </div>
  );
}
