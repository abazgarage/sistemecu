<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

const mountPoint = ref(null)
const activeSection = ref('overview')
const selectedPart = ref('ecu')
const vehicleType = ref('MOTORCYCLE')
const isLive = ref(true)
const showLabels = ref(true)
const sceneReady = ref(false)
const dtcFilter = ref('all')

const parts = [
  { id: 'ecu', name: 'Engine Control Unit', short: 'ECU', type: 'CONTROL MODULE', voltage: '12.4 V', status: 'NORMAL', description: 'Unit pengendali yang memproses masukan sensor dan mengatur keluaran aktuator pada sistem manajemen mesin.' },
  { id: 'map', name: 'Manifold Absolute Pressure', short: 'MAP', type: 'INPUT SENSOR', voltage: '2.1 V', status: 'NORMAL', description: 'Sensor tekanan manifold yang membantu ECU memperkirakan beban mesin.' },
  { id: 'tps', name: 'Throttle Position Sensor', short: 'TPS', type: 'INPUT SENSOR', voltage: '0.8 V', status: 'NORMAL', description: 'Mendeteksi sudut bukaan throttle sebagai salah satu masukan perhitungan beban mesin.' },
  { id: 'injector', name: 'Fuel Injector', short: 'INJ', type: 'OUTPUT ACTUATOR', voltage: 'PULSE', status: 'READY', description: 'Aktuator yang menyemprotkan bahan bakar sesuai perintah pengendali mesin.' },
  { id: 'ckp', name: 'Crankshaft Position', short: 'CKP', type: 'INPUT SENSOR', voltage: 'AC SIGNAL', status: 'NORMAL', description: 'Memberikan informasi posisi dan kecepatan putaran poros engkol.' },
  { id: 'power', name: 'Power Regulation', short: 'PWR', type: 'POWER', voltage: '12.4 V', status: 'NORMAL', description: 'Tahap catu daya konseptual untuk rangkaian elektronik modul.' },
]
const dtcs = [
  { code: 'P0107', title: 'MAP sensor circuit low', system: 'INTAKE', severity: 'INFO' },
  { code: 'P0122', title: 'Throttle position sensor low', system: 'THROTTLE', severity: 'WARNING' },
  { code: 'P0335', title: 'Crankshaft position sensor circuit', system: 'IGNITION', severity: 'INFO' },
]
const filteredDtcs = computed(() => dtcFilter.value === 'all' ? dtcs : dtcs.filter(item => item.severity.toLowerCase() === dtcFilter.value))
const selected = computed(() => parts.find(part => part.id === selectedPart.value) || parts[0])

let renderer, scene, camera, controls, animationId, raycaster, pointer, boardGroup, resizeObserver
const interactiveMeshes = []
const signalParticles = []

