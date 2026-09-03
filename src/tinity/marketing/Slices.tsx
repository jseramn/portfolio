import { SLICES, SLICE_BADGE } from "../content/slices";
import { Panel, PanelGrid } from "./Panel";
import { Section } from "./Section";

export function Slices() {
  return (
    <Section.Root className="slices" id="slices" aria-labelledby="slices-title">
      <Section.Inner>
        <Section.Header>
          <Section.Copy>
            <Section.Eyebrow id="slices-title">SLICES</Section.Eyebrow>
            <Section.Title>What Tinity is building.</Section.Title>
          </Section.Copy>
          <Section.Dek>
            Shipped means in the repo. Next and later are not present tense.
          </Section.Dek>
        </Section.Header>
        <PanelGrid>
          {SLICES.map((slice) => (
            <Panel
              key={slice.id}
              className={slice.status === "shipped" ? "panel--shipped" : undefined}
              data-status={slice.status}
            >
              <p className="eyebrow">{slice.eyebrow}</p>
              <h3 className="panel-title">{slice.title}</h3>
              <p className="panel-dek">{slice.dek}</p>
              <span className={`badge badge--${slice.status}`}>
                {SLICE_BADGE[slice.status]}
              </span>
            </Panel>
          ))}
        </PanelGrid>
      </Section.Inner>
    </Section.Root>
  );
}
