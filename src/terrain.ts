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

  constructor(size = 200000, segments = 256) {
    this.size = size;
    this.segments = segments;
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    for (let i = 0; i < geometry.attributes.position.count; i++) {
      const x = geometry.attributes.position.getX(i);
      const z = geometry.attributes.position.getZ(i);
      const height = perlin(x, z) * 600 + perlin(x * 2, z * 2) * 200;
      geometry.attributes.position.setY(i, height);
    }
    geometry.computeVertexNormals();
    const material = new THREE.MeshStandardMaterial({ color: 0x6fc276, flatShading: false, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.y = 0;
    this.mesh.receiveShadow = true;
    this.mesh.visible = true;
  }

  getHeight(x: number, z: number): number {
    return perlin(x, z) * 600 + perlin(x * 2, z * 2) * 200;
  }
}
