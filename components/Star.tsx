import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { easing } from 'maath';
import * as THREE from 'three';
import { TreeState } from '../types';

interface StarProps {
  state: TreeState;
}

const GlowShaderMaterial = {
    uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color('#FFD700') }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        vec2 center = vec2(0.5);
        float dist = distance(vUv, center);
        
        // Natural radial fade
        float alpha = smoothstep(0.5, 0.0, dist);
        
        // Add subtle pulse to alpha
        float pulse = 0.8 + 0.2 * sin(uTime * 2.0);
        
        gl_FragColor = vec4(uColor, alpha * pulse * 0.6);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
};

export const Star: React.FC<StarProps> = ({ state }) => {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const glowRef = useRef<THREE.ShaderMaterial>(null);
  
  const geometry = useMemo(() => {
    // Custom 3D Faceted Star Geometry
    const outerRadius = 0.9;
    const innerRadius = 0.45;
    const depth = 0.35; // Thickness for 3D effect

    const vertices: number[] = [];
    const indices: number[] = [];

    // Center Front point (Index 0)
    vertices.push(0, 0, depth);
    // Center Back point (Index 1)
    vertices.push(0, 0, -depth);

    // Generate ring points
    for (let i = 0; i < 10; i++) {
        const angle = i * Math.PI * 2 / 10 - Math.PI / 2;
        const r = i % 2 === 0 ? outerRadius : innerRadius;
        vertices.push(Math.cos(angle) * r, Math.sin(angle) * r, 0);
    }

    // Indices for Front Faces (Center Front -> Ring i -> Ring i+1)
    for (let i = 0; i < 10; i++) {
        const center = 0;
        const p1 = 2 + i;
        const p2 = 2 + ((i + 1) % 10);
        indices.push(center, p1, p2);
    }

    // Indices for Back Faces (Center Back -> Ring i+1 -> Ring i)
    for (let i = 0; i < 10; i++) {
        const center = 1;
        const p1 = 2 + i;
        const p2 = 2 + ((i + 1) % 10);
        indices.push(center, p2, p1);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    
    return geo;
  }, []);

  useFrame((stateCtx, delta) => {
    if (!groupRef.current) return;

    // Transition
    const targetScale = state === TreeState.TREE_SHAPE ? 1 : 0;
    // Position at top of tree (approx height 5.8)
    const targetY = state === TreeState.TREE_SHAPE ? 5.8 : 20; 

    easing.damp(groupRef.current.scale, 'x', targetScale, 0.5, delta);
    easing.damp(groupRef.current.scale, 'y', targetScale, 0.5, delta);
    easing.damp(groupRef.current.scale, 'z', targetScale, 0.5, delta);
    
    easing.damp(groupRef.current.position, 'y', targetY, 0.8, delta);
    
    // Rotation
    groupRef.current.rotation.y += delta * 0.5;

    // Pulse Emission
    if (materialRef.current) {
        materialRef.current.emissiveIntensity = 1.0 + Math.sin(stateCtx.clock.elapsedTime * 2.5) * 0.5;
    }
    
    // Update Glow Shader Time
    if (glowRef.current) {
        glowRef.current.uniforms.uTime.value = stateCtx.clock.elapsedTime;
    }
    
    // Billboard the glow
    if (groupRef.current.children[1]) {
        groupRef.current.children[1].lookAt(stateCtx.camera.position);
    }
  });

  // Apply Z rotation to invert the star (Math.PI)
  return (
    <group ref={groupRef} position={[0, 20, 0]} scale={0} rotation={[0, 0, Math.PI]}>
        <mesh geometry={geometry}>
            <meshStandardMaterial 
                ref={materialRef}
                color="#FFD700" 
                emissive="#FFD700"
                emissiveIntensity={1}
                roughness={0.1}
                metalness={1.0}
                flatShading={true} // Enhances the faceted look
            />
        </mesh>
        
        {/* Natural Glow Plane */}
        <mesh position={[0,0,0]} scale={6}>
             <planeGeometry args={[1, 1]} />
             <shaderMaterial 
                ref={glowRef}
                args={[GlowShaderMaterial]}
             />
        </mesh>
    </group>
  );
};