'use client';

import { Text, Group, Circle, Line, Rect } from 'react-konva';
import { CursorPosition } from '@/types/canvas';

interface CollaboratorCursorsProps {
  cursors: Map<string, CursorPosition>;
  scale: number;
  position: { x: number; y: number };
}

export default function CollaboratorCursors({ cursors, scale, position }: CollaboratorCursorsProps) {
  return (
    <>
      {Array.from(cursors.values()).map(({ userId, x, y, user }) => {
        // Convert from screen space to canvas space for display
        const cx = (x - position.x) / scale;
        const cy = (y - position.y) / scale;

        const color = user?.color ?? '#C77B5A';
        const name = user?.name ?? 'Someone';
        const activity = user?.activity ?? 'Idle';
        const labelText = `${name} · ${activity}`;
        const pillWidth = Math.max(64, labelText.length * 6.2 + 16);

        return (
          <Group key={userId} x={cx} y={cy} listening={false}>
            {/* Trail / ambient pulse */}
            <Circle
              x={0}
              y={0}
              radius={10 / scale}
              fill={color}
              opacity={0.15}
            />
            <Circle
              x={0}
              y={0}
              radius={4 / scale}
              fill={color}
              opacity={0.7}
            />

            {/* Cursor arrow SVG path converted to Konva polygon */}
            <Line
              points={[0, 0, 14, 8, 6, 10, 8, 17, 5, 17, 2, 10, 0, 11, 0, 0]}
              closed
              fill={color}
              stroke="#FFFFFF"
              strokeWidth={1}
              scale={{ x: 1 / scale, y: 1 / scale }}
              shadowColor="rgba(26, 15, 8, 0.25)"
              shadowBlur={4}
              shadowOffsetY={1}
            />

            {/* Name & activity badge */}
            <Group
              x={16 / scale}
              y={14 / scale}
              scale={{ x: 1 / scale, y: 1 / scale }}
            >
              <Rect
                x={0}
                y={0}
                width={pillWidth}
                height={18}
                fill={color}
                cornerRadius={9}
                shadowColor="rgba(26, 15, 8, 0.2)"
                shadowBlur={6}
                shadowOffsetY={2}
              />
              <Text
                x={8}
                y={3.5}
                text={labelText}
                fontSize={10}
                fontFamily="Inter, sans-serif"
                fontStyle="600"
                fill="#FAF6F0"
                align="left"
              />
            </Group>
          </Group>
        );
      })}
    </>
  );
}
