# EcoSync – 3D Eco-World Presentation & Viva Answers (Q1–Q5)

> **Where to demo:** Run the frontend (`npm run dev` inside `frontend/`) and tap the **Journey** tab in the bottom navigation bar. The interactive **3D Eco-World** appears at the top of `Journey.jsx`.

---

## Q1. What interactive experience did you create, and what is its purpose?

- **What we built:** An **interactive 3D Eco-World** embedded inside **EcoSync** (our mobile-first sustainability PWA built with React, Vite, and Tailwind CSS).
- **Objective / Intended Experience:** Turn everyday eco-friendly habits (waste disposal, tree planting, maintaining daily streaks) into a living, interactive 3D island rather than just flat numbers and lists.
- **Main Features & Interactive Elements:**
  - **3D Orbit & Zoom:** Users drag/touch to rotate around the 3D eco-island and pinch/scroll to zoom.
  - **Garbage Truck Dispatch:** Clicking **🚛 Dispatch Truck** sends a 3D garbage truck along the circular road to collect waste bins (`+20 PTS` per bin).
  - **Random-Walking Eco-Volunteer & Tree Planting:** A 3D human character patrols random points on the grass floor; clicking **🌱 Plant Tree (+30)** sends the volunteer to plant a new 3D sapling that grows in real time.
  - **24-Hour Daily Streak Rule:** Clearing all waste bins awards a `+1` streak only once every 24 hours (`ONE_DAY_MS`), reinforcing real daily habit consistency.
- **Personal Contribution:** Designed and built the `EcoWorld3D` Three.js component (`frontend/src/features/journey/EcoWorld3D.jsx`), the random floor-pathfinding logic for the 3D human, the truck collection route, and the 24-hour streak persistence, and integrated it into `Journey.jsx`.

**Demo Tip:** Open `/journey`, drag the 3D island to show 360° lighting and shadows, click **Dispatch Truck** to collect the bins, and click **Plant Tree** to watch the volunteer walk over and grow a tree.

---

## Q2. Which tools, technologies, and development concepts did you use?

- **Engine / Frameworks & Why:**
  - **Three.js (`three` + `OrbitControls`):** Lightweight WebGL 3D library that runs directly inside React without heavy game-engine overhead, ideal for a mobile-first PWA.
  - **React 18 + Vite + Tailwind CSS:** Existing EcoSync frontend stack for fast HMR, component modularity, and responsive mobile UI.
  - **`localStorage`:** Persists 3D points, streak count, and the 24-hour streak timestamp (`ecosync_last_3d_streak_at`) across reloads.
- **Project Structure:**
  - `frontend/src/features/journey/EcoWorld3D.jsx` — Self-contained Three.js scene, meshes, lighting, animation loop, and React UI controls.
  - `frontend/src/features/journey/Journey.jsx` — Expedition Map page hosting `<EcoWorld3D />`.
  - `frontend/src/components/BottomNav.jsx` & `frontend/src/App.jsx` — App shell and `/journey` route.
- **Course Concepts Implemented:**
  - **3D Scene Graph & Hierarchy:** Grouping sub-meshes (`hubGroup`, `truckGroup`, `humanGroup`, `treesGroup`) so each entity transforms as one unit.
  - **3D Transformations:** Translation (`position.set`), rotation (`rotation.y = Math.atan2(dx, dz)`), and non-linear scaling (`mesh.scale.setScalar`) for tree growth.
  - **Materials & Lighting:** `MeshStandardMaterial` (PBR roughness/metalness) lit by `HemisphereLight` and shadow-casting `DirectionalLight` (`PCFSoftShadowMap`).
  - **Animation & Game Loop:** Frame-rate-independent `THREE.Clock` (`dt`) driving `requestAnimationFrame`.
- **How Components Work Together:** React renders the container `div` and action buttons (`Dispatch Truck`, `Plant Tree`, `Reset`), while `useEffect` initializes the Three.js `WebGLRenderer`. Mutable simulation state lives in `simRef` so button clicks immediately trigger 3D animations without re-creating the WebGL context.

**Show:** Open `frontend/src/features/journey/EcoWorld3D.jsx` in your IDE and point out the scene setup (`Scene`, `PerspectiveCamera`, `WebGLRenderer`) and `animate()` loop.

---

## Q3. How did you implement interactions and behavior in your project?

- **User Input:**
  - **Touch / Mouse Drag & Scroll/Pinch:** Handled by `OrbitControls` (`enableDamping = true`, `maxPolarAngle` clamped above ground so the user never clips under the island).
  - **UI Action Buttons:** `🚛 Dispatch Truck`, `🌱 Plant Tree (+30)`, and `Reset` buttons below the 3D viewport.
