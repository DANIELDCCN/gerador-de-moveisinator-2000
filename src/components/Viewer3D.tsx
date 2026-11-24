import { useEffect, useRef, useState } from "react"
import {
  AmbientLight,
  BoxGeometry,
  CanvasTexture,
  Color,
  DirectionalLight,
  EdgesGeometry,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshLambertMaterial,
  PerspectiveCamera,
  RepeatWrapping,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
  Box3,
} from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { CARPENTRY } from "../config/carpentry"
import type { FurnitureProject } from "../domain/types"

type Pattern = "plain" | "diag" | "horiz" | "dots" | "vert"

interface Piece {
  group: Group
  center: [number, number, number]
  shift: [number, number, number]
}

export function Viewer3D({ project }: { project: FurnitureProject }) {
  const mountRef = useRef<HTMLDivElement>(null)
  const applyRef = useRef<(amount: number) => void>(() => {})
  const explodeRef = useRef(30)
  const [explode, setExplode] = useState(30)
  const [failed, setFailed] = useState(false)
  explodeRef.current = explode

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    let renderer: WebGLRenderer
    try {
      renderer = new WebGLRenderer({ antialias: true })
    } catch {
      setFailed(true)
      return
    }
    if (!renderer.getContext()) {
      renderer.dispose()
      setFailed(true)
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    const scene = new Scene()
    scene.background = new Color("#f4f0e6")
    const camera = new PerspectiveCamera(40, 1, 10, 20000)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    controls.target.set(0, 0, 0)
    renderer.domElement.style.touchAction = "none"
    renderer.domElement.setAttribute("aria-hidden", "true")
    mount.appendChild(renderer.domElement)

    scene.add(new AmbientLight(0xffffff, 0.85))
    const key = new DirectionalLight(0xffffff, 1.15)
    key.position.set(400, 900, 600)
    scene.add(key)
    const fill = new DirectionalLight(0xffffff, 0.45)
    fill.position.set(-500, 200, -300)
    scene.add(fill)

    const root = new Group()
    scene.add(root)
    const pieces = buildPieces(project, root)
    const lineMaterials: LineBasicMaterial[] = []
    root.traverse((object) => {
      if (object instanceof LineSegments && object.material instanceof LineBasicMaterial) {
        lineMaterials.push(object.material)
      }
    })

    const layout = (amount: number) => {
      for (const piece of pieces) {
        piece.group.position.set(
          piece.center[0] + piece.shift[0] * amount,
          piece.center[1] + piece.shift[1] * amount,
          piece.center[2] + piece.shift[2] * amount,
        )
      }
      root.position.set(0, 0, 0)
      root.updateMatrixWorld(true)
      const box = new Box3().setFromObject(root)
      const center = box.getCenter(new Vector3())
      root.position.sub(center)
    }

    layout(1)
    root.updateMatrixWorld(true)
    const fitted = new Box3().setFromObject(root)
    const size = fitted.getSize(new Vector3())
    const maxDim = Math.max(size.x, size.y, size.z, 400)
    camera.position.set(maxDim * 0.72, maxDim * 0.48, -maxDim * 1.25)
    camera.near = maxDim / 200
    camera.far = maxDim * 20
    camera.updateProjectionMatrix()
    layout(explodeRef.current / 100)
    applyRef.current = layout

    let frame = 0
    const tick = () => {
      controls.update()
      renderer.render(scene, camera)
      frame = window.requestAnimationFrame(tick)
    }
    tick()

    const resize = () => {
      const width = mount.clientWidth || 640
      const height = Math.max(420, Math.round(width * 0.7))
      renderer.setSize(width, height, false)
      renderer.domElement.style.width = "100%"
      renderer.domElement.style.height = `${height}px`
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(mount)

    return () => {
      window.cancelAnimationFrame(frame)
      observer.disconnect()
      applyRef.current = () => {}
      controls.dispose()
      root.traverse((object) => {
        if (object instanceof Mesh) {
          object.geometry.dispose()
          disposeMaterial(object.material)
        }
        if (object instanceof LineSegments) object.geometry.dispose()
      })
      for (const material of lineMaterials) material.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [project])

  const level = explode === 0 ? "Peças juntas" : explode < 40 ? "Pouco afastadas" : explode < 75 ? "Afastadas" : "Bem afastadas"

  return (
    <div className="viewer">
      <div className="zoom">
        <label htmlFor="explodir">Afastar as peças</label>
        <input
          id="explodir"
          type="range"
          min={0}
          max={100}
          value={explode}
          onChange={(event) => {
            const value = Number(event.target.value)
            setExplode(value)
            applyRef.current(value / 100)
          }}
        />
        <span>
          {level} ({explode}%)
        </span>
      </div>
      <p>Arraste para girar. Use a roda do mouse ou o gesto de pinça para aproximar. A vista explica o encaixe; a medida vale a da tabela.</p>
      {failed ? (
        <p className="callout" role="status">
          <span className="badge">Nota</span> A vista 3D não abriu neste navegador. O desenho e a lista de peças continuam valendo.
        </p>
      ) : (
        <div className="canvas-host" ref={mountRef} />
      )}
      <ul className="swatches">
        <Swatch pattern="plain" label="Caixa: laterais, tampo e base, só o contorno" />
        <Swatch pattern="vert" label="Roda-pé: listras verticais" />
        <Swatch pattern="dots" label="Painel traseiro e fundos: pontos" />
        <Swatch pattern="diag" label="Frente da gaveta: diagonal" />
        <Swatch pattern="horiz" label="Caixa da gaveta: listras horizontais" />
      </ul>
    </div>
  )
}

function Swatch({ pattern, label }: { pattern: Pattern; label: string }) {
  return (
    <li>
      <svg viewBox="0 0 48 48" aria-hidden="true" className="swatch">
        <rect width="48" height="48" fill="#fbf7ef" stroke="#161616" strokeWidth="2" />
        <SwatchShape pattern={pattern} />
      </svg>
      <span>{label}</span>
    </li>
  )
}

function SwatchShape({ pattern }: { pattern: Pattern }) {
  if (pattern === "diag") return <path d="M0,48 L48,0 M0,24 L24,0 M24,48 L48,24" stroke="#161616" strokeWidth="2" fill="#fbf7ef" />
  if (pattern === "horiz") return <path d="M0,12 H48 M0,24 H48 M0,36 H48" stroke="#161616" strokeWidth="2" fill="#fbf7ef" />
  if (pattern === "vert") return <path d="M12,0 V48 M24,0 V48 M36,0 V48" stroke="#161616" strokeWidth="2" fill="#fbf7ef" />
  if (pattern === "dots") {
    return (
      <g fill="#161616">
        <rect width="48" height="48" fill="#fbf7ef" />
        <circle cx="12" cy="12" r="2" />
        <circle cx="28" cy="12" r="2" />
        <circle cx="12" cy="28" r="2" />
        <circle cx="28" cy="28" r="2" />
      </g>
    )
  }
  return <rect width="48" height="48" fill="#d8d3c7" stroke="#161616" />
}

function buildPieces(project: FurnitureProject, root: Group): Piece[] {
  const { input, derived } = project
  const pieces: Piece[] = []
  const height = input.heightMm
  const width = input.widthMm
  const thickness = input.thicknessMm
  const back = input.backThicknessMm
  const sideDepth = derived.sideDepthMm
  const plinth = derived.plinthHeightMm
  const inner = derived.innerWidthMm
  const setback = CARPENTRY.plinthSetbackMm

  const add = (
    size: [number, number, number],
    center: [number, number, number],
    shift: [number, number, number],
    pattern: Pattern,
  ) => {
    if (size.some((value) => value <= 0)) return
    const group = new Group()
    const geometry = new BoxGeometry(size[0], size[1], size[2])
    const map = makeMap(pattern, size)
    const material = new MeshLambertMaterial({ color: map ? "#ffffff" : "#d8d3c7", map })
    const mesh = new Mesh(geometry, material)
    const edges = new LineSegments(
      new EdgesGeometry(geometry),
      new LineBasicMaterial({ color: 0x161616 }),
    )
    group.add(mesh, edges)
    root.add(group)
    pieces.push({ group, center, shift })
  }

  add([thickness, height, sideDepth], [thickness / 2, height / 2, sideDepth / 2], [-160, 0, 0], "plain")
  add(
    [thickness, height, sideDepth],
    [width - thickness / 2, height / 2, sideDepth / 2],
    [160, 0, 0],
    "plain",
  )
  add([inner, thickness, sideDepth], [width / 2, height - thickness / 2, sideDepth / 2], [0, 110, 0], "plain")
  add([inner, thickness, sideDepth], [width / 2, plinth + thickness / 2, sideDepth / 2], [0, -50, 0], "plain")
  add(
    [width, derived.backHeightMm, back],
    [width / 2, plinth + derived.backHeightMm / 2, sideDepth + back / 2],
    [0, 0, 140],
    "dots",
  )

  if (input.plinthEnabled) {
    const rail = derived.plinthRailLengthMm
    add([inner, plinth, thickness], [width / 2, plinth / 2, setback + thickness / 2], [0, -120, -50], "vert")
    add([inner, plinth, thickness], [width / 2, plinth / 2, sideDepth - thickness / 2], [0, -120, 40], "vert")
    add(
      [thickness, plinth, rail],
      [thickness + thickness / 2, plinth / 2, setback + thickness + rail / 2],
      [-90, -120, 0],
      "vert",
    )
    add(
      [thickness, plinth, rail],
      [width - thickness - thickness / 2, plinth / 2, setback + thickness + rail / 2],
      [90, -120, 0],
      "vert",
    )
  }

  derived.slideCenterFromFloorMm.forEach((center, index) => {
    const boxBottom = center - derived.boxHeightMm / 2
    const frontBottom = boxBottom - (derived.frontHeightMm - derived.boxHeightMm) / 2
    const forward = -80 * (index + 1)
    const x0 = thickness + input.slideClearancePerSideMm
    add(
      [derived.frontWidthMm, derived.frontHeightMm, thickness],
      [thickness + input.drawerGapMm + derived.frontWidthMm / 2, frontBottom + derived.frontHeightMm / 2, thickness / 2],
      [0, 0, forward - 50],
      "diag",
    )
    add(
      [thickness, derived.boxHeightMm, derived.boxDepthMm],
      [x0 + thickness / 2, center, thickness + derived.boxDepthMm / 2],
      [0, 0, forward],
      "horiz",
    )
    add(
      [thickness, derived.boxHeightMm, derived.boxDepthMm],
      [x0 + derived.boxOuterWidthMm - thickness / 2, center, thickness + derived.boxDepthMm / 2],
      [0, 0, forward],
      "horiz",
    )
    add(
      [derived.boxInnerWidthMm, derived.boxHeightMm, thickness],
      [x0 + thickness + derived.boxInnerWidthMm / 2, center, thickness + thickness / 2],
      [0, 0, forward],
      "horiz",
    )
    add(
      [derived.boxInnerWidthMm, derived.boxHeightMm, thickness],
      [x0 + thickness + derived.boxInnerWidthMm / 2, center, thickness + derived.boxDepthMm - thickness / 2],
      [0, 0, forward],
      "horiz",
    )
    add(
      [derived.boxInnerWidthMm, back, derived.boxInnerDepthMm],
      [
        x0 + thickness + derived.boxInnerWidthMm / 2,
        boxBottom + back / 2,
        thickness + thickness + derived.boxInnerDepthMm / 2,
      ],
      [0, 0, forward],
      "dots",
    )
  })

  return pieces
}

function makeMap(pattern: Pattern, size: [number, number, number]): CanvasTexture | null {
  if (pattern === "plain") return null
  const canvas = document.createElement("canvas")
  canvas.width = 128
  canvas.height = 128
  const context = canvas.getContext("2d")
  if (!context) return null
  context.fillStyle = "#e7e2d6"
  context.fillRect(0, 0, 128, 128)
  context.strokeStyle = "#161616"
  context.fillStyle = "#161616"
  context.lineWidth = 4
  if (pattern === "diag") {
    context.beginPath()
    for (let offset = -128; offset < 256; offset += 18) {
      context.moveTo(offset, 128)
      context.lineTo(offset + 128, 0)
    }
    context.stroke()
  } else if (pattern === "horiz") {
    for (let y = 10; y < 128; y += 18) {
      context.beginPath()
      context.moveTo(0, y)
      context.lineTo(128, y)
      context.stroke()
    }
  } else if (pattern === "vert") {
    for (let x = 10; x < 128; x += 18) {
      context.beginPath()
      context.moveTo(x, 0)
      context.lineTo(x, 128)
      context.stroke()
    }
  } else {
    for (let y = 12; y < 128; y += 22) {
      for (let x = 12; x < 128; x += 22) {
        context.beginPath()
        context.arc(x, y, 3, 0, Math.PI * 2)
        context.fill()
      }
    }
  }
  const texture = new CanvasTexture(canvas)
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.colorSpace = SRGBColorSpace
  texture.repeat.set(Math.max(1, size[0] / 140), Math.max(1, size[1] / 140))
  return texture
}

function disposeMaterial(material: Mesh["material"]): void {
  const list = Array.isArray(material) ? material : [material]
  for (const item of list) {
    if (item instanceof MeshLambertMaterial && item.map) item.map.dispose()
    item.dispose()
  }
}
