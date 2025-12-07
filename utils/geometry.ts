import * as THREE from 'three';

// Random point inside a sphere
export const getRandomSpherePosition = (radius: number): [number, number, number] => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius;
  const sinPhi = Math.sin(phi);
  return [
    r * sinPhi * Math.cos(theta),
    r * sinPhi * Math.sin(theta),
    r * Math.cos(phi)
  ];
};

// Point on a Cone surface (The Christmas Tree shape)
export const getTreePosition = (
    height: number, 
    maxRadius: number, 
    yOffset: number = -2, 
    maxHeightRatio: number = 1.0,
    biasPower: number = 1.0
): [number, number, number] => {
  // biasPower > 1 pushes points towards y=0 (The Base of the tree)
  // biasPower = 1 is linear random (visually denser at top of cone due to surface area)
  // biasPower = 2 is approx uniform surface area distribution
  // biasPower > 2 is bottom heavy (more items at base)
  
  const effectiveHeight = height * maxHeightRatio;
  
  // y goes from 0 (Base) to effectiveHeight (Tip relative to ratio)
  // We use Math.pow(u, biasPower) to bias result.
  // If biasPower > 1, u^p is small, so y is small (near base).
  const u = Math.random();
  const y = effectiveHeight * Math.pow(u, biasPower);
  
  // Radius calculation: Max at y=0, 0 at y=height
  const currentRadius = maxRadius * (1 - y / height);
  
  const theta = Math.random() * Math.PI * 2;
  
  // Add some internal volume, not just surface
  const r = currentRadius * Math.sqrt(Math.random()); 

  return [
    r * Math.cos(theta),
    y + yOffset,
    r * Math.sin(theta)
  ];
};

// Generate data for Ornaments
export const generateOrnamentData = (
    count: number, 
    scatterRadius: number, 
    treeHeight: number, 
    treeRadius: number,
    maxHeightRatio: number = 1.0,
    biasPower: number = 1.0
): any[] => {
  return new Array(count).fill(0).map(() => ({
    // Scatter radius 25
    scatterPosition: getRandomSpherePosition(scatterRadius), 
    treePosition: getTreePosition(treeHeight, treeRadius, -treeHeight / 2, maxHeightRatio, biasPower),
    rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0],
    scale: 0.5 + Math.random() * 0.5,
  }));
};