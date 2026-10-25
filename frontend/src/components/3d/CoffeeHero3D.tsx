import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, ContactShadows, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Sparkles, Compass, Heart } from 'lucide-react';

// Procedural 3D Coffee Cup with Saucer & Coffee Liquid
function CoffeeCup({ mouse }: { mouse: React.MutableRefObject<{ x: number; y: number }> }) {
  const groupRef = useRef<THREE.Group>(null);
  const liquidRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Smooth continuous gentle rotation + responsive mouse parallax
      groupRef.current.rotation.y += delta * 0.4;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        0.2 + mouse.current.y * 0.15,
        0.05
      );
      groupRef.current.position.x = THREE.MathUtils.lerp(
        groupRef.current.position.x,
        mouse.current.x * 0.2,
        0.05
      );
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.3, 0]}>
      {/* Ceramic Saucer Plate */}
      <mesh position={[0, -0.6, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.5, 1.1, 0.08, 48]} />
        <meshStandardMaterial color="#F8F3EA" roughness={0.2} metalness={0.05} />
      </mesh>
      <mesh position={[0, -0.56, 0]}>
        <ringGeometry args={[0.7, 1.45, 48]} />
        <meshStandardMaterial color="#E8D8C3" roughness={0.3} side={THREE.DoubleSide} />
      </mesh>

      {/* Ceramic Cup Body */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.9, 0.65, 1.2, 48, 1, true]} />
        <meshStandardMaterial color="#FAF7F5" roughness={0.15} metalness={0.08} side={THREE.DoubleSide} />
      </mesh>
      {/* Cup Bottom base */}
      <mesh position={[0, -0.58, 0]}>
        <circleGeometry args={[0.65, 48]} />
        <meshStandardMaterial color="#FAF7F5" roughness={0.2} side={THREE.DoubleSide} />
      </mesh>

      {/* Ceramic Handle */}
      <mesh position={[0.92, 0, 0]} rotation={[0, 0, 0]} castShadow>
        <torusGeometry args={[0.32, 0.09, 16, 32, Math.PI * 1.2]} />
        <meshStandardMaterial color="#FAF7F5" roughness={0.15} metalness={0.08} />
      </mesh>

      {/* Rich Espresso Liquid with Latte Art Crema */}
      <mesh ref={liquidRef} position={[0, 0.45, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.85, 48]} />
        <meshStandardMaterial
          color="#3A2218"
          roughness={0.25}
          metalness={0.1}
        />
      </mesh>
      {/* Latte Art Swirl Ring */}
      <mesh position={[0, 0.452, 0]} rotation={[-Math.PI / 2, 0, 0.4]}>
        <ringGeometry args={[0.15, 0.55, 32]} />
        <meshStandardMaterial color="#E8D8C3" roughness={0.4} opacity={0.85} transparent />
      </mesh>
      {/* Latte Art Center Leaf Heart */}
      <mesh position={[0, 0.453, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.2, 24]} />
        <meshStandardMaterial color="#F4ECE1" roughness={0.4} />
      </mesh>
    </group>
  );
}

// Procedural Floating Roasted Coffee Beans
function FloatingBeans() {
  const beanPositions: [number, number, number][] = [
    [-1.6, 0.8, 0.4],
    [1.7, 0.6, -0.2],
    [-1.3, -0.5, 0.9],
    [1.4, -0.4, 0.8],
    [0.2, 1.4, -0.5],
  ];

  return (
    <>
      {beanPositions.map((pos, idx) => (
        <Float key={idx} speed={1.5 + idx * 0.3} rotationIntensity={1.8} floatIntensity={1.2}>
          <group position={pos} scale={0.15}>
            {/* Ellipsoid bean half */}
            <mesh castShadow>
              <sphereGeometry args={[1, 16, 16]} />
              <meshStandardMaterial color="#2B1810" roughness={0.4} />
            </mesh>
          </group>
        </Float>
      ))}
    </>
  );
}