- **Object Responses:**
  - **Human Volunteer:** Continuously picks random `(x, z)` floor coordinates via `pickRandomFloorPoint()` (avoiding the central hub), rotates toward the target, swings arms/legs (`Math.sin(elapsed * 9)`), and walks to the new sapling when **Plant Tree** is clicked.
  - **Garbage Truck:** Follows a circular road (`roadRadius = 1.95`), checks angular proximity (`diff < 0.22`) to each trash bin, hides collected bins, and awards `+20 PTS`.
  - **24-Hour Streak Logic:** `tryIncrementDailyStreak()` compares `Date.now() - lastClaim >= 24 * 60 * 60 * 1000` before incrementing the streak, otherwise displaying how many hours remain.
- **State Management:**
  - React `useState` manages HUD metrics (`points`, `streak`, `treeCount`, `trashRemaining`, `statusMsg`).
  - `useRef` (`simRef`) bridges React event handlers and the 60fps Three.js `animate()` loop.

**Show:** Click **Plant Tree (+30)** during the demo and point to `simRef.current.addTreeCallback` + the `animate()` random-walk block in `EcoWorld3D.jsx`.

---

## Q4. How did you create and integrate the visual or interactive elements?

- **3D Models & Environment:**
  - Built procedurally in Three.js using primitive geometries (`BoxGeometry`, `CylinderGeometry`, `ConeGeometry`, `RingGeometry`) combined into hierarchical `THREE.Group` objects—keeping bundle size small and load time instant on mobile.
  - **Environment:** Grass island base, soil layer, circular road ring, and a central EcoSync Hub with a metallic solar-panel roof.
- **Transformations, Materials & Lighting:**
  - `MeshStandardMaterial` with tuned `roughness` and `metalness` (e.g., `metalness: 0.35` on the solar roof).
  - `DirectionalLight` with a `1024x1024` shadow map (`castShadow` on trees, truck, hub, and human; `receiveShadow` on grass and road).
  - Smooth interpolation (`cur + (targetScale - cur) * 0.08`) for growing newly planted trees.
- **Testing & Verification:**
  - Verified production bundling with `npm run build` (`vite build` succeeded, transforming 2,134 modules).
  - Verified camera bounds (`minPolarAngle`, `maxPolarAngle`, `minDistance`, `maxDistance`), WebGL cleanup on component unmount (`controls.dispose()`, `renderer.dispose()`), and 24-hour streak timestamp behavior.

**Show:** Point out `spawnTree()`, `truckGroup`, `humanGroup`, and `dirLight.shadow` in `EcoWorld3D.jsx` alongside the live rendered shadows in the browser.

---

## Q5. What technical challenges did you face, and how did you ensure your project works correctly?

- **Most Difficult Feature:** Synchronizing the **React UI state** (buttons, points, 24-hour streak) with the **imperative 60fps Three.js render loop** without causing React re-renders to reset or stutter the WebGL canvas, plus ensuring the **random-walking human** never walks through the central house or off the island.
- **Problems Faced:**
  1. **Camera Clipping:** Without polar angle limits, dragging downward allowed the camera to go underneath the island.
  2. **Obstacle Avoidance:** Naive random `(x, z)` points caused the human to walk straight through the central EcoSync hub.
  3. **Memory Leaks on Route Switch:** Switching tabs in React Router (`BottomNav`) unmounts `Journey.jsx`; without cleanup, WebGL contexts and `requestAnimationFrame` loops would leak.
- **How We Debugged & Resolved Them:**
  - Clamped `OrbitControls.maxPolarAngle = Math.PI / 2.25` and `minDistance` / `maxDistance`.
  - Added radial bounds (`distFromCenter > 1.05 && distFromCenter < 2.35`) in `pickRandomFloorPoint()` so the human stays strictly on the walkable grass ring.
  - Used `simRef` for mutable 3D state and added a full `useEffect` cleanup (`cancelAnimationFrame`, `controls.dispose()`, `renderer.dispose()`).
- **Completeness & Remaining Limitations:**
  - **Complete:** Interactive 3D Eco-World is integrated on `/journey`, builds cleanly (`vite build`), and supports orbit/zoom, truck dispatch, random-walking human, tree planting, and 24-hour streak tracking.
  - **Limitations:** 3D points/trees currently persist in `localStorage` rather than the PostgreSQL backend, and models are procedural Three.js geometry rather than external `.glb` assets (which can be swapped in later with `GLTFLoader`).
