import { View } from 'react-native';
import Svg, { Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../../theme';

type Bar = { label: string; value: number; target?: number };

/** Minimal bar chart (time per day/week/month). Values are minutes; the axis shows hours. */
/** `target` (optional) draws a dashed line per bar, e.g. expected work hours. */
export function AppBarChart({
  bars,
  height = 180,
  width = 320,
  color,
  targetColor = '#f97316',
}: {
  bars: Bar[];
  height?: number;
  width?: number;
  color?: string;
  targetColor?: string;
}) {
  const { colors } = useTheme();
  const pad = { l: 28, r: 8, t: 10, b: 22 };
  const max = Math.max(60, ...bars.map((b) => Math.max(b.value, b.target ?? 0)));
  const maxH = Math.ceil(max / 60);
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const slot = innerW / Math.max(1, bars.length);
  const barW = Math.min(28, slot * 0.6);
  const ticks = [...new Set([0, Math.round(maxH / 2), maxH])];
  return (
    <View accessibilityRole="image" accessibilityLabel={bars.map((b) => `${b.label} ${Math.round((b.value / 60) * 10) / 10} hours`).join(', ')}>
      <Svg width={width} height={height}>
        {ticks.map((t) => {
          const y = pad.t + innerH - (t / maxH) * innerH;
          return <Line key={`g${t}`} x1={pad.l} x2={width - pad.r} y1={y} y2={y} stroke={colors.border} strokeWidth={1} />;
        })}
        {ticks.map((t) => (
          <SvgText key={`t${t}`} x={pad.l - 6} y={pad.t + innerH - (t / maxH) * innerH + 4} fontSize={10} fill={colors.textMuted} textAnchor="end">
            {`${t}h`}
          </SvgText>
        ))}
        {bars.map((b, i) => {
          const h = (b.value / (maxH * 60)) * innerH;
          const x = pad.l + slot * i + (slot - barW) / 2;
          return <Rect key={`b${i}`} x={x} y={pad.t + innerH - h} width={barW} height={Math.max(h, b.value ? 2 : 0)} rx={4} fill={color ?? colors.accent} />;
        })}
        {bars.some((b) => b.target != null) ? (
          <Polyline
            points={bars.map((b, i) => `${pad.l + slot * i + slot / 2},${pad.t + innerH - ((b.target ?? 0) / (maxH * 60)) * innerH}`).join(' ')}
            fill="none"
            stroke={targetColor}
            strokeWidth={2}
            strokeDasharray="5,4"
          />
        ) : null}
        {bars.map((b, i) => (
          <SvgText key={`l${i}`} x={pad.l + slot * i + slot / 2} y={height - 6} fontSize={10} fill={colors.textMuted} textAnchor="middle">
            {b.label}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}
