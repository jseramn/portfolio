import { useEffect, useState } from "react";
import { HARNESSES } from "../content/harnesses";
import { REPO_HREF, VERSION } from "../content/version";
import { GhostButton, GhostLink } from "./Ghost";
import { Nav } from "./Nav";

const SKELETON = `---
title: Tinity
version: …
---

Loading index.md…`;

const TWINS = [
  { file: "llms.txt", label: "llms.txt" },
  { file: "index.md", label: "index.md" },
  { file: "changelog.md", label: "changelog.md" },
  { file: "design.md", label: "design.md" },
] as const;

function AgentToolbar({
  copied,
  ready,
  onCopy,
}: {
  copied: boolean;
  ready: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="agent-toolbar">
      <div className="agent-toolbar-actions">
        <GhostButton disabled={!ready} onClick={onCopy}>
          {copied ? "Copied" : "Copy page"}
        </GhostButton>
        {TWINS.map((twin) => (
          <GhostLink key={twin.file} href={`${import.meta.env.BASE_URL}${twin.file}`}>
            {twin.label}
          </GhostLink>
        ))}
        <GhostLink href={REPO_HREF} target="_blank" rel="noopener noreferrer">
          README
        </GhostLink>
      </div>
      <p className="agent-toolbar-meta">
        v{VERSION} · {HARNESSES.length} idle
      </p>
    </div>
  );
}

export function AgentSurface() {
  const [text, setText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const href = `${import.meta.env.BASE_URL}index.md`;

  useEffect(() => {
    let alive = true;
    fetch(href)
      .then((res) => (res.ok ? res.text() : Promise.reject(res.status)))
      .then((body) => {
        if (alive) setText(body);
      })
      .catch(() => {
        if (alive) setText("Could not load index.md.");
      });
    return () => {
      alive = false;
    };
  }, [href]);

  const copy = async () => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="agent-surface">
      <Nav />
      <AgentToolbar copied={copied} ready={Boolean(text)} onCopy={() => void copy()} />
      <pre className={`agent-md${text ? "" : " agent-md--loading"}`} aria-busy={!text}>
        {text ?? SKELETON}
      </pre>
    </div>
  );
}
