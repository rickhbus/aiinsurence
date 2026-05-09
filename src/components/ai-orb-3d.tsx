"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Html } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { Group, Mesh } from "three";
import styles from "./ai-orb-3d.module.css";

export type AIOrb3DState = "idle" | "listening" | "thinking" | "speaking" | "emergency";

type AIOrb3DProps = {
  state?: AIOrb3DState;
  mode?: "medical" | "insurance" | "neutral";
  className?: string;
};

const stateLabel: Record<AIOrb3DState, string> = {
  idle: "Ready",
  listening: "Listening",
  thinking: "Thinking",
  speaking: "Explaining",
  emergency: "Emergency",
};

const stateConfig = {
  idle: {
    color: "#14b8a6",
    secondary: "#2563eb",
    speed: 0.35,
    scale: 1,
    sparkles: 22,
  },
  listening: {
    color: "#06b6d4",
    secondary: "#2563eb",
    speed: 0.65,
    scale: 1.04,
    sparkles: 34,
  },
  thinking: {
    color: "#2563eb",
    secondary: "#7c3aed",
    speed: 1.15,
    scale: 1.02,
    sparkles: 46,
  },
  speaking: {
    color: "#14b8a6",
    secondary: "#38bdf8",
    speed: 0.9,
    scale: 1.06,
    sparkles: 38,
  },
  emergency: {
    color: "#dc2626",
    secondary: "#f97316",
    speed: 1.45,
    scale: 1.07,
    sparkles: 54,
  },
} satisfies Record<
  AIOrb3DState,
  {
    color: string;
    secondary: string;
    speed: number;
    scale: number;
    sparkles: number;
  }
>;

