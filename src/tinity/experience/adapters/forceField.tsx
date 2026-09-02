import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type ReactNode,
} from "react";
import {
  createForceField,
  type ForceFieldInstance,
} from "../../components/canvasui/ForceField";
import { CanvasEffectHost } from "./host";
import { FIELD_OPTIONS } from "./options";

export type ForceFieldHandle = {
  impact: (x: number, y: number) => void;
  resize: () => void;
};

type Props = {
  onReady?: (instance: ForceFieldInstance | null) => void;
  className?: string;
  children?: ReactNode;
};

export const ForceFieldAdapter = forwardRef<ForceFieldHandle, Props>(
  function ForceFieldAdapter({ onReady, className, children }, ref) {
    const sourceRef = useRef<HTMLCanvasElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const outputRef = useRef<HTMLCanvasElement>(null);
    const instanceRef = useRef<ForceFieldInstance | null>(null);
    const onReadyRef = useRef(onReady);
    onReadyRef.current = onReady;

    useImperativeHandle(ref, () => ({
      impact(x, y) {
        instanceRef.current?.impact(x, y);
      },
      resize() {
        instanceRef.current?.resize();
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
      let instance: ForceFieldInstance | null = null;
      try {
        instance = createForceField(
          { source, content, output },
          FIELD_OPTIONS,
        );
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
