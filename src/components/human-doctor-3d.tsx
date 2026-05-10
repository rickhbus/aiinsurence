"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, useGLTF } from "@react-three/drei";
import { Suspense, useRef } from "react";
import { type Group } from "three";
import styles from "./human-ai-home.module.css";

export type HumanDoctor3DState =
  | "ready"
  | "listening"
  | "thinking"
  | "explaining"
  | "emergency";

type HumanDoctor3DProps = {
  state: HumanDoctor3DState;
  className?: string;
};

const stateLabel: Record<HumanDoctor3DState, string> = {
  ready: "Ready",
  listening: "Listening",
  thinking: "Thinking",
  explaining: "Explaining",
  emergency: "Emergency",
};

function DoctorModel({ state }: { state: HumanDoctor3DState }) {
  const groupRef = useRef<Group>(null);
  const { scene } = useGLTF("/models/ai-doctor-guide.glb");

  useFrame((clock) => {
    const time = clock.clock.elapsedTime;
    
    if (groupRef.current) {
      // Gentle floating animation
      groupRef.current.position.y = Math.sin(time * 0.8) * 0.02;
      
      // Subtle rotation based on state
      if (state === "listening") {
        groupRef.current.rotation.y = Math.sin(time * 0.5) * 0.05;
      } else if (state === "thinking") {
        groupRef.current.rotation.y = Math.sin(time * 0.3) * 0.03;
        groupRef.current.rotation.x = Math.sin(time * 0.4) * 0.02;
      } else if (state === "emergency") {
        groupRef.current.rotation.y = Math.sin(time * 1.2) * 0.08;
      } else {
        groupRef.current.rotation.y = Math.sin(time * 0.2) * 0.01;
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.5, 0]} scale={[0.8, 0.8, 0.8]}>
      <primitive object={scene} />
    </group>
  );
}

export function HumanDoctor3D({
  state = "ready",
  className = "",
}: HumanDoctor3DProps) {
  return (
    <section
      className={`${styles.avatarStage} ${className}`}
      aria-label={`3D AI doctor: ${stateLabel[state]}`}
    >
      <div className={styles.statusPill}>
        <span />
        {stateLabel[state]}
      </div>

      <div className={styles.avatar3D}>
        <Canvas
          camera={{ position: [0, 1.2, 3], fov: 45 }}
          dpr={[1, 1.5]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
        >
          <Suspense fallback={null}>
            <ambientLight intensity={1.2} />
            <directionalLight position={[2, 3, 4]} intensity={1.8} />
            <pointLight position={[-2, 1, 2]} intensity={1.2} color="#ffffff" />
            <pointLight position={[2, 2, -1]} intensity={0.8} color="#f0f0f0" />

            <DoctorModel state={state} />

            <ContactShadows
              position={[0, -1.5, 0]}
              opacity={0.15}
              scale={3}
              blur={2}
              far={3}
            />

            <Environment preset="apartment" />
          </Suspense>
        </Canvas>
      </div>

      <div className={styles.avatarBadge}>
        <strong>智健導航</strong>
        <small>AI Healthcare Guide</small>
      </div>
    </section>
  );
}
