import * as THREE from 'three';
// Duplicated perlin here for now (not exported from terrain)
function perlin(x: number, y: number): number {
  return (
    Math.sin(x * 0.0007) * Math.cos(y * 0.0006) +
    Math.sin(x * 0.0002 + y * 0.0003) * 0.5
  );
}

import { Terrain } from './terrain';

export class Track {
  public curve: THREE.CatmullRomCurve3;
  public mesh: THREE.Mesh;
  public width: number;
  private points: THREE.Vector3[];
  private terrain: Terrain;

  constructor(terrain: Terrain, numPoints = 18, radius?: number, width = 1200) {
    this.width = width;
    this.terrain = terrain;
    this.points = [];
    // Ensure track fits within terrain bounds
    const margin = 1000;
    const maxRadius = (terrain.size / 2) - margin;
    const trackRadius = Math.min(radius ?? maxRadius * 0.8, maxRadius);
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const r = trackRadius * (0.8 + Math.random() * 0.4);
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const y = this.terrain.getHeight(x, z) + 30;
      this.points.push(new THREE.Vector3(x, y, z));
    }
    this.points.push(this.points[0].clone());
    this.curve = new THREE.CatmullRomCurve3(this.points, true, 'catmullrom', 0.5);
    this.mesh = this.createTrackMesh();
  }

  private createTrackMesh(): THREE.Mesh {
    // Flat road mesh along curve, projected onto terrain
    const segments = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    for (let i = 0; i < segments; i++) {
      const t = i / segments;
      const center = this.curve.getPoint(t);
      const tangent = this.curve.getTangent(t);
      // Perpendicular vector in XZ plane
      const perp = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      // Two edge points
      const left = center.clone().addScaledVector(perp, -this.width / 2);
      const right = center.clone().addScaledVector(perp, this.width / 2);
      // Project left/right onto terrain
      left.y = this.terrain.getHeight(left.x, left.z) + 5;
      right.y = this.terrain.getHeight(right.x, right.z) + 5;
      positions.push(left.x, left.y, left.z);
      positions.push(right.x, right.y, right.z);
      normals.push(0, 1, 0, 0, 1, 0);
      uvs.push(0, t, 1, t);
    }
    // Create triangles
    const indices: number[] = [];
    for (let i = 0; i < segments - 1; i++) {
      const a = i * 2;
      const b = i * 2 + 1;
      const c = i * 2 + 2;
      const d = i * 2 + 3;
      indices.push(a, b, c, b, d, c);
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeBoundingSphere();
    const material = new THREE.MeshStandardMaterial({ color: 0xf7e36a, metalness: 0.2, roughness: 0.7 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 0;
    mesh.receiveShadow = true;
    return mesh;
  }

  // Check if a point is "on" the track (within width/2 of curve)
  public isOnTrack(point: THREE.Vector3, tolerance = 0.8): boolean {
    // Sample curve at high resolution to find closest point
    let minDist = Infinity;
    for (let i = 0; i <= 1000; i++) {
      const t = i / 1000;
      const curvePoint = this.curve.getPoint(t);
      const dist = curvePoint.distanceTo(new THREE.Vector3(point.x, curvePoint.y, point.z));
      if (dist < minDist) minDist = dist;
    }
    return minDist < (this.width / 2) * tolerance;
  }
}
