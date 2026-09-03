import { CHANGELOG, datedChangelog } from "../content/changelog";
import { GhostButton } from "./Ghost";
import { Panel, PanelGrid } from "./Panel";
import { Section } from "./Section";
import { useWindow } from "./shell";

export function Changelog() {
  const { open } = useWindow();
  const cards = datedChangelog(CHANGELOG).slice(0, 3);
  return (
    <Section.Root
      className="changelog"
      id="changelog"
      aria-labelledby="changelog-title"
    >
      <Section.Inner>
        <Section.Header>
          <Section.Copy>
            <Section.Eyebrow id="changelog-title">CHANGELOG</Section.Eyebrow>
            <Section.Title>What landed.</Section.Title>
          </Section.Copy>
        </Section.Header>
        <PanelGrid>
          {cards.map((entry) => (
            <Panel key={`${entry.version}-${entry.date}`}>
              <p className="eyebrow">{entry.date}</p>
              <h3 className="panel-title">v{entry.version}</h3>
              <ul>
                {entry.highlights.slice(0, 3).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </Panel>
          ))}
        </PanelGrid>
        <GhostButton onClick={() => open("changelog")}>Full changelog</GhostButton>
      </Section.Inner>
    </Section.Root>
  );
}
