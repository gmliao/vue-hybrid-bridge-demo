<template>
  <div class="space-invaders-container">
    <div class="hud" id="hud">
      <div class="row"><div>{{ $t('spaceInvaders.score') }}</div><div>{{ score }}</div></div>
      <div class="row"><div>{{ $t('spaceInvaders.lives') }}</div><div>{{ lives }}</div></div>
      <div class="row"><div>{{ $t('spaceInvaders.level') }}</div><div>{{ level }}</div></div>
      <div class="row"><div>{{ $t('spaceInvaders.controls') }}</div><div>{{ $t('spaceInvaders.controlsDesc') }}</div></div>
      <div class="row"><div>{{ $t('spaceInvaders.visual') }}</div><div>{{ $t('spaceInvaders.visualDesc') }}</div></div>
    </div>

    <div class="centerBanner" :style="{ display: showOverlay ? 'flex' : 'none' }">
      <div class="panel">
        <h1>{{ overlayTitle }}</h1>
        <p class="description">{{ $t('spaceInvaders.description') }}</p>
        <div class="btns">
          <button @click="handleStart">{{ $t('spaceInvaders.startGame') }}</button>
          <button @click="handleRestart">{{ $t('spaceInvaders.restart') }}</button>
        </div>
      </div>
    </div>

    <canvas ref="canvasRef" id="renderCanvas"></canvas>
    
    <!-- 虛擬按鈕（手機/平板模式） -->
    <div class="virtual-controls" v-if="showVirtualControls">
      <div class="virtual-buttons-left">
        <button 
          class="virtual-btn virtual-btn-left"
          @touchstart.prevent="handleVirtualLeft(true)"
          @touchend.prevent="handleVirtualLeft(false)"
          @touchcancel.prevent="handleVirtualLeft(false)"
          @mousedown.prevent="handleVirtualLeft(true)"
          @mouseup.prevent="handleVirtualLeft(false)"
          @mouseleave.prevent="handleVirtualLeft(false)"
        >
          ←
        </button>
        <button 
          class="virtual-btn virtual-btn-right"
          @touchstart.prevent="handleVirtualRight(true)"
          @touchend.prevent="handleVirtualRight(false)"
          @touchcancel.prevent="handleVirtualRight(false)"
          @mousedown.prevent="handleVirtualRight(true)"
          @mouseup.prevent="handleVirtualRight(false)"
          @mouseleave.prevent="handleVirtualRight(false)"
        >
          →
        </button>
      </div>
      <div class="virtual-buttons-right">
        <button 
          class="virtual-btn virtual-btn-shoot"
          @touchstart.prevent="handleVirtualShoot(true)"
          @touchend.prevent="handleVirtualShoot(false)"
          @touchcancel.prevent="handleVirtualShoot(false)"
          @mousedown.prevent="handleVirtualShoot(true)"
          @mouseup.prevent="handleVirtualShoot(false)"
          @mouseleave.prevent="handleVirtualShoot(false)"
        >
          🔫
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Engine,
  Scene,
  ArcRotateCamera,
  HemisphericLight,
  DirectionalLight,
  Vector3,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Color4,
  ShadowGenerator,
  Mesh,
  VertexData
} from '@babylonjs/core'

const { t } = useI18n()
const canvasRef = ref<HTMLCanvasElement | null>(null)

// 虛擬按鈕顯示控制
const showVirtualControls = ref(false)
const checkScreenSize = () => {
  showVirtualControls.value = window.innerWidth <= 1024
}

// HUD
const score = ref(0)
const lives = ref(3)
const level = ref(1)

// Overlay
const showOverlay = ref(true)
const overlayTitle = ref(t('spaceInvaders.title'))

// 3D stage on XZ plane (Y is up)
const WORLD = {
  playerZ: -8.2,
  invaderStartZ: 7.5, // 往後移
  floorZ: -9.2,
  backZ: 8.8,
  leftX: -11.2,
  rightX: 11.2,
}

// Game state
let engine: Engine | null = null
let scene: Scene | null = null
let running = false
let paused = false

// Entities
let player: Mesh | null = null
let invaders: Array<{ mesh: Mesh; hp: number; points: number }> = []
let playerBullets: Array<{ mesh: Mesh; vz: number }> = []
let enemyBullets: Array<{ mesh: Mesh; vz: number }> = []
let shields: Array<{ mesh: Mesh; hp: number }> = []

