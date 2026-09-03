import type { Harness } from "../content/harnesses";
import { markSrcFor } from "../experience/AgentMark";
import { cx } from "./cx";

export function HarnessMark({
  harness,
  size = 20,
  lazy = false,
  className,
}: {
  harness: Harness;
  size?: number;
  lazy?: boolean;
  className?: string;
}) {
  return (
    <img
      className={cx("harness-mark", className)}
      src={markSrcFor(harness.id)}
      alt=""
      width={size}
      height={size}
      loading={lazy ? "lazy" : undefined}
      decoding="async"
    />
  );
}
