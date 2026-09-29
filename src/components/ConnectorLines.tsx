import React, { useEffect, useState, useCallback } from 'react';

interface ConnectionPoint {
  x: number;
  y: number;
}

interface PurpleConnection {
  pathD: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface GreenConnection {
  id: string;
  pathD: string;
  endPoint: ConnectionPoint;
}

interface ConnectorLinesProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  selectedModuleId: string | null;
  activeTopicId: string | null;
  greenArtifactIds: string[];
  isBluePopped: boolean;
  isGreenPopped: boolean;
}

// V1 Connecting Terminal Circle Component (with live pulsing beacon halo)
const TerminalCircle: React.FC<{
  x: number;
  y: number;
  color: string;
  pulseDelay?: string;
}> = ({ x, y, color, pulseDelay = '0s' }) => (
  <g>
    {/* Outer pulsing halo ring */}
    <circle cx={x} cy={y} r="7" fill={color} opacity="0.3">
      <animate
        attributeName="r"
        values="5;9;5"
        dur="2.4s"
        begin={pulseDelay}
        repeatCount="indefinite"
      />
      <animate
        attributeName="opacity"
        values="0.35;0.08;0.35"
        dur="2.4s"
        begin={pulseDelay}
        repeatCount="indefinite"
      />
    </circle>
    {/* Solid terminal node circle with crisp white outline */}
    <circle
      cx={x}
      cy={y}
      r="4.5"
      fill={color}
      stroke="#ffffff"
      strokeWidth="2"
    >
      <animate
        attributeName="r"
        values="4.2;4.8;4.2"
        dur="2.4s"
        begin={pulseDelay}
        repeatCount="indefinite"
      />
    </circle>
  </g>
);

