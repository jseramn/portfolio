import { AgentSurface } from "./marketing/AgentSurface";
import { HumanSurface } from "./marketing/HumanSurface";
import { ShellProviders, useSurface } from "./marketing/shell";
import { WindowHost } from "./marketing/Window";

function Shell() {
  const { surface } = useSurface();
  return (
    <div className="app" data-surface={surface}>
      {surface === "agent" ? <AgentSurface /> : <HumanSurface />}
      <WindowHost />
    </div>
  );
}

export function App() {
  return (
    <ShellProviders>
      <Shell />
    </ShellProviders>
  );
}
