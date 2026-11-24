import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const LAST_STREAK_KEY = 'ecosync_last_3d_streak_at';
const STREAK_COUNT_KEY = 'ecosync_3d_streak_count';
const POINTS_KEY = 'ecosync_3d_points';

/**
 * Picks a random walkable (x, z) point on the grass floor, avoiding the central EcoSync hub.
 */
function pickRandomFloorPoint() {
  for (let i = 0; i < 20; i++) {
    const x = (Math.random() - 0.5) * 4.2;
    const z = (Math.random() - 0.5) * 4.2;
    const distFromCenter = Math.hypot(x, z);
    if (distFromCenter > 1.05 && distFromCenter < 2.35) {
      return new THREE.Vector3(x, 0, z);
    }
  }
  return new THREE.Vector3(1.5, 0, 1.5);
}

/**
 * Interactive 3D Eco-World built with Three.js for EcoSync.
 * Features a random-walking human eco-volunteer, an animated garbage truck,
 * plantable 3D trees, OrbitControls, and a 24-hour streak cooldown rule.
 */
export default function EcoWorld3D() {
  const mountRef = useRef(null);
  const controlsRef = useRef(null);
  const cameraRef = useRef(null);

  const [points, setPoints] = useState(() => {
    const saved = Number(localStorage.getItem(POINTS_KEY));
    return Number.isFinite(saved) && saved > 0 ? saved : 120;
  });
  const [streak, setStreak] = useState(() => {
    const saved = Number(localStorage.getItem(STREAK_COUNT_KEY));
    return Number.isFinite(saved) && saved > 0 ? saved : 18;
  });
  const [treeCount, setTreeCount] = useState(3);
  const [trashRemaining, setTrashRemaining] = useState(3);
  const [statusMsg, setStatusMsg] = useState('Drag to orbit • Scroll/pinch to zoom');

  // Mutable simulation refs shared between React buttons and the Three.js render loop
  const simRef = useRef({
    truckActive: false,
    truckAngle: 0.25,
    bins: [],
    trees: [],
    humanTarget: pickRandomFloorPoint(),
    humanPauseTimer: 0,
    plantingMode: false,
    addTreeCallback: null,
    resetBinsCallback: null,
  });

  const showStatus = useCallback((msg) => {
    setStatusMsg(msg);
  }, []);

  const tryIncrementDailyStreak = useCallback(() => {
    const now = Date.now();
    const lastClaim = Number(localStorage.getItem(LAST_STREAK_KEY) || 0);
    if (!lastClaim || now - lastClaim >= ONE_DAY_MS) {
      localStorage.setItem(LAST_STREAK_KEY, String(now));
      setStreak((prev) => {
        const next = prev + 1;
        localStorage.setItem(STREAK_COUNT_KEY, String(next));
        return next;
      });
      showStatus('All waste cleared! Daily streak +1 (24h goal met)');
    } else {
      const hoursLeft = Math.max(1, Math.ceil((ONE_DAY_MS - (now - lastClaim)) / (60 * 60 * 1000)));
      showStatus(`All waste cleared! Next streak in ~${hoursLeft}h (24h rule)`);
    }
  }, [showStatus]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 280;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(4.8, 4.4, 5.2);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 2. OrbitControls (drag to rotate, pinch/scroll to zoom)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2.25; // keep camera above ground
    controls.minPolarAngle = 0.25;
    controls.minDistance = 4.0;
    controls.maxDistance = 12.0;
    controls.target.set(0, 0.2, 0);
    controlsRef.current = controls;

    // 3. Lighting
    const hemiLight = new THREE.HemisphereLight(0xdfffe0, 0x3b2f2f, 0.75);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.35);
    dirLight.position.set(5, 8, 4);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 20;
    const d = 4.5;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    scene.add(dirLight);

    // 4. Base Eco-Island (Grass + Soil)
    const grassGeo = new THREE.BoxGeometry(5.2, 0.3, 5.2);
    const grassMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.85 });
    const grassMesh = new THREE.Mesh(grassGeo, grassMat);
    grassMesh.position.y = -0.15;
    grassMesh.receiveShadow = true;
    scene.add(grassMesh);

    const soilGeo = new THREE.BoxGeometry(5.0, 0.28, 5.0);
    const soilMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.95 });
    const soilMesh = new THREE.Mesh(soilGeo, soilMat);
    soilMesh.position.y = -0.44;
    scene.add(soilMesh);

    // 5. Circular Road Ring
    const roadRadius = 1.95;
    const roadGeo = new THREE.RingGeometry(roadRadius - 0.28, roadRadius + 0.28, 48);
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9, side: THREE.DoubleSide });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.position.y = 0.005;
    roadMesh.receiveShadow = true;
    scene.add(roadMesh);

    // 6. Central EcoSync Solar Hub
    const hubGroup = new THREE.Group();
    const wallMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.75, 1.0),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.6 })
    );
    wallMesh.position.y = 0.375;
    wallMesh.castShadow = true;
    wallMesh.receiveShadow = true;
    hubGroup.add(wallMesh);

    const solarRoof = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 0.1, 1.15),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.35, roughness: 0.3 })
    );
    solarRoof.position.y = 0.8;
    solarRoof.castShadow = true;
    hubGroup.add(solarRoof);
    scene.add(hubGroup);

    // 7. Helper to create 3D Trees
    const treesGroup = new THREE.Group();
    scene.add(treesGroup);

    function spawnTree(x, z, startScale = 1) {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.09, 0.45, 8),
        new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.9 })
      );
      trunk.position.y = 0.225;
      trunk.castShadow = true;
      tree.add(trunk);

      const foliage1 = new THREE.Mesh(
        new THREE.ConeGeometry(0.32, 0.5, 8),
        new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.8 })
      );
      foliage1.position.y = 0.58;
      foliage1.castShadow = true;
      tree.add(foliage1);

      const foliage2 = new THREE.Mesh(
        new THREE.ConeGeometry(0.24, 0.4, 8),
        new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.75 })
      );
      foliage2.position.y = 0.82;
      foliage2.castShadow = true;
      tree.add(foliage2);

      tree.position.set(x, 0, z);
      tree.scale.setScalar(startScale);
      treesGroup.add(tree);
      simRef.current.trees.push({ mesh: tree, targetScale: 0.9 + Math.random() * 0.25 });
    }

    simRef.current.trees = [];
    spawnTree(-1.55, -1.35, 1);
    spawnTree(1.65, -1.25, 0.95);
    spawnTree(-1.35, 1.55, 0.9);

    simRef.current.addTreeCallback = () => {
      const pt = pickRandomFloorPoint();
      spawnTree(pt.x, pt.z, 0.05);
      simRef.current.humanTarget.copy(pt);
      simRef.current.plantingMode = true;
      simRef.current.humanPauseTimer = 0;
      setTreeCount(simRef.current.trees.length);
      setPoints((prev) => {
        const next = prev + 30;
        localStorage.setItem(POINTS_KEY, String(next));
        return next;
      });
      showStatus('Volunteer walking to plant a tree! +30 PTS');
    };

    // 8. Trash Bins along the road
    const binAngles = [1.0, 2.9, 4.8];
    const binsGroup = new THREE.Group();
    scene.add(binsGroup);

    function createBins() {
      binsGroup.clear();
      simRef.current.bins = binAngles.map((angle) => {
        const mesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.24, 0.3, 0.24),
          new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.6 })
        );
        mesh.position.set(
          Math.cos(angle) * (roadRadius + 0.35),
          0.15,
          Math.sin(angle) * (roadRadius + 0.35)
        );
        mesh.castShadow = true;
        binsGroup.add(mesh);
        return { angle, mesh, collected: false };
      });
    }
    createBins();
    simRef.current.resetBinsCallback = createBins;

    // 9. 3D Garbage Truck
    const truckGroup = new THREE.Group();
    const truckBin = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.32, 0.56),
      new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.5 })
    );
    truckBin.position.set(0, 0.22, -0.1);
    truckBin.castShadow = true;
    truckGroup.add(truckBin);

    const truckCab = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.26, 0.26),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 })
    );
    truckCab.position.set(0, 0.19, 0.32);
    truckCab.castShadow = true;
    truckGroup.add(truckCab);

    const wheelGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.06, 12);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
    [
      [-0.19, 0.08, 0.28],
      [0.19, 0.08, 0.28],
      [-0.19, 0.08, -0.22],
      [0.19, 0.08, -0.22],
    ].forEach(([wx, wy, wz]) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, wy, wz);
      truckGroup.add(wheel);
    });
    scene.add(truckGroup);

    // 10. 3D Human Eco-Volunteer (random floor movement)
    const humanGroup = new THREE.Group();
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.7 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.6 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const capMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.5 });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.24, 0.12), shirtMat);
    torso.position.y = 0.28;
    torso.castShadow = true;
    humanGroup.add(torso);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), skinMat);
    head.position.y = 0.48;
    head.castShadow = true;
    humanGroup.add(head);

    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, 0.18), capMat);
    cap.position.y = 0.58;
    humanGroup.add(cap);

    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.16, 0.07), pantsMat);
    leftLeg.position.set(-0.06, 0.08, 0);
    leftLeg.castShadow = true;
    humanGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.16, 0.07), pantsMat);
    rightLeg.position.set(0.06, 0.08, 0);
    rightLeg.castShadow = true;
    humanGroup.add(rightLeg);

    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.07), skinMat);
    leftArm.position.set(-0.15, 0.28, 0);
    humanGroup.add(leftArm);

    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.07), skinMat);
    rightArm.position.set(0.15, 0.28, 0);
    humanGroup.add(rightArm);

    humanGroup.position.set(1.2, 0, 1.1);
    scene.add(humanGroup);

    // 11. Animation Loop
    let frameId = 0;
    const clock = new THREE.Clock();

    function animate() {
      frameId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.elapsedTime;

      // Tree growth animation
      for (const t of simRef.current.trees) {
        const cur = t.mesh.scale.x;
        const next = cur + (t.targetScale - cur) * 0.08;
        t.mesh.scale.setScalar(next);
      }

      // Random-walking Human on the grass floor
      const sim = simRef.current;
      if (sim.humanPauseTimer > 0) {
        sim.humanPauseTimer -= dt;
        leftLeg.rotation.x = 0;
        rightLeg.rotation.x = 0;
        leftArm.rotation.x = 0;
        rightArm.rotation.x = 0;
      } else {
        const dx = sim.humanTarget.x - humanGroup.position.x;
        const dz = sim.humanTarget.z - humanGroup.position.z;
        const dist = Math.hypot(dx, dz);

        if (dist < 0.15) {
          sim.plantingMode = false;
          sim.humanPauseTimer = 0.8 + Math.random() * 1.2;
          sim.humanTarget.copy(pickRandomFloorPoint());
        } else {
          const speed = sim.plantingMode ? 1.55 : 0.85;
          const step = Math.min(dist, speed * dt);
          humanGroup.position.x += (dx / dist) * step;
          humanGroup.position.z += (dz / dist) * step;

          // Smoothly face direction of travel
          const targetYaw = Math.atan2(dx, dz);
          humanGroup.rotation.y = targetYaw;

          // Walking limb swing
          const swing = Math.sin(elapsed * 9) * 0.55;
          leftLeg.rotation.x = swing;
          rightLeg.rotation.x = -swing;
          leftArm.rotation.x = -swing * 0.7;
          rightArm.rotation.x = swing * 0.7;
        }
      }

      // Garbage Truck circular road movement
      if (sim.truckActive) {
        sim.truckAngle += dt * 1.4;
        const allBins = sim.bins;
        let collectedNow = 0;
        for (const b of allBins) {
          if (!b.collected) {
            const diff = Math.abs(
              ((sim.truckAngle % (Math.PI * 2)) - b.angle + Math.PI * 3) % (Math.PI * 2) - Math.PI
            );
            if (diff < 0.22) {
              b.collected = true;
              b.mesh.visible = false;
              collectedNow += 1;
            }
          }
        }
        if (collectedNow > 0) {
          setPoints((prev) => {
            const next = prev + collectedNow * 20;
            localStorage.setItem(POINTS_KEY, String(next));
            return next;
          });
          const remaining = allBins.filter((b) => !b.collected).length;
          setTrashRemaining(remaining);
          if (remaining === 0) {
            sim.truckActive = false;
            tryIncrementDailyStreak();
          } else {
            showStatus(`Garbage collected! +${collectedNow * 20} PTS`);
          }
        }
      }

      truckGroup.position.set(
        Math.cos(sim.truckAngle) * roadRadius,
        0,
        Math.sin(sim.truckAngle) * roadRadius
      );
      truckGroup.rotation.y = -sim.truckAngle;

      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // Responsive resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 360;
      const h = container.clientHeight || 280;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [showStatus, tryIncrementDailyStreak]);

  const handleDispatchTruck = () => {
    const sim = simRef.current;
    if (sim.bins.every((b) => b.collected)) {
      sim.resetBinsCallback?.();
      setTrashRemaining(sim.bins.length);
    }
    sim.truckActive = true;
    showStatus('Garbage truck dispatched along the route!');
  };

  const handlePlantTree = () => {
    simRef.current.addTreeCallback?.();
  };

  const handleResetView = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(4.8, 4.4, 5.2);
      controlsRef.current.target.set(0, 0.2, 0);
      controlsRef.current.update();
    }
  };

  return (
    <section className="mb-4 rounded-2xl bg-surface-container-low border border-surface-container-high p-3 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />
          <h2 className="font-label-chunky text-xs uppercase tracking-wider text-primary font-black">
            3D Eco-World
          </h2>
        </div>
        <div className="flex items-center gap-2 font-label-mono-num text-[11px] font-bold">
          <span className="px-2 py-0.5 rounded-full bg-surface-container text-tertiary-fixed-dim">
            🔥 {streak}d
          </span>
          <span className="px-2 py-0.5 rounded-full bg-surface-container text-primary-container">
            +{points} PTS
          </span>
        </div>
      </div>

      {/* Three.js Canvas Container */}
      <div className="relative w-full h-[260px] rounded-xl overflow-hidden bg-surface-container-lowest border border-surface-container-high">
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
        <div className="pointer-events-none absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] px-2.5 py-1 rounded-lg bg-surface-container-lowest/85 backdrop-blur-sm border border-surface-container-high text-on-surface-variant">
          <span className="truncate">{statusMsg}</span>
          <span className="font-label-mono-num flex-shrink-0 ml-2">
            🌳 {treeCount} • 🗑️ {trashRemaining}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2 pt-2.5">
        <button
          type="button"
          onClick={handleDispatchTruck}
          className="flex-1 min-w-[120px] py-2 px-3 rounded-xl bg-primary-container text-on-primary-fixed font-label-chunky text-[11px] uppercase font-black shadow-[0_3px_0_#2d5000] active:translate-y-0.5 transition-all"
        >
          🚛 Dispatch Truck
        </button>
        <button
          type="button"
          onClick={handlePlantTree}
          className="flex-1 min-w-[120px] py-2 px-3 rounded-xl bg-surface-container-high text-primary font-label-chunky text-[11px] uppercase font-bold border border-primary-container/30 active:translate-y-0.5 transition-all"
        >
          🌱 Plant Tree (+30)
        </button>
        <button
          type="button"
          onClick={handleResetView}
          className="py-2 px-3 rounded-xl bg-surface-container text-on-surface-variant font-label-chunky text-[11px] uppercase active:scale-95 transition"
        >
          Reset
        </button>
      </div>
    </section>
  );
}
