import { FAQ } from "../content/faq";
import { Section } from "./Section";

export function Faq() {
  return (
    <Section.Root className="faq" id="faq" aria-labelledby="faq-title">
      <Section.Inner>
        <Section.Header>
          <Section.Copy>
            <Section.Eyebrow id="faq-title">FAQ</Section.Eyebrow>
            <Section.Title>Short answers while we apply to OSS.</Section.Title>
          </Section.Copy>
        </Section.Header>
        <div className="faq-list">
          {FAQ.map((item) => (
            <details key={item.id} name="faq" className="faq-item">
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </Section.Inner>
    </Section.Root>
  );
}
