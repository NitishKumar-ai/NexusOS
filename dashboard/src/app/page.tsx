import CommandBar from "@/components/CommandBar";
import LiveFeed from "@/components/LiveFeed";
import AuditLog from "@/components/AuditLog";
import { GatewayHealth } from "@/components/GatewayHealth";

export default function Home() {
  return (
    <div className="min-h-screen py-20 bg-transparent">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header Section */}
        <div className="text-center mb-16 space-y-4">
          <div className="flex flex-col items-center gap-6 mb-8">
            <GatewayHealth />
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold tracking-widest uppercase animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              System Operational
            </div>
          </div>
          <h1 className="text-6xl font-extrabold tracking-tight text-gradient sm:text-7xl">
            NexusOS
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-white/50 font-medium leading-relaxed">
            Strategic Agent Orchestration & Real-time Mission Control
          </p>
        </div>

        {/* Command Center */}
        <CommandBar />

        {/* Live Feed */}
        <LiveFeed />

        {/* Audit Log */}
        <AuditLog />
        
        {/* Footer */}
        <div className="mt-32 text-center text-white/20 text-xs font-medium uppercase tracking-[0.2em]">
          Powered by Everything-Claude-Code & OpenClaw
        </div>
      </div>
    </div>
  );
}
