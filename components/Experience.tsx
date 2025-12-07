import React from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, OrbitControls, Float, PerspectiveCamera, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { TreeState } from '../types';
import { Foliage } from './Foliage';
import { Ornaments } from './Ornaments';
import { Star } from './Star';
import * as THREE from 'three';

interface ExperienceProps {
  treeState: TreeState;
}

const Rig = () => {
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Reduced jitter amplitude significantly for a more stable "Panoramic" view
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, 20 + Math.sin(t * 0.1) * 2, 0.01);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, 2 + Math.cos(t * 0.15) * 1, 0.01);
    state.camera.lookAt(0, 1, 0); // Look slightly up
  });
  return null;
}

export const Experience: React.FC<ExperienceProps> = ({ treeState }) => {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: false, toneMapping: THREE.ReinhardToneMapping, toneMappingExposure: 1.5 }}
    >
      {/* Moved camera back to 22 to see full tree comfortably */}
      <PerspectiveCamera makeDefault position={[22, 2, 22]} fov={45} />
      
      <color attach="background" args={['#000300']} />
      
      {/* Cinematic Lighting */}
      <ambientLight intensity={0.1} color="#001a10" />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#FFEDD5" decay={2} />
      <pointLight position={[-10, -5, -10]} intensity={0.5} color="#E0F2FE" />
      <spotLight 
        position={[0, 20, 0]} 
        angle={0.3} 
        penumbra={1} 
        intensity={2.5} 
        color="#FFF7ED" 
        castShadow 
      />

      <Environment preset="city" />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      <Float speed={1} rotationIntensity={0.1} floatIntensity={0.1} floatingRange={[-0.2, 0.2]}>
        
        <Foliage state={treeState} />
        <Star state={treeState} />

        {/* --- BAUBLES (Bias Power 2.0 = Uniform Surface Distribution) --- */}
        {/* DOUBLED COUNTS */}
        
        {/* Gold Baubles (120 -> 240) */}
        <Ornaments 
          state={treeState} 
          type="SPHERE" 
          count={240} 
          color="#D4AF37" 
          metalness={0.9} 
          roughness={0.15}
          biasPower={2.0} 
        />

        {/* Pearl/Off-White Baubles (80 -> 160) */}
        <Ornaments 
          state={treeState} 
          type="SPHERE" 
          count={160} 
          color="#EAE0C8" 
          metalness={0.8} 
          roughness={0.1}
          biasPower={2.0} 
        />

        {/* Red Baubles (60 -> 120) */}
        <Ornaments 
          state={treeState} 
          type="SPHERE" 
          count={120} 
          color="#AC0100" 
          metalness={0.7} 
          roughness={0.15}
          biasPower={2.0} 
        />

        {/* Green Baubles (100 -> 200) */}
        <Ornaments 
          state={treeState} 
          type="SPHERE" 
          count={200} 
          color="#005F1C" 
          metalness={0.6} 
          roughness={0.2}
          biasPower={2.0} 
        />

        {/* --- GIFTS --- */}
        {/* biasPower=3.5 keeps them low. maxHeightRatio=0.7 ensures NO gifts at the top (closest to Star). */}

        {/* Red Gifts: #AC0100 */}
        <Ornaments 
          state={treeState} 
          type="BOX" 
          count={25} 
          color="#AC0100" 
          metalness={0.4} 
          roughness={0.4} 
          biasPower={3.5}
          maxHeightRatio={0.7}
        />

        {/* Green Gifts: #005F1C */}
        <Ornaments 
          state={treeState} 
          type="BOX" 
          count={20} 
          color="#005F1C" 
          metalness={0.4} 
          roughness={0.4} 
          biasPower={3.5}
          maxHeightRatio={0.7}
        />

        {/* Gold Gifts (Replacing White) */}
        <Ornaments 
          state={treeState} 
          type="BOX" 
          count={20} 
          color="#D4AF37" 
          metalness={0.6} 
          roughness={0.3} 
          biasPower={3.5}
          maxHeightRatio={0.7}
        />
        
        {/* --- SEQUINS --- */}
        {/* Gold Sequins (Reduced by ~1/3 from 800 -> 535) */}
        <Ornaments 
          state={treeState} 
          type="SEQUIN" 
          count={535} 
          color="#FCD34D" 
          metalness={1.0} 
          roughness={0.05} 
          biasPower={2.0}
        />

      </Float>

      <Rig />
      {/* Locked zoom and pan to keep frame perfect */}
      <OrbitControls 
        enableZoom={false} 
        enablePan={false} 
        maxPolarAngle={Math.PI / 1.5} 
        minPolarAngle={Math.PI / 3}
      />

      <EffectComposer disableNormalPass>
        <Bloom luminanceThreshold={0.6} mipmapBlur intensity={1.2} radius={0.5} />
        <Vignette eskil={false} offset={0.1} darkness={1.2} />
      </EffectComposer>
    </Canvas>
  );
};