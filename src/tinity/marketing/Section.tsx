import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cx } from "./cx";

type SectionRootProps = ComponentPropsWithoutRef<"section">;

function Root({ className, children, ...props }: SectionRootProps) {
  return (
    <section className={cx("section", className)} {...props}>
      {children}
    </section>
  );
}

function Inner({ children }: { children: ReactNode }) {
  return <div className="section-inner">{children}</div>;
}

function Header({ children }: { children: ReactNode }) {
  return <header className="section-head">{children}</header>;
}

function Copy({ children }: { children: ReactNode }) {
  return <div className="section-copy">{children}</div>;
}

function Meta({ children }: { children: ReactNode }) {
  return <div className="section-meta">{children}</div>;
}

function Eyebrow({
  id,
  children,
}: {
  id?: string;
  children: ReactNode;
}) {
  return (
    <p className="eyebrow" id={id}>
      {children}
    </p>
  );
}

function Title({ children }: { children: ReactNode }) {
  return <h2 className="section-title">{children}</h2>;
}

function Dek({ children }: { children: ReactNode }) {
  return <p className="section-dek">{children}</p>;
}

export const Section = {
  Root,
  Inner,
  Header,
  Copy,
  Meta,
  Eyebrow,
  Title,
  Dek,
};
