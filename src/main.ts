import * as THREE from 'three';
import { createWelcomeScreen } from './welcome';
import { Character } from './characterData';

let playerName: string = localStorage.getItem('playerName') || 'Time Rider';
import { CHARACTERS } from './characterData';
let playerCharacter: Character = CHARACTERS.find(c => c.name === localStorage.getItem('playerCharacter')) || CHARACTERS[0];

function startGame(name: string, character: Character) {
  playerName = name;
  playerCharacter = character;
  setupScene();
}

createWelcomeScreen(startGame);

function setupScene() {
  // Basic Three.js scene setup
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xaee6f5);

  // Camera positioned to see ground and bike (metric: cm)
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 10, 10000); // 10cm to 100m
  camera.position.set(0, 400, 1000); // 4m up, 10m back
  camera.lookAt(0, 120, 0); // Look at bike (1.2m high)

  // Remove any existing Three.js canvas (avoid stacking canvases)
  document.querySelectorAll('canvas').forEach(c => c.remove());

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setClearColor(0xaee6f5);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.domElement.style.position = 'fixed';
  renderer.domElement.style.top = '0';
  renderer.domElement.style.left = '0';
  renderer.domElement.style.width = '100vw';
  renderer.domElement.style.height = '100vh';
  renderer.domElement.style.zIndex = '0';
  document.body.appendChild(renderer.domElement);

  console.log('[Time Riders] Scene setup complete, renderer appended.');

  // Ground: 4000x4000cm (40x40m)
  const groundGeometry = new THREE.PlaneGeometry(4000, 4000);
  const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x6fc276 });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  scene.add(ground);

  // Grid helper (40m)
  const grid = new THREE.GridHelper(4000, 40, 0xaaaaaa, 0xcccccc);
  grid.position.y = 1;
  scene.add(grid);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
  dirLight.position.set(10, 20, 10);
  scene.add(dirLight);

  // Placeholder: simple box as the "bike" (KTM): 220x120x40cm (2.2m long, 1.2m high, 0.4m wide)
  // Bike geometry: length (Z), height (Y), width (X)
  const bikeGeometry = new THREE.BoxGeometry(40, 120, 220); // +Z is forward
  const bikeMaterial = new THREE.MeshStandardMaterial({ color: 0xffa500 });
  const bike = new THREE.Mesh(bikeGeometry, bikeMaterial);
  bike.position.set(0, 60, 0); // 60cm above ground (half height)
  scene.add(bike);

  // --- Controls State ---
  const keys = { w: false, a: false, s: false, d: false };
  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    if (e.key === 'w') keys.w = true;
    if (e.key === 'a') keys.a = true;
    if (e.key === 's') keys.s = true;
    if (e.key === 'd') keys.d = true;
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === 'w') keys.w = false;
    if (e.key === 'a') keys.a = false;
    if (e.key === 's') keys.s = false;
    if (e.key === 'd') keys.d = false;
  });

  // --- Bike Physics ---
  let bikeSpeed = 0; // cm/frame
  let bikeRotY = 0;  // radians
  const maxSpeed = 40; // cm/frame (~14.4km/h at 60fps)
  const accel = 1.5; // cm/frame^2
  const brake = 2.5; // cm/frame^2
  const friction = 0.7; // cm/frame^2
  const steerSpeed = 0.025; // radians/frame

  // Add overlays: player info and controls
  const overlay = document.createElement('div');
  overlay.id = 'game-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '24px';
  overlay.style.left = '24px';
  overlay.style.background = 'rgba(255,255,255,0.85)';
  overlay.style.padding = '1rem 2rem';
  overlay.style.borderRadius = '10px';
  overlay.style.fontSize = '1.2rem';
  overlay.style.zIndex = '1002';
  overlay.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
  overlay.innerHTML = `<b>Player:</b> ${playerName} <br/><b>Character:</b> ${playerCharacter?.name ?? ''}`;
  document.body.appendChild(overlay);

  const controls = document.createElement('div');
  controls.id = 'controls-overlay';
  controls.style.position = 'fixed';
  controls.style.bottom = '24px';
  controls.style.left = '50%';
  controls.style.transform = 'translateX(-50%)';
  controls.style.background = 'rgba(255,255,255,0.92)';
  controls.style.padding = '1.2rem 2.5rem';
  controls.style.borderRadius = '12px';
  controls.style.fontSize = '1.1rem';
  controls.style.zIndex = '1002';
  controls.style.boxShadow = '0 2px 8px rgba(0,0,0,0.10)';
  controls.style.textAlign = 'center';
  controls.innerHTML = `
    <b>Controls</b><br/>
    <span style="color:#2196f3;font-weight:bold">Player 1:</span> <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd><br/>
    <span style="color:#e91e63;font-weight:bold">Player 2:</span> <kbd>J</kbd> <kbd>K</kbd> <kbd>L</kbd> <kbd>I</kbd><br/>
    <span style="color:#43a047;font-weight:bold">Mouse:</span> <span>Y = throttle, X = steer</span><br/>
    <span style="color:#ff9800;font-weight:bold">Joystick:</span> <span>Supported</span>
  `;
  document.body.appendChild(controls);

  // Resize handler
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  function animate() {
    requestAnimationFrame(animate);

    // --- Update Bike Physics ---
    // Throttle/Reverse
    if (keys.w) bikeSpeed += accel;
    if (keys.s) bikeSpeed -= brake;
    // Friction
    if (!keys.w && !keys.s) {
      if (bikeSpeed > 0) bikeSpeed = Math.max(0, bikeSpeed - friction);
      else if (bikeSpeed < 0) bikeSpeed = Math.min(0, bikeSpeed + friction);
    }
    // Clamp speed
    bikeSpeed = Math.max(-maxSpeed, Math.min(maxSpeed, bikeSpeed));
    // Steering
    if (keys.a) bikeRotY += steerSpeed * (bikeSpeed >= 0 ? 1 : -1);
    if (keys.d) bikeRotY -= steerSpeed * (bikeSpeed >= 0 ? 1 : -1);
    bike.rotation.y = bikeRotY;
    // Move bike forward in its local +Z
    const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), bikeRotY);
    bike.position.addScaledVector(forward, bikeSpeed);
    // Prevent falling through ground
    bike.position.y = 60;

    // Camera follows just behind and above the bike (third-person)
    const bikeWorldPos = new THREE.Vector3();
    bike.getWorldPosition(bikeWorldPos);
    // Offset: 500cm (5m) behind, 250cm (2.5m) above
    const behind = new THREE.Vector3(0, 250, 500);
    // Apply bike rotation to camera offset
    behind.applyAxisAngle(new THREE.Vector3(0, 1, 0), bike.rotation.y);
    camera.position.copy(bikeWorldPos).add(behind);
    camera.lookAt(bikeWorldPos.x, bikeWorldPos.y + 60, bikeWorldPos.z); // Look at bike
    renderer.render(scene, camera);
  }

  animate();
}

