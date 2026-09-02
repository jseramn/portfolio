import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type ReactNode,
} from "react";
import {
  createGlitch,
  type GlitchInstance,
} from "../../components/canvasui/Glitch";
import { CanvasEffectHost } from "./host";
import { GLITCH_OPTIONS } from "./options";

export type GlitchHandle = {
  burst: () => void;
};

type Props = {
  onReady?: (instance: GlitchInstance | null) => void;
  className?: string;
  children?: ReactNode;
};

export const GlitchAdapter = forwardRef<GlitchHandle, Props>(
  function GlitchAdapter({ onReady, className, children }, ref) {
    const sourceRef = useRef<HTMLCanvasElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const outputRef = useRef<HTMLCanvasElement>(null);
    const instanceRef = useRef<GlitchInstance | null>(null);
    const onReadyRef = useRef(onReady);
    onReadyRef.current = onReady;

    useImperativeHandle(ref, () => ({
      burst() {
        instanceRef.current?.burst();
      },
    }));

    useEffect(() => {
      const source = sourceRef.current;
      const content = contentRef.current;
      const output = outputRef.current;
      if (!source || !content || !output) {
        onReadyRef.current?.(null);
        return;
      }
      let instance: GlitchInstance | null = null;
      try {
        instance = createGlitch({ source, content, output }, GLITCH_OPTIONS);
      } catch {
        instance = null;
      }
      instanceRef.current = instance;
      onReadyRef.current?.(instance);
      return () => {
        instance?.destroy();
        instanceRef.current = null;
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
  },
);
