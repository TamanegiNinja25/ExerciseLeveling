/**
 * Blue-flame visual effects built on RN `Animated` (no extra native deps).
 * `useFlameMode()` decides how much to show: the in-app toggle turns effects
 * off entirely, and the OS "reduce motion" setting keeps the flames but
 * freezes them (no flicker, no embers).
 */
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useGame } from '../store/useGame';

const ND = Platform.OS !== 'web'; // native driver isn't available on web

const BACKDROP = '#0B0D14';

export const FLAME = {
  core: '#E0F2FE',
  bright: '#7DD3FC',
  mid: '#38BDF8',
  deep: '#2563EB',
  shadow: '#1E3A8A',
};

export type FlameMode = 'animated' | 'static' | 'off';

export function useFlameMode(): FlameMode {
  const setting = useGame((s) => s.settings.effects !== false);
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => alive && setReduceMotion(v)).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  return !setting ? 'off' : reduceMotion ? 'static' : 'animated';
}

/** A 0→1→0 loop with its own phase so neighbouring flames never sync up. */
function useOscillator(duration: number, delay: number, run: boolean) {
  const v = useRef(new Animated.Value(run ? 0 : 0.6)).current;
  useEffect(() => {
    if (!run) {
      v.setValue(0.6);
      return;
    }
    const ease = Easing.inOut(Easing.sin);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration, easing: ease, useNativeDriver: ND }),
        Animated.timing(v, { toValue: 0, duration, easing: ease, useNativeDriver: ND }),
      ]),
    );
    const t = setTimeout(() => loop.start(), delay);
    return () => {
      clearTimeout(t);
      loop.stop();
    };
  }, [run]);
  return v;
}

/**
 * A single flame tongue: a teardrop (square with one sharp corner rotated
 * 45° so the point faces up), stretched vertically and filled with a
 * deep-blue → bright gradient. It flickers by scaling from its base.
 */
function Tongue({ left, bottom, width, height, duration, delay, core, run }: {
  left: number; bottom: number; width: number; height: number;
  duration: number; delay: number; core?: boolean; run: boolean;
}) {
  const t = useOscillator(duration, delay, run);
  const side = width / Math.SQRT2;
  const stretch = height / width;
  const scaleY = t.interpolate({ inputRange: [0, 1], outputRange: [0.78, 1.12] });
  // Keep the base anchored while scaling around the centre.
  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [height * 0.11, -height * 0.06] });
  const scaleX = t.interpolate({ inputRange: [0, 1], outputRange: [1.06, 0.9] });
  const opacity = t.interpolate({ inputRange: [0, 1], outputRange: core ? [0.75, 1] : [0.55, 0.95] });
  const colors = core
    ? (['rgba(224,242,254,0)', FLAME.core, FLAME.bright] as const)
    : (['rgba(125,211,252,0)', FLAME.mid, FLAME.deep] as const);

  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: 'absolute', left, bottom, width, height, opacity, transform: [{ translateY }, { scaleX }, { scaleY }] }}
    >
      <View style={{ position: 'absolute', bottom: 0, left: 0, width, height: width, transform: [{ scaleY: stretch }, { translateY: -width * 0.18 }] }}>
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: side,
            height: side,
            marginLeft: (width - side) / 2,
            marginTop: (width - side) / 2,
            borderTopLeftRadius: 0,
            borderTopRightRadius: side,
            borderBottomLeftRadius: side,
            borderBottomRightRadius: side,
            transform: [{ rotate: '45deg' }],
          }}
        />
      </View>
    </Animated.View>
  );
}

/** Rising spark particles. */
export function Embers({ count = 10, width, height, run = true }: { count?: number; width: number; height: number; run?: boolean }) {
  const enabled = useFlameMode() === 'animated' && run;
  const seeds = useMemo(
    () => Array.from({ length: count }, (_, i) => ({
      x: ((i * 37) % 100) / 100,
      size: 2 + ((i * 13) % 3),
      duration: 1800 + ((i * 271) % 1600),
      delay: (i * 397) % 2200,
      drift: (((i * 53) % 21) - 10) * 1.5,
    })),
    [count],
  );
  if (!enabled) return null;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
      {seeds.map((s, i) => <Ember key={i} {...s} width={width} height={height} />)}
    </View>
  );
}

function Ember({ x, size, duration, delay, drift, width, height }: {
  x: number; size: number; duration: number; delay: number; drift: number; width: number; height: number;
}) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(t, { toValue: 1, duration, easing: Easing.out(Easing.quad), useNativeDriver: ND }));
    const timer = setTimeout(() => loop.start(), delay);
    return () => {
      clearTimeout(timer);
      loop.stop();
    };
  }, []);
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x * width,
        bottom: 0,
        width: size,
        height: size,
        borderRadius: size,
        backgroundColor: FLAME.bright,
        opacity: t.interpolate({ inputRange: [0, 0.15, 0.7, 1], outputRange: [0, 1, 0.6, 0] }),
        transform: [
          { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, -height]}) },
          { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, drift] }) },
        ],
      }}
    />
  );
}

/** Pulsing blue glow disc. */
function Glow({ size, run }: { size: number; run: boolean }) {
  const t = useOscillator(1400, 0, run);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size,
        backgroundColor: FLAME.mid,
        opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.08, 0.2] }),
        transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.04] }) }],
      }}
    />
  );
}

