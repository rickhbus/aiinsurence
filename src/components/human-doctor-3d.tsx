"use client";

import { ContactShadows, Environment, useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import {
  Box3,
  Color,
  Group,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Vector3,
} from "three";
import styles from "./human-doctor-3d.module.css";

export type HumanDoctor3DState =
  | "ready"
  | "listening"
  | "thinking"
  | "explaining"
  | "emergency";

export type DoctorEmotion =
  | "warm"
  | "listening"
  | "focused"
  | "reassuring"
  | "concerned"
  | "urgent";

export type HumanDoctor3DProps = {
  state?: HumanDoctor3DState;
  emotion?: DoctorEmotion;
  className?: string;
};

const MODEL_PATH = "/models/ai-doctor-guide.glb";
const TARGET_MODEL_HEIGHT = 2.86;
const MODEL_Y_OFFSET = -1.16;
const BASE_MODEL_ROTATION_X = 0.044;
const BASE_MODEL_ROTATION_Y = 0;
const CAMERA_POSITION: [number, number, number] = [0, 0.64, 4.18];
const CAMERA_LOOK_AT: [number, number, number] = [0, 0.12, 0];
const CAMERA_FOV = 33;

const stateLabel: Record<HumanDoctor3DState, string> = {
  ready: "Ready",
  listening: "Listening",
  thinking: "Thinking",
  explaining: "Explaining",
  emergency: "Emergency",
};

class DoctorModelBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

function DoctorModel({
  state,
  emotion,
}: {
  state: HumanDoctor3DState;
  emotion: DoctorEmotion;
}) {
  const groupRef = useRef<Group>(null);
  const { scene } = useGLTF(MODEL_PATH);

  const normalizedModel = useMemo(() => {
    const model = scene.clone(true);
    const morphMeshes: MorphMesh[] = [];

    model.traverse((object) => {
      if (isMesh(object)) {
        object.castShadow = true;
        object.receiveShadow = true;

        applyPremiumMaterial(object);

        if (isMorphMesh(object)) {
          morphMeshes.push(object);
        }
      }
    });

    const box = new Box3().setFromObject(model);
    const size = new Vector3();
    const center = new Vector3();
    box.getSize(size);
    box.getCenter(center);

    const modelHeight = size.y > 0 ? size.y : 1;
    const scale = TARGET_MODEL_HEIGHT / modelHeight;

    model.position.set(-center.x, -center.y, -center.z);

    return {
      model,
      morphMeshes,
      scale,
    };
  }, [scene]);

  useEffect(() => {
    if (
      process.env.NODE_ENV !== "development" ||
      normalizedModel.morphMeshes.length === 0
    ) {
      return;
    }

    const morphNames = new Set<string>();
    normalizedModel.morphMeshes.forEach((mesh) => {
      Object.keys(mesh.morphTargetDictionary).forEach((name) => {
        morphNames.add(name);
      });
    });

    if (morphNames.size > 0) {
      console.info(
        "AI doctor GLB morph targets:",
        Array.from(morphNames).sort().join(", "),
      );
    }
  }, [normalizedModel.morphMeshes]);

  useFrame(({ clock }) => {
    const elapsed = clock.elapsedTime;
    const group = groupRef.current;

    if (group) {
      const motion = getMotionForState(state, emotion, elapsed);

      group.position.y = MathUtils.lerp(
        group.position.y,
        MODEL_Y_OFFSET + motion.floatY,
        0.08,
      );
      group.rotation.x = MathUtils.lerp(
        group.rotation.x,
        BASE_MODEL_ROTATION_X + motion.rotationX,
        0.08,
      );
      group.rotation.y = MathUtils.lerp(
        group.rotation.y,
        BASE_MODEL_ROTATION_Y + motion.rotationY,
        0.08,
      );
      group.rotation.z = MathUtils.lerp(group.rotation.z, motion.rotationZ, 0.08);
    }

    animateMorphTargets(normalizedModel.morphMeshes, state, emotion, elapsed);
  });

  return (
    <group
      ref={groupRef}
      position={[0, MODEL_Y_OFFSET, 0]}
      rotation={[BASE_MODEL_ROTATION_X, BASE_MODEL_ROTATION_Y, 0]}
      scale={[
        normalizedModel.scale,
        normalizedModel.scale,
        normalizedModel.scale,
      ]}
    >
      <primitive object={normalizedModel.model} />
    </group>
  );
}

function CameraAim() {
  const { camera } = useThree();

  useFrame(() => {
    camera.lookAt(...CAMERA_LOOK_AT);
  });

  return null;
}

function LoadingDoctor() {
  return (
    <group position={[0, -1.38, 0]}>
      <mesh castShadow position={[0, 1.24, 0]}>
        <sphereGeometry args={[0.38, 32, 32]} />
        <meshStandardMaterial color="#dbeafe" roughness={0.72} metalness={0.05} />
      </mesh>
      <mesh castShadow position={[0, 0.42, 0]} scale={[0.72, 1, 0.42]}>
        <capsuleGeometry args={[0.36, 0.95, 12, 28]} />
        <meshStandardMaterial color="#f8fbff" roughness={0.8} metalness={0.04} />
      </mesh>
    </group>
  );
}

export function HumanDoctor3D({
  state = "ready",
  emotion = "warm",
  className = "",
}: HumanDoctor3DProps) {
  const resolvedEmotion = state === "emergency" ? "urgent" : emotion;

  return (
    <section
      className={[
        styles.stage,
        styles[`state_${state}`],
        styles[`emotion_${resolvedEmotion}`],
        className,
      ].join(" ")}
      aria-label={`3D AI doctor: ${stateLabel[state]}`}
      data-state={state}
      data-emotion={resolvedEmotion}
    >
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.statusPill}>
        <span aria-hidden="true" />
        {stateLabel[state]}
      </div>

      <DoctorModelBoundary fallback={<DoctorFallback state={state} />}>
        <div className={styles.canvasWrap}>
          <Canvas
            camera={{ position: CAMERA_POSITION, fov: CAMERA_FOV }}
            dpr={[1, 1.75]}
            shadows="percentage"
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: "high-performance",
            }}
          >
            <CameraAim />
            <ambientLight intensity={1.38} />
            <directionalLight
              castShadow
              position={[1.7, 2.7, 3.8]}
              intensity={1.48}
              shadow-mapSize={[1024, 1024]}
            />
            <pointLight
              position={[-2.5, 1.35, 2.4]}
              intensity={0.82}
              color="#fde7c8"
            />
            <pointLight
              position={[2.2, 1.6, -1.4]}
              intensity={0.36}
              color={getEmotionLightColor(resolvedEmotion)}
            />

            <Suspense fallback={<LoadingDoctor />}>
              <DoctorModel state={state} emotion={resolvedEmotion} />

              <ContactShadows
                position={[0, -1.82, 0]}
                opacity={state === "emergency" ? 0.24 : 0.18}
                scale={3.3}
                blur={2.5}
                far={4}
              />

              <Environment preset="city" environmentIntensity={0.48} />
            </Suspense>
          </Canvas>
        </div>
      </DoctorModelBoundary>

      <div className={styles.particles} aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>

      {state === "emergency" ? (
        <div className={styles.emergencyBadge}>Emergency first</div>
      ) : null}
    </section>
  );
}

