import { COMMUNITY } from "../content/community";
import { REPO_ISSUES_HREF } from "../content/version";
import { GhostLink } from "./Ghost";
import { Panel, PanelGrid } from "./Panel";
import { Section } from "./Section";

export function Community() {
  return (
    <Section.Root
      className="community"
      id="community"
      aria-labelledby="community-title"
    >
      <Section.Inner>
        <Section.Header>
          <Section.Copy>
            <Section.Eyebrow id="community-title">COMMUNITY</Section.Eyebrow>
            <Section.Title>We are still building this.</Section.Title>
          </Section.Copy>
          <Section.Dek>
            Channels are reserved. The public trail is GitHub.
          </Section.Dek>
        </Section.Header>
        <PanelGrid>
          {COMMUNITY.map((item) => (
            <Panel key={item.id} data-status={item.status}>
              <a href={item.href} target="_blank" rel="noopener noreferrer">
                {item.label}
              </a>
              <p className="panel-dek">{item.dek}</p>
            </Panel>
          ))}
        </PanelGrid>
        <GhostLink
          href={REPO_ISSUES_HREF}
          target="_blank"
          rel="noopener noreferrer"
        >
          Contribute
        </GhostLink>
      </Section.Inner>
    </Section.Root>
  );
}