// Timers
let fireCooldown = 0
let enemyFireCooldown = 0

// Invader formation movement
let invDir = 1 // +1 right, -1 left
let invSpeed = 0.9 // 降低移動速度
let invStepForward = 0.55 // towards player (negative Z)

// Input
const input = {
  left: false,
  right: false,
  shoot: false,
}

let shadowGen: ShadowGenerator | null = null
let renderLoop: (() => void) | null = null

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

// Simple audio beep
// 延遲初始化音頻上下文，直到用戶交互
let audioCtx: AudioContext | null = null
const getAudioContext = () => {
  if (!audioCtx) {
  try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  } catch {
    return null
  }
  }
  return audioCtx
}

const beep = (freq: number, dur = 0.05, gain = 0.05, type: OscillatorType = 'square') => {
  const ctx = getAudioContext()
  if (!ctx) return
  try {
    // 如果音頻上下文被暫停，嘗試恢復
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }
    const o = ctx.createOscillator()
    const g = ctx.createGain()
  o.type = type
  o.frequency.value = freq
  g.gain.value = gain
  o.connect(g)
    g.connect(ctx.destination)
  o.start()
    o.stop(ctx.currentTime + dur)
  } catch {
    // 忽略音頻錯誤，不影響遊戲
  }
}

const updateHUD = () => {
  // Vue reactivity handles this
}

const disposeAll = (arr: Array<{ mesh: Mesh }>) => {
  for (const e of arr) {
    e.mesh?.dispose?.()
  }
  arr.length = 0
}

const makeMat = (s: Scene, diffuse: Color3, emissive: Color3, alpha = 1) => {
  const m = new StandardMaterial('m' + Math.random().toString(16).slice(2), s)
  m.diffuseColor = diffuse
  m.emissiveColor = emissive
  m.specularColor = new Color3(0.10, 0.10, 0.10)
  m.alpha = alpha
  return m
}

const aabb = (mesh: Mesh) => {
  const bi = mesh.getBoundingInfo().boundingBox
  return { min: bi.minimumWorld, max: bi.maximumWorld }
}

const intersects = (a: Mesh, b: Mesh) => {
  const A = aabb(a)
  const B = aabb(b)
  return (
    A.min.x <= B.max.x && A.max.x >= B.min.x &&
    A.min.z <= B.max.z && A.max.z >= B.min.z
  )
}

const formatEndGameText = (finalScore: number, reason: string) => {
  return t('spaceInvaders.gameOverText', { 
    score: finalScore, 
    reason: reason || '' 
  })
}