// Fallback component for low-spec, WebGL error, or reduced motion
export const StaticCoffeeFallback: React.FC = () => {
  return (
    <div className="relative w-full h-[400px] sm:h-[480px] flex items-center justify-center">
      <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-gradient-to-tr from-caramel/20 via-latte/40 to-cream p-6 flex items-center justify-center shadow-warm-xl border border-latte/50">
        <div className="w-48 h-48 sm:w-60 sm:h-60 rounded-full bg-gradient-to-b from-espresso-700 to-coffee-600 flex flex-col items-center justify-center text-cream shadow-inner relative overflow-hidden">
          <div className="w-36 h-36 rounded-full border-4 border-dashed border-latte/40 flex items-center justify-center animate-spin-slow">
            <div className="w-20 h-20 rounded-full bg-latte/80 blur-xs flex items-center justify-center text-espresso font-serif text-2xl font-bold">
              ☕
            </div>
          </div>
          <div className="absolute bottom-4 text-xs tracking-widest uppercase font-medium text-latte/90">
            Freshly Roasted
          </div>
        </div>
      </div>
      {/* Floating Badges */}
      <div className="absolute top-8 left-6 sm:left-12 glass-panel px-3.5 py-2 rounded-full shadow-warm flex items-center gap-2 text-xs font-semibold text-espresso">
        <Sparkles className="w-3.5 h-3.5 text-caramel" />
        <span>Discover Specialty Cafes</span>
      </div>
      <div className="absolute bottom-8 right-6 sm:right-12 glass-panel px-3.5 py-2 rounded-full shadow-warm flex items-center gap-2 text-xs font-semibold text-espresso">
        <Compass className="w-3.5 h-3.5 text-sage-600" />
        <span>Jhapa & Birtamode</span>
      </div>
    </div>
  );
};

export const CoffeeHero3D: React.FC = () => {
  const [hasWebGL, setHasWebGL] = useState<boolean>(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);
  const mouse = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    // Check reduced motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const listener = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', listener);

    // Test WebGL availability
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) setHasWebGL(false);
    } catch {
      setHasWebGL(false);
    }

    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    mouse.current = { x, y };
  };

  if (!hasWebGL || prefersReducedMotion) {
    return <StaticCoffeeFallback />;
  }

  return (
    <div
      onPointerMove={handlePointerMove}
      className="relative w-full h-[380px] sm:h-[460px] md:h-[500px] flex items-center justify-center select-none"
    >
      <Suspense fallback={<StaticCoffeeFallback />}>
        <Canvas
          shadows
          camera={{ position: [0, 1.2, 3.2], fov: 45 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        >
          {/* Studio Warm Lighting */}
          <ambientLight intensity={0.8} />
          <directionalLight
            position={[4, 6, 3]}
            intensity={1.4}
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-bias={-0.0001}
            color="#FFF4E6"
          />
          <pointLight position={[-3, 2, -2]} intensity={0.6} color="#C7834B" />
          <pointLight position={[2, -1, 2]} intensity={0.4} color="#8A9A78" />

          {/* 3D Elements */}
          <CoffeeCup mouse={mouse} />
          <FloatingBeans />

          {/* Soft Ground Contact Shadow */}
          <ContactShadows
            position={[0, -0.95, 0]}
            opacity={0.45}
            scale={4}
            blur={2.5}
            far={1.5}
            color="#241711"
          />

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            maxPolarAngle={Math.PI / 2 + 0.1}
            minPolarAngle={Math.PI / 4}
            rotateSpeed={0.5}
          />
        </Canvas>
      </Suspense>

      {/* Floating Micro-UI Interactive Badges */}
      <div className="absolute top-6 left-4 sm:left-10 glass-panel px-3.5 py-1.5 rounded-full shadow-warm flex items-center gap-2 text-xs font-semibold text-espresso pointer-events-none transform -rotate-2">
        <Sparkles className="w-3.5 h-3.5 text-caramel fill-caramel/20" />
        <span>Freshly Pulled Espresso</span>
      </div>

      <div className="absolute bottom-6 left-6 sm:left-12 glass-panel px-3.5 py-1.5 rounded-full shadow-warm flex items-center gap-2 text-xs font-semibold text-espresso pointer-events-none transform rotate-1">
        <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
        <span>Find Your Vibe</span>
      </div>

      <div className="absolute top-12 right-4 sm:right-10 glass-panel px-3.5 py-1.5 rounded-full shadow-warm flex items-center gap-2 text-xs font-semibold text-espresso pointer-events-none transform rotate-3">
        <Compass className="w-3.5 h-3.5 text-sage-600" />
        <span>Explore Jhapa</span>
      </div>
    </div>
  );
};