export function AIOrb3D({ state = "idle", mode = "medical", className = "" }: AIOrb3DProps) {
  const config = stateConfig[state];
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    function handleChange(event: MediaQueryListEvent) {
      setPrefersReducedMotion(event.matches);
    }

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return (
    <section
      className={`${styles.shell} ${styles[mode]} ${styles[state]} ${className}`}
      aria-label={`3D AI assistant: ${stateLabel[state]}`}
    >
      <div className={styles.statusPill}>
        <span />
        {stateLabel[state]}
      </div>
      <Canvas
        className={styles.canvas}
        camera={{ position: [0, 0.2, 5.2], fov: 42 }}
        dpr={[1, 1.75]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={1.6} />
          <directionalLight position={[3, 4, 5]} intensity={2.4} />
          <pointLight position={[-3, -1, 3]} intensity={2.4} color={config.color} />
          <pointLight position={[3, 2, -2]} intensity={1.8} color={config.secondary} />
          <AIHumanoidModel state={state} config={config} reducedMotion={prefersReducedMotion} />
          <ContactShadows position={[0, -1.85, 0]} opacity={0.22} scale={5} blur={2.6} far={4} />
          <Environment preset="city" />
        </Suspense>
      </Canvas>
      <p className={styles.safetyNote}>AI healthcare navigation only. Not a diagnosis.</p>
    </section>
  );
}

function AIHumanoidModel({
  state,
  config,
  reducedMotion,
}: {
  state: AIOrb3DState;
  config: {
    color: string;
    secondary: string;
    speed: number;
    scale: number;
    sparkles: number;
  };
  reducedMotion: boolean;
}) {
  const groupRef = useRef<Group | null>(null);
  const headRef = useRef<Mesh | null>(null);
  const mouthRef = useRef<Mesh | null>(null);
  const elapsedRef = useRef(0);

  const isEmergency = state === "emergency";
  const isSpeaking = state === "speaking";
  const isListening = state === "listening";
  const isThinking = state === "thinking";

  const glassMaterial = useMemo(
    () => ({
      color: config.color,
      emissive: config.color,
      emissiveIntensity: isEmergency ? 0.35 : 0.18,
      roughness: 0.08,
      metalness: 0.05,
      transmission: 0.68,
      thickness: 1.4,
      transparent: true,
      opacity: 0.78,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
    }),
    [config.color, isEmergency],
  );

  useFrame((_state, delta) => {
    if (reducedMotion) {
      if (groupRef.current) {
        groupRef.current.position.y = 0;
        groupRef.current.rotation.y = 0;
        groupRef.current.scale.setScalar(config.scale);
      }

      if (headRef.current) {
        headRef.current.rotation.set(0, 0, 0);
      }

      if (mouthRef.current) {
        mouthRef.current.scale.set(1, 1, 1);
      }

      return;
    }

    elapsedRef.current += delta;
    const time = elapsedRef.current;

    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(time * 1.15) * 0.08;
      groupRef.current.rotation.y = Math.sin(time * 0.45) * 0.12;
      groupRef.current.scale.setScalar(config.scale + Math.sin(time * 2.2) * 0.01);
    }

    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(time * 0.7) * 0.08;
      headRef.current.rotation.x = isListening
        ? -0.08 + Math.sin(time * 0.8) * 0.03
        : Math.sin(time * 0.5) * 0.035;
    }

    if (mouthRef.current) {
      const pulse = isSpeaking ? 1 + Math.sin(time * 9) * 0.55 : 1;
      mouthRef.current.scale.set(1, pulse, 1);
    }
  });

  const glowColor = isEmergency ? "#fee2e2" : "#ffffff";

  return (
    <group ref={groupRef} position={[0, -0.15, 0]}>
        <mesh position={[0, 0.45, -0.35]} scale={[1.65, 1.9, 0.08]}>
          <sphereGeometry args={[1, 64, 64]} />
          <meshBasicMaterial color={config.color} transparent opacity={isEmergency ? 0.16 : 0.1} />
        </mesh>

        <mesh ref={headRef} position={[0, 0.75, 0]}>
          <sphereGeometry args={[0.72, 96, 96]} />
          <meshPhysicalMaterial {...glassMaterial} />
        </mesh>

        <mesh position={[0, 0.73, 0.08]} scale={[0.48, 0.5, 0.48]}>
          <sphereGeometry args={[1, 64, 64]} />
          <meshStandardMaterial
            color={config.secondary}
            emissive={config.secondary}
            emissiveIntensity={0.44}
            transparent
            opacity={0.24}
            roughness={0.12}
          />
        </mesh>

        <group position={[0, 0.78, 0.73]}>
          <mesh position={[-0.22, 0.08, 0]} scale={[1.2, 0.55, 1]}>
            <sphereGeometry args={[0.052, 24, 24]} />
            <meshBasicMaterial color={glowColor} transparent opacity={0.82} />
          </mesh>

          <mesh position={[0.22, 0.08, 0]} scale={[1.2, 0.55, 1]}>
            <sphereGeometry args={[0.052, 24, 24]} />
            <meshBasicMaterial color={glowColor} transparent opacity={0.82} />
          </mesh>

          <mesh ref={mouthRef} position={[0, -0.18, 0]}>
            <boxGeometry args={[0.24, 0.025, 0.015]} />
            <meshBasicMaterial color={glowColor} transparent opacity={0.58} />
          </mesh>
        </group>

        <mesh position={[0, -0.05, 0]} scale={[0.28, 0.5, 0.28]}>
          <capsuleGeometry args={[0.38, 0.55, 24, 48]} />
          <meshPhysicalMaterial {...glassMaterial} opacity={0.52} />
        </mesh>

        <mesh position={[0, -0.72, 0]} scale={[1.35, 0.42, 0.58]}>
          <sphereGeometry args={[1, 96, 48]} />
          <meshPhysicalMaterial {...glassMaterial} opacity={0.5} />
        </mesh>

        <mesh position={[0, -0.54, 0.53]}>
          <sphereGeometry args={[0.08, 32, 32]} />
          <meshBasicMaterial color={glowColor} transparent opacity={isThinking ? 0.95 : 0.68} />
        </mesh>

        <mesh rotation={[1.16, 0.08, 0]}>
          <torusGeometry args={[1.28, 0.008, 16, 180]} />
          <meshBasicMaterial color={config.color} transparent opacity={0.45} />
        </mesh>

        <mesh rotation={[0.74, 0.75, 0.2]}>
          <torusGeometry args={[1.52, 0.007, 16, 180]} />
          <meshBasicMaterial color={config.secondary} transparent opacity={0.28} />
        </mesh>

        {(isListening || isThinking) && (
          <mesh position={[0, 0.75, 0]} rotation={[1.35, 0, 0]}>
            <torusGeometry args={[0.96, 0.01, 16, 180]} />
            <meshBasicMaterial color={config.color} transparent opacity={0.62} />
          </mesh>
        )}

        {isEmergency ? (
          <Html center position={[0, -1.55, 0]}>
            <div className={styles.emergencyBadge}>Call 999 / A&amp;E</div>
          </Html>
        ) : null}
    </group>
  );
}