function createTextSprite(text) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  ctx.font = '600 38px monospace'
  ctx.fillStyle = '#8beaff'
  ctx.shadowColor = '#48d9f4'
  ctx.shadowBlur = 18
  ctx.fillText(text, 18, 78)
  const texture = new THREE.CanvasTexture(canvas)
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }))
  sprite.scale.set(1.2, 0.3, 1)
  return sprite
}
function addPart(id, label, position, size, color = 0x17465a) {
  const geometry = new THREE.BoxGeometry(...size)
  const material = new THREE.MeshStandardMaterial({ color, metalness: 0.72, roughness: 0.28, emissive: 0x087e9c, emissiveIntensity: 0.32 })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(...position)
  mesh.userData.partId = id
  mesh.castShadow = true
  boardGroup.add(mesh)
  interactiveMeshes.push(mesh)
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), new THREE.LineBasicMaterial({ color: 0x54dcff, transparent: true, opacity: 0.7 }))
  edges.position.copy(mesh.position)
  boardGroup.add(edges)
  if (showLabels.value) {
    const sprite = createTextSprite(label)
    sprite.position.set(position[0], position[1] + size[1] * 0.85 + 0.12, position[2])
    boardGroup.add(sprite)
  }
}
function createCircuitPath(points, color = 0x23d9f5) {
  const curve = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point)))
  boardGroup.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.012, 6, false), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.82 })))
  boardGroup.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.035, 6, false), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.12 })))
  const particle = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 12), new THREE.MeshBasicMaterial({ color }))
  boardGroup.add(particle)
  signalParticles.push({ curve, particle, offset: Math.random() })
}
function addConnector(position, label) {
  const group = new THREE.Group()
  group.position.set(...position)
  const housing = new THREE.Mesh(
    new THREE.BoxGeometry(0.52, 0.24, 0.38),
    new THREE.MeshStandardMaterial({ color: 0x182d37, metalness: 0.35, roughness: 0.5, emissive: 0x062b39, emissiveIntensity: 0.35 })
  )
  group.add(housing)
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 5; col++) {
      const pin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 0.13, 8),
        new THREE.MeshStandardMaterial({ color: 0xc5a96b, metalness: 0.85, roughness: 0.25, emissive: 0x59451d, emissiveIntensity: 0.2 })
      )
      pin.rotation.x = Math.PI / 2
      pin.position.set(-0.18 + col * 0.09, -0.025 + row * 0.09, 0.2)
      group.add(pin)
    }
  }
  boardGroup.add(group)
  const tag = createTextSprite(label)
  tag.scale.set(0.75, 0.19, 1)
  tag.position.set(position[0], position[1] + 0.24, position[2])
  boardGroup.add(tag)
}
function buildScene() {
  if (!mountPoint.value) return
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x050b13)
  scene.fog = new THREE.FogExp2(0x050b13, 0.055)
  camera = new THREE.PerspectiveCamera(42, mountPoint.value.clientWidth / mountPoint.value.clientHeight, 0.1, 100)
  camera.position.set(4.2, 3.2, 5.6)
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(mountPoint.value.clientWidth, mountPoint.value.clientHeight)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.2
  mountPoint.value.appendChild(renderer.domElement)
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.06
  controls.minDistance = 3.2
  controls.maxDistance = 10
  controls.maxPolarAngle = Math.PI * 0.49
  scene.add(new THREE.AmbientLight(0x80cce8, 1.35))
  const keyLight = new THREE.DirectionalLight(0x8deaff, 2.6)
  keyLight.position.set(3, 5, 4)
  scene.add(keyLight)
  const rimLight = new THREE.PointLight(0x087eae, 22, 12)
  rimLight.position.set(-3, 1, -2)
  scene.add(rimLight)
  boardGroup = new THREE.Group()
  scene.add(boardGroup)
  const board = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.16, 2.7), new THREE.MeshStandardMaterial({ color: 0x0a202b, metalness: 0.52, roughness: 0.38, emissive: 0x062b39, emissiveIntensity: 0.55 }))
  board.position.y = -0.12
  boardGroup.add(board)
  const boardEdges = new THREE.LineSegments(new THREE.EdgesGeometry(board.geometry), new THREE.LineBasicMaterial({ color: 0x22c9ed, transparent: true, opacity: 0.8 }))
  boardEdges.position.copy(board.position)
  boardGroup.add(boardEdges)
  for (let i = 0; i < 12; i++) {
    const trace = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.012, 2.15), new THREE.MeshBasicMaterial({ color: 0x0e7890, transparent: true, opacity: 0.38 }))
    trace.position.set(-2.05 + i * 0.37, -0.025, 0)
    boardGroup.add(trace)
  }
  addPart('ecu', 'NADI / ECU CORE', [-0.1, 0.34, 0], [1.45, 0.58, 1.05], 0x153c4b)
  addPart('map', 'MAP', [-1.55, 0.43, 0.48], [0.48, 0.34, 0.42])
  addPart('tps', 'TPS', [-1.45, -0.32, -0.38], [0.5, 0.28, 0.42])
  addPart('injector', 'INJECTOR', [1.45, 0.48, 0.42], [0.56, 0.4, 0.45], 0x1a5260)
  addPart('ckp', 'CKP', [1.48, -0.3, -0.38], [0.48, 0.32, 0.42])
  addPart('power', 'POWER', [0.05, 0.83, 0.18], [0.55, 0.22, 0.48], 0x31505a)
  createCircuitPath([[-1.55, 0.15, 0.48], [-1.0, 0.08, 0.35], [-0.72, 0.15, 0.1], [-0.1, 0.15, 0]])
  createCircuitPath([[-1.45, -0.16, -0.38], [-0.95, -0.02, -0.28], [-0.55, 0.12, -0.1], [-0.1, 0.15, 0]])
  createCircuitPath([[0.62, 0.15, 0.18], [1.0, 0.1, 0.25], [1.45, 0.22, 0.42]], 0x48e6bd)
  createCircuitPath([[0.62, 0.1, -0.1], [1.0, -0.08, -0.25], [1.48, -0.14, -0.38]], 0xf3bd5c)
  createConnector([-2.02, 0.12, -0.92], 'J1 / SENSOR')
  createConnector([2.0, 0.12, 0.92], 'J2 / OUTPUT')
  createConnector([0.05, 0.12, -1.02], 'J3 / POWER')
  const grid = new THREE.GridHelper(14, 42, 0x0b6178, 0x123140)
  grid.position.y = -1.15
  scene.add(grid)
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.65, 0.008, 8, 120), new THREE.MeshBasicMaterial({ color: 0x1689a9, transparent: true, opacity: 0.35 }))
  ring.rotation.x = Math.PI / 2.7
  ring.position.y = -0.7
  scene.add(ring)
  raycaster = new THREE.Raycaster()
  pointer = new THREE.Vector2()
  renderer.domElement.addEventListener('pointerdown', onSceneClick)
  resizeObserver = new ResizeObserver(onResize)
  resizeObserver.observe(mountPoint.value)
  sceneReady.value = true
  animate()
}
function onSceneClick(event) {
  const rect = renderer.domElement.getBoundingClientRect()
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  raycaster.setFromCamera(pointer, camera)
  const hits = raycaster.intersectObjects(interactiveMeshes)
  if (hits.length && hits[0].object.userData.partId) selectedPart.value = hits[0].object.userData.partId
}
function onResize() {
  if (!mountPoint.value || !renderer || !camera) return
  camera.aspect = mountPoint.value.clientWidth / Math.max(mountPoint.value.clientHeight, 1)
  camera.updateProjectionMatrix()
  renderer.setSize(mountPoint.value.clientWidth, mountPoint.value.clientHeight)
}
function animate() {
  animationId = requestAnimationFrame(animate)
  if (boardGroup && isLive.value) {
    boardGroup.rotation.y = Math.sin(performance.now() * 0.00018) * 0.07
    const time = performance.now() * 0.00022
    signalParticles.forEach(({ curve, particle, offset }) => {
      particle.position.copy(curve.getPoint((time + offset) % 1))
    })
  }
  if (controls) controls.update()
  if (renderer && scene && camera) renderer.render(scene, camera)
}
function resetView() { if (camera && boardGroup) { camera.position.set(4.2, 3.2, 5.6); boardGroup.rotation.set(0, 0, 0); controls?.target.set(0, 0.1, 0); controls?.update() } }
function selectPart(id) { selectedPart.value = id }
watch(showLabels, () => { if (scene) { disposeScene(); buildScene() } })
function disposeScene() {
  if (animationId) cancelAnimationFrame(animationId)
  if (resizeObserver) resizeObserver.disconnect()
  if (controls) controls.dispose()
  if (renderer) {
    renderer.domElement.removeEventListener('pointerdown', onSceneClick)
    renderer.dispose()
    renderer.domElement.remove()
  }
  if (scene) scene.traverse(object => {
    if (object.geometry) object.geometry.dispose()
    if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => { if (material.map) material.map.dispose(); material.dispose() })
  })
  interactiveMeshes.length = 0
  signalParticles.length = 0
  renderer = scene = camera = controls = boardGroup = null
}
onMounted(buildScene)
onBeforeUnmount(disposeScene)
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="brand"><div class="brand-mark"><span class="brand-pulse"></span>N</div><div><strong>NADI</strong><small>AUTOMOTIVE INTELLIGENCE</small></div></div>
      <div class="side-label">WORKSPACE</div>
      <button class="nav-item active" @click="activeSection = 'overview'"><span class="nav-icon">⌘</span><span>Overview</span><kbd>01</kbd></button>
      <button class="nav-item" @click="activeSection = 'ecu-lab'"><span class="nav-icon">◈</span><span>3D ECU Lab</span><kbd>02</kbd></button>
      <button class="nav-item" @click="activeSection = 'diagnostics'"><span class="nav-icon">⌁</span><span>Diagnostics</span><kbd>03</kbd></button>
      <button class="nav-item" @click="activeSection = 'wiring'"><span class="nav-icon">⌘</span><span>Wiring Lab</span><kbd>04</kbd></button>
      <div class="side-label side-label-spaced">KNOWLEDGE</div>
      <button class="nav-item" @click="activeSection = 'library'"><span class="nav-icon">▤</span><span>Learning Library</span><kbd>05</kbd></button>
      <div class="sidebar-bottom"><div class="connection-card"><span class="status-dot"></span><div><strong>CORE ONLINE</strong><small>Local simulation mode</small></div></div><div class="profile"><div class="avatar">AG</div><div><strong>AB GARAGE</strong><small>Workshop workspace</small></div><span class="more">···</span></div></div>
    </aside>
    <main class="main-content">
      <header class="topbar"><div class="breadcrumb"><span>WORKSPACE</span><b>/</b><strong>{{ activeSection.replace('-', ' ').toUpperCase() }}</strong></div><div class="top-actions"><span class="clock-dot"></span><span class="top-status">SYSTEM NOMINAL</span><span class="top-divider"></span><button class="icon-button" title="Notifications">♧</button><div class="user-mini">AG</div></div></header>
      <section class="page-heading"><div><div class="eyebrow"><span class="eyebrow-line"></span> AUTOMOTIVE CONTROL ENVIRONMENT <span class="eyebrow-tag">BETA 1.0</span></div><h1>ECU <span>Intelligence</span> Lab</h1><p>Explore the electronic nervous system behind modern vehicles.</p></div><div class="heading-meta"><span>SESSION ID</span><strong>NADI-ECU-0426</strong><span class="meta-live"><i></i> LIVE ENVIRONMENT</span></div></section>
      <section class="metrics-grid">
        <article class="metric-card"><div class="metric-top"><span>CONTROL MODULE</span><span class="metric-symbol">◈</span></div><strong>01 <small>UNIT</small></strong><div class="metric-foot"><i></i> ECU CORE ACTIVE</div></article>
        <article class="metric-card"><div class="metric-top"><span>CONNECTED NODES</span><span class="metric-symbol">⌘</span></div><strong>06 <small>NODES</small></strong><div class="metric-foot"><i></i> SIGNAL NETWORK READY</div></article>
        <article class="metric-card"><div class="metric-top"><span>SUPPLY VOLTAGE</span><span class="metric-symbol">ϟ</span></div><strong>12.4 <small>V DC</small></strong><div class="metric-foot"><i></i> SIMULATED VALUE</div></article>
        <article class="metric-card"><div class="metric-top"><span>DIAGNOSTIC STATUS</span><span class="metric-symbol">⌁</span></div><strong class="metric-ok">NOMINAL</strong><div class="metric-foot"><i></i> NO ACTIVE CRITICAL FAULT</div></article>
      </section>
      <section class="workspace-grid">
        <div class="visual-panel panel">
          <div class="panel-header"><div><div class="panel-kicker">INTERACTIVE MODEL <span class="live-pill">● LIVE</span></div><h2>ECU Circuit Visualization</h2><p>Explore nodes and signal pathways in a conceptual ECU system.</p></div><div class="panel-controls"><button :class="{ selected: vehicleType === 'MOTORCYCLE' }" @click="vehicleType = 'MOTORCYCLE'">MOTORCYCLE</button><button :class="{ selected: vehicleType === 'AUTOMOTIVE' }" @click="vehicleType = 'AUTOMOTIVE'">AUTOMOTIVE</button></div></div>
          <div class="scene-wrap"><div ref="mountPoint" class="three-canvas"></div><div class="scene-hud hud-top-left"><span>MODEL / {{ vehicleType }}</span><strong>ECU NETWORK <i>●</i></strong></div><div class="scene-hud hud-top-right"><span>RENDER ENGINE</span><strong>THREE.JS / WEBGL</strong></div><div class="scene-bottom"><span><i class="pulse-dot"></i> SIGNAL FLOW ACTIVE</span><span>DRAG TO ORBIT · SCROLL TO ZOOM</span></div><div v-if="!sceneReady" class="scene-loading">INITIALIZING 3D CORE...</div></div>
          <div class="scene-toolbar"><div class="toolbar-legend"><span><i class="legend-input"></i> INPUT SENSOR</span><span><i class="legend-output"></i> OUTPUT ACTUATOR</span><span><i class="legend-power"></i> POWER</span></div><div class="toolbar-actions"><button @click="showLabels = !showLabels">{{ showLabels ? 'HIDE LABELS' : 'SHOW LABELS' }}</button><button @click="resetView">↺ RESET VIEW</button></div></div>
        </div>
        <div class="inspector-column">
          <div class="panel inspector-panel"><div class="panel-header compact"><div><div class="panel-kicker">NODE INSPECTOR</div><h2>Component Details</h2></div><span class="inspect-icon">⌖</span></div><div class="component-select"><button v-for="part in parts" :key="part.id" :class="{ active: selectedPart === part.id }" @click="selectPart(part.id)">{{ part.short }}</button></div><div class="selected-component"><div class="component-chip">◈</div><div><span>{{ selected.type }}</span><h3>{{ selected.name }}</h3></div></div><div class="detail-rows"><div><span>NODE IDENTIFIER</span><strong>{{ selected.id.toUpperCase() }}</strong></div><div><span>REFERENCE VALUE</span><strong>{{ selected.voltage }}</strong></div><div><span>STATUS</span><strong class="value-good"><i></i>{{ selected.status }}</strong></div></div><p class="component-description">{{ selected.description }}</p><div class="inspector-note"><span>ⓘ</span> Data shown is illustrative and intended for learning.</div></div>
          <div class="panel signal-panel"><div class="panel-header compact"><div><div class="panel-kicker">NETWORK TELEMETRY</div><h2>Signal Overview</h2></div><span class="signal-wave">∿</span></div><div class="signal-row"><span>Sensor input</span><div class="signal-track"><i style="width:78%"></i></div><b>78%</b></div><div class="signal-row"><span>ECU processing</span><div class="signal-track"><i style="width:92%"></i></div><b>92%</b></div><div class="signal-row"><span>Actuator output</span><div class="signal-track output"><i style="width:64%"></i></div><b>64%</b></div><div class="telemetry-foot"><span><i></i> STREAMING SIMULATION</span><span>1.2 KB/S</span></div></div>
        </div>
      </section>
      <section class="lower-grid">
        <div class="panel diagnostics-panel"><div class="panel-header compact"><div><div class="panel-kicker">FAULT CODE DATABASE</div><h2>Diagnostic Reference</h2></div><div class="filter-tabs"><button :class="{ active: dtcFilter === 'all' }" @click="dtcFilter = 'all'">ALL</button><button :class="{ active: dtcFilter === 'warning' }" @click="dtcFilter = 'warning'">WARNING</button><button :class="{ active: dtcFilter === 'info' }" @click="dtcFilter = 'info'">INFO</button></div></div><div class="dtc-list"><div v-for="dtc in filteredDtcs" :key="dtc.code" class="dtc-row"><span class="dtc-code">{{ dtc.code }}</span><span class="dtc-title">{{ dtc.title }}</span><span class="dtc-system">{{ dtc.system }}</span><span :class="['severity', dtc.severity.toLowerCase()]">{{ dtc.severity }}</span></div><div v-if="!filteredDtcs.length" class="empty-state">No matching sample codes.</div></div><div class="data-disclaimer">DEMO DATA · NOT CONNECTED TO A VEHICLE DIAGNOSTIC PORT</div></div>
        <div class="panel quick-panel"><div class="panel-kicker">QUICK ACCESS</div><h2>Explore the system</h2><button @click="activeSection = 'library'"><span>▤</span><div><strong>Learning Library</strong><small>ECU fundamentals and components</small></div><b>↗</b></button><button @click="activeSection = 'wiring'"><span>⌘</span><div><strong>Wiring Reference</strong><small>Conceptual signal architecture</small></div><b>↗</b></button><button @click="activeSection = 'diagnostics'"><span>⌁</span><div><strong>Diagnostic Center</strong><small>Sample fault-code explorer</small></div><b>↗</b></button></div>
      </section>
      <footer><span>© 2026 NADI — AUTOMOTIVE INTELLIGENCE</span><span>BUILT FOR LEARNING <b>·</b> POWERED BY VUE 3 + THREE.JS</span></footer>
    </main>
  </div>
</template>
