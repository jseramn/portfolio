import { useSurface } from "./shell";

export function SurfaceSwitch() {
  const { surface, setSurface } = useSurface();
  return (
    <div className="surface-switch" role="group" aria-label="Page surface">
      <button
        type="button"
        className="surface-switch-btn"
        aria-pressed={surface === "human"}
        onClick={() => setSurface("human")}
      >
        HUMAN
      </button>
      <button
        type="button"
        className="surface-switch-btn"
        aria-pressed={surface === "agent"}
        title="Markdown twin for agents and MCP"
        onClick={() => setSurface("agent")}
      >
        AGENT
      </button>
    </div>
  );
}
