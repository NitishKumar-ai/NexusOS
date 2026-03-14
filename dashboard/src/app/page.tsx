import CommandBar from "@/components/CommandBar";
import LiveFeed from "@/components/LiveFeed";

export default function Home() {
  return (
    <div className="min-h-screen py-20 bg-transparent">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header Section */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-block px-4 py-1.5 rounded-full glass-accent text-violet-400 text-xs font-bold tracking-widest uppercase mb-4">
            v2.0 Beta • Mission Control
          </div>
          <h1 className="text-6xl font-extrabold tracking-tight text-gradient sm:text-7xl">
            NexusOS
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-white/50 font-medium leading-relaxed">
            The event-driven agent mission control for high-bandwidth engineering.
          </p>
        </div>

        {/* Command Center */}
        <CommandBar />

        {/* Live Feed */}
        <LiveFeed />
        
        {/* Footer */}
        <div className="mt-32 text-center text-white/20 text-xs font-medium uppercase tracking-[0.2em]">
          Powered by Everything-Claude-Code & OpenClaw
        </div>
      </div>
    </div>
  );
}
