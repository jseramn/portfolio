import { useRef } from "react";
import { REPO_HREF } from "../content/version";
import { GhostButton, GhostLink } from "./Ghost";
import { Lockup } from "./Lockup";
import { useWindow } from "./shell";
import { SurfaceSwitch } from "./SurfaceSwitch";

const DRAWER_HASHES = [
  ["#status", "Status"],
  ["#hub", "Hub"],
  ["#slices", "Slices"],
  ["#changelog", "Changelog"],
  ["#community", "Community"],
  ["#faq", "FAQ"],
] as const;

export function Nav() {
  const { open } = useWindow();
  const menuRef = useRef<HTMLDialogElement>(null);

  const closeMenu = () => {
    menuRef.current?.close();
  };

  return (
    <header className="nav">
      <Lockup />
      <div className="nav-end">
        <SurfaceSwitch />
        <GhostLink
          className="nav-desktop"
          href={REPO_HREF}
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub ↗
        </GhostLink>
        <GhostButton className="nav-desktop" onClick={() => open("docs")}>
          Docs · soon
        </GhostButton>
        <button
          type="button"
          className="nav-menu"
          aria-label="Open menu"
          onClick={() => menuRef.current?.showModal()}
        >
          Menu
        </button>
      </div>
      <dialog ref={menuRef} className="nav-drawer" onClose={closeMenu}>
        <form method="dialog">
          <GhostButton type="submit">Close</GhostButton>
        </form>
        <GhostLink href={REPO_HREF} target="_blank" rel="noopener noreferrer">
          GitHub ↗
        </GhostLink>
        <GhostButton
          onClick={() => {
            open("docs");
            closeMenu();
          }}
        >
          Docs · soon
        </GhostButton>
        {DRAWER_HASHES.map(([href, label]) => (
          <GhostLink key={href} href={href} onClick={closeMenu}>
            {label}
          </GhostLink>
        ))}
      </dialog>
    </header>
  );
}
