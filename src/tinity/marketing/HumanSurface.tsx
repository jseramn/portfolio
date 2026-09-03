import { Changelog } from "./Changelog";
import { Community } from "./Community";
import { Faq } from "./Faq";
import { Footer } from "./Footer";
import { HeroShell } from "./HeroShell";
import { Hub } from "./Hub";
import { Slices } from "./Slices";
import { StatusBar } from "./StatusBar";

export function HumanSurface() {
  return (
    <div className="human-spine">
      <HeroShell />
      <StatusBar />
      <Hub />
      <Slices />
      <Changelog />
      <Community />
      <Faq />
      <Footer />
    </div>
  );
}