const createScene = () => {
  if (!engine) return null

  const s = new Scene(engine)
  s.clearColor = new Color4(0.03, 0.04, 0.09, 1)

  // Camera: slight tilt for visible depth
  const camera = new ArcRotateCamera(
    'cam',
    -Math.PI / 2,
    1.15,
    26,
    Vector3.Zero(),
    s
  )
  camera.lowerRadiusLimit = 18
  camera.upperRadiusLimit = 40
  camera.wheelPrecision = 80
  camera.panningSensibility = 0
  // 完全禁用攝影機控制，因為這是遊戲，需要固定視角
  // 不調用 attachControl，這樣方向鍵就不會被攝影機占用

  // Lights: directional + hemi
  const hemi = new HemisphericLight('hemi', new Vector3(0, 1, 0), s)
  hemi.intensity = 0.55

  const dir = new DirectionalLight('dir', new Vector3(-0.35, -1, 0.25), s)
  dir.position = new Vector3(10, 18, -10)
  dir.intensity = 1.05

  shadowGen = new ShadowGenerator(2048, dir)
  shadowGen.useBlurExponentialShadowMap = true
  shadowGen.blurKernel = 24
  shadowGen.depthScale = 80

  // Ground plane
  const ground = MeshBuilder.CreateGround('ground', { width: 26, height: 22, subdivisions: 2 }, s)
  ground.position.y = -0.02
  ground.receiveShadows = true
  const gMat = new StandardMaterial('gMat', s)
  gMat.diffuseColor = new Color3(0.05, 0.07, 0.14)
  gMat.emissiveColor = new Color3(0.01, 0.01, 0.02)
  gMat.specularColor = new Color3(0.05, 0.05, 0.06)
  ground.material = gMat

  // Subtle grid overlay
  const grid = MeshBuilder.CreateGround('grid', { width: 26, height: 22, subdivisions: 22 }, s)
  grid.position.y = 0.001
  const gridMat = new StandardMaterial('gridMat', s)
  gridMat.diffuseColor = new Color3(0, 0, 0)
  gridMat.emissiveColor = new Color3(0.12, 0.18, 0.42)
  gridMat.alpha = 0.14
  grid.material = gridMat

  // Back wall for depth cue
  const backWall = MeshBuilder.CreatePlane('back', { width: 26, height: 10 }, s)
  backWall.position = new Vector3(0, 5.0, WORLD.backZ + 0.5)
  backWall.rotation.y = Math.PI
  const bwMat = new StandardMaterial('bwMat', s)
  bwMat.diffuseColor = new Color3(0.02, 0.03, 0.06)
  bwMat.emissiveColor = new Color3(0.02, 0.03, 0.08)
  bwMat.alpha = 0.75
  backWall.material = bwMat

  // Side rails
  const railL = MeshBuilder.CreateBox('railL', { width: 0.25, height: 0.35, depth: 22 }, s)
  railL.position = new Vector3(WORLD.leftX - 0.4, 0.15, 0)
  const railR = railL.clone('railR')
  railR.position.x = WORLD.rightX + 0.4
  const rMat = new StandardMaterial('rMat', s)
  rMat.emissiveColor = new Color3(0.14, 0.22, 0.65)
  rMat.alpha = 0.25
  railL.material = rMat
  railR.material = rMat

  // Stars
  const starCount = 900
  const positions: number[] = []
  for (let i = 0; i < starCount; i++) {
    positions.push(
      (Math.random() * 2 - 1) * 55,
      Math.random() * 28,
      (Math.random() * 2 - 1) * 55
    )
  }
  const stars = new Mesh('stars', s)
  const vd = new VertexData()
  vd.positions = positions
  vd.applyToMesh(stars)
  const sm = new StandardMaterial('sm', s)
  sm.disableLighting = true
  sm.emissiveColor = new Color3(0.65, 0.75, 1.0)
  sm.alpha = 0.18
  stars.material = sm
  stars.isPickable = false
  stars.position.y = 8
  stars.convertToUnIndexedMesh()
  ;(sm as any).pointsCloud = true
  ;(sm as any).pointSize = 1.0

  // Player
  player = MeshBuilder.CreateBox('player', { width: 1.7, height: 0.55, depth: 0.9 }, s)
  player.position = new Vector3(0, 0.32, WORLD.playerZ)
  player.material = makeMat(s, new Color3(0.10, 0.85, 0.65), new Color3(0.02, 0.18, 0.14))
  if (shadowGen) shadowGen.addShadowCaster(player)

  const cannon = MeshBuilder.CreateBox('cannon', { width: 0.34, height: 0.46, depth: 0.9 }, s)
  cannon.parent = player
  cannon.position = new Vector3(0, 0.50, 0)
  cannon.material = makeMat(s, new Color3(0.08, 0.55, 0.42), new Color3(0.01, 0.12, 0.09))

  return s
}

const buildShields = () => {
  if (!scene || !shadowGen) return
  const shieldZ = WORLD.playerZ + 3.4
  const xs = [-7.5, -2.5, 2.5, 7.5]
  for (const x of xs) {
    const mesh = MeshBuilder.CreateBox('shield', { width: 2.1, height: 0.8, depth: 1.1 }, scene)
    mesh.position = new Vector3(x, 0.35, shieldZ)
    mesh.material = makeMat(scene, new Color3(0.35, 0.85, 0.22), new Color3(0.05, 0.16, 0.05), 0.95)
    mesh.receiveShadows = true
    shadowGen.addShadowCaster(mesh)
    shields.push({ mesh, hp: 12 })
  }
}

const invaderSpecByRow = (r: number) => {
  if (r === 0) return { size: 0.95, points: 30, color: [0.85, 0.25, 0.45] }
  if (r === 1) return { size: 1.00, points: 20, color: [0.85, 0.55, 0.20] }
  return { size: 1.05, points: 10, color: [0.35, 0.65, 1.00] }
}

