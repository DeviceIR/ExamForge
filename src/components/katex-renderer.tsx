"use client";

import * as React from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

export default function KatexRenderer({
  children,
  display = false,
}: {
  children: string;
  display?: boolean;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  React.useEffect(() => {
    if (!ref.current) return;
    try {
      katex.render(children, ref.current, {
        throwOnError: false,
        displayMode: display,
        output: "html",
      });
    } catch {
      if (ref.current) ref.current.textContent = children;
    }
  }, [children, display]);
  return <span ref={ref} className={display ? "block" : "inline"} />;
}
