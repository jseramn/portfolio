import { HARNESSES, IDLE_COUNT } from "../content/harnesses";
import { VERSION, VERSION_TAG_HREF } from "../content/version";
import { HarnessMark } from "./HarnessMark";
import { harnessTooltip } from "./harnessStatus";
import { Section } from "./Section";

export function StatusBar() {
  return (
    <Section.Root className="status" id="status" aria-labelledby="status-title">
      <Section.Inner>
        <Section.Header>
          <Section.Copy>
            <Section.Eyebrow id="status-title">STATUS</Section.Eyebrow>
            <a className="status-version" href={VERSION_TAG_HREF}>
              RUNS ON v{VERSION}
            </a>
          </Section.Copy>
          <Section.Meta>
            <p className="status-count">
              <span className="status-count-led" aria-hidden="true" />
              {IDLE_COUNT} IDLE
            </p>
          </Section.Meta>
        </Section.Header>
        <ul className="status-pips">
          {HARNESSES.map((harness) => {
            const tip = harnessTooltip(harness.label, harness.status);
            return (
              <li
                key={harness.id}
                className="status-pip"
                data-status={harness.status}
                data-harness={harness.id}
                title={tip}
                aria-label={tip}
              >
                <HarnessMark harness={harness} />
                <span className="status-pip-label">{harness.label}</span>
              </li>
            );
          })}
        </ul>
      </Section.Inner>
    </Section.Root>
  );
}
