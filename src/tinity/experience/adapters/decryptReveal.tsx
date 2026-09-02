import { useEffect, useRef, type ReactNode } from "react";
import { createDecryptReveal } from "../../components/canvasui/DecryptReveal";
import { CanvasEffectHost } from "./host";
import { DECRYPT_OPTIONS } from "./options";

type Props = {
  className?: string;
  children?: ReactNode;
};

export function DecryptRevealAdapter({ className, children }: Props) {
  const sourceRef = useRef<HTMLCanvasElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const source = sourceRef.current;
    const content = contentRef.current;
    const output = outputRef.current;
    if (!source || !content || !output) return;
    let instance = null;
    try {
      instance = createDecryptReveal(
        { source, content, output },
        DECRYPT_OPTIONS,
      );
    } catch {
      instance = null;
    }
    return () => {
      instance?.destroy();
    };
  }, []);

  return (
    <CanvasEffectHost
      className={className}
      sourceRef={sourceRef}
      contentRef={contentRef}
      outputRef={outputRef}
    >
      {children}
    </CanvasEffectHost>
  );
}
