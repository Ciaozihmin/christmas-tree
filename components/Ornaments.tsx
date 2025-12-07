import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeState } from '../types';
import { generateOrnamentData } from '../utils/geometry';
import { easing } from 'maath';

interface OrnamentsProps {
  state: TreeState;
  type: 'SPHERE' | 'BOX' | 'SEQUIN';
  count: number;
  color: string;
  metalness: number;
  roughness: number;
  maxHeightRatio?: number; 
  biasPower?: number; // New param for vertical distribution
}

export const Ornaments: React.FC<OrnamentsProps> = ({ 
  state, type, count, color, metalness, roughness, maxHeightRatio = 1.0, biasPower = 1.0
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tempObj = useMemo(() => new THREE.Object3D(), []);

  // Pre-calculate positions
  const data = useMemo(() => {
    // Tree Height reduced to 10
    return generateOrnamentData(count, 25, 10, 4.5, maxHeightRatio, biasPower);
  }, [count, maxHeightRatio, biasPower]);

  // Animation state reference
  const progress = useRef(0);

  useLayoutEffect(() => {
    // Initial paint
    if (meshRef.current) {
      data.forEach((d, i) => {
        tempObj.position.set(...d.scatterPosition);
        tempObj.rotation.set(...d.rotation as [number, number, number]);
        
        let scale = d.scale;
        const rand = (i * 1337) % 1000 / 1000;

        if (type === 'SPHERE') {
            const y = d.treePosition[1];
            // In lower half (y < -1), allow for larger baubles to fill space
            if (y < -1.0 && rand > 0.85) {
                scale = 1.1; // Large bauble
            } else {
                // Standard sizes
                if (rand < 0.33) scale = 0.35;      
                else if (rand < 0.66) scale = 0.55;  
                else scale = 0.7;
            }
        } else if (type === 'BOX') {
            scale = 0.7 + rand * 0.3; 
        } else if (type === 'SEQUIN') {
             scale = 1.0;
        }

        tempObj.scale.setScalar(scale);
        
        if (type === 'SEQUIN') {
            tempObj.scale.z = 0.02; 
        }

        tempObj.updateMatrix();
        meshRef.current?.setMatrixAt(i, tempObj.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [data, tempObj, type]);

  useFrame((ctx, delta) => {
    if (!meshRef.current) return;

    // Smooth transition
    const target = state === TreeState.TREE_SHAPE ? 1 : 0;
    const smoothTime = type === 'BOX' ? 0.6 : type === 'SEQUIN' ? 0.4 : 0.7; 
    
    easing.damp(progress, 'current', target, smoothTime, delta);

    const p = progress.current;

    for (let i = 0; i < count; i++) {
      const d = data[i];
      const start = new THREE.Vector3(...d.scatterPosition);
      const end = new THREE.Vector3(...d.treePosition);
      
      const currentPos = start.lerp(end, p);
      
      if (p < 0.95) {
        const floatIntensity = type === 'SEQUIN' ? 0.05 : 0.02;
        const speed = type === 'SEQUIN' ? 2.0 : 1.0;
        currentPos.y += Math.sin(ctx.clock.elapsedTime * speed + i) * floatIntensity * (1 - p);
      }

      const rotSpeed = type === 'SEQUIN' ? 3.0 : 0.2;
      tempObj.rotation.set(
        d.rotation[0] + ctx.clock.elapsedTime * rotSpeed * (1-p),
        d.rotation[1] + ctx.clock.elapsedTime * (rotSpeed * 2),
        d.rotation[2] + ctx.clock.elapsedTime * rotSpeed * (1-p)
      );

      tempObj.position.copy(currentPos);
      
      let scale = 1.0;
      const r = (i * 1337) % 1000 / 1000;
      
      if (type === 'SPHERE') {
        const y = d.treePosition[1];
        // Dynamic check same as layout effect
        if (y < -1.0 && r > 0.85) {
            scale = 1.1; 
        } else {
            if (r < 0.33) scale = 0.35;
            else if (r < 0.66) scale = 0.55;
            else scale = 0.7;
        }
      } else if (type === 'BOX') {
        scale = 0.7 + r * 0.3;
      }

      tempObj.scale.setScalar(scale);
      if (type === 'SEQUIN') tempObj.scale.z = 0.02;

      tempObj.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObj.matrix);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  const geometry = useMemo(() => {
    if (type === 'BOX') {
        // Use ExtrudeGeometry to create a Box with bevels (Rounded Edges)
        const size = 1.0;
        const shape = new THREE.Shape();
        const s2 = size / 2;
        shape.moveTo(-s2, -s2);
        shape.lineTo(s2, -s2);
        shape.lineTo(s2, s2);
        shape.lineTo(-s2, s2);
        shape.closePath();

        const extrudeSettings = {
          depth: size,
          bevelEnabled: true,
          bevelSegments: 2,
          steps: 1,
          bevelSize: 0.1,
          bevelThickness: 0.1,
        };
        // Center the geometry
        const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geo.center();
        return geo;

    } else if (type === 'SEQUIN') {
        return new THREE.TorusGeometry(0.12, 0.09, 8, 16); 
    } else {
        return new THREE.SphereGeometry(0.35, 16, 16);
    }
  }, [type]);

  return (
    <instancedMesh ref={meshRef} args={[geometry, undefined, count]}>
      <meshStandardMaterial 
        color={color} 
        metalness={metalness} 
        roughness={roughness}
        emissive={color}
        emissiveIntensity={0.15} 
      />
    </instancedMesh>
  );
};