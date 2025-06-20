import * as THREE from 'three';
import { createWelcomeScreen } from './welcome';
import { Character } from './characterData';
import { Terrain } from './terrain';
import { Track } from './track';

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
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 10, 250000); // 10cm to 2.5km
  camera.position.set(0, 4000, 10000); // 40m up, 100m back
  // (camera.lookAt will be set after startPoint is defined)

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

  // --- Terrain (ground) ---
  const terrain = new Terrain();

  // DEBUG: swap terrain material to MeshBasicMaterial for visibility
  // (terrain.mesh.material as THREE.Material).dispose();
  // terrain.mesh.material = new THREE.MeshBasicMaterial({ color: 0x6fc276, wireframe: false, side: THREE.DoubleSide });
  scene.add(terrain.mesh);

  // --- Track ---
  const track = new Track(terrain);
  scene.add(track.mesh);

  // --- Start marker ---
  const startPoint = track.curve.getPoint(0);
  // Now set camera to look at the bike start position
  camera.lookAt(startPoint.x, startPoint.y, startPoint.z);
  const startMarkerGeo = new THREE.CylinderGeometry(200, 200, 40, 32);
  const startMarkerMat = new THREE.MeshStandardMaterial({ color: 0xff2222 });
  const startMarker = new THREE.Mesh(startMarkerGeo, startMarkerMat);
  startMarker.position.copy(startPoint);
  startMarker.position.y += 40;
  scene.add(startMarker);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
  scene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
  dirLight.position.set(5000, 10000, 5000);
  dirLight.castShadow = true;
  scene.add(dirLight);

  // --- Bike at track start ---
  const bikeGeometry = new THREE.BoxGeometry(40, 120, 220); // +Z is forward
  const bikeMaterial = new THREE.MeshStandardMaterial({ color: 0xffa500 });
  const bike = new THREE.Mesh(bikeGeometry, bikeMaterial);
  // Place bike at start of track
  bike.position.copy(startPoint);
  bike.position.y = terrain.getHeight(bike.position.x, bike.position.z) + 60;
  // Orient bike to match track direction
  const startTangent = track.curve.getTangent(0);
  bike.rotation.y = Math.atan2(startTangent.x, startTangent.z);
  scene.add(bike);

  // Log terrain bounds
  terrain.mesh.geometry.computeBoundingBox();
  const terrainBounds = terrain.mesh.geometry.boundingBox;
  console.log('Terrain bounds:', terrainBounds);
  console.log('Bike start position:', bike.position);

  // --- Controls State ---
  const keys = { w: false, a: false, s: false, d: false, left: false, right: false, up: false, down: false };
  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    if (e.key === 'w') keys.w = true;
    if (e.key === 'a') keys.a = true;
    if (e.key === 's') keys.s = true;
    if (e.key === 'd') keys.d = true;
    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowRight') keys.right = true;
    if (e.key === 'ArrowUp') keys.up = true;
    if (e.key === 'ArrowDown') keys.down = true;
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === 'w') keys.w = false;
    if (e.key === 'a') keys.a = false;
    if (e.key === 's') keys.s = false;
    if (e.key === 'd') keys.d = false;
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
    if (e.key === 'ArrowUp') keys.up = false;
    if (e.key === 'ArrowDown') keys.down = false;
  });

  // --- Mobile Tilt Controls ---
  let tiltEnabled = false;
  let tiltSensitivity = 1.0;
  let lastBeta = 0, lastGamma = 0;

  function handleOrientation(event: DeviceOrientationEvent) {
    // event.beta: front-back tilt [-180,180], event.gamma: left-right tilt [-90,90]
    lastBeta = event.beta ?? 0;
    lastGamma = event.gamma ?? 0;
    // Throttle/brake: forward/back tilt
    if (lastBeta > 20 * tiltSensitivity) {
      keys.w = true; keys.s = false;
    } else if (lastBeta < -10 * tiltSensitivity) {
      keys.s = true; keys.w = false;
    } else {
      keys.w = false; keys.s = false;
    }
    // Steering: left/right tilt
    if (lastGamma > 10 * tiltSensitivity) {
      keys.a = false; keys.d = true;
    } else if (lastGamma < -10 * tiltSensitivity) {
      keys.a = true; keys.d = false;
    } else {
      keys.a = false; keys.d = false;
    }
  }

  function enableTiltControls() {
    // iOS: requestPermission is not in TypeScript types, so cast to any
    if (typeof window.DeviceOrientationEvent !== 'undefined' && typeof (window.DeviceOrientationEvent as any).requestPermission === 'function') {
      (window.DeviceOrientationEvent as any).requestPermission().then((response: string) => {
        if (response === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation);
          tiltEnabled = true;
          window.dispatchEvent(new Event('tiltcontrols:enabled'));
          alert('Tilt controls enabled! Hold phone landscape. Tilt forward/back to throttle/brake, left/right to steer.');
        }
      });
    } else if ('ondeviceorientation' in window) {
      window.addEventListener('deviceorientation', handleOrientation);
      tiltEnabled = true;
      window.dispatchEvent(new Event('tiltcontrols:enabled'));
      alert('Tilt controls enabled! Hold phone landscape. Tilt forward/back to throttle/brake, left/right to steer.' );
    } else {
      alert('Tilt controls not supported on this device/browser.');
    }
  }

  // --- Auto-enable tilt controls on mobile ---
  if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    function autoEnableTiltControls() {
      if (tiltEnabled) return;
      if (typeof window.DeviceOrientationEvent !== 'undefined' && typeof (window.DeviceOrientationEvent as any).requestPermission === 'function') {
        // iOS 13+: must request permission
        (window.DeviceOrientationEvent as any).requestPermission().then((response: string) => {
          if (response === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
            tiltEnabled = true;
            window.dispatchEvent(new Event('tiltcontrols:enabled'));
            // Optionally, show a toast or hint here
          } else {
            alert('Tilt controls permission denied. Enable in Settings > Safari > Motion & Orientation Access.');
          }
        }).catch(() => {
          alert('Tilt controls permission denied or not supported.');
        });
      } else if ('ondeviceorientation' in window) {
        window.addEventListener('deviceorientation', handleOrientation);
        tiltEnabled = true;
        window.dispatchEvent(new Event('tiltcontrols:enabled'));
      } else {
        alert('Tilt controls not supported on this device/browser.');
      }
    }
    autoEnableTiltControls();
  }


  // --- Bike Physics ---
  let bikeSpeed = 0; // cm/frame
  let bikeRotY = 0;  // radians
  const maxSpeed = 40; // cm/frame (~14.4km/h at 60fps)
  const accel = 1.5; // cm/frame^2
  const brake = 2.5; // cm/frame^2
  const friction = 0.7; // cm/frame^2
  const steerSpeed = 0.025; // radians/frame

  // --- Controls Instructions Overlay ---
  let controlsOverlay = document.getElementById('controls-overlay') as HTMLDivElement | null;
  if (!controlsOverlay) {
    controlsOverlay = document.createElement('div');
    controlsOverlay.id = 'controls-overlay';
    controlsOverlay.style.position = 'fixed';
    controlsOverlay.style.top = '0';
    controlsOverlay.style.left = '0';
    controlsOverlay.style.width = '100vw';
    controlsOverlay.style.padding = 'max(2vw,12px)';
    controlsOverlay.style.background = 'rgba(30,40,60,0.85)';
    controlsOverlay.style.color = '#fff';
    controlsOverlay.style.fontSize = 'clamp(1rem, 2vw, 1.4rem)';
    controlsOverlay.style.fontFamily = 'sans-serif';
    controlsOverlay.style.zIndex = '1500';
    controlsOverlay.style.textAlign = 'center';
    controlsOverlay.style.borderBottomLeftRadius = '18px';
    controlsOverlay.style.borderBottomRightRadius = '18px';
    controlsOverlay.innerHTML =
      '<b>Controls:</b> <br>' +
      'WASD or Arrow keys: Move & Steer<br>' +
      'Space: Restart &nbsp; | &nbsp; M: Toggle Music<br>' +
      'On mobile: Tap "Enable Tilt Controls"<br>' +
      '<span style="font-size:0.9em;">Tip: Tilt phone to steer/throttle/brake</span>';
    document.body.appendChild(controlsOverlay);
  }

  function hideControlsOverlay() {
    if (controlsOverlay && controlsOverlay.parentElement) {
      controlsOverlay.parentElement.removeChild(controlsOverlay);
      controlsOverlay = null;
    }
  }

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

  // Camera rig for banking camera with bike
  let cameraRig: THREE.Object3D | null = null;

  function animate() {
    requestAnimationFrame(animate);

    // --- Update Bike Physics ---
    // Throttle/Brake
    if (keys.w) bikeSpeed += accel;
    if (keys.s) bikeSpeed -= brake * Math.sign(bikeSpeed); // S only slows, not reverses
    // Friction
    if (!keys.w && !keys.s) {
      if (bikeSpeed > 0) bikeSpeed = Math.max(0, bikeSpeed - friction);
      else if (bikeSpeed < 0) bikeSpeed = Math.min(0, bikeSpeed + friction);
    }
    // Clamp speed (no reverse)
    bikeSpeed = Math.max(0, Math.min(maxSpeed, bikeSpeed));
    // Steering
    let steer = 0;
    if (keys.a) steer += 1;
    if (keys.d) steer -= 1;
    if (bikeSpeed > 0.5) {
      bikeRotY += steerSpeed * steer;
    }
    bike.rotation.y = bikeRotY;
    // Move bike forward in its local +Z (geometry +Z is forward)
    const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), bikeRotY);
    bike.position.addScaledVector(forward, bikeSpeed);
    // Set bike Y to terrain height under wheels
    bike.position.y = terrain.getHeight(bike.position.x, bike.position.z) + 60;

    // --- Pitch (tilt up/down for hills) ---
    // Sample terrain at front and rear wheel
    const bikeLength = 220; // cm
    const forwardVec = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), bike.rotation.y).normalize();
    const rearPos = bike.position.clone().addScaledVector(forwardVec, -bikeLength / 2);
    const frontPos = bike.position.clone().addScaledVector(forwardVec, bikeLength / 2);
    const rearY = terrain.getHeight(rearPos.x, rearPos.z) + 60;
    const frontY = terrain.getHeight(frontPos.x, frontPos.z) + 60;
    // Pitch angle: atan2(height difference, wheelbase)
    const pitch = Math.atan2(frontY - rearY, bikeLength);
    bike.rotation.x = pitch;

    // --- Leaning ---
    // Lean into corners: negative for left, positive for right
    const maxLean = Math.PI / 7; // max lean angle ~25deg
    const lean = -steer * Math.min(1, bikeSpeed / maxSpeed) * maxLean;
    bike.rotation.z = lean;

    // Camera follows just behind and above the bike (third-person)
    const bikeWorldPos = new THREE.Vector3();
    bike.getWorldPosition(bikeWorldPos);
    // Offset: 500cm (5m) behind, 250cm (2.5m) above, but behind is -Z
    const behind = new THREE.Vector3(0, 250, -500);
    // Apply bike rotation to camera offset
    behind.applyAxisAngle(new THREE.Vector3(0, 1, 0), bike.rotation.y);
    camera.position.copy(bikeWorldPos).add(behind);
    camera.lookAt(bikeWorldPos.x, bikeWorldPos.y + 60, bikeWorldPos.z); // Look at bike
    renderer.render(scene, camera);

    // Hide controls overlay if bike starts moving
    if (controlsOverlay && bikeSpeed > 0.5) {
      hideControlsOverlay();
    }

  }

  function animate2() {
    requestAnimationFrame(animate);

    // --- Update Bike Physics ---
    // Throttle/Brake
    if (keys.w) bikeSpeed += accel;
    if (keys.s) bikeSpeed -= brake * Math.sign(bikeSpeed); // S only slows, not reverses
    // Friction
    if (!keys.w && !keys.s) {
      if (bikeSpeed > 0) bikeSpeed = Math.max(0, bikeSpeed - friction);
      else if (bikeSpeed < 0) bikeSpeed = Math.min(0, bikeSpeed + friction);
    }
    // Clamp speed (no reverse)
    bikeSpeed = Math.max(0, Math.min(maxSpeed, bikeSpeed));
    // Steering
    let steer = 0;
    if (keys.a) steer += 1;
    if (keys.d) steer -= 1;
    if (bikeSpeed > 0.5) {
      bikeRotY += steerSpeed * steer;
    }
    bike.rotation.y = bikeRotY;
    // Move bike forward in its local +Z (geometry +Z is forward), using only yaw (rotation.y)
    // const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), bikeRotY);
    // bike.position.addScaledVector(forward, bikeSpeed);

    const forwardYaw = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), bike.rotation.y).normalize();
    bike.position.addScaledVector(forwardYaw, bikeSpeed);
    // Set bike Y to terrain height under wheels
    bike.position.y = terrain.getHeight(bike.position.x, bike.position.z) + 60;

    // --- Pitch (tilt up/down for hills) ---
    // Sample terrain at front and rear wheel
    const bikeLength = 220; // cm
    const forwardVec = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), bike.rotation.y).normalize();
    const rearPos = bike.position.clone().addScaledVector(forwardVec, -bikeLength / 2);
    const frontPos = bike.position.clone().addScaledVector(forwardVec, bikeLength / 2);
    const rearY = terrain.getHeight(rearPos.x, rearPos.z) + 60;
    const frontY = terrain.getHeight(frontPos.x, frontPos.z) + 60;
    // Pitch angle: atan2(height difference, wheelbase)
    const pitch = Math.atan2(frontY - rearY, bikeLength);
    bike.rotation.x = pitch;

    // --- Leaning ---
    // Lean into corners: negative for left, positive for right
    const maxLean = Math.PI / 7; // max lean angle ~25deg
    const lean = -steer * Math.min(1, bikeSpeed / maxSpeed) * maxLean;
    bike.rotation.z = lean;

    // --- Camera Follow Bike (closer, banks/rolls with bike) ---
    const followDistance = 650; // cm (6.5m)
    const followHeight = 220;   // cm (2.2m)
    // Use a camera rig to bank/roll with the bike
    if (!cameraRig) {
      cameraRig = new THREE.Object3D();
      scene.add(cameraRig);
      cameraRig.add(camera);
      camera.position.set(0, followHeight, -followDistance);
    }
    // Copy bike position and rotation.z (lean)
    cameraRig.position.copy(bike.position);
    cameraRig.rotation.set(0, bike.rotation.y, bike.rotation.z);
    // Camera always looks at a point just above bike (in rig's local space)
    camera.lookAt(new THREE.Vector3(0, 60, 0));


    // const bikeWorldPos = new THREE.Vector3();
    // bike.getWorldPosition(bikeWorldPos);
    // // Offset: 500cm (5m) behind, 250cm (2.5m) above, but behind is -Z
    // const behind = new THREE.Vector3(0, 250, -500);
    // // Apply bike rotation to camera offset
    // behind.applyAxisAngle(new THREE.Vector3(0, 1, 0), bike.rotation.y);
    // camera.position.copy(bikeWorldPos).add(behind);
    // camera.lookAt(bikeWorldPos.x, bikeWorldPos.y + 60, bikeWorldPos.z); // Look at bike



    // Log bike position in each frame
    if (performance.now() % 1000 < 20) { // log every ~1s
      console.log('Bike position:', bike.position.clone());
    }
    renderer.render(scene, camera);
  }

  animate();
}