/**
 * Blue flames licking up around a circular child (e.g. the avatar).
 * `power` 0–1 controls how tall and dense the fire burns.
 */
export function FlameAura({ size, power = 0.5, children }: { size: number; power?: number; children: ReactNode }) {
  const mode = useFlameMode();
  const enabled = mode !== 'off';
  const run = mode === 'animated';
  const p = Math.max(0, Math.min(1, power));
  const box = size * 1.7;
  const count = 7 + Math.round(p * 4);
  const tongues = useMemo(() => {
    const out: { left: number; bottom: number; width: number; height: number; duration: number; delay: number; core: boolean }[] = [];
    const mid = box / 2; // flames rise from the middle of the circle so only the crown shows
    for (let i = 0; i < count; i++) {
      const f = count === 1 ? 0.5 : i / (count - 1); // 0..1 across the circle
      const arc = Math.sin(f * Math.PI); // taller in the middle
      const w = size * (0.3 + 0.12 * arc);
      const h = size * (0.5 + (0.45 + 0.5 * p) * arc);
      const cx = mid + (f - 0.5) * size * 1.2;
      out.push({ left: cx - w / 2, bottom: mid - size * 0.15, width: w, height: h, duration: 380 + ((i * 97) % 260), delay: (i * 131) % 400, core: false });
    }
    // Bright inner cores just behind the centre.
    [-0.16, 0.16].forEach((dx, j) => {
      const w = size * 0.3;
      out.push({ left: mid + dx * size - w / 2, bottom: mid, width: w, height: size * (0.62 + 0.35 * p), duration: 300 + j * 90, delay: j * 120, core: true });
    });
    return out;
  }, [size, count, p, box]);

  return (
    <View style={{ width: box, height: box, alignItems: 'center', justifyContent: 'center', marginHorizontal: -(box - size) / 2, marginVertical: -(box - size) / 2 }}>
      {enabled && (
        <>
          <Glow size={size * 1.45} run={run} />
          {tongues.map((t, i) => <Tongue key={i} {...t} run={run} />)}
          <Embers count={6 + Math.round(p * 6)} width={box} height={box * 0.9} />
        </>
      )}
      {/* Opaque backdrop so the fire stays behind semi-transparent content. */}
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: BACKDROP, alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </View>
    </View>
  );
}

/**
 * Full-screen celebration: a wall of blue fire rises from the bottom while
 * the title flares in. Auto-dismisses; tap to skip.
 */
export function FlameBurst({ title, subtitle, onDone }: { title: string; subtitle?: string; onDone: () => void }) {
  const { width, height } = useWindowDimensions();
  const mode = useFlameMode();
  const enabled = mode !== 'off';
  const intro = useRef(new Animated.Value(0)).current;
  const doneRef = useRef(false);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    Animated.timing(intro, { toValue: 0, duration: 280, useNativeDriver: ND }).start(onDone);
  };

  useEffect(() => {
    Animated.spring(intro, { toValue: 1, friction: 6, tension: 60, useNativeDriver: ND }).start();
    const t = setTimeout(finish, 2800);
    return () => clearTimeout(t);
  }, []);

  const wall = useMemo(() => {
    const n = 12;
    return Array.from({ length: n }, (_, i) => {
      const w = width / (n - 5); // wide and overlapping, so it reads as one wall of fire
      const h = height * (0.22 + 0.16 * Math.abs(Math.sin(i * 1.7)));
      return { left: (i - 1) * (width / (n - 2)), bottom: -h * 0.12, width: w, height: h, duration: 320 + ((i * 83) % 240), delay: (i * 61) % 300, core: i % 3 === 1 };
    });
  }, [width, height]);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: intro, zIndex: 100 }]}>
      <Pressable onPress={finish} style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(2,6,23,0.88)', alignItems: 'center', justifyContent: 'center' }]}>
        {enabled && (
          <>
            <LinearGradient colors={['rgba(37,99,235,0)', 'rgba(37,99,235,0.35)']} style={[StyleSheet.absoluteFill, { top: height * 0.45 }]} />
            {wall.map((t, i) => <Tongue key={i} {...t} run={mode === 'animated'} />)}
            <Embers count={24} width={width} height={height * 0.85} />
          </>
        )}
        <Animated.View style={{ alignItems: 'center', transform: [{ scale: intro.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] }}>
          <Text style={burst.title}>{title}</Text>
          {subtitle ? <Text style={burst.subtitle}>{subtitle}</Text> : null}
          <Text style={burst.hint}>Tap to continue</Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

/** Text with a soft blue flame glow. */
export function GlowText({ children, size = 24, style }: { children: ReactNode; size?: number; style?: object }) {
  return <Text style={[{ color: FLAME.core, fontSize: size, fontWeight: '900', letterSpacing: 2, textShadowColor: FLAME.mid, textShadowRadius: size / 2, textShadowOffset: { width: 0, height: 0 } }, style]}>{children}</Text>;
}

const burst = StyleSheet.create({
  title: {
    color: FLAME.core,
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: 4,
    textAlign: 'center',
    textShadowColor: FLAME.mid,
    textShadowRadius: 24,
    textShadowOffset: { width: 0, height: 0 },
  },
  subtitle: { color: FLAME.bright, fontSize: 16, fontWeight: '700', marginTop: 10, textAlign: 'center', paddingHorizontal: 24 },
  hint: { color: 'rgba(224,242,254,0.5)', fontSize: 12, fontWeight: '700', marginTop: 28, letterSpacing: 1 },
});