const buildInvaders = () => {
  if (!scene || !shadowGen) return
  const rows = 5
  const cols = 11
  const startX = -8.5
  const startZ = WORLD.invaderStartZ
  const gapX = 1.75
  const gapZ = 1.25

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const spec = invaderSpecByRow(r)
      const size = spec.size
      const mesh = MeshBuilder.CreateBox('inv', { width: size, height: 0.65, depth: 1.05 }, scene)
      mesh.position = new Vector3(startX + c * gapX, 0.38, startZ - r * gapZ)
      const [cr, cg, cb] = spec.color
      mesh.material = makeMat(scene, new Color3(cr, cg, cb), new Color3(cr * 0.07, cg * 0.07, cb * 0.07))
      shadowGen.addShadowCaster(mesh)
      invaders.push({ mesh, hp: 1, points: spec.points })
    }
  }

  invDir = 1
  invSpeed = 0.8 + (level.value - 1) * 0.15 // 降低基礎速度和每關增加速度
}

const resetRound = () => {
  if (!scene) return
  for (const inv of invaders) inv.mesh.dispose()
  invaders = []
  disposeAll(playerBullets)
  disposeAll(enemyBullets)
  for (const sh of shields) sh.mesh.dispose()
  shields = []
  
  if (player) {
    player.position.x = 0
    player.position.z = WORLD.playerZ
  }
  fireCooldown = 0
  enemyFireCooldown = 0
  buildShields()
  buildInvaders()
}

const resetGame = () => {
  score.value = 0
  lives.value = 3
  level.value = 1
  paused = false
  updateHUD()
  resetRound()
}

const startGame = () => {
  running = true
  paused = false
  showOverlay.value = false
  updateHUD()
  try {
    if (audioCtx && (audioCtx as any).resume) (audioCtx as any).resume()
  } catch {}
}

const endGame = (reason: string) => {
  running = false
  paused = false
  overlayTitle.value = `${t('spaceInvaders.gameOver')} - ${formatEndGameText(score.value, reason)}`
  showOverlay.value = true
}

const nextLevel = () => {
  level.value += 1
  updateHUD()
  resetRound()
  beep(600, 0.06, 0.06, 'sine')
  beep(900, 0.06, 0.05, 'sine')
}

const shootPlayer = () => {
  if (fireCooldown > 0 || !scene || !player || !shadowGen) return
  fireCooldown = 0.18
  const b = MeshBuilder.CreateCylinder('pBullet', { diameter: 0.16, height: 0.95, tessellation: 10 }, scene)
  b.rotation.x = Math.PI / 2
  b.position = new Vector3(player.position.x, 0.55, player.position.z + 0.9)
  b.material = makeMat(scene, new Color3(0.95, 0.95, 0.95), new Color3(0.18, 0.18, 0.18))
  shadowGen.addShadowCaster(b)
  playerBullets.push({ mesh: b, vz: +14.0 })
  beep(880, 0.03, 0.04, 'square')
}

const shootEnemy = () => {
  if (enemyFireCooldown > 0 || !scene || !shadowGen) return
  const remain = Math.max(1, invaders.length)
  const freq = clamp(0.85 - (level.value - 1) * 0.08 - (1 / remain) * 0.95, 0.12, 0.85)
  enemyFireCooldown = freq

  // pick bottom-most invader per X bucket
  const byCol = new Map<number, { mesh: Mesh; hp: number; points: number }>()
  for (const inv of invaders) {
    const col = Math.round(inv.mesh.position.x * 10)
    const cur = byCol.get(col)
    if (!cur || inv.mesh.position.z < cur.mesh.position.z) byCol.set(col, inv)
  }
  const candidates = Array.from(byCol.values())
  if (candidates.length === 0) return
  const shooter = candidates[Math.floor(Math.random() * candidates.length)]

  const b = MeshBuilder.CreateCylinder('eBullet', { diameter: 0.18, height: 0.95, tessellation: 10 }, scene)
  b.rotation.x = Math.PI / 2
  b.position = new Vector3(shooter.mesh.position.x, 0.55, shooter.mesh.position.z - 0.9)
  b.material = makeMat(scene, new Color3(1.0, 0.35, 0.35), new Color3(0.14, 0.03, 0.03))
  shadowGen.addShadowCaster(b)
  enemyBullets.push({ mesh: b, vz: -10.0 - (level.value - 1) * 0.7 })
  beep(220, 0.03, 0.03, 'square')
}

