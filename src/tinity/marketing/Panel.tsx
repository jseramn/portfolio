import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";

type PanelTag = "li" | "article" | "div";

type PanelProps = HTMLAttributes<HTMLElement> & {
  as?: PanelTag;
  children: ReactNode;
};

export function Panel({ as: Tag = "li", className, children, ...props }: PanelProps) {
  return (
    <Tag className={cx("panel", className)} {...props}>
      {children}
    </Tag>
  );
}

export function PanelGrid({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <ul className={cx("panel-grid", className)}>{children}</ul>;
}
