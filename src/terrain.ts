import * as THREE from 'three';

// Simple perlin-like noise for hills
function perlin(x: number, y: number): number {
  return (
    Math.sin(x * 0.0007) * Math.cos(y * 0.0006) +
    Math.sin(x * 0.0002 + y * 0.0003) * 0.5
  );
}

export class Terrain {
  public mesh: THREE.Mesh;
  public size: number;
  public segments: number;

  constructor(size = 20000, segments = 128) {
    this.size = size;
    this.segments = segments;
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    let minHeight = Infinity;
    let maxHeight = -Infinity;
    // Swap geometry to XZ plane: set Y=height, X=original X, Z=original Y
    for (let i = 0; i < geometry.attributes.position.count; i++) {
      const origX = geometry.attributes.position.getX(i);
      const origY = geometry.attributes.position.getY(i);
      // X = origX, Z = origY, Y = height
      const height = this.getHeight(origX, origY);
      if (height < minHeight) minHeight = height;
      if (height > maxHeight) maxHeight = height;
      geometry.attributes.position.setX(i, origX);
      geometry.attributes.position.setZ(i, origY);
      geometry.attributes.position.setY(i, height);
    }
    console.log('[Terrain] minHeight:', minHeight, 'maxHeight:', maxHeight);
    geometry.computeVertexNormals();
    // DEBUG: Use MeshBasicMaterial for visibility, wireframe ON
    // Stylised grass material
    const material = new THREE.MeshStandardMaterial({ color: 0x3da35d, flatShading: true, roughness: 0.85, metalness: 0.15, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(geometry, material);
    // No rotation needed: mesh is now XZ with Y as height
    this.mesh.position.y = 0;
    this.mesh.receiveShadow = true;
    this.mesh.visible = true;
  }

  getHeight(x: number, z: number): number {
    return perlin(x, z) * 600 + perlin(x * 2, z * 2) * 200;
  }
}
