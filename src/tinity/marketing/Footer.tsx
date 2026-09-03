import { VERSION } from "../content/version";
import { Credits } from "../experience/Credits";

export function Footer() {
  return (
    <footer className="site-footer">
      <Credits />
      <p className="site-footer-meta">MIT · v{VERSION}</p>
    </footer>
  );
}
