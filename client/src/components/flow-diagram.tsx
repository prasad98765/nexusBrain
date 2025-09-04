import { useEffect, useRef, useState } from "react";

interface FlowDiagramProps {
  steps: string[];
  className?: string;
  variant?: "horizontal" | "vertical";
}

export function FlowDiagram({
  steps,
  className = "",
  variant = "horizontal",
}: FlowDiagramProps) {
  const isHorizontal = variant === "horizontal";

  const [textSizes, setTextSizes] = useState<{ width: number; height: number }[]>(
    []
  );

  const textRefs = useRef<(SVGTextElement | null)[]>([]);

  // Measure text width after render
  useEffect(() => {
    const sizes = textRefs.current.map((el) => {
      if (el) {
        const bbox = el.getBBox();
        return { width: bbox.width, height: bbox.height };
      }
      return { width: 70, height: 20 }; // fallback
    });
    setTextSizes(sizes);
  }, [steps]);

  const paddingX = 20;
  const paddingY = 10;
  const gap = 40;

  // calculate total diagram size
  let totalWidth = 0;
  let totalHeight = 0;

  if (isHorizontal) {
    totalWidth = steps.reduce((acc, _, i) => {
      const size = textSizes[i] || { width: 70, height: 20 };
      const boxW = size.width + paddingX * 2;
      return acc + boxW + (i < steps.length - 1 ? gap : 0);
    }, 20); // initial margin
    totalHeight = 120;
  } else {
    totalHeight = steps.reduce((acc, _, i) => {
      const size = textSizes[i] || { width: 70, height: 20 };
      const boxH = size.height + paddingY * 2;
      return acc + boxH + (i < steps.length - 1 ? gap : 0);
    }, 20);
    totalWidth = 300;
  }

  return (
    <svg
      width="100%"
      height="auto"
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      className={`w-full h-auto ${className}`}
      style={{ backgroundColor: "black", display: "block" }}
      preserveAspectRatio="xMinYMid meet"
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="10"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="white" />
        </marker>
      </defs>

      {steps.map((step, index) => {
        const size = textSizes[index] || { width: 70, height: 20 };
        const boxWidth = size.width + paddingX * 2;
        const boxHeight = size.height + paddingY * 2;

        const x = isHorizontal
          ? 20 +
            steps.slice(0, index).reduce((acc, _, j) => {
              const prevSize = textSizes[j] || { width: 70, height: 20 };
              return acc + prevSize.width + paddingX * 2 + gap;
            }, 0)
          : 70;

        const y = isHorizontal
          ? 40
          : 20 +
            steps.slice(0, index).reduce((acc, _, j) => {
              const prevSize = textSizes[j] || { height: 20, width: 70 };
              return acc + prevSize.height + paddingY * 2 + gap;
            }, 0);

        const isLast = index === steps.length - 1;

        return (
          <g key={index}>
            {/* Box */}
            <rect
              x={x}
              y={y}
              width={boxWidth}
              height={boxHeight}
              fill="black"
              stroke="white"
              strokeWidth="2"
              rx="5"
            />

            {/* Text */}
            <text
              ref={(el) => (textRefs.current[index] = el)}
              x={x + boxWidth / 2}
              y={y + boxHeight / 2 + size.height / 4}
              textAnchor="middle"
              fill="white"
              fontSize="14"
              fontFamily="Inter, sans-serif"
            >
              {step}
            </text>

            {/* Arrow */}
            {!isLast && (
              <path
                d={
                  isHorizontal
                    ? `M${x + boxWidth} ${y + boxHeight / 2} L${
                        x + boxWidth + gap
                      } ${y + boxHeight / 2}`
                    : `M${x + boxWidth / 2} ${y + boxHeight} L${
                        x + boxWidth / 2
                      } ${y + boxHeight + gap}`
                }
                stroke="white"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