const damageShield = (shield: { mesh: Mesh; hp: number }) => {
  shield.hp -= 1
  const alpha = clamp(0.25 + shield.hp / 14, 0.22, 0.95)
  ;(shield.mesh.material as StandardMaterial).alpha = alpha
  if (shield.hp <= 0) {
    shield.mesh.dispose()
    const idx = shields.indexOf(shield)
    if (idx >= 0) shields.splice(idx, 1)
  }
}

const onPlayerHit = () => {
  lives.value -= 1
  updateHUD()
  beep(110, 0.09, 0.06, 'sine')
  beep(70, 0.12, 0.05, 'sine')

  disposeAll(playerBullets)
  disposeAll(enemyBullets)

      if (lives.value <= 0) {
        endGame(t('spaceInvaders.gameOverReasonLives'))
        return
      }
  if (player) player.position.x = 0
}

const tick = (dt: number) => {
  if (!running || paused || !scene || !player) return

  // Player move
  const speed = 10.0
  let vx = 0
  if (input.left) vx -= 1
  if (input.right) vx += 1
  player.position.x += vx * speed * dt
  player.position.x = clamp(player.position.x, WORLD.leftX + 1.0, WORLD.rightX - 1.0)

  // Shoot (hold)
  fireCooldown = Math.max(0, fireCooldown - dt)
  if (input.shoot) shootPlayer()

  // Enemy shoot
  enemyFireCooldown = Math.max(0, enemyFireCooldown - dt)
  if (invaders.length > 0) {
    const p = clamp(dt * (0.8 + level.value * 0.18), 0.0, 0.28)
    if (Math.random() < p) shootEnemy()
  }

  // Invader formation
  if (invaders.length > 0) {
    let minX = Infinity, maxX = -Infinity, minZ = Infinity
    for (const inv of invaders) {
      const x = inv.mesh.position.x
      const z = inv.mesh.position.z
      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x)
      minZ = Math.min(minZ, z)
    }

    const remainFactor = clamp(1.0 + (1.0 / Math.max(1, invaders.length)) * 18, 1.0, 3.6)
    const v = invSpeed * remainFactor

    for (const inv of invaders) {
      inv.mesh.position.x += invDir * v * dt
      inv.mesh.rotation.y += dt * 0.25 * invDir
    }

    if (maxX > WORLD.rightX - 1.0 && invDir > 0) {
      invDir = -1
      for (const inv of invaders) inv.mesh.position.z -= invStepForward
      beep(140, 0.02, 0.02, 'square')
    } else if (minX < WORLD.leftX + 1.0 && invDir < 0) {
      invDir = 1
      for (const inv of invaders) inv.mesh.position.z -= invStepForward
      beep(140, 0.02, 0.02, 'square')
    }

    if (minZ < WORLD.playerZ + 1.2) {
      endGame(t('spaceInvaders.gameOverReasonInvaders'))
      return
    }
  }

  // Player bullets
  for (let i = playerBullets.length - 1; i >= 0; i--) {
    const b = playerBullets[i]
    b.mesh.position.z += b.vz * dt
    b.mesh.rotation.y += dt * 3.0
    if (b.mesh.position.z > WORLD.backZ + 2.5) {
      b.mesh.dispose()
      playerBullets.splice(i, 1)
      continue
    }

    let hit = false
    for (let j = invaders.length - 1; j >= 0; j--) {
      const inv = invaders[j]
      if (intersects(b.mesh, inv.mesh)) {
        score.value += inv.points
        updateHUD()
        inv.mesh.dispose()
        invaders.splice(j, 1)
        hit = true
        beep(520, 0.03, 0.04, 'square')
        break
      }
    }
    if (hit) {
      b.mesh.dispose()
      playerBullets.splice(i, 1)
      continue
    }

    for (const sh of [...shields]) {
      if (sh.mesh && intersects(b.mesh, sh.mesh)) {
        damageShield(sh)
        b.mesh.dispose()
        playerBullets.splice(i, 1)
        beep(300, 0.02, 0.02, 'square')
        break
      }
    }
  }

  // Enemy bullets
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const b = enemyBullets[i]
    b.mesh.position.z += b.vz * dt
    b.mesh.rotation.y -= dt * 3.2
    if (b.mesh.position.z < WORLD.floorZ - 1.2) {
      b.mesh.dispose()
      enemyBullets.splice(i, 1)
      continue
    }

    if (player && intersects(b.mesh, player)) {
      b.mesh.dispose()
      enemyBullets.splice(i, 1)
      onPlayerHit()
      if (!running) return
      continue
    }

    let consumed = false
    for (const sh of [...shields]) {
      if (sh.mesh && intersects(b.mesh, sh.mesh)) {
        damageShield(sh)
        b.mesh.dispose()
        enemyBullets.splice(i, 1)
        beep(240, 0.02, 0.02, 'square')
        consumed = true
        break
      }
    }
    if (consumed) continue
  }

  if (invaders.length === 0) {
    nextLevel()
  }
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.code === 'ArrowLeft') input.left = true
  if (e.code === 'ArrowRight') input.right = true
  if (e.code === 'Space') {
    input.shoot = true
    e.preventDefault()
  }
  if (e.code === 'KeyP') {
    if (running) {
      paused = !paused
      if (paused) {
        overlayTitle.value = t('spaceInvaders.paused')
        showOverlay.value = true
      } else {
        showOverlay.value = false
      }
    }
  }
}

