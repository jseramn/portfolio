import { useState } from "react";
import { HARNESSES } from "../content/harnesses";
import { markSrcFor } from "../experience/AgentMark";
import { usePrefersReducedMotion } from "../experience/motion";
import { HarnessMark } from "./HarnessMark";
import { harnessTooltip } from "./harnessStatus";
import {
  HUB_CX,
  HUB_CY,
  HUB_SIZE,
  hubLayout,
  markHubTransform,
  sendPath,
  spokePath,
} from "./hubLayout";
import { MARK_VIEWBOX, MarkSvg } from "./Lockup";
import { Section } from "./Section";

const NODE = 44;

type Traffic = {
  dir: "send" | "receive";
  dur: number;
  delay: number;
};

function randomTraffic(): Traffic {
  return {
    dir: Math.random() < 0.5 ? "send" : "receive",
    dur: 1.8 + Math.random() * 1.6,
    delay: Math.random() * 1.2,
  };
}

export function Hub() {
  const reduced = usePrefersReducedMotion();
  const nodes = hubLayout(HARNESSES.map((h) => h.id));
  const [traffic] = useState(() => nodes.map(() => randomTraffic()));
  return (
    <Section.Root className="hub" id="hub" aria-labelledby="hub-title">
      <Section.Inner>
        <Section.Header>
          <Section.Copy>
            <Section.Eyebrow id="hub-title">HUB</Section.Eyebrow>
            <Section.Title>Tinity is the node between the harnesses.</Section.Title>
          </Section.Copy>
          <Section.Dek>
            Seventeen harnesses on four racks. Policy out, later. Today every
            node is idle.
          </Section.Dek>
        </Section.Header>
        <figure
          className="hub-figure"
          role="img"
          aria-labelledby="hub-title"
          aria-describedby="hub-desc"
        >
          <svg
            className="hub-ring"
            viewBox={`0 0 ${HUB_SIZE} ${HUB_SIZE}`}
            aria-hidden="true"
          >
            <g fill="none" stroke="var(--hairline)" strokeWidth="1">
              {nodes.map((node) => (
                <path
                  key={node.id}
                  className="hub-spoke"
                  d={spokePath(node, HUB_CX, HUB_CY, HUB_SIZE)}
                />
              ))}
            </g>
            {!reduced
              ? nodes.map((node, index) => {
                  const hop = traffic[index];
                  if (!hop) return null;
                  const path =
                    hop.dir === "send"
                      ? sendPath(node, HUB_CX, HUB_CY, HUB_SIZE)
                      : spokePath(node, HUB_CX, HUB_CY, HUB_SIZE);
                  return (
                    <circle
                      key={`dot-${node.id}`}
                      r="3"
                      className="hub-dot"
                      fill="#1fdb12"
                    >
                      <animateMotion
                        dur={`${hop.dur.toFixed(3)}s`}
                        begin={`${hop.delay.toFixed(3)}s`}
                        repeatCount="indefinite"
                        path={path}
                      />
                    </circle>
                  );
                })
              : null}
            <g transform={markHubTransform()}>
              <MarkSvg size={MARK_VIEWBOX.width} />
            </g>
            {nodes.map((node) => {
              const harness = HARNESSES[node.index]!;
              const tip = harnessTooltip(harness.label, harness.status);
              return (
                <g
                  key={`node-${node.id}`}
                  className="hub-node"
                  data-status={harness.status}
                  data-edge={node.edge}
                  transform={`translate(${node.x * HUB_SIZE} ${node.y * HUB_SIZE})`}
                >
                  <title>{tip}</title>
                  <rect
                    x={-NODE / 2}
                    y={-NODE / 2}
                    width={NODE}
                    height={NODE}
                    fill="#111111"
                    stroke="#262626"
                  />
                  <image
                    href={markSrcFor(harness.id)}
                    x="-12"
                    y="-12"
                    width="24"
                    height="24"
                  />
                </g>
              );
            })}
          </svg>
          <ul className="hub-stack">
            {HARNESSES.map((harness) => (
              <li
                key={harness.id}
                data-status={harness.status}
                title={harnessTooltip(harness.label, harness.status)}
              >
                <HarnessMark harness={harness} size={24} lazy />
                <span>{harness.label}</span>
              </li>
            ))}
          </ul>
          <figcaption id="hub-desc" className="sr-only">
            Tinity sits at the center. {HARNESSES.length} harnesses sit on four
            racks. All nodes are idle.
          </figcaption>
        </figure>
      </Section.Inner>
    </Section.Root>
  );
}
