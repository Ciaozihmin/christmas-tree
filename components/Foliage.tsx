import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeState } from '../types';
import { getRandomSpherePosition, getTreePosition } from '../utils/geometry';
import { easing } from 'maath';

const vertexShader = `
  uniform float uProgress;
  uniform float uTime;
  
  attribute vec3 treePosition;
  attribute vec3 scatterPosition;
  attribute float aSize;
  attribute float aGoldMix; 
  
  varying vec3 vColor;

  // Simple pseudo-random function
  float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }
  
  void main() {
    // Interpolate position
    vec3 pos = mix(scatterPosition, treePosition, uProgress);
    
    // "Breathing" / Wind effect
    float breathing = sin(uTime * 2.0 + pos.x * 0.5 + pos.y) * 0.05;
    
    // Jitter Effect: High frequency, low amplitude noise
    float jitterSpeed = 15.0;
    float jitterAmp = 0.03;
    vec3 jitter = vec3(
        sin(uTime * jitterSpeed + pos.y * 10.0),
        cos(uTime * jitterSpeed + pos.x * 10.0),
        sin(uTime * jitterSpeed + pos.z * 10.0)
    ) * jitterAmp;

    // Apply jitter mostly when in tree shape (uProgress near 1) to make it "shimmer" alive
    // But user asked for "foliage layer increase jitter effect", so we apply it generally.
    pos += jitter;

    // Increase movement when scattered for "floating" effect
    float scatterMovement = (1.0 - uProgress) * 0.5;
    pos.x += breathing * (1.0 + scatterMovement); 
    pos.y += breathing * (0.5 + scatterMovement);
    pos.z += cos(uTime * 1.5 + pos.x) * 0.05 * (1.0 - uProgress);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    
    gl_PointSize = aSize * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
    
    // Color logic: 
    // Deep Forest Green
    vec3 emerald = vec3(0.01, 0.18, 0.08); 
    // Champagne/Warm Gold
    vec3 gold = vec3(1.0, 0.85, 0.4);     
    
    // Base color mix based on attribute
    vec3 baseColor = mix(emerald, gold, aGoldMix);

    // Highlight glimmer
    float highlight = sin(uTime * 3.0 + pos.y * 2.0 + pos.x) * 0.5 + 0.5;
    
    // Add warm glow to everything
    vColor = mix(baseColor, gold, pow(highlight, 4.0) * 0.5);
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  
  void main() {
    // Circular particle
    vec2 uv = gl_PointCoord.xy - 0.5;
    float r = length(uv);
    if (r > 0.5) discard;
    
    // Soft edge glow
    float glow = 1.0 - (r * 2.0);
    glow = pow(glow, 2.0); // Sharper core
    
    gl_FragColor = vec4(vColor, glow);
  }
`;

interface FoliageProps {
  state: TreeState;
}

export const Foliage: React.FC<FoliageProps> = ({ state }) => {
  const meshRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  const COUNT = 6000;
  const SCATTER_RADIUS = 25;
  const TREE_HEIGHT = 10; 
  const TREE_RADIUS = 4.5;

  const { positions, treePositions, scatterPositions, sizes, goldMix } = useMemo(() => {
    const p = new Float32Array(COUNT * 3);
    const tp = new Float32Array(COUNT * 3);
    const sp = new Float32Array(COUNT * 3);
    const s = new Float32Array(COUNT);
    const g = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      const scatter = getRandomSpherePosition(SCATTER_RADIUS);
      // Bias Power 2.0 for Uniform Surface distribution for needles
      const tree = getTreePosition(TREE_HEIGHT, TREE_RADIUS, -TREE_HEIGHT/2, 1.0, 2.0);
      
      sp[i * 3] = scatter[0];
      sp[i * 3 + 1] = scatter[1];
      sp[i * 3 + 2] = scatter[2];

      tp[i * 3] = tree[0];
      tp[i * 3 + 1] = tree[1];
      tp[i * 3 + 2] = tree[2];
      
      // Start at scatter
      p[i * 3] = scatter[0];
      p[i * 3 + 1] = scatter[1];
      p[i * 3 + 2] = scatter[2];

      s[i] = Math.random() * 0.8 + 0.4;
      
      // 15% chance to be a golden needle
      g[i] = Math.random() > 0.85 ? 1.0 : 0.0;
    }
    
    return { positions: p, treePositions: tp, scatterPositions: sp, sizes: s, goldMix: g };
  }, []);

  // Helper ref to track animated progress for JS side if needed, but here we do it in shader uniform
  const progress = useRef(0);

  useFrame((ctx, delta) => {
    // Smooth damp the progress
    const target = state === TreeState.TREE_SHAPE ? 1 : 0;
    easing.damp(progress, 'current', target, 1.2, delta);

    if (materialRef.current) {
        materialRef.current.uniforms.uProgress.value = progress.current;
        materialRef.current.uniforms.uTime.value = ctx.clock.elapsedTime;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-treePosition"
          count={treePositions.length / 3}
          array={treePositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-scatterPosition"
          count={scatterPositions.length / 3}
          array={scatterPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aSize"
          count={sizes.length}
          array={sizes}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aGoldMix"
          count={goldMix.length}
          array={goldMix}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{
            uTime: { value: 0 },
            uProgress: { value: 0 }
        }}
      />
    </points>
  );
};