const handleKeyUp = (e: KeyboardEvent) => {
  if (e.code === 'ArrowLeft') input.left = false
  if (e.code === 'ArrowRight') input.right = false
  if (e.code === 'Space') {
    input.shoot = false
    e.preventDefault()
  }
}

// 虛擬按鈕處理
const handleVirtualLeft = (pressed: boolean) => {
  input.left = pressed
}

const handleVirtualRight = (pressed: boolean) => {
  input.right = pressed
}

const handleVirtualShoot = (pressed: boolean) => {
  input.shoot = pressed
}

const handleStart = () => {
  // 初始化音頻上下文（需要用戶交互）
  getAudioContext()
  try {
    const ctx = getAudioContext()
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }
  } catch {}
  startGame()
}

const handleRestart = () => {
  // 初始化音頻上下文（需要用戶交互）
  getAudioContext()
  try {
    const ctx = getAudioContext()
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }
  } catch {}
  resetGame()
  startGame()
}

const handleResize = () => {
  if (engine) {
    // resize 會自動處理高 DPI
    engine.resize()
  }
  adjustCanvasScale()
}

// 調整 Canvas 縮放以適應容器，確保不會跑出邊邊
const adjustCanvasScale = () => {
  if (!canvasRef.value || !engine) return
  
  // 確保 engine 正確調整大小，會自動處理 devicePixelRatio
  engine.resize()
  
  // 確保 canvas 的 CSS 尺寸與實際渲染尺寸匹配
  const container = canvasRef.value.parentElement
  if (container) {
    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight
    
    // 設置 CSS 尺寸（邏輯像素）
    canvasRef.value.style.width = `${containerWidth}px`
    canvasRef.value.style.height = `${containerHeight}px`
  }
}

function pause() {
  if (engine && renderLoop) {
    engine.stopRenderLoop()
  }
  paused = true
}

function resume() {
  if (engine && renderLoop) {
    engine.runRenderLoop(renderLoop)
  }
  paused = false
  // 只有在遊戲運行時才隱藏 overlay，如果還沒開始則顯示
  if (!running) {
    showOverlay.value = true
  }
}