function DoctorFallback({ state }: { state: HumanDoctor3DState }) {
  return (
    <div className={styles.fallback} role="status">
      <div className={styles.fallbackSilhouette} aria-hidden="true" />
      <strong>{state === "emergency" ? "Emergency first" : "AI doctor guide"}</strong>
      <span>3D guide is unavailable right now.</span>
    </div>
  );
}

function getEmotionLightColor(emotion: DoctorEmotion) {
  switch (emotion) {
    case "concerned":
      return "#fbbf24";
    case "urgent":
      return "#ef4444";
    case "focused":
      return "#60a5fa";
    case "reassuring":
      return "#5eead4";
    case "listening":
      return "#67e8f9";
    case "warm":
    default:
      return "#bfdbfe";
  }
}

function getMotionForState(
  state: HumanDoctor3DState,
  emotion: DoctorEmotion,
  elapsed: number,
) {
  const breath = Math.sin(elapsed * 1.05) * 0.018;

  if (state === "emergency" || emotion === "urgent") {
    return {
      floatY: Math.sin(elapsed * 0.65) * 0.004,
      rotationX: 0.004,
      rotationY: Math.sin(elapsed * 0.5) * 0.008,
      rotationZ: 0,
    };
  }

  if (state === "listening" || emotion === "listening") {
    return {
      floatY: breath + Math.sin(elapsed * 1.2) * 0.004,
      rotationX: Math.sin(elapsed * 1.1) * 0.004,
      rotationY: Math.sin(elapsed * 0.55) * 0.012,
      rotationZ: Math.sin(elapsed * 0.7) * 0.003,
    };
  }

  if (state === "thinking" || emotion === "focused") {
    return {
      floatY: Math.sin(elapsed * 0.58) * 0.006,
      rotationX: 0.002,
      rotationY: Math.sin(elapsed * 0.34) * 0.012,
      rotationZ: 0,
    };
  }

  if (emotion === "concerned") {
    return {
      floatY: Math.sin(elapsed * 0.62) * 0.006,
      rotationX: 0.003,
      rotationY: Math.sin(elapsed * 0.38) * 0.01,
      rotationZ: -0.003,
    };
  }

  if (state === "explaining" || emotion === "reassuring") {
    return {
      floatY: breath,
      rotationX: Math.sin(elapsed * 0.72) * 0.004,
      rotationY: Math.sin(elapsed * 0.42) * 0.012,
      rotationZ: Math.sin(elapsed * 0.58) * 0.003,
    };
  }

  return {
    floatY: breath,
    rotationX: 0,
    rotationY: Math.sin(elapsed * 0.34) * 0.008,
    rotationZ: 0,
  };
}

