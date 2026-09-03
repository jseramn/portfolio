import { useEffect, useRef, type ReactNode } from "react";
import { CHANGELOG } from "../content/changelog";
import { REPO_HREF } from "../content/version";
import { GhostButton } from "./Ghost";
import { useWindow, type WindowId } from "./shell";

function Frame({ children }: { children: ReactNode }) {
  const { id, close } = useWindow();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (id) {
      if (!el.open) el.showModal();
    } else if (el.open) {
      el.close();
    }
  }, [id]);

  return (
    <dialog
      ref={ref}
      className="win"
      aria-labelledby="win-title"
      onClose={close}
    >
      <header className="win-bar">
        <h2 id="win-title" className="win-title">
          {id === "changelog" ? "Changelog" : "Docs"}
        </h2>
        <GhostButton onClick={close}>Close</GhostButton>
      </header>
      {children}
    </dialog>
  );
}

function Docs() {
  return (
    <div className="win-body">
      <p>Docs are coming soon.</p>
      <p>
        Until then, read{" "}
        <a href={`${import.meta.env.BASE_URL}index.md`}>index.md</a>,{" "}
        <a href={`${import.meta.env.BASE_URL}design.md`}>design.md</a>, and the{" "}
        <a href={REPO_HREF} target="_blank" rel="noopener noreferrer">
          README
        </a>
        .
      </p>
    </div>
  );
}

function Changelog() {
  return (
    <div className="win-body">
      {CHANGELOG.map((entry) => (
        <article key={`${entry.version}-${entry.date ?? "unreleased"}`}>
          <p className="eyebrow">
            {entry.date ?? "Unreleased"} · {entry.version}
          </p>
          <ul>
            {entry.highlights.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}

const BODIES: Record<WindowId, () => ReactNode> = {
  docs: () => <Docs />,
  changelog: () => <Changelog />,
};

export const Window = {
  Frame,
  Docs,
  Changelog,
};

export function WindowHost() {
  const { id } = useWindow();
  const Body = id ? BODIES[id] : Docs;
  return (
    <Window.Frame>
      <Body />
    </Window.Frame>
  );
}
