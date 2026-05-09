"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Float,
  Html,
  Sparkles,
} from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import { DoubleSide, type Group, type Mesh } from "three";
import styles from "./ai-orb-3d.module.css";

export type AIOrb3DState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "emergency";

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
    sparkles: 16,
  },
  listening: {
    color: "#06b6d4",
    secondary: "#2563eb",
    speed: 0.65,
    scale: 1.025,
    sparkles: 26,
  },
  thinking: {
    color: "#2563eb",
    secondary: "#7c3aed",
    speed: 1.08,
    scale: 1.015,
    sparkles: 34,
  },
  speaking: {
    color: "#14b8a6",
    secondary: "#38bdf8",
    speed: 0.88,
    scale: 1.035,
    sparkles: 30,
  },
  emergency: {
    color: "#dc2626",
    secondary: "#f97316",
    speed: 1.35,
    scale: 1.045,
    sparkles: 42,
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

export function AIOrb3D({
  state = "idle",
  mode = "medical",
  className = "",
}: AIOrb3DProps) {
  const config = stateConfig[state];

  return (
    <section
      className={`${styles.shell} ${styles[mode] ?? ""} ${styles[state] ?? ""} ${className}`}
      aria-label={`3D AI assistant: ${stateLabel[state]}`}
    >
      <div className={styles.statusPill}>
        <span />
        {stateLabel[state]}
      </div>

      <Canvas
        className={styles.canvas}
        camera={{ position: [0, 0.18, 5.7], fov: 36 }}
        dpr={[1, 1.75]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={1.55} />
          <directionalLight position={[3, 4.2, 5]} intensity={2.4} />
          <pointLight position={[-3.2, 0.2, 3]} intensity={2.1} color={config.color} />
          <pointLight position={[3, 2.6, -2]} intensity={1.45} color={config.secondary} />

          <AIHumanoidBust state={state} config={config} />

          <Sparkles
            count={config.sparkles}
            scale={[3.7, 3.2, 3.7]}
            size={1.55}
            speed={config.speed}
            color={config.color}
            opacity={0.3}
          />

          <ContactShadows
            position={[0, -1.88, 0]}
            opacity={0.18}
            scale={4.25}
            blur={2.9}
            far={4}
          />

          <Environment preset="city" />
        </Suspense>
      </Canvas>

      <p className={styles.safetyNote}>
        AI healthcare navigation only. Not a diagnosis.
      </p>
    </section>
  );
}

function AIHumanoidBust({
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
  const headRef = useRef<Mesh | null>(null);
  const leftEyeRef = useRef<Mesh | null>(null);
  const rightEyeRef = useRef<Mesh | null>(null);
  const mouthRef = useRef<Mesh | null>(null);
  const haloOneRef = useRef<Mesh | null>(null);
  const haloTwoRef = useRef<Mesh | null>(null);

  const isEmergency = state === "emergency";
  const isSpeaking = state === "speaking";
  const isListening = state === "listening";
  const isThinking = state === "thinking";

  const glassMaterial = useMemo(
    () => ({
      color: config.color,
      emissive: config.color,
      emissiveIntensity: isEmergency ? 0.32 : 0.14,
      roughness: 0.055,
      metalness: 0.035,
      transmission: 0.72,
      thickness: 1.85,
      transparent: true,
      opacity: 0.72,
      clearcoat: 1,
      clearcoatRoughness: 0.055,
    }),
    [config.color, isEmergency],
  );

  const bodyMaterial = useMemo(
    () => ({
      ...glassMaterial,
      opacity: 0.42,
      emissiveIntensity: isEmergency ? 0.2 : 0.08,
    }),
    [glassMaterial, isEmergency],
  );

  useFrame((clock) => {
    const time = clock.clock.elapsedTime;

    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(time * 1.05) * 0.055;
      groupRef.current.rotation.y = Math.sin(time * 0.38) * 0.09;
      groupRef.current.scale.setScalar(
        config.scale + Math.sin(time * 1.6) * 0.006,
      );
    }

    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(time * 0.62) * 0.055;
      headRef.current.rotation.x = isListening
        ? -0.06 + Math.sin(time * 0.8) * 0.018
        : Math.sin(time * 0.45) * 0.022;
    }

    if (haloOneRef.current) {
      haloOneRef.current.rotation.z += 0.0042 * config.speed;
    }

    if (haloTwoRef.current) {
      haloTwoRef.current.rotation.z -= 0.0035 * config.speed;
    }

    if (mouthRef.current) {
      const pulse = isSpeaking ? 1 + Math.sin(time * 9) * 0.45 : 1;
      mouthRef.current.scale.set(1, pulse, 1);
    }

    const blink = Math.sin(time * 2.7) > 0.985 ? 0.18 : 1;

    if (leftEyeRef.current) {
      leftEyeRef.current.scale.y = blink;
    }

    if (rightEyeRef.current) {
      rightEyeRef.current.scale.y = blink;
    }
  });

  const faceColor = isEmergency ? "#fee2e2" : "#ffffff";

  return (
    <Float
      speed={isEmergency ? 1.9 : 1.18}
      rotationIntensity={0.14}
      floatIntensity={0.28}
    >
      <group ref={groupRef} position={[0, -0.12, 0]}>
        <mesh position={[0, 0.25, -0.55]} scale={[1.55, 2.05, 0.08]}>
          <sphereGeometry args={[1, 64, 64]} />
          <meshBasicMaterial
            color={config.color}
            transparent
            opacity={isEmergency ? 0.11 : 0.065}
          />
        </mesh>

        <mesh ref={headRef} position={[0, 0.88, 0]} scale={[0.66, 0.88, 0.58]}>
          <sphereGeometry args={[0.82, 96, 96]} />
          <meshPhysicalMaterial {...glassMaterial} />
        </mesh>

        <mesh position={[0, 0.9, 0.02]} scale={[0.24, 0.4, 0.22]}>
          <sphereGeometry args={[1, 48, 48]} />
          <meshStandardMaterial
            color={config.secondary}
            emissive={config.secondary}
            emissiveIntensity={0.42}
            transparent
            opacity={0.22}
            roughness={0.08}
          />
        </mesh>

        <group position={[0, 0.9, 0.49]}>
          <mesh ref={leftEyeRef} position={[-0.18, 0.08, 0]} scale={[1.45, 0.44, 1]}>
            <sphereGeometry args={[0.036, 24, 24]} />
            <meshBasicMaterial color={faceColor} transparent opacity={0.82} />
          </mesh>

          <mesh ref={rightEyeRef} position={[0.18, 0.08, 0]} scale={[1.45, 0.44, 1]}>
            <sphereGeometry args={[0.036, 24, 24]} />
            <meshBasicMaterial color={faceColor} transparent opacity={0.82} />
          </mesh>

          <mesh position={[0, -0.035, 0]} scale={[0.55, 1.05, 0.35]}>
            <sphereGeometry args={[0.034, 16, 16]} />
            <meshBasicMaterial color={faceColor} transparent opacity={0.16} />
          </mesh>

          <mesh ref={mouthRef} position={[0, -0.19, 0]}>
            <boxGeometry args={[0.19, 0.018, 0.01]} />
            <meshBasicMaterial color={faceColor} transparent opacity={0.44} />
          </mesh>
        </group>

        <mesh position={[0, 0.04, 0]} scale={[0.2, 0.48, 0.2]}>
          <capsuleGeometry args={[0.34, 0.52, 24, 48]} />
          <meshPhysicalMaterial {...bodyMaterial} opacity={0.5} />
        </mesh>

        <mesh position={[0, -0.68, 0]} scale={[1, 1, 0.62]}>
          <cylinderGeometry args={[0.46, 0.92, 1.0, 96, 1, true]} />
          <meshPhysicalMaterial
            {...bodyMaterial}
            opacity={0.38}
            side={DoubleSide}
          />
        </mesh>

        <mesh
          position={[-0.54, -0.62, 0]}
          scale={[0.54, 0.2, 0.38]}
          rotation={[0, 0, -0.16]}
        >
          <sphereGeometry args={[1, 64, 32]} />
          <meshPhysicalMaterial {...bodyMaterial} opacity={0.34} />
        </mesh>

        <mesh
          position={[0.54, -0.62, 0]}
          scale={[0.54, 0.2, 0.38]}
          rotation={[0, 0, 0.16]}
        >
          <sphereGeometry args={[1, 64, 32]} />
          <meshPhysicalMaterial {...bodyMaterial} opacity={0.34} />
        </mesh>

        <mesh position={[0, -0.38, 0.44]}>
          <sphereGeometry args={[0.06, 32, 32]} />
          <meshBasicMaterial
            color={faceColor}
            transparent
            opacity={isThinking ? 0.86 : 0.52}
          />
        </mesh>

        <mesh ref={haloOneRef} rotation={[1.18, 0.08, 0]}>
          <torusGeometry args={[1.2, 0.0065, 16, 180]} />
          <meshBasicMaterial color={config.color} transparent opacity={0.36} />
        </mesh>

        <mesh ref={haloTwoRef} rotation={[0.72, 0.78, 0.18]}>
          <torusGeometry args={[1.43, 0.006, 16, 180]} />
          <meshBasicMaterial
            color={config.secondary}
            transparent
            opacity={0.22}
          />
        </mesh>

        {(isListening || isThinking) && (
          <mesh position={[0, 0.82, 0]} rotation={[1.35, 0, 0]}>
            <torusGeometry args={[0.82, 0.008, 16, 180]} />
            <meshBasicMaterial color={config.color} transparent opacity={0.48} />
          </mesh>
        )}

        {isEmergency ? (
          <Html center position={[0, -1.42, 0]}>
            <div className={styles.emergencyBadge}>Call 999 / A&amp;E</div>
          </Html>
        ) : null}
      </group>
    </Float>
  );
}