export const ConnectorLines: React.FC<ConnectorLinesProps> = ({
  containerRef,
  selectedModuleId,
  activeTopicId,
  greenArtifactIds,
  isBluePopped,
  isGreenPopped,
}) => {
  const [purpleConnection, setPurpleConnection] = useState<PurpleConnection | null>(null);
  const [greenConnections, setGreenConnections] = useState<GreenConnection[]>([]);
  const [topicStartPoint, setTopicStartPoint] = useState<ConnectionPoint | null>(null);

  const updateCoordinates = useCallback(() => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();

    // 1. Purple Module -> Blue Key Topics Roadmap Connection Curve
    if (isBluePopped && selectedModuleId) {
      const leftCardEl = document.getElementById(`left-module-${selectedModuleId}`);
      const blueCardEl = document.getElementById('center-blue-card');

      if (leftCardEl && blueCardEl) {
        const leftRect = leftCardEl.getBoundingClientRect();
        const blueRect = blueCardEl.getBoundingClientRect();

        const startX = leftRect.right - containerRect.left;
        const startY = leftRect.top + leftRect.height / 2 - containerRect.top;

        const endX = blueRect.left - containerRect.left;
        // Clamp endY to smoothly enter the blue card at the level of the module or top section
        const endY = Math.max(
          blueRect.top + 32 - containerRect.top,
          Math.min(startY, blueRect.bottom - 32 - containerRect.top)
        );

        const deltaX = Math.max(24, (endX - startX) * 0.5);
        const pathD = `M ${startX} ${startY} C ${startX + deltaX} ${startY}, ${endX - deltaX} ${endY}, ${endX} ${endY}`;

        setPurpleConnection({
          pathD,
          startX,
          startY,
          endX,
          endY,
        });
      } else {
        setPurpleConnection(null);
      }
    } else {
      setPurpleConnection(null);
    }

    // 2. Blue Topic -> Green Study Note Cards Connection Curves
    if (isGreenPopped && activeTopicId && greenArtifactIds.length > 0) {
      const blueTopicEl = document.getElementById(`blue-topic-${activeTopicId}`);

      if (blueTopicEl) {
        const topicRect = blueTopicEl.getBoundingClientRect();
        const startX = topicRect.right - containerRect.left;
        const startY = topicRect.top + topicRect.height / 2 - containerRect.top;

        setTopicStartPoint({ x: startX, y: startY });

        const paths: GreenConnection[] = [];

        greenArtifactIds.forEach((artifactId) => {
          const greenEl = document.getElementById(`green-artifact-${artifactId}`);
          if (!greenEl) return;

          const greenRect = greenEl.getBoundingClientRect();
          // Dock connection circle right at the card border
          const endX = greenRect.left - containerRect.left;
          const endY = greenRect.top + greenRect.height / 2 - containerRect.top;

          const dx = endX - startX;
          const cp1x = startX + dx * 0.45;
          const cp1y = startY;
          const cp2x = endX - dx * 0.45;
          const cp2y = endY;

          const pathD = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;

          paths.push({
            id: artifactId,
            pathD,
            endPoint: { x: endX, y: endY },
          });
        });

        setGreenConnections(paths);
      } else {
        setTopicStartPoint(null);
        setGreenConnections([]);
      }
    } else {
      setTopicStartPoint(null);
      setGreenConnections([]);
    }
  }, [containerRef, selectedModuleId, activeTopicId, greenArtifactIds, isBluePopped, isGreenPopped]);

  // Recalculate across spring settles, layout transitions, resizes, and scrolling
  useEffect(() => {
    updateCoordinates();

    const handleResize = () => updateCoordinates();
    const handleScroll = () => updateCoordinates();

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);

    const f1 = requestAnimationFrame(updateCoordinates);
    const t1 = setTimeout(updateCoordinates, 60);
    const t2 = setTimeout(updateCoordinates, 150);
    const t3 = setTimeout(updateCoordinates, 300);
    const t4 = setTimeout(updateCoordinates, 500);

    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updateCoordinates();
      });
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
      cancelAnimationFrame(f1);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [updateCoordinates, containerRef]);

  // If nothing is connected, do not render SVG elements
  if (!purpleConnection && greenConnections.length === 0) {
    return null;
  }

  return (
    <svg
      className="absolute inset-0 pointer-events-none w-full h-full z-10 overflow-visible"
      aria-hidden="true"
    >
      {/* 1. Purple Module -> Blue Roadmap Connection Curve (Thicker, Pulsing, Connecting Circles) */}
      {purpleConnection && (
        <g className="transition-opacity duration-200">
          <path
            d={purpleConnection.pathD}
            fill="none"
            stroke="#9333ea"
            strokeWidth="3.5"
            strokeDasharray="6 4"
            strokeLinecap="round"
          >
            <animate
              attributeName="stroke-opacity"
              values="0.65;1;0.65"
              dur="2.4s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="stroke-width"
              values="3.2;3.8;3.2"
              dur="2.4s"
              repeatCount="indefinite"
            />
          </path>

          {/* Starting connecting circle on purple module */}
          <TerminalCircle
            x={purpleConnection.startX}
            y={purpleConnection.startY}
            color="#9333ea"
            pulseDelay="0s"
          />

          {/* Destination connecting circle on blue roadmap */}
          <TerminalCircle
            x={purpleConnection.endX}
            y={purpleConnection.endY}
            color="#2563eb"
            pulseDelay="0.4s"
          />
        </g>
      )}

      {/* 2. Blue Card Active Topic -> Green Artifact Cards Connection Curves (Thicker, Pulsing, Connecting Circles) */}
      {greenConnections.length > 0 && (
        <g className="transition-opacity duration-200">
          {/* Green Connecting Lines */}
          {greenConnections.map((item, idx) => (
            <path
              key={item.id}
              d={item.pathD}
              fill="none"
              stroke="#059669"
              strokeWidth="3.5"
              strokeLinecap="round"
            >
              <animate
                attributeName="stroke-opacity"
                values="0.65;1;0.65"
                dur="2.2s"
                begin={`${idx * 0.15}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="stroke-width"
                values="3.2;3.8;3.2"
                dur="2.2s"
                begin={`${idx * 0.15}s`}
                repeatCount="indefinite"
              />
            </path>
          ))}

          {/* Origin connecting circle on active blue topic */}
          {topicStartPoint && (
            <TerminalCircle
              x={topicStartPoint.x}
              y={topicStartPoint.y}
              color="#2563eb"
              pulseDelay="0s"
            />
          )}

          {/* Destination connecting circles on each green artifact card (NO arrows) */}
          {greenConnections.map((item, idx) => (
            <TerminalCircle
              key={`term-${item.id}`}
              x={item.endPoint.x}
              y={item.endPoint.y}
              color="#059669"
              pulseDelay={`${0.2 + idx * 0.2}s`}
            />
          ))}
        </g>
      )}
    </svg>
  );
};