onMounted(async () => {
  // 等待 DOM 完全渲染
  await nextTick()
  
  if (!canvasRef.value) return

  // 確保 canvas 有正確的尺寸
  const container = canvasRef.value.parentElement
  if (container) {
    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight
    
    // 如果尺寸為 0，等待一下再初始化
    if (containerWidth === 0 || containerHeight === 0) {
      await new Promise(resolve => {
        const checkSize = () => {
          const w = container.clientWidth
          const h = container.clientHeight
          if (w > 0 && h > 0) {
            resolve(undefined)
          } else {
            requestAnimationFrame(checkSize)
          }
        }
        checkSize()
      })
    }
  }

  // 創建引擎，啟用高 DPI 支援
  engine = new Engine(canvasRef.value, true, {
    preserveDrawingBuffer: true,
    stencil: true,
    disableWebGL2Support: false,
    // 啟用高 DPI 支援，自動處理 devicePixelRatio
    adaptToDeviceRatio: true,
  })

  // 創建場景
  scene = createScene()
  if (!scene) return

  overlayTitle.value = t('spaceInvaders.title')
  updateHUD()
  resetGame()
  running = false
  showOverlay.value = true // 確保初始顯示 overlay

  // 設置渲染循環
  renderLoop = () => {
    if (scene) {
      const dt = scene.getEngine().getDeltaTime() / 1000
      tick(dt)
      scene.render()
    }
  }
  
  // 確保引擎正確初始化尺寸
  engine.resize()
  
  // 調整畫面縮放以適應容器
  adjustCanvasScale()
  
  // 強制立即渲染多次，確保畫面顯示
  if (scene && engine) {
    // 立即渲染一次
    scene.render()
    
    // 使用 requestAnimationFrame 確保在下一幀也渲染
    requestAnimationFrame(() => {
      if (scene && engine) {
        scene.render()
        // 再下一幀也渲染一次，確保畫面顯示
        requestAnimationFrame(() => {
          if (scene && engine) {
            scene.render()
          }
        })
      }
    })
  }
  
  // 啟動渲染循環
  engine.runRenderLoop(renderLoop)

  // 事件監聽
  window.addEventListener('keydown', handleKeyDown, { passive: false })
  window.addEventListener('keyup', handleKeyUp, { passive: false })
  window.addEventListener('resize', handleResize)
  window.addEventListener('resize', checkScreenSize)
  
  // 初始化螢幕大小檢查
  checkScreenSize()
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('resize', checkScreenSize)
  
  if (engine) {
    engine.stopRenderLoop()
    engine.dispose()
  }
  if (scene) {
    scene.dispose()
  }
})

defineExpose({
  pause,
  resume
})
</script>

<style scoped>
.space-invaders-container {
  width: 100%;
  height: 100%;
  margin: 0;
  overflow: hidden;
  background: #070b18;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

#renderCanvas {
  width: 100%;
  height: 100%;
  touch-action: none;
  display: block;
  position: relative;
  z-index: 1;
  /* 讓 Babylon.js 自己處理高 DPI，不要使用 object-fit */
}

/* 確保 canvas 在移動設備上正確縮放 */
@media (max-width: 768px) {
  #renderCanvas {
    touch-action: pan-x pan-y pinch-zoom;
  }
}

.hud {
  position: absolute;
  left: 12px;
  top: 12px;
  z-index: 1000;
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Noto Sans", "Helvetica Neue", Arial;
  color: #e8eeff;
  background: rgba(10, 14, 28, 0.55);
  border: 1px solid rgba(232, 238, 255, 0.12);
  backdrop-filter: blur(8px);
  padding: 10px 12px;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.3);
  user-select: none;
  min-width: 280px;
  max-width: calc(100vw - 24px);
  pointer-events: none;
  font-size: 14px;
}

@media (max-width: 768px) {
  .hud {
    left: 8px;
    top: 8px;
    padding: 8px 10px;
    min-width: auto;
    width: auto;
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .hud {
    left: 4px;
    top: 4px;
    padding: 6px 8px;
    font-size: 11px;
    border-radius: 8px;
  }
}

.hud .row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin: 4px 0;
}

@media (max-width: 768px) {
  .hud .row {
    gap: 8px;
    margin: 3px 0;
  }
  
  .hud .row:last-child {
    display: none; /* 在小螢幕隱藏視覺說明 */
  }
}

@media (max-width: 480px) {
  .hud .row {
    gap: 6px;
    margin: 2px 0;
  }
  
  .hud .row:nth-child(4) {
    display: none; /* 在超小螢幕也隱藏操作說明 */
  }
}

.hud kbd {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 6px;
  border: 1px solid rgba(232, 238, 255, 0.18);
  background: rgba(232, 238, 255, 0.08);
  color: #e8eeff;
}

@media (max-width: 768px) {
  .hud kbd {
    font-size: 10px;
    padding: 1px 4px;
  }
}

@media (max-width: 480px) {
  .hud kbd {
    font-size: 9px;
    padding: 1px 3px;
  }
}

.centerBanner {
  position: absolute;
  inset: 0;
  align-items: center;
  justify-content: center;
  z-index: 20;
  background: rgba(0,0,0,0.62);
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto;
  color: #fff;
}