function animateMorphTargets(
  meshes: MorphMesh[],
  state: HumanDoctor3DState,
  emotion: DoctorEmotion,
  elapsed: number,
) {
  if (meshes.length === 0) {
    return;
  }

  const blinkCycle = elapsed % 4.4;
  const blink = blinkCycle < 0.12 ? Math.sin((blinkCycle / 0.12) * Math.PI) : 0;
  const speaking =
    state === "explaining" || emotion === "reassuring"
      ? 0.04 + Math.max(0, Math.sin(elapsed * 5.2)) * 0.08
      : 0;
  const smile =
    emotion === "warm" || emotion === "reassuring"
      ? 0.12
      : emotion === "listening"
        ? 0.08
        : 0;
  const concern =
    emotion === "concerned" ? 0.12 : emotion === "urgent" ? 0.08 : 0;

  meshes.forEach((mesh) => {
    setOptionalMorph(mesh, ["blink", "eyeclose", "eyesclosed"], blink);
    setOptionalMorph(mesh, ["smile", "happy", "joy"], smile);
    setOptionalMorph(mesh, ["mouthopen", "jawopen", "open"], speaking);
    setOptionalMorph(mesh, ["brow", "frown", "sad", "concern"], concern);
  });
}

function setOptionalMorph(mesh: MorphMesh, needles: string[], value: number) {
  const match = Object.entries(mesh.morphTargetDictionary).find(([name]) => {
    const normalized = name.toLowerCase().replace(/[\s_-]/g, "");
    return needles.some((needle) => normalized.includes(needle));
  });

  if (!match) {
    return;
  }

  mesh.morphTargetInfluences[match[1]] = MathUtils.clamp(value, 0, 1);
}

function isMesh(object: Object3D): object is Mesh {
  return (object as Mesh).isMesh === true;
}

type MorphMesh = Mesh & {
  morphTargetDictionary: Record<string, number>;
  morphTargetInfluences: number[];
};

function isMorphMesh(object: Object3D): object is MorphMesh {
  const mesh = object as Mesh;

  return Boolean(
    mesh.isMesh &&
      mesh.morphTargetDictionary &&
      mesh.morphTargetInfluences &&
      Array.isArray(mesh.morphTargetInfluences),
  );
}

function applyPremiumMaterial(mesh: Mesh) {
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

  materials.forEach((material) => {
    if (!(material instanceof MeshStandardMaterial)) {
      return;
    }

    material.envMapIntensity = Math.min(
      Math.max(material.envMapIntensity ?? 0, 0.38),
      0.58,
    );
    material.roughness = Math.max(material.roughness, 0.64);

    if (material.color.equals(new Color("#ffffff"))) {
      material.color.lerp(new Color("#f8fbff"), 0.24);
    }
  });
}

useGLTF.preload(MODEL_PATH);
