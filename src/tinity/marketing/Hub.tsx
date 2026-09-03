import { HARNESSES } from "../content/harnesses";
import { markSrcFor } from "../experience/AgentMark";
import { usePrefersReducedMotion } from "../experience/motion";
import { HarnessMark } from "./HarnessMark";
import { harnessTooltip } from "./harnessStatus";
import { HUB_CX, HUB_CY, hubLayout, spokePath } from "./hubLayout";
import { MarkSvg } from "./Lockup";
import { Section } from "./Section";

const SIZE = 800;
const DOT_INDEXES = [0, 4, 8, 12];

export function Hub() {
  const reduced = usePrefersReducedMotion();
  const nodes = hubLayout(HARNESSES.map((h) => h.id));
  return (
    <Section.Root className="hub" id="hub" aria-labelledby="hub-title">
      <Section.Inner>
        <Section.Header>
          <Section.Copy>
            <Section.Eyebrow id="hub-title">HUB</Section.Eyebrow>
            <Section.Title>Tinity is the node between the harnesses.</Section.Title>
          </Section.Copy>
          <Section.Dek>
            Seventeen spokes in. Policy out, later. Today every rim node is idle.
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
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            aria-hidden="true"
          >
            <g fill="none" stroke="var(--hairline)" strokeWidth="1">
              {nodes.map((node) => (
                <path
                  key={node.id}
                  className="hub-spoke"
                  d={spokePath(node, HUB_CX, HUB_CY, SIZE)}
                />
              ))}
            </g>
            {!reduced
              ? DOT_INDEXES.map((index) => {
                  const node = nodes[index];
                  if (!node) return null;
                  return (
                    <circle
                      key={`dot-${node.id}`}
                      r="3"
                      className="hub-dot"
                      fill="#1fdb12"
                    >
                      <animateMotion
                        dur="2.4s"
                        begin={`${index * 0.35}s`}
                        repeatCount="indefinite"
                        path={spokePath(node, HUB_CX, HUB_CY, SIZE)}
                      />
                    </circle>
                  );
                })
              : null}
            <g
              transform={`translate(${HUB_CX * SIZE} ${HUB_CY * SIZE}) scale(28)`}
            >
              <MarkSvg size={3.47} />
            </g>
            {nodes.map((node) => {
              const harness = HARNESSES[node.index]!;
              const tip = harnessTooltip(harness.label, harness.status);
              return (
                <g
                  key={`node-${node.id}`}
                  className="hub-node"
                  data-status={harness.status}
                  transform={`translate(${node.x * SIZE} ${node.y * SIZE})`}
                >
                  <title>{tip}</title>
                  <circle r="22" fill="#111111" stroke="#262626" />
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
            Tinity sits at the center. {HARNESSES.length} harnesses sit on the
            ring. All nodes are idle.
          </figcaption>
        </figure>
      </Section.Inner>
    </Section.Root>
  );
}