.panel {
  width: min(500px, calc(100vw - 64px));
  max-width: 90vw;
  background: rgba(10, 14, 28, 0.86);
  border: 1px solid rgba(232, 238, 255, 0.12);
  border-radius: 16px;
  padding: 32px 24px;
  box-shadow: 0 12px 50px rgba(0,0,0,0.45);
  text-align: center;
}

@media (max-width: 768px) {
  .panel {
    width: calc(100vw - 32px);
    max-width: calc(100vw - 32px);
    padding: 24px 20px;
    border-radius: 12px;
  }
}

@media (max-width: 480px) {
  .panel {
    width: calc(100vw - 16px);
    max-width: calc(100vw - 16px);
    padding: 20px 16px;
    border-radius: 10px;
  }
}

.panel h1 {
  font-size: 24px;
  margin: 0 0 16px;
  font-weight: 600;
}

.panel .description {
  margin: 0 0 24px;
  opacity: 0.85;
  line-height: 1.6;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

@media (max-width: 768px) {
  .panel h1 {
    font-size: 20px;
    margin: 0 0 12px;
  }
  
  .panel .description {
    font-size: 13px;
    margin: 0 0 20px;
    line-height: 1.5;
  }
}

@media (max-width: 480px) {
.panel h1 {
  font-size: 18px;
  margin: 0 0 10px;
}

  .panel .description {
    font-size: 12px;
    margin: 0 0 16px;
    line-height: 1.4;
  }
}

.panel .btns {
  display: flex;
  gap: 12px;
  margin-top: 0;
  justify-content: center;
  flex-wrap: wrap;
}

.panel button {
  appearance: none;
  border: 1px solid rgba(232, 238, 255, 0.18);
  background: rgba(232, 238, 255, 0.1);
  color: #fff;
  padding: 12px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  min-width: 120px;
  transition: all 0.2s ease;
  touch-action: manipulation;
}

.panel button:hover {
  background: rgba(232, 238, 255, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.panel button:active {
  transform: translateY(0);
}

@media (max-width: 768px) {
  .panel .btns {
    gap: 10px;
  }
  
  .panel button {
    padding: 10px 20px;
    font-size: 13px;
    min-width: 100px;
    flex: 1;
    max-width: 200px;
  }
}

@media (max-width: 480px) {
  .panel .btns {
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }
  
  .panel button {
    width: 100%;
    max-width: 100%;
    padding: 12px 16px;
    font-size: 14px;
    min-width: auto;
  }
}

/* 虛擬按鈕樣式 */
.virtual-controls {
  position: absolute;
  inset: 0;
  z-index: 100;
  pointer-events: none;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 20px;
  gap: 20px;
}

.virtual-buttons-left,
.virtual-buttons-right {
  display: flex;
  gap: 12px;
  pointer-events: auto;
}

.virtual-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 2px solid rgba(232, 238, 255, 0.3);
  background: rgba(10, 14, 28, 0.7);
  backdrop-filter: blur(10px);
  color: #e8eeff;
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
  user-select: none;
  touch-action: manipulation;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.1s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.virtual-btn:active {
  background: rgba(232, 238, 255, 0.2);
  transform: scale(0.95);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
}

.virtual-btn-shoot {
  background: rgba(255, 60, 60, 0.6);
  border-color: rgba(255, 100, 100, 0.5);
}

.virtual-btn-shoot:active {
  background: rgba(255, 60, 60, 0.8);
}

/* 平板模式 */
@media (max-width: 1024px) and (min-width: 769px) {
  .virtual-btn {
    width: 70px;
    height: 70px;
    font-size: 28px;
  }
}

/* 手機模式 */
@media (max-width: 768px) {
  .virtual-controls {
    padding: 15px;
    gap: 15px;
  }
  
  .virtual-buttons-left,
  .virtual-buttons-right {
    gap: 10px;
  }
  
  .virtual-btn {
    width: 55px;
    height: 55px;
    font-size: 22px;
  }
}

/* 小手機模式 */
@media (max-width: 480px) {
  .virtual-controls {
    padding: 10px;
    gap: 10px;
  }
  
  .virtual-btn {
    width: 50px;
    height: 50px;
    font-size: 20px;
  }
}
</style>