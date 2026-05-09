"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Float, Html, Sparkles } from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
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
          <AIOrbModel state={state} config={config} />
          <Sparkles
            count={config.sparkles}
            scale={[4.2, 3.2, 4.2]}
            size={2.2}
            speed={config.speed}
            color={config.color}
            opacity={0.42}
          />
          <ContactShadows position={[0, -1.85, 0]} opacity={0.22} scale={5} blur={2.6} far={4} />
          <Environment preset="city" />
        </Suspense>
      </Canvas>
      <p className={styles.safetyNote}>AI healthcare navigation only. Not a diagnosis.</p>
    </section>
  );
}

function AIOrbModel({
  state,
  config,
}: {
  state: AIOrb3DState;
  config: {
    color: string;
    secondary: string;
    speed: number;
    scale: number;
    sparkles: number;
  };
}) {
  const groupRef = useRef<Group | null>(null);
  const coreRef = useRef<Mesh | null>(null);
  const ringOneRef = useRef<Mesh | null>(null);
  const ringTwoRef = useRef<Mesh | null>(null);
  const ringThreeRef = useRef<Mesh | null>(null);
  const isEmergency = state === "emergency";
  const isSpeaking = state === "speaking";
  const materialProps = useMemo(
    () => ({
      color: config.color,
      emissive: config.color,
      emissiveIntensity: isEmergency ? 0.48 : 0.28,
      roughness: 0.18,
      metalness: 0.08,
      transmission: 0.55,
      thickness: 1.2,
      transparent: true,
      opacity: 0.92,
    }),
    [config.color, isEmergency],
  );

  useFrame((clock) => {
    const time = clock.clock.elapsedTime;

    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(time * 0.35) * 0.18;
      groupRef.current.rotation.x = Math.sin(time * 0.25) * 0.08;
      groupRef.current.position.y = Math.sin(time * 1.1) * 0.08;
      groupRef.current.scale.setScalar(
        config.scale + Math.sin(time * (isSpeaking ? 5 : 2.2)) * 0.015,
      );
    }

    if (coreRef.current) {
      coreRef.current.rotation.y += 0.004 * config.speed;
      coreRef.current.rotation.x += 0.002 * config.speed;
    }

    if (ringOneRef.current) {
      ringOneRef.current.rotation.z += 0.008 * config.speed;
      ringOneRef.current.rotation.x = 1.18;
    }

    if (ringTwoRef.current) {
      ringTwoRef.current.rotation.z -= 0.006 * config.speed;
      ringTwoRef.current.rotation.y = 1.05;
    }

    if (ringThreeRef.current) {
      ringThreeRef.current.rotation.z += 0.004 * config.speed;
      ringThreeRef.current.rotation.x = 0.72;
      ringThreeRef.current.rotation.y = 0.52;
    }
  });

  return (
    <Float
      speed={state === "emergency" ? 2.2 : 1.4}
      rotationIntensity={0.35}
      floatIntensity={0.45}
    >
      <group ref={groupRef}>
        <mesh ref={coreRef}>
          <sphereGeometry args={[1.06, 96, 96]} />
          <meshPhysicalMaterial {...materialProps} />
        </mesh>
        <mesh scale={0.72}>
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
        <mesh position={[-0.32, 0.34, 0.9]} scale={[0.24, 0.12, 0.04]}>
          <sphereGeometry args={[1, 32, 16]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.78} />
        </mesh>
        <mesh ref={ringOneRef}>
          <torusGeometry args={[1.45, 0.012, 16, 160]} />
          <meshBasicMaterial color={config.color} transparent opacity={0.62} />
        </mesh>
        <mesh ref={ringTwoRef}>
          <torusGeometry args={[1.65, 0.01, 16, 160]} />
          <meshBasicMaterial color={config.secondary} transparent opacity={0.42} />
        </mesh>
        <mesh ref={ringThreeRef}>
          <torusGeometry args={[1.86, 0.008, 16, 180]} />
          <meshBasicMaterial color={config.color} transparent opacity={0.26} />
        </mesh>
        <AIFace speaking={isSpeaking} emergency={isEmergency} />
        {isEmergency ? (
          <Html center position={[0, -1.55, 0]}>
            <div className={styles.emergencyBadge}>Call 999 / A&amp;E</div>
          </Html>
        ) : null}
      </group>
    </Float>
  );
}

function AIFace({ speaking, emergency }: { speaking: boolean; emergency: boolean }) {
  const mouthRef = useRef<Mesh | null>(null);

  useFrame((clock) => {
    if (!mouthRef.current) return;

    const time = clock.clock.elapsedTime;
    const scaleX = speaking ? 1 + Math.sin(time * 9) * 0.28 : 1;
    const scaleY = speaking ? 1 + Math.sin(time * 9) * 0.65 : 1;
    mouthRef.current.scale.set(scaleX, scaleY, 1);
  });

  const eyeColor = emergency ? "#fee2e2" : "#ffffff";

  return (
    <group position={[0, 0.02, 1.02]}>
      <mesh position={[-0.28, 0.14, 0]}>
        <sphereGeometry args={[0.055, 24, 24]} />
        <meshBasicMaterial color={eyeColor} />
      </mesh>
      <mesh position={[0.28, 0.14, 0]}>
        <sphereGeometry args={[0.055, 24, 24]} />
        <meshBasicMaterial color={eyeColor} />
      </mesh>
      <mesh ref={mouthRef} position={[0, -0.22, 0]} scale={[1, 0.8, 1]}>
        <boxGeometry args={[0.34, 0.045, 0.02]} />
        <meshBasicMaterial color={eyeColor} transparent opacity={0.88} />
      </mesh>
    </group>
  );
}
