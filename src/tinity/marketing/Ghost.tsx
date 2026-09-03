import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import { cx } from "./cx";

type GhostButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function GhostButton({
  className,
  type = "button",
  children,
  ...props
}: GhostButtonProps) {
  return (
    <button type={type} className={cx("btn-ghost", className)} {...props}>
      {children}
    </button>
  );
}

type GhostLinkProps = AnchorHTMLAttributes<HTMLAnchorElement>;

export function GhostLink({ className, children, ...props }: GhostLinkProps) {
  return (
    <a className={cx("btn-ghost", className)} {...props}>
      {children}
    </a>
  );
}
