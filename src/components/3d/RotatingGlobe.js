'use client';

import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PointMaterial, Points } from '@react-three/drei';
// Pure JS sphere point generation to avoid external dependency issues
function generateSpherePoints(count = 1000, radius = 1.5) {
  const points = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i += 3) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = radius * Math.cbrt(Math.random());
    points[i] = r * Math.sin(phi) * Math.cos(theta);
    points[i + 1] = r * Math.sin(phi) * Math.sin(theta);
    points[i + 2] = r * Math.cos(phi);
  }
  return points;
}

function ParticleSphere(props) {
  const ref = useRef();
  
  const [sphere] = useState(() => generateSpherePoints(1000, 1.5));

  useFrame((state, delta) => {
    // Subtle rotation over time
    if (ref.current) {
      ref.current.rotation.x -= delta / 12;
      ref.current.rotation.y -= delta / 15;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled {...props}>
        <PointMaterial
          transparent
          color="#6366f1"
          size={0.012}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={0.8}
        />
      </Points>
    </group>
  );
}

function FloatingShape() {
  const meshRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (meshRef.current) {
      // Subtle float and rotation
      meshRef.current.rotation.x = Math.sin(time / 4) * 0.2;
      meshRef.current.rotation.y = time * 0.15;
      meshRef.current.position.y = Math.sin(time / 2) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[0.75, 1]} />
      <meshBasicMaterial 
        color="#818cf8" 
        wireframe 
        transparent 
        opacity={0.25} 
      />
    </mesh>
  );
}

export default function RotatingGlobe() {
  return (
    <div className="w-full h-full min-h-[300px] md:min-h-[450px] relative pointer-events-none select-none">
      <Canvas 
        camera={{ position: [0, 0, 3] }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <FloatingShape />
        <ParticleSphere />
        <OrbitControls enableZoom={false} enablePan={false} enableRotate={true} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
}
