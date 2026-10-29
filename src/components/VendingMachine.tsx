import { siteConfig } from "@/siteconfig"
import { claimMission, fetchMachineState, submitSpinToBackend, type Mission } from "@/lib/gachaApi"
import { SOUNDS, playSound } from "@/lib/sounds"
import { cn } from "@/lib/utils"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import type React from "react"
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"

// ==========================================
// CONSTANTS & CONFIGURATION
// ==========================================

const SPIN_COST = 10
const MAX_VISIBLE_COINS = 6
const CAPSULE_SIZE = 80
const BUCKET_SCALE = 0.8
const CAPSULES_PER_FRONT_ROW = 4
const HOLD_MS = 1800
const TICKET_MARGIN = 12

const CAPSULE_COLORS = [
  "from-pink-200 via-pink-400 to-pink-600",
  "from-blue-200 via-blue-400 to-blue-600",
  "from-yellow-200 via-yellow-400 to-yellow-600",
  "from-purple-200 via-purple-400 to-purple-600",
  "from-green-200 via-green-400 to-green-600",
  "from-orange-300 via-orange-400 to-orange-600",
]

const OOS_LINE1 = "WE RAN OUT OF CAPSULES ... "
const OOS_LINE2 = "WE WILL REFILL AS SOON AS POSSIBLE ... "

const SLEEP_PARTS = [
  { id: "sleep-face", text: "(* ´ ﹃｀*)", size: "text-2xl" },
  { id: "sleep-z1", text: "ᶻ", size: "text-sm" },
  { id: "sleep-z2", text: "𝗓", size: "text-lg" },
  { id: "sleep-z3", text: "Z", size: "text-2xl" },
]

const METER_SEGMENTS = Array.from({ length: SPIN_COST }, (_, i) => ({
  id: `meter-seg-${i}`,
}))

const SHARE_HASHTAG = '#definitelyNotPrize #notTaki #誰'

export type PrizeId =
  | "ticket"
  | "rock"
  | "potato"
  | "sock"
  | "bottlecap"
  | "coffee"
  | "rice"
  | "teabag"
  | "cert"

interface PileSpot {
  id: string
  left: string
  bottom: number
  z: number
  scale: number
  rotate: number
  blur: number
  bright: number
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

const safeRandom = (): number => {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return buf[0] / 4294967296
}

const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

const seededShuffle = (size: number, seed: number): number[] => {
  const arr = Array.from({ length: size }, (_, i) => i)
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i * 31) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

const floorTop = () => window.innerHeight - 100
const jstDateStr = () =>
  new Date(Date.now() + (new Date().getTimezoneOffset() + 540) * 60000)
    .toISOString()
    .split("T")[0]

const roundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) => {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

const tiltFor = (i: number) => (seededRandom(i * 97 + 13) - 0.5) * 36

const buildPileLayout = (count: number): PileSpot[] => {
  const layout: PileSpot[] = []
  if (count <= 0) return layout

  const pairCapacity = CAPSULES_PER_FRONT_ROW * 2 - 1
  const pairsNeeded = Math.ceil(count / pairCapacity)
  const pairStep =
    pairsNeeded <= 3 ? 62 : Math.max(40, Math.floor(170 / pairsNeeded))
  const backLift = Math.round(pairStep * 0.55)

  let placed = 0
  let rowIndex = 0

  while (placed < count) {
    const isBack = rowIndex % 2 === 1
    const perRow = isBack ? CAPSULES_PER_FRONT_ROW - 1 : CAPSULES_PER_FRONT_ROW
    const pair = Math.floor(rowIndex / 2)
    const rowBottom = pair * pairStep + (isBack ? backLift : 0)
    const fillCount = Math.min(perRow, count - placed)
    const slotOrder = seededShuffle(perRow, rowIndex * 97 + 5)

    for (let k = 0; k < fillCount; k++) {
      const slot = slotOrder[k]
      const baseLeft = isBack
        ? ((slot + 1) / (perRow + 1)) * 100
        : ((slot + 0.5) / perRow) * 100
      const jitterX = (seededRandom(placed * 173 + 7) - 0.5) * 14
      const jitterY = (seededRandom(placed * 211 + 3) - 0.5) * 8
      const depth = seededRandom(placed * 419 + 17)
      const scale = isBack ? 0.78 + depth * 0.06 : 0.92 + depth * 0.1

      layout.push({
        id: `capsule-${placed}`,
        left: `calc(${baseLeft.toFixed(2)}% - ${(40 - jitterX).toFixed(1)}px)`,
        bottom: rowBottom + jitterY,
        z: isBack ? 1 + Math.round(depth * 2) : 5 + Math.round(depth * 4),
        scale,
        rotate: seededRandom(placed * 111 + 1) * 360,
        blur: isBack ? 1.2 - depth * 0.6 : 0,
        bright: isBack ? 0.88 + depth * 0.06 : 1,
      })
      placed++
    }
    rowIndex++
  }
  return layout
}

const drawTicketCanvas = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  isFront: boolean,
  data: { code: string; validUntil: string } | null,
) => {
  const canvas = canvasRef.current
  if (!canvas) return
  const ctx = canvas.getContext("2d")
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, rect.width, rect.height)

  const m = TICKET_MARGIN
  const w = rect.width - m * 2
  const h = rect.height - m * 2

  ctx.shadowColor = "rgba(255, 182, 193, 0.75)"
  ctx.shadowBlur = 10
  ctx.fillStyle = isFront ? "#fff0f5" : "#f0f8ff"
  roundRect(ctx, m, m, w, h, 16)
  ctx.fill()

  ctx.shadowBlur = 0
  ctx.strokeStyle = "#ffb6c1"
  ctx.lineWidth = 3
  ctx.setLineDash([6, 6])
  roundRect(ctx, m + 6, m + 6, w - 12, h - 12, 12)
  ctx.stroke()
  ctx.setLineDash([])

  ctx.textAlign = "center"
  ctx.textBaseline = "middle"

  if (isFront) {
    ctx.fillStyle = "#d63384"
    ctx.font = 'bold 26px "Hiragino Maru Gothic Pro", "Meiryo", sans-serif'
    ctx.fillText("Free Commission", rect.width / 2, rect.height / 2 - 15)
    ctx.fillStyle = "#888"
    ctx.font = '16px "Hiragino Maru Gothic Pro", "Meiryo", sans-serif'
    ctx.fillText("Valid for 1 week!", rect.width / 2, rect.height / 2 + 20)
  } else {
    ctx.fillStyle = "#d63384"
    ctx.font = 'bold 20px "Hiragino Maru Gothic Pro", "Meiryo", sans-serif'
    ctx.fillText("Your Special Code:", rect.width / 2, rect.height / 2 - 25)
    ctx.fillStyle = "#333"
    ctx.font = "bold 32px monospace"
    ctx.fillText(data?.code || "XXXXXX", rect.width / 2, rect.height / 2 + 10)
    ctx.fillStyle = "#666"
    ctx.font = '14px "Hiragino Maru Gothic Pro", "Meiryo", sans-serif'
    ctx.fillText(
      `Expires: ${data?.validUntil}`,
      rect.width / 2,
      rect.height / 2 + 45,
    )
  }
}

// ==========================================
// SVG ICONS
// ==========================================

const CatPawIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    className={className}
    aria-hidden="true"
  >
    <path
      fill="currentColor"
      d="M24 20c-6.334 0-11.686 5.531-13.414 12.635c-.76 3.124.386 6.44 3.199 7.998C16.015 41.868 19.332 43 24 43s7.986-1.132 10.216-2.367c2.813-1.558 3.958-4.874 3.198-7.998C35.686 25.53 30.334 20 24 20zM7 14c-2.21 0-4 1.683-4 4.444S4.79 24 7 24s4-2.794 4-5.556S9.21 14 7 14zm34 0c-2.21 0-4 1.683-4 4.444S38.79 24 41 24s4-2.794 4-5.556S43.21 14 41 14zM17.5 5c-2.21 0-4 1.683-4 4.444S15.29 15 17.5 15s4-2.794 4-5.556S19.71 5 17.5 5zm13 0c-2.21 0-4 1.683-4 4.444S28.29 15 30.5 15s4-2.794 4-5.556S32.71 5 30.5 5z"
    />
  </svg>
)

const RockIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32 32"
    className={className}
    aria-hidden="true"
  >
    <path
      fill="#9b9b9b"
      d="m10.38 29.104l12.9.99a3.4 3.4 0 0 0 2.74-1.38l3.18-4.3c.56-.77.78-1.74.59-2.67l-.505-2.563l-1.165-.837l-.335-2.7l.696-.543l-.031-.157c-.16-.82-.61-1.55-1.28-2.05l-3.79-3.37l-2.38-4.4l-2.9-.16l-5.06-1.84l-6.66 7.04l-1.61 3.61l-.26.58l-1.66 3.07c-.17.3.02 3.08-.04 3.42c0 0 6.95 8.26 7.57 8.26"
    />
    <path
      fill="#e6e6e6"
      d="m20 10.104l-4.05 11.14l9.71 2.7l3.63-4.77l-.81-4.07z"
    />
    <path
      fill="#636363"
      d="M2.51 18.394L2 22.104h3l.79-3.13c.13-.56.48-1.03.97-1.33l4.24-2.54l-3.05-6.66l-1.38 1.51c-.13.14-.23.3-.31.48l-1.75 3.93l-1.66 3.07c-.17.3-.28.62-.34.96"
    />
    <path
      fill="#d3d3d3"
      d="m11.51 20.614l4.49 4.49l9.66-1.16l-7.48-3.4c-.66-.3-1-1.05-.79-1.75l2.61-8.69l1-4.98c-.84-1.34-1.23-1.72-2.67-2.19c-.96-.34-1.79-.63-1.79-.63s-.54-.23-1.12-.29c-.73-.06-1.2.07-1.82.54L11 15.104v4.28c0 .46.18.9.51 1.23"
    />
    <path
      fill="#636363"
      d="M2 22.104h3l11 3v4.99l-4.25.01c-1.15 0-2.28-.26-3.31-.78l-1.37-.68a7.2 7.2 0 0 1-1.91-1.38l-.93-.93a7.3 7.3 0 0 1-1.78-2.88z"
    />
    <path
      fill="#9b9b9b"
      d="M29.98 22.914c.12.66-.06 1.34-.51 1.85l-3.97 4.52c-.41.47-1.17.81-1.79.82H16v-5l9.66-1.16l3.62-4.77zM17.51 4.434l-1.11-1.57a1.883 1.883 0 0 0-2.89-.22l-6.76 7.04c-.65.68-.53 1.79.25 2.31l4 3.11l4.63-4.21c.55-.5.95-1.14 1.16-1.86l.95-3.25c.13-.46.05-.96-.23-1.35"
    />
  </svg>
)

const PotatoIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32 32"
    className={className}
    aria-hidden="true"
  >
    <path
      fill="#f3ad61"
      d="M23.257 2.926c-4.2-1.98-9.22-.7-11.96 3.04l-5.24 7.14c-3.95 5.38-2 13.03 4.04 15.87c5.33 2.51 11.67.19 14.14-5.15l3.71-8.04c2.23-4.84.14-10.58-4.69-12.86"
    />
    <path
      fill="#d3883e"
      d="M21.367 6.546a1.4 1.4 0 1 1-2.8 0a1.4 1.4 0 0 1 2.8 0m-2.87 8.78a1.83 1.83 0 1 0 0-3.66a1.83 1.83 0 0 0 0 3.66m-8.5 5.36a1.68 1.68 0 1 0 0-3.36a1.68 1.68 0 0 0 0 3.36m2.47 3.19a1.16 1.16 0 1 1-2.32 0a1.16 1.16 0 0 1 2.32 0m12.03-8.06a1.16 1.16 0 1 0 0-2.32a1.16 1.16 0 0 0 0 2.32"
    />
  </svg>
)

const SockIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32 32"
    className={className}
    aria-hidden="true"
  >
    <path
      fill="#8ecae6"
      d="M20.5 2h-9v14.6l-6.4 4.5a6.2 6.2 0 0 0 7.1 10.2l9.5-6.7a6.2 6.2 0 0 0 2.6-5V2z"
    />
    <path fill="#f8f9fa" d="M11.5 2h9v4.5h-9z" />
    <path
      fill="#5fa8d3"
      d="M6.9 20.6l-1.8 1.3a6.2 6.2 0 0 0 3.4 11l1.6-.6a8 8 0 0 1-3.2-11.7z"
    />
  </svg>
)

const BottleCapIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
    className={className}
    aria-hidden="true"
  >
    <path
      fill="#ef4444"
      d="M146.499 150.27C96.573 200.195 58.83 252.838 38.41 296.735c-10.21 21.949-16.034 41.712-17.185 57.376c-1.152 15.663 2.144 26.57 9.05 33.477s17.815 10.203 33.478 9.051s35.427-6.975 57.376-17.185c43.897-20.42 96.54-58.163 146.465-108.088C317.52 221.44 355.262 168.797 375.682 124.9c10.21-21.948 16.034-41.712 17.185-57.375c1.152-15.664-2.144-26.571-9.05-33.477c-6.907-6.907-17.815-10.204-33.478-9.052s-35.427 6.975-57.376 17.185c-43.897 20.42-96.54 58.163-146.465 108.089zm13.935 10.213c41.592-41.69 85.542-75.431 111.893-90.014c-57.86 45.917-217.929 183.745-148.373 275.74c6.305 8.34-61.76 34.137-65.167 24.83c-22.38-61.146 36.763-145.52 101.647-210.556M41.744 412.841c4.947 8.962 10.733 18.459 16.161 28.652c3.506-2.819 7.906-5.132 11.59-6.03c8.066-1.885 16.128.87 21.76 5.488c5.63 4.619 9.599 10.81 12.702 17.479c3.899 8.377 6.483 17.462 7.526 26.004a478 478 0 0 0 8.664-3.002c.606-9.63-.184-21-.264-31.983c-.053-7.272.214-14.436 1.99-21.283c2.625-7.78 5.641-13.813 11.925-18.142c7.374-5.046 16.26-5.932 23.704-3.857s13.74 6.48 19.25 11.573c9.504 8.784 16.758 19.647 20.942 28.494a573 573 0 0 0 8.793-4.965c-2.562-10.086-5.463-23.926-6.049-37.782c-.6-14.18.845-29.487 10.423-39.63a34 34 0 0 1 4.62-4.014c7.867-5.586 17.288-6.762 25.611-5.138s15.891 5.63 22.704 10.407c9.209 6.458 16.99 14.19 22.588 21.131a645 645 0 0 0 10.154-8.416c-5.173-7.802-9.976-18.099-13.13-29.667c-4.607-16.888-5.025-37.474 9.24-51.74c14.267-14.267 34.853-13.848 51.741-9.242c11.568 3.155 21.865 7.958 29.667 13.13a639 639 0 0 0 8.417-10.153c-6.942-5.598-14.674-13.38-21.131-22.588c-4.778-6.813-8.784-14.38-10.408-22.704s-.448-17.745 5.138-25.611c1.29-1.79 2.581-3.22 4.014-4.62c10.144-9.578 25.45-11.023 39.63-10.423c13.857.586 27.696 3.487 37.782 6.049a580 580 0 0 0 4.966-8.793c-8.848-4.184-19.71-11.439-28.494-20.942c-5.094-5.511-9.498-11.807-11.573-19.25c-2.076-7.444-1.19-16.33 3.856-23.704c4.123-6.084 11.761-10.219 18.142-11.925c6.847-1.776 14.012-2.043 21.283-1.99c10.983.08 22.354.87 31.984.264a480 480 0 0 0 3-8.664c-8.54-1.043-17.625-3.628-26.003-7.527c-6.668-3.103-12.86-7.07-17.479-12.702c-4.618-5.63-7.373-13.693-5.487-21.76c1.381-4.477 3.342-8.52 6.03-11.59c-10.194-5.427-19.69-11.213-28.652-16.16c1.638 7.21 2.07 15.074 1.464 23.308c-1.386 18.847-7.97 40.285-18.792 63.55C370.099 178.9 331.28 232.728 280.119 283.89c-51.16 51.16-104.99 89.98-151.518 111.624c-23.264 10.822-44.702 17.405-63.549 18.791c-8.234.606-16.098.175-23.307-1.464zm27.564 41.953a8 8 0 0 0-.466.471a17.7 17.7 0 0 0-2.452 3.877c4.645 11.014 8.274 22.823 9.658 35.629c10.182-9.497 12.795-4.634 17.98-4.858c-.602-7.144-2.702-16.64-6.132-24.01c-2.358-5.067-5.308-9.151-7.874-11.256c-2.567-2.105-3.98-2.523-6.496-1.934c-1.806.422-3.107 1.04-4.218 2.08zM451.197 73.13c-1.103 1.22-1.886 2.64-2.255 4.166c-.588 2.517-.171 3.93 1.934 6.496s6.19 5.517 11.256 7.874c7.37 3.43 16.866 5.53 24.01 6.133c-2.121-6.134-1.639-12.173 4.858-17.98c-12.806-1.384-24.615-5.013-35.629-9.659c-1.648.729-3.071 1.75-4.174 2.97M142.84 425.434c-2.1 2.002-3.244 5.007-3.82 7.18c-1.091 4.203-1.474 10.068-1.425 16.706c.056 7.712.702 16.382.617 25.255c11.754-8.651 20.014-21.068 43.794-20.002c-3.048-6.404-9.84-16.95-17.28-23.825c-4.184-3.868-8.54-6.56-11.982-7.52s-5.68-.82-8.944 1.415q-.51.361-.96.79zm278.79-278.746a12 12 0 0 0-.76.883c-2.233 3.265-2.373 5.501-1.413 8.944s3.651 7.798 7.52 11.984c6.875 7.438 17.42 14.23 23.825 17.278c-.606-20.71 9.905-32.31 20.001-43.794c-8.873.085-17.543-.56-25.255-.617c-6.638-.048-12.502.335-16.705 1.425c-2.952.802-5.363 1.952-7.214 3.897zm-50.02 81.633a11 11 0 0 0-1.096 1.188c-2.641 3.72-3.123 7.204-2.195 11.963s3.685 10.448 7.525 15.925c5.06 7.215 12.092 14.048 17.687 18.698c3.589-15.098 16.365-31.912 34.451-49.896c-8.701-1.987-19.218-3.878-29.014-4.293c-8.39.554-21.39.837-27.358 6.415M225.128 374.845c-6.146 6.112-7.177 22.42-6.992 27.894c.414 9.797 2.305 20.314 4.292 29.015c14.862-12.526 26.804-28.222 49.896-34.452c-4.65-5.594-11.483-12.627-18.698-17.686c-5.477-3.84-11.167-6.597-15.925-7.525c-4.758-.929-8.243-.446-11.963 2.195a10 10 0 0 0-.61.559m80.045-65.901c-8.004 8.004-8.422 20.823-4.677 34.556c2.241 8.218 6.212 16.39 9.79 22.387c13.324-21.166 30.664-38.507 51.83-51.831c-5.997-3.577-14.168-7.548-22.386-9.79c-13.734-3.745-26.553-3.326-34.557 4.678"
    />
  </svg>
)

const CannedCoffeeIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32 32"
    className={className}
    aria-hidden="true"
  >
    <rect x="10" y="6" width="12" height="22" rx="2" fill="#a8a29e" />
    <rect x="10" y="11" width="12" height="10" fill="#78350f" />
    <ellipse cx="16" cy="6" rx="6" ry="2" fill="#d6d3d1" />
    <rect x="12" y="13" width="8" height="2" rx="1" fill="#fbbf24" />
  </svg>
)

const CoffeeBeanIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 72 72"
    className={className}
    aria-hidden="true"
  >
    <ellipse cx="36" cy="36" fill="#a57939" rx="19" ry="28" />
    <path
      fill="#6a462f"
      fillRule="evenodd"
      d="M36.313 64c-.015 0-.02-.021-.005-.026c8.326-2.834 14.553-14.26 14.553-27.923c0-13.671-6.234-25.102-14.567-27.928c-.067-.023-.052-.123.019-.123C46.633 8 55 20.536 55 36s-8.367 28-18.687 28"
    />
    <g fill="#6a462f">
      <path
        fillRule="evenodd"
        d="M36 61s-6-11.193-6-25c0-13.76 5.96-24.924 6-25c-.029.054-3 5.63-3 12.5c0 6.903 3 12.5 3 12.5s3 5.596 3 12.5S36 61 36 61"
      />
    </g>
    <g fill="none" stroke="#000" strokeWidth="2">
      <ellipse cx="36" cy="36" rx="19" ry="28" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M36 36s-3-5.596-3-12.5S36 11 36 11m0 25s3 5.596 3 12.5S36 61 36 61"
      />
    </g>
  </svg>
)

const RiceGrainIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32 32"
    className={className}
    aria-hidden="true"
  >
    <ellipse
      cx="16"
      cy="16"
      rx="4"
      ry="9"
      fill="#fafaf9"
      stroke="#a8a29e"
      strokeWidth="1.5"
      transform="rotate(20 16 16)"
    />
    <path
      d="M14 10c2 4 2 8 1 12"
      stroke="#d6d3d1"
      strokeWidth="1.2"
      fill="none"
      transform="rotate(20 16 16)"
    />
  </svg>
)

const TeaBagIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32 32"
    className={className}
    aria-hidden="true"
  >
    <path d="M16 4v8" stroke="#a8a29e" strokeWidth="1.5" fill="none" />
    <rect x="13" y="2" width="6" height="4" rx="1" fill="#fbbf24" />
    <path
      d="M10 12h12l2 6v8a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3v-8z"
      fill="#d9f99d"
      stroke="#84cc16"
      strokeWidth="1.5"
    />
    <path d="M11 18h10" stroke="#84cc16" strokeWidth="1" />
  </svg>
)

const CertIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32 32"
    className={className}
    aria-hidden="true"
  >
    <rect
      x="6"
      y="5"
      width="20"
      height="24"
      rx="2"
      fill="#fefce8"
      stroke="#eab308"
      strokeWidth="1.5"
    />
    <path d="M10 11h12M10 15h12M10 19h8" stroke="#ca8a04" strokeWidth="1.2" />
    <circle
      cx="21"
      cy="24"
      r="3.5"
      fill="#facc15"
      stroke="#ca8a04"
      strokeWidth="1.2"
    />
    <path
      d="M19.5 26.5l-1.5 3M22.5 26.5l1.5 3"
      stroke="#ca8a04"
      strokeWidth="1.2"
    />
  </svg>
)

// ==========================================
// SUB-COMPONENTS
// ==========================================

const MascotCapsule = ({ className }: { className?: string }) => (
  <div
    className={cn("relative h-16 w-16", className)}
    style={{ animation: "mascot-bob 2.6s ease-in-out infinite" }}
  >
    <div className="absolute inset-0 overflow-hidden rounded-full border-4 border-white shadow-md">
      <div className="h-1/2 w-full bg-linear-to-br from-rose-300 to-pink-400" />
      <div className="h-1/2 w-full bg-white" />
    </div>
    <span className="absolute left-3 top-2 h-2.5 w-3.5 -rotate-12 rounded-full bg-white/70 blur-[2px]" />
    <div className="absolute left-1/2 top-[54%] flex -translate-x-1/2 gap-2">
      <span
        className="h-2 w-1 rounded-full bg-stone-700"
        style={{ animation: "mascot-blink 4.2s ease-in-out infinite" }}
      />
      <span
        className="h-2 w-1 rounded-full bg-stone-700"
        style={{ animation: "mascot-blink 4.2s ease-in-out infinite" }}
      />
    </div>
    <span className="absolute left-2 top-[62%] h-1 w-2 rounded-full bg-rose-300/90" />
    <span className="absolute right-2 top-[62%] h-1 w-2 rounded-full bg-rose-300/90" />
  </div>
)

const COFFEE_BEAN_SPOTS = Array.from({ length: 10 }).map((_, i) => ({
  id: `bean-${i}`,
  left: `${seededRandom(i * 53 + 1) * 84}%`,
  top: `${seededRandom(i * 71 + 2) * 78}%`,
  rot: seededRandom(i * 97 + 3) * 360,
}))

export const PRIZE_META: Record<
  Exclude<PrizeId, "ticket">,
  {
    label: string
    backText: string
    shareText: string
    chipText: string
    cardClass: string
    Icon: (p: { className?: string }) => React.ReactElement
  }
> = {
  rock: {
    label: "A Rock",
    backText: "A genuine rock. It has been doing nothing for 400 million years and shows no signs of stopping.",
    shareText: "I just won A ROCK from the gacha machine. It has been doing nothing for 400 million years and I respect that deeply.",
    chipText: "How would you like me to deliver it to you?",
    cardClass: "bg-linear-to-br from-slate-100 to-slate-300 border-slate-400",
    Icon: RockIcon,
  },
  potato: {
    label: "A Potato",
    backText: "This potato was grown by my great-grandfather and has been passed down through my family ever since. Now it is yours. I think it is still edible. If you feel unwell after the first bite, please call 119 immediately.",
    shareText: "I just won A POTATO from the gacha machine. It is a family heirloom passed down from their great-grandfather. Eh!? Wait, does accepting it mean I am part of the family now? ...Do I have to attend the reunions?",
    chipText: "How would you like me to deliver it to you?",
    cardClass: "bg-linear-to-br from-amber-100 to-amber-200 border-amber-400",
    Icon: PotatoIcon,
  },
  sock: {
    label: "A Single Sock",
    backText: "Its partner is missing. Probably in another dimension by now.",
    shareText: "I just won A SINGLE SOCK from the gacha machine. Its partner is missing and now it has me.",
    chipText: "How would you like me to deliver it to you?",
    cardClass: "bg-linear-to-br from-sky-100 to-sky-200 border-sky-400",
    Icon: SockIcon,
  },
  bottlecap: {
    label: "A Bottle Cap",
    backText: "A bottle cap! Please do not bite it. It is not edible. Recycle it responsibly after you are done looking at it.",
    shareText: "I just won A BOTTLE CAP from the gacha machine. Anyone want to trade it for a full cola?",
    chipText: "How would you like me to deliver it to you?",
    cardClass: "bg-linear-to-br from-red-100 to-red-200 border-red-400",
    Icon: BottleCapIcon,
  },
  coffee: {
    label: "A Canned Coffee",
    backText: "A canned coffee! I only took one sip to make sure it's fresh. It's not that I was thinking about indirect k-...kiss or something! D-don't get the wrong idea!",
    shareText: "I just won A CANNED COFFEE from the gacha machine. That's it! Don't ask questions!",
    chipText: "How would you like me to deliver it to you?",
    cardClass: "bg-linear-to-br from-amber-100 to-orange-200 border-amber-400",
    Icon: CannedCoffeeIcon,
  },
  rice: {
    label: "One (1) Grain Of Rice",
    backText: "One (1) grain of rice. Please do not ask for seconds. There are no seconds.",
    shareText: "I just won ONE (1) GRAIN OF RICE from the gacha machine. What am I even supposed to do with it!?",
    chipText: "How would you like me to deliver it to you?",
    cardClass: "bg-linear-to-br from-zinc-50 to-zinc-200 border-zinc-300",
    Icon: RiceGrainIcon,
  },
  teabag: {
    label: "A Used Tea Bag",
    backText: "Already brewed once. It believes in second chances, but makes no promises about a third.",
    shareText: "I just won A USED TEA BAG from the gacha machine. Can I really use it a second time? What about a third? And a fou—",
    chipText: "How would you like me to deliver it to you?",
    cardClass: "bg-linear-to-br from-lime-100 to-lime-200 border-lime-400",
    Icon: TeaBagIcon,
  },
  cert: {
    label: "Certificate Of NEET",
    backText: "This certificate is proudly presented to the bearer in recognition of outstanding dedication to Not being in Education, Employment, or Training. Through countless hours of doing absolutely nothing, you have proven that rest itself is an achievement. Congratulations on your well-earned status.",
    shareText: "I just won a CERTIFICATE OF NEET from the gacha machine. After years of unpaid practice, my profession is finally official.",
    chipText: "Feel free to print at your local konbini",
    cardClass: "bg-linear-to-br from-yellow-50 to-yellow-100 border-yellow-300",
    Icon: CertIcon,
  },
}

export const PrizeCardFace = ({
  prize,
  back,
}: {
  prize: Exclude<PrizeId, "ticket">
  back?: boolean
}) => {
  const meta = PRIZE_META[prize]
  return (
    <div
      className={cn(
        "absolute inset-0 rounded-xl border-2 flex flex-col items-center justify-center gap-3 overflow-hidden",
        meta.cardClass,
      )}
    >
      {prize === "coffee" && (
        <div className="absolute inset-0 z-0 pointer-events-none">
          {COFFEE_BEAN_SPOTS.map((s) => (
            <div
              key={s.id}
              className="absolute opacity-10"
              style={{
                left: s.left,
                top: s.top,
                transform: `rotate(${s.rot}deg)`,
              }}
            >
              <CoffeeBeanIcon className="w-8 h-8" />
            </div>
          ))}
        </div>
      )}
      {back ? (
        <>
          <div className="relative z-10 text-base font-black text-gray-600 tracking-wide text-center px-4">
            {meta.label}
          </div>
          <p className="relative z-10 text-xs text-gray-500 px-8 text-center leading-relaxed">
            {meta.backText}
          </p>
        </>
      ) : (
        <>
          <div className="relative z-10">
            <meta.Icon className="w-24 h-24 drop-shadow-md" />
          </div>
          <div className="relative z-10 text-sm font-bold text-gray-600 tracking-wider text-center px-4">
            {meta.label}
          </div>
        </>
      )}
    </div>
  )
}

const PrizeModal = ({
  data,
  onClose,
}: {
  data: { prize: PrizeId; code?: string; validUntil?: string }
  onClose: () => void
}) => {
  const frontCanvasRef = useRef<HTMLCanvasElement>(null)
  const backCanvasRef = useRef<HTMLCanvasElement>(null)
  const ticketContainerRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const dimRef = useRef<HTMLDivElement>(null)
  const rotationRef = useRef(0)
  const isDraggingRef = useRef(false)
  const lastXRef = useRef(0)

  const isTicket = data.prize === "ticket"
  const [copied, setCopied] = useState(false)

  const shareUrlFor = (prize: string) =>
    `${siteConfig.url}/share/${prize}/index.html`

  const shareOnX = () => {
    if (isTicket) return
    const meta = PRIZE_META[data.prize as Exclude<PrizeId, 'ticket'>]
    const text = `${meta.shareText} ${SHARE_HASHTAG}`
    const url = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrlFor(data.prize as string))}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const copyShare = async () => {
    if (isTicket) return
    const meta = PRIZE_META[data.prize as Exclude<PrizeId, 'ticket'>]
    const payload = `${meta.shareText}\n\n${SHARE_HASHTAG}\n${shareUrlFor(data.prize as string)}`
    try {
      await navigator.clipboard.writeText(payload)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      window.prompt('Clipboard is shy today, copy it manually:', payload)
    }
  }

  useEffect(() => {
    const root = rootRef.current
    const dim = dimRef.current
    if (!root || !dim) return

    const items = Array.from(root.children).filter(
      (c) => c !== dim,
    ) as HTMLElement[]

    gsap.fromTo(
      dim,
      { opacity: 0 },
      { opacity: 1, duration: 0.4, ease: "power2.out" },
    )
    gsap.fromTo(
      items,
      { opacity: 0, filter: "blur(12px)", y: 10 },
      {
        opacity: 1,
        filter: "blur(0px)",
        y: 0,
        duration: 0.5,
        stagger: 0.08,
        ease: "power2.out",
      },
    )
  }, [])

  useEffect(() => {
    if (!isTicket) return
    drawTicketCanvas(frontCanvasRef, true, {
      code: data.code || "",
      validUntil: data.validUntil || "",
    })
    drawTicketCanvas(backCanvasRef, false, {
      code: data.code || "",
      validUntil: data.validUntil || "",
    })
  }, [data, isTicket])

  useEffect(() => {
    let animationFrameId: number
    const animate = () => {
      if (!isDraggingRef.current) {
        rotationRef.current = (rotationRef.current + 0.3) % 360
        if (ticketContainerRef.current)
          ticketContainerRef.current.style.transform = `rotateY(${rotationRef.current}deg)`
      }
      animationFrameId = requestAnimationFrame(animate)
    }
    animationFrameId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrameId)
  }, [])

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return
      rotationRef.current += (e.clientX - lastXRef.current) * 0.8
      lastXRef.current = e.clientX
      if (ticketContainerRef.current)
        ticketContainerRef.current.style.transform = `rotateY(${rotationRef.current}deg)`
    }
    const handleUp = () => {
      isDraggingRef.current = false
    }
    window.addEventListener("pointermove", handleMove)
    window.addEventListener("pointerup", handleUp)
    window.addEventListener("pointerleave", handleUp)
    return () => {
      window.removeEventListener("pointermove", handleMove)
      window.removeEventListener("pointerup", handleUp)
      window.removeEventListener("pointerleave", handleUp)
    }
  }, [])

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true
    lastXRef.current = e.clientX;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    e.preventDefault()
  }

  const blockContextMenu = (e: React.MouseEvent) => e.preventDefault()

  const saveAsImage = () => {
    const combinedCanvas = document.createElement("canvas")
    const dpr = window.devicePixelRatio || 1
    const width = 320,
      height = 440
    combinedCanvas.width = width * dpr
    combinedCanvas.height = height * dpr
    const ctx = combinedCanvas.getContext("2d")
    if (!ctx) return
    ctx.scale(dpr, dpr)
    ctx.fillStyle = "#fdf2f8"
    roundRect(ctx, 0, 0, width, height, 20)
    ctx.fill()
    if (frontCanvasRef.current)
      ctx.drawImage(frontCanvasRef.current, 20, 20, 280, 180)
    if (backCanvasRef.current)
      ctx.drawImage(backCanvasRef.current, 20, 220, 280, 180)
    ctx.fillStyle = "#d63384"
    ctx.font = '14px "Hiragino Maru Gothic Pro", "Meiryo", sans-serif'
    ctx.textAlign = "center"
    ctx.fillText("Thank you for using the Gacha!", width / 2, height - 15)
    const link = document.createElement("a")
    link.download = `free-commission-ticket-${data.code}.png`
    link.href = combinedCanvas.toDataURL("image/png")
    link.click()
  }

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-200 flex flex-col items-center justify-center p-4"
    >
      <div
        ref={dimRef}
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
      />
      {isTicket ? (
        <div className="relative mb-6 px-4 py-1.5 rounded-md bg-white/15 border border-pink-300/40 text-sm text-pink-100 backdrop-blur-sm text-center">
          Please use before{" "}
          <span className="font-semibold text-pink-300">{data.validUntil}</span>
          !
        </div>
      ) : (
        <div className="relative mb-6 px-4 py-1.5 rounded-md bg-white/15 border border-white/25 text-sm text-white/85 backdrop-blur-sm text-center">
          {PRIZE_META[data.prize as Exclude<PrizeId, "ticket">].chipText}
        </div>
      )}
      <div
        className="relative w-96 h-64 cursor-grab active:cursor-grabbing touch-none select-none"
        style={{ perspective: "1000px" }}
        onPointerDown={handlePointerDown}
        onContextMenu={isTicket ? blockContextMenu : undefined}
      >
        <div
          ref={ticketContainerRef}
          className="relative w-full h-full"
          style={{ transformStyle: "preserve-3d" }}
        >
          {isTicket ? (
            <>
              <div
                className="absolute inset-0"
                style={{ backfaceVisibility: "hidden" }}
              >
                <canvas
                  ref={frontCanvasRef}
                  className="w-full h-full"
                  onContextMenu={blockContextMenu}
                />
              </div>
              <div
                className="absolute inset-0"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
              >
                <canvas
                  ref={backCanvasRef}
                  className="w-full h-full"
                  onContextMenu={blockContextMenu}
                />
              </div>
            </>
          ) : (
            <>
              <div
                className="absolute inset-0"
                style={{ backfaceVisibility: "hidden" }}
              >
                <PrizeCardFace
                  prize={data.prize as Exclude<PrizeId, "ticket">}
                />
              </div>
              <div
                className="absolute inset-0"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
              >
                <PrizeCardFace
                  prize={data.prize as Exclude<PrizeId, "ticket">}
                  back
                />
              </div>
            </>
          )}
        </div>
      </div>
      <div className="absolute bottom-8 inset-x-0 flex flex-wrap items-center justify-center gap-3 px-4">
        {isTicket ? (
          <button
            onClick={saveAsImage}
            className="px-6 py-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-semibold shadow-lg transition-colors"
          >
            Download Ticket
          </button>
        ) : (
          <>
            <button
              onClick={shareOnX}
              className="px-6 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-lg font-semibold shadow-lg transition-colors"
            >
              Share on X
            </button>
            <button
              onClick={copyShare}
              className="px-6 py-2.5 bg-neutral-400 hover:bg-neutral-400/80 text-white rounded-lg font-semibold border border-white/25 backdrop-blur-sm transition-colors w-40"
            >
              {copied ? 'Copied!' : 'Copy & share'}
            </button>
          </>
        )}
        <button
          onClick={onClose}
          className="px-6 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-lg font-semibold border border-white/25 backdrop-blur-sm transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  )
}

// ==========================================
// MAIN VENDING MACHINE COMPONENT
// ==========================================

const VendingMachine = () => {
  // --- State & Refs ---
  const [length, setLength] = useState<number | null>(null)
  const [missions, setMissions] = useState<Mission[]>([])
  const [coins, setCoins] = useState(() =>
    Math.max(
      Number.parseInt(localStorage.getItem("gachaBoxCoins") || "0", 10),
      0,
    ),
  )
  const [insertedCoins, setInsertedCoins] = useState(() =>
    Math.min(
      Math.max(
        Number.parseInt(localStorage.getItem("gachaInsertedCoins") || "0", 10),
        0,
      ),
      SPIN_COST,
    ),
  )
  const [displayInserted, setDisplayInserted] = useState(insertedCoins)
  const [isMuted, setIsMuted] = useState(
    () => localStorage.getItem("gachaMuted") === "true",
  )

  const [isSpinning, setIsSpinning] = useState(false)
  const [capsuleInBucketIndex, setCapsuleInBucketIndex] = useState<number | null>(null)
  const [isOpening, setIsOpening] = useState(false)
  const [isPresenting, setIsPresenting] = useState(false)
  const [prizeData, setPrizeData] = useState<{
    prize: PrizeId
    code?: string
    validUntil?: string
  } | null>(null)
  const [currentDropResult, setCurrentDropResult] = useState<{
    prize: PrizeId
    code?: string
    validUntil?: string
  } | null>(null)

  const [now, setNow] = useState(
    () => new Date(Date.now() + (new Date().getTimezoneOffset() + 540) * 60000),
  )
  const [ripples, setRipples] = useState<
    { id: number; x: number; y: number }[]
  >([])
  const [cursorPos, setCursorPos] = useState({
    x: -100,
    y: -100,
    active: false,
  })
  const [floorCoins, setFloorCoins] = useState<{ id: number; rotation: number; left: number }[]>([])

  const [isDragging, setIsDragging] = useState(false)
  const [isCoinSettling, setIsCoinSettling] = useState(false)
  const [visitedIds, setVisitedIds] = useState<Record<number, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem("gachaVisitedMissions") || "{}")
    } catch {
      return {}
    }
  })
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [hold, setHold] = useState<{ id: number; p: number } | null>(null)
  const [holdCompletedIds, setHoldCompletedIds] = useState<Set<number>>(
    new Set(),
  )

  const introPlayedRef = useRef(false)
  const introTlRef = useRef<gsap.core.Timeline | null>(null)
  const rippleIdRef = useRef(0)
  const floorCoinIdRef = useRef(0)
  const isDraggingRef = useRef(false)
  const isOverSlotRef = useRef(false)
  const listRef = useRef<HTMLDivElement>(null)
  const listDragRef = useRef({
    active: false,
    startY: 0,
    startScroll: 0,
    moved: false,
    pulling: false,
  })
  const pullRef = useRef(0)
  const holdRef = useRef<{ id: number; raf: number } | null>(null)
  const coinRef = useRef<HTMLDivElement>(null)
  const coinAnchorRef = useRef<HTMLDivElement>(null)
  const coinBoxRef = useRef<HTMLDivElement>(null)
  const slotRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const presentationCloneRef = useRef<HTMLElement | null>(null)
  const presentationTlRef = useRef<gsap.core.Timeline | null>(null)
  const shakeTimelineRef = useRef<gsap.core.Timeline | null>(null)
  const drainProxyRef = useRef({ v: 0 })
  const coinsRef = useRef(0)
  const pendingLengthRef = useRef<number | null>(null)
  const insertedCoinsRef = useRef(0)
  const lengthRef = useRef<number | null>(null)

  const { contextSafe } = useGSAP({ scope: containerRef })

  // --- Core Logic & Helpers ---

  const reconcileCoins = (totalCoins: number) => {
    let inserted = Number.parseInt(
      localStorage.getItem("gachaInsertedCoins") || "0",
      10,
    )
    if (Number.isNaN(inserted) || inserted < 0) inserted = 0
    inserted = Math.min(inserted, SPIN_COST)
    const floorCount = floorCoins.length
    if (inserted + floorCount > totalCoins) {
      inserted = Math.max(0, totalCoins - floorCount)
      localStorage.setItem("gachaInsertedCoins", inserted.toString())
    }
    const box = Math.max(0, totalCoins - inserted - floorCount)
    setInsertedCoins(inserted)
    setDisplayInserted(inserted)
    setCoins(box)
  }

  const toggleMute = () => {
    const next = !isMuted
    setIsMuted(next)
    localStorage.setItem("gachaMuted", String(next))
  }

  const markVisited = (id: number) => {
    setVisitedIds((prev) => {
      const next = { ...prev, [id]: jstDateStr() }
      localStorage.setItem("gachaVisitedMissions", JSON.stringify(next))
      return next
    })
  }

  const dropCoinToFloor = (coinEl: HTMLElement) => {
    setIsCoinSettling(true)
    const rect = coinEl.getBoundingClientRect()
    const dropLeft = rect.left
    gsap.to(coinEl, {
      top: floorTop(),
      rotateY: 0,
      scaleX: 1,
      scale: 1,
      duration: 0.5,
      ease: "power2.in",
      onComplete: () => {
        playSound(SOUNDS.coinDrop)
        setFloorCoins((prev) => [
          ...prev,
          {
            id: floorCoinIdRef.current++,
            rotation: (safeRandom() - 0.5) * 40,
            left: dropLeft,
          },
        ])
        setIsCoinSettling(false)
      },
    })
  }

  // --- Effects ---

  useEffect(() => {
    void fetchMachineState()
      .then((data) => {
        setLength(data.capsules)
        reconcileCoins(data.coins)
        setMissions(data.missions || [])
      })
      .catch((err) => {
        console.error("Failed to load machine state:", err)
        setLength(0)
        setCoins(0)
      })
  }, [])

  useEffect(() => {
    const id = window.setInterval(
      () =>
        setNow(
          new Date(Date.now() + (new Date().getTimezoneOffset() + 540) * 60000),
        ),
      1000,
    )
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    coinsRef.current = coins
    localStorage.setItem("gachaBoxCoins", coins.toString())
  }, [coins])

  useEffect(() => {
    insertedCoinsRef.current = insertedCoins
    localStorage.setItem("gachaInsertedCoins", insertedCoins.toString())
  }, [insertedCoins])

  useEffect(() => {
    lengthRef.current = length
  }, [length])

  useEffect(
    () => () => {
      presentationTlRef.current?.kill()
      presentationCloneRef.current?.remove()
      introTlRef.current?.kill()
      if (holdRef.current) cancelAnimationFrame(holdRef.current.raf)
    },
    [],
  )

  useLayoutEffect(() => {
    if (!containerRef.current || length === null || introPlayedRef.current)
      return
    gsap.set(
      [".machine-container", ".phone-container", ".coin-box-container"],
      { opacity: 0 },
    )
  }, [length])

  useEffect(() => {
    const root = containerRef.current
    if (!root || length === null || introPlayedRef.current) return
    introPlayedRef.current = true
    const machineEl = root.querySelector(".machine-container")
    const phoneEl = root.querySelector(".phone-container")
    const boxEl = root.querySelector(".coin-box-container")
    const tl = gsap.timeline()
    introTlRef.current = tl
    if (machineEl) {
      tl.fromTo(
        machineEl,
        {
          opacity: 0,
          scale: 0.94,
          filter: "blur(10px)",
        },
        {
          opacity: 1,
          scale: 1,
          filter: "blur(0px)",
          duration: 0.9,
          ease: "power2.out",
          clearProps: "all",
        },
        0,
      )
    }
    if (phoneEl) {
      tl.fromTo(
        phoneEl,
        {
          opacity: 0,
          x: 60,
          rotateY: -12,
        },
        {
          opacity: 1,
          x: 0,
          rotateY: 0,
          duration: 0.9,
          ease: "power3.out",
          clearProps: "all",
        },
        0,
      )
    }
    if (boxEl) {
      tl.fromTo(
        boxEl,
        {
          opacity: 0,
          scale: 0.92,
          filter: "blur(6px)",
        },
        {
          opacity: 1,
          scale: 1,
          filter: "blur(0px)",
          duration: 0.8,
          ease: "power2.out",
          clearProps: "all",
        },
        0,
      )
    }
  }, [length])

  const meterFull = insertedCoins >= SPIN_COST
  const meterColor = `hsl(${(displayInserted / SPIN_COST) * 120}, 75%, 45%)`
  const canGrabFromBox = coins > 0 && !isDragging && !isCoinSettling && !isSpinning
  const coinMounted = canGrabFromBox || isDragging || isCoinSettling
  const totalRender = Math.min(coins, MAX_VISIBLE_COINS)
  const staticRender = Math.max(totalRender - (canGrabFromBox ? 1 : 0), 0)
  const activeTilt = tiltFor(Math.max(totalRender - 1, 0))

  useEffect(() => {
    if (canGrabFromBox && coinRef.current) {
      gsap.set(coinRef.current, {
        position: "static",
        opacity: 1,
        rotateY: 0,
        scaleX: 1,
        clearProps: "left,top,zIndex,x,y",
      })
      gsap.to(coinRef.current, {
        rotation: activeTilt,
        scale: 1,
        duration: 0.25,
        ease: "back.out(2)",
      })
    }
  }, [canGrabFromBox, activeTilt])

  useEffect(() => {
    if (capsuleInBucketIndex !== null && !isOpening) {
      const capsuleEl = document.querySelector(
        `.capsule[data-index="${capsuleInBucketIndex}"]`,
      )
      if (capsuleEl) {
        if (shakeTimelineRef.current) shakeTimelineRef.current.kill()
        shakeTimelineRef.current = gsap.timeline({
          repeat: -1,
          repeatDelay: 1.5,
        })
        shakeTimelineRef.current.to(capsuleEl, {
          rotation: "+=6",
          duration: 0.12,
          ease: "power1.inOut",
        })
        shakeTimelineRef.current.to(capsuleEl, {
          rotation: "-=12",
          duration: 0.24,
          ease: "power1.inOut",
        })
        shakeTimelineRef.current.to(capsuleEl, {
          rotation: "+=6",
          duration: 0.12,
          ease: "power1.inOut",
        })
      }
    } else if (shakeTimelineRef.current) {
      shakeTimelineRef.current.kill()
      shakeTimelineRef.current = null
    }
    return () => {
      if (shakeTimelineRef.current) shakeTimelineRef.current.kill()
    }
  }, [capsuleInBucketIndex, isOpening])

  useGSAP(
    () => {
      const handleMove = (e: PointerEvent) => {
        if (!isDraggingRef.current || !coinRef.current) return
        gsap.set(coinRef.current, {
          left: e.clientX - 20,
          top: e.clientY - 20,
        })
        if (slotRef.current) {
          const slotRect = slotRef.current.getBoundingClientRect()
          const coinRect = coinRef.current.getBoundingClientRect()
          const coinCenterX = coinRect.left + coinRect.width / 2
          const coinCenterY = coinRect.top + coinRect.height / 2
          const overSlot =
            coinCenterX >= slotRect.left &&
            coinCenterX <= slotRect.right &&
            coinCenterY >= slotRect.top &&
            coinCenterY <= slotRect.bottom
          if (overSlot && !isOverSlotRef.current) {
            isOverSlotRef.current = true
            gsap.to(coinRef.current, {
              rotateY: 75,
              scaleX: 0.2,
              duration: 0.3,
              ease: "power2.out",
            })
          } else if (!overSlot && isOverSlotRef.current) {
            isOverSlotRef.current = false
            gsap.to(coinRef.current, {
              rotateY: 0,
              scaleX: 1,
              duration: 0.3,
              ease: "power2.out",
            })
          }
        }
      }
      const handleUp = (e: PointerEvent) => {
        if (!isDraggingRef.current || !coinRef.current) return
        isDraggingRef.current = false
        setIsDragging(false)
        try {
          (e.target as HTMLElement).releasePointerCapture(e.pointerId)
        } catch { }
        const coinRect = coinRef.current.getBoundingClientRect()
        const coinCenterX = coinRect.left + coinRect.width / 2
        const coinCenterY = coinRect.top + coinRect.height / 2
        const slotRect = slotRef.current?.getBoundingClientRect()
        const overSlot =
          !!slotRect &&
          coinCenterX >= slotRect.left &&
          coinCenterX <= slotRect.right &&
          coinCenterY >= slotRect.top &&
          coinCenterY <= slotRect.bottom
        const machineEmpty = lengthRef.current === 0
        const boxRect = coinBoxRef.current?.getBoundingClientRect()
        const overBox =
          !!boxRect &&
          coinCenterX >= boxRect.left &&
          coinCenterX <= boxRect.right &&
          coinCenterY >= boxRect.top &&
          coinCenterY <= boxRect.bottom
        if (overSlot && !machineEmpty) {
          if (insertedCoinsRef.current >= SPIN_COST) {
            dropCoinToFloor(coinRef.current)
          } else {
            playSound(SOUNDS.coinInsert)
            setIsCoinSettling(true)
            setInsertedCoins((prev) => Math.min(prev + 1, SPIN_COST))
            setDisplayInserted((prev) => Math.min(prev + 1, SPIN_COST))
            gsap.to(coinRef.current, {
              left: slotRect!.left + slotRect!.width / 2 - 20,
              top: slotRect!.top + slotRect!.height / 2 - 20,
              scale: 0,
              rotateY: 90,
              duration: 0.4,
              ease: "power2.in",
              onComplete: () => setIsCoinSettling(false),
            })
          }
        } else if (overBox && coinAnchorRef.current) {
          setIsCoinSettling(true)
          const anchorRect = coinAnchorRef.current.getBoundingClientRect()
          gsap.to(coinRef.current, {
            left: anchorRect.left - 8,
            top: anchorRect.top + 8,
            rotateY: 0,
            scaleX: 1,
            scale: 1,
            duration: 0.3,
            ease: "power2.in",
            onComplete: () => {
              playSound(SOUNDS.coinDrop)
              setCoins((prev) => prev + 1)
              setIsCoinSettling(false)
              if (coinRef.current) {
                gsap.set(coinRef.current, {
                  position: "static",
                  opacity: 1,
                  rotateY: 0,
                  clearProps: "left,top,zIndex,x,y",
                })
                gsap.to(coinRef.current, {
                  rotation: tiltFor(
                    Math.min(coinsRef.current + 1, MAX_VISIBLE_COINS) - 1,
                  ),
                  scale: 1,
                  duration: 0.25,
                  ease: "back.out(2)",
                })
              }
            },
          })
        } else {
          dropCoinToFloor(coinRef.current)
        }
        isOverSlotRef.current = false
      }
      window.addEventListener("pointermove", handleMove)
      window.addEventListener("pointerup", handleUp)
      return () => {
        window.removeEventListener("pointermove", handleMove)
        window.removeEventListener("pointerup", handleUp)
      }
    },
    { scope: containerRef },
  )

  // --- Event Handlers ---

  const handleCoinPointerDown = (e: React.PointerEvent) => {
    if (!canGrabFromBox) return
    isDraggingRef.current = true
    setIsDragging(true)
    setCoins((prev) => prev - 1)
    const target = e.currentTarget as HTMLElement
    target.setPointerCapture(e.pointerId)
    e.preventDefault()
    const rect = target.getBoundingClientRect()
    gsap.set(coinRef.current, {
      position: "fixed",
      zIndex: 9999,
      left: rect.left,
      top: rect.top,
    })
    gsap.to(coinRef.current, {
      rotation: 0,
      rotateY: 0,
      scaleX: 1,
      scale: 1,
      duration: 0.18,
      ease: "power2.out",
    })
  }

  const handleFloorCoinPointerDown = (
    e: React.PointerEvent,
    floorId: number,
  ) => {
    if (isDragging || isCoinSettling || isSpinning) return
    isDraggingRef.current = true
    setIsDragging(true)
    setFloorCoins((prev) => prev.filter((c) => c.id !== floorId))
    const target = e.currentTarget as HTMLElement
    target.setPointerCapture(e.pointerId)
    e.preventDefault()
    const rect = target.getBoundingClientRect()
    gsap.set(coinRef.current, {
      position: "fixed",
      zIndex: 9999,
      left: rect.left,
      top: rect.top,
      rotateY: 0,
      scaleX: 1,
      scale: 1,
      rotation: 0,
    })
  }

  const handleScreenPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    playSound(SOUNDS.uiTap, 0.3)
    const rect = e.currentTarget.getBoundingClientRect()
    const id = rippleIdRef.current++
    setRipples((prev) => [
      ...prev,
      { id, x: e.clientX - rect.left, y: e.clientY - rect.top },
    ])
    window.setTimeout(
      () => setRipples((prev) => prev.filter((r) => r.id !== id)),
      700,
    )
  }

  const handleScreenPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setCursorPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true,
    })
  }

  const handleScreenPointerLeave = () =>
    setCursorPos((prev) => ({ ...prev, active: false }))

  const claimById = async (m: Mission) => {
    try {
      const res = await claimMission(m.id)
      playSound(SOUNDS.missionClaim)
      reconcileCoins(res.totalCoins)
      const state = await fetchMachineState()
      setMissions(state.missions || [])
    } catch (e: any) {
      alert(e.message || "Failed to claim!")
    }
  }

  const startHold = (e: React.PointerEvent, id: number) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    playSound(SOUNDS.uiTap, 0.25)
    const start = performance.now()
    const loop = (now: number) => {
      const p = Math.min((now - start) / HOLD_MS, 1)
      setHold({ id, p })
      if (p >= 1) {
        holdRef.current = null
        setHold(null)
        setHoldCompletedIds((prev) => new Set([...prev, id]))
        return
      }
      holdRef.current = { id, raf: requestAnimationFrame(loop) }
    }
    holdRef.current = { id, raf: requestAnimationFrame(loop) }
  }

  const cancelHold = () => {
    if (holdRef.current) cancelAnimationFrame(holdRef.current.raf)
    holdRef.current = null
    setHold(null)
  }

  const setPull = (v: number) => {
    pullRef.current = v
    setPullDistance(v)
  }

  const handleListPointerDown = (e: React.PointerEvent) => {
    const el = listRef.current
    if (!el) return
    listDragRef.current = {
      active: true,
      startY: e.clientY,
      startScroll: el.scrollTop,
      moved: false,
      pulling: false,
    }
  }

  const handleListPointerMove = (e: React.PointerEvent) => {
    const st = listDragRef.current
    const el = listRef.current
    if (!st.active || !el) return
    const dy = e.clientY - st.startY
    if (!st.moved && Math.abs(dy) > 6) st.moved = true
    if (!st.moved) return
    if (st.startScroll <= 0 && dy > 0 && !isRefreshing) {
      st.pulling = true
      setPull(Math.min(dy * 0.45, 72))
    } else {
      st.pulling = false
      if (pullRef.current !== 0) setPull(0)
      el.scrollTop = st.startScroll - dy
    }
  }

  const handleListPointerEnd = () => {
    const st = listDragRef.current
    if (!st.active) return
    st.active = false
    if (st.pulling && pullRef.current > 48 && !isRefreshing) {
      setPull(0)
      setIsRefreshing(true)
      void fetchMachineState()
        .then((state) => {
          setMissions(state.missions || [])
          reconcileCoins(state.coins)
        })
        .catch(() => { })
        .finally(() => setIsRefreshing(false))
    } else {
      setPull(0)
    }
    st.pulling = false
    window.setTimeout(() => {
      listDragRef.current.moved = false
    }, 0)
  }

  const handleListClickCapture = (e: React.MouseEvent) => {
    if (listDragRef.current.moved) {
      e.stopPropagation()
      e.preventDefault()
    }
  }

  const handleManualSpin = contextSafe(() => {
    if (
      !meterFull ||
      length === 0 ||
      length === null ||
      isSpinning ||
      capsuleInBucketIndex !== null
    )
      return
    playSound(SOUNDS.spinStart)
    setIsSpinning(true)
    setInsertedCoins(0)
    drainProxyRef.current.v = displayInserted
    gsap.to(drainProxyRef.current, {
      v: 0,
      duration: 0.7,
      ease: "power1.in",
      onUpdate: () => setDisplayInserted(Math.ceil(drainProxyRef.current.v)),
    })
    const dropIndex = (length ?? 1) - 1
    const capsules = gsap.utils.toArray<HTMLElement>(".capsule")
    const capsule = document.querySelector<HTMLElement>(
      `.capsule[data-index="${dropIndex}"]`,
    )
    if (!capsule) {
      setIsSpinning(false)
      return
    }
    const chute = document.getElementById("prize-chute")
    if (!chute) return
    capsule.style.rotate = "0deg"
    capsule.style.scale = "1"
    const capsuleRect = capsule.getBoundingClientRect()
    const chuteRect = chute.getBoundingClientRect()
    const visualHeight = CAPSULE_SIZE * BUCKET_SCALE
    const visualTopOffset = (CAPSULE_SIZE - visualHeight) / 2
    const destX =
      chuteRect.left +
      chuteRect.width / 2 -
      (capsuleRect.left + capsuleRect.width / 2)
    const destY = chuteRect.top + 10 - visualTopOffset - capsuleRect.top
    const tl = gsap.timeline({
      onComplete: async () => {
        playSound(SOUNDS.capsuleDrop)
        setCapsuleInBucketIndex(dropIndex)
        try {
          const result = await submitSpinToBackend()
          pendingLengthRef.current = result.remaining
          reconcileCoins(result.coins)
          setCurrentDropResult({
            prize: result.prize as PrizeId,
            code: result.code || undefined,
            validUntil: result.expiresAt || undefined,
          })
        } catch (e: any) {
          console.error("Spin error:", e)
          if (e.message === "out_of_capsules") setLength(0)
          else if (e.message === "not_enough_coins")
            void fetchMachineState().then((state) =>
              reconcileCoins(state.coins),
            )
        }
        setIsSpinning(false)
      },
    })
    tl.to("#spin-btn", { rotation: 180, duration: 0.3, yoyo: true, repeat: 1 })
    const pileCapsules = capsules.filter((el) => el !== capsule)
    tl.to(
      pileCapsules,
      {
        x: () => gsap.utils.random(-25, 25),
        y: () => gsap.utils.random(-20, 10),
        rotation: () => gsap.utils.random(-25, 25),
        duration: 0.08,
        ease: "power3.out",
        stagger: { each: 0.015, from: "random" },
      },
      "<",
    )
    tl.to(pileCapsules, {
      x: () => gsap.utils.random(-18, 18),
      y: () => gsap.utils.random(-12, 6),
      rotation: () => gsap.utils.random(-18, 18),
      duration: 0.1,
      ease: "power2.inOut",
    })
    tl.to(pileCapsules, {
      x: () => gsap.utils.random(-10, 10),
      y: () => gsap.utils.random(-6, 3),
      rotation: () => gsap.utils.random(-10, 10),
      duration: 0.12,
      ease: "power1.inOut",
    })
    tl.to(pileCapsules, {
      x: 0,
      y: 0,
      rotation: 0,
      duration: 0.3,
      ease: "elastic.out(1, 0.4)",
    })
    tl.to(
      capsule,
      {
        x: destX,
        y: destY,
        scale: BUCKET_SCALE,
        rotation: 720,
        duration: 0.8,
        ease: "bounce.out",
      },
      "<0.1",
    )
  })

  const handleOpenCapsule = (e: React.MouseEvent, index: number) => {
    if (isOpening || capsuleInBucketIndex !== index) return
    playSound(SOUNDS.capsuleOpen)
    if (shakeTimelineRef.current) {
      shakeTimelineRef.current.kill()
      shakeTimelineRef.current = null
    }
    setIsOpening(true)
    setIsPresenting(true)
    const original = e.currentTarget as HTMLElement
    const rect = original.getBoundingClientRect()
    const clone = original.cloneNode(true) as HTMLElement
    clone.style.position = "fixed"
    clone.style.left = `${rect.left}px`
    clone.style.top = `${rect.top}px`
    clone.style.width = `${rect.width}px`
    clone.style.height = `${rect.height}px`
    clone.style.bottom = "auto"
    clone.style.right = "auto"
    clone.style.margin = "0"
    clone.style.zIndex = "180"
    clone.style.transform = ""
    clone.style.rotate = ""
    clone.style.scale = ""
    clone.style.pointerEvents = "none"
    clone.classList.remove("shadow-md")
    clone
      .querySelectorAll<HTMLElement>(".capsule-top, .capsule-bottom")
      .forEach((el) => el.classList.remove("shadow-md"))
    document.body.appendChild(clone)
    presentationCloneRef.current = clone
    gsap.set(original, { opacity: 0, pointerEvents: "none" })
    if (overlayRef.current)
      gsap.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.45 },
      )
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2
    const tl = gsap.timeline({
      onComplete: () => {
        if (currentDropResult)
          setPrizeData({
            prize: currentDropResult.prize,
            code: currentDropResult.code,
            validUntil: currentDropResult.validUntil,
          })
        clone.remove()
        presentationCloneRef.current = null
        setCapsuleInBucketIndex(null)
        setCurrentDropResult(null)
        setIsOpening(false)
        setIsPresenting(false)
        if (pendingLengthRef.current !== null) {
          setLength(pendingLengthRef.current)
          pendingLengthRef.current = null
        }
      },
    })
    presentationTlRef.current = tl
    tl.to(clone, {
      left: centerX - rect.width / 2,
      top: centerY - rect.height / 2,
      scale: 2.5,
      rotation: 0,
      duration: 0.9,
      ease: "power2.inOut",
    })
    const wobble = gsap.timeline({ repeat: 1 })
    wobble
      .to(clone, { rotation: "+=6", duration: 0.12, ease: "power1.inOut" })
      .to(clone, { rotation: "-=12", duration: 0.24, ease: "power1.inOut" })
      .to(clone, { rotation: "+=6", duration: 0.12, ease: "power1.inOut" })
    tl.add(wobble)
    tl.to(
      clone.querySelector(".capsule-top"),
      { y: -70, opacity: 0, duration: 0.6, ease: "power2.out" },
      "+=0.15",
    )
    tl.to(
      clone.querySelector(".capsule-bottom"),
      { y: 70, opacity: 0, duration: 0.6, ease: "power2.out" },
      "<",
    )
  }

  const capsuleColorMap = useMemo(() => {
    const colors = []
    for (let i = 0; i < 50; i++)
      colors.push(
        CAPSULE_COLORS[
        Math.floor(seededRandom(i * 137) * CAPSULE_COLORS.length)
        ],
      )
    return colors
  }, [])

  const pileLayout = useMemo(() => buildPileLayout(length ?? 0), [length])
  if (length === null) return null

  const machineEmpty = length === 0 && capsuleInBucketIndex === null
  const clockLabel = now
    .toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .toUpperCase()

  // --- Render ---
  return (
    <div
      className="flex flex-col md:flex-row items-center justify-center gap-12 md:p-8 relative"
      ref={containerRef}
    >
      <style>{`
        @keyframes phone-ripple { from { transform: translate(-50%, -50%) scale(0); opacity: 0.5; } to { transform: translate(-50%, -50%) scale(3); opacity: 0; } }
        .phone-ripple { position: absolute; width: 96px; height: 96px; border-radius: 9999px; background: radial-gradient(circle, rgba(148,163,184,0.45) 0%, rgba(148,163,184,0.2) 55%, transparent 75%); pointer-events: none; animation: phone-ripple 0.65s ease-out forwards; z-index: 40; }
        .phone-screen, .phone-screen * { cursor: none !important; }
        @keyframes mascot-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes mascot-blink { 0%, 90%, 100% { transform: scaleY(1); } 95% { transform: scaleY(0.12); } }
        @keyframes vm-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes vm-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
      `}</style>

      {/* MAIN MACHINE */}
      <div className="machine-container min-w-2xs w-[calc(100vw-3rem)] xs:w-md min-h-96 h-130 bg-linear-to-br from-slate-200 via-slate-300 to-slate-400 rounded-md shadow-lg p-4 mx-auto relative mt-26">
        <div className="w-full h-72 bg-white/50 border-2 border-gray-300 rounded-t-lg relative">
          <div className="absolute inset-x-3 bottom-3 top-8 z-40">
            {pileLayout.map((spot, i) => {
              const isInBucket = capsuleInBucketIndex === i
              return (
                <div
                  key={spot.id}
                  data-index={i}
                  className={cn(
                    "capsule absolute w-20 h-20 rounded-full transition-[opacity,filter] duration-300 opacity-100",
                    isInBucket &&
                    "cursor-pointer hover:drop-shadow-[0_0_14px_rgba(255,193,220,0.95)]",
                  )}
                  style={{
                    left: spot.left,
                    bottom: spot.bottom,
                    zIndex: spot.z,
                    scale: isInBucket ? undefined : spot.scale,
                    rotate: isInBucket ? undefined : `${spot.rotate}deg`,
                    filter: isInBucket
                      ? undefined
                      : `blur(${spot.blur.toFixed(2)}px) brightness(${spot.bright.toFixed(2)})`,
                  }}
                  onDoubleClick={(e) => handleOpenCapsule(e, i)}
                >
                  <div
                    className={cn(
                      "capsule-top absolute top-0 w-full h-1/2 rounded-t-full shadow-md overflow-hidden bg-linear-to-br",
                      capsuleColorMap[i],
                    )}
                  >
                    <div className="absolute bg-white/70 rounded-full blur-sm size-4 left-4 top-2"></div>
                  </div>
                  <div
                    className={cn(
                      "capsule-bottom absolute bottom-0 w-full h-1/2 rounded-b-full shadow-md bg-linear-to-br",
                      capsuleColorMap[i],
                    )}
                  ></div>
                </div>
              )
            })}
          </div>

          {machineEmpty && (
            <div className="absolute inset-0 z-45 bg-gray-950 rounded-t-lg overflow-hidden flex flex-col items-center justify-center gap-3">
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(0deg, rgba(255,255,255,0.18) 0px, rgba(255,255,255,0.18) 1px, transparent 1px, transparent 3px)",
                }}
              />
              <div className="text-pink-400 font-mono text-xs tracking-[0.35em] animate-pulse select-none">
                !! OUT OF STOCK !!
              </div>

              <div className="w-full overflow-hidden">
                <div
                  className="inline-flex whitespace-nowrap"
                  style={{ animation: "vm-marquee 14s linear infinite" }}
                >
                  <span className="px-4 text-cyan-300 font-mono text-sm tracking-widest">
                    {OOS_LINE1}
                  </span>
                  <span className="px-4 text-cyan-300 font-mono text-sm tracking-widest">
                    {OOS_LINE1}
                  </span>
                  <span className="px-4 text-cyan-300 font-mono text-sm tracking-widest">
                    {OOS_LINE1}
                  </span>
                  <span className="px-4 text-cyan-300 font-mono text-sm tracking-widest">
                    {OOS_LINE1}
                  </span>
                </div>
              </div>
              <div className="w-full overflow-hidden">
                <div
                  className="inline-flex whitespace-nowrap"
                  style={{ animation: "vm-marquee 17s linear infinite" }}
                >
                  <span className="px-4 text-cyan-300 font-mono text-xs tracking-widest">
                    {OOS_LINE2}
                  </span>
                  <span className="px-4 text-cyan-300 font-mono text-xs tracking-widest">
                    {OOS_LINE2}
                  </span>
                  <span className="px-4 text-cyan-300 font-mono text-xs tracking-widest">
                    {OOS_LINE2}
                  </span>
                  <span className="px-4 text-cyan-300 font-mono text-xs tracking-widest">
                    {OOS_LINE2}
                  </span>
                </div>
              </div>

              <div className="mt-1 flex items-end gap-1 font-mono select-none">
                {SLEEP_PARTS.map((part, i) => (
                  <span
                    key={part.id}
                    className={cn("text-pink-300", part.size)}
                    style={{
                      animation: "vm-bob 1.8s ease-in-out infinite",
                      animationDelay: `${i * 0.22}s`,
                    }}
                  >
                    {part.text}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-around gap-4 py-6 relative z-50 bg-linear-to-b from-slate-300 to-slate-400 rounded-b-lg -mt-2.5 pt-8">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 pointer-events-none">
            <div className="flex flex-col-reverse gap-0.5">
              {METER_SEGMENTS.map((seg, idx) => (
                <div
                  key={seg.id}
                  className="w-3.5 h-1.5 rounded-sm border border-black/25 transition-colors duration-200"
                  style={{
                    backgroundColor:
                      idx < displayInserted ? meterColor : "rgba(0,0,0,0.25)",
                  }}
                />
              ))}
            </div>
            <span className="font-mono tabular-nums text-[9px] font-bold text-slate-600 select-none">
              {String(insertedCoins).padStart(2, "0")}/{SPIN_COST}
            </span>
          </div>

          <button
            id="spin-btn"
            onClick={handleManualSpin}
            disabled={
              !meterFull ||
              isSpinning ||
              length === 0 ||
              capsuleInBucketIndex !== null
            }
            className="relative translate-x-1/6 sm:translate-x-0 size-26 bg-gray-100 shadow rounded-full after:content-[''] after:absolute after:h-16 after:w-4 after:bg-white after:shadow after:left-1/2 after:top-1/2 after:-translate-1/2 after:border-r-2 after:border-r-gray-300 before:content-[''] before:absolute before:size-17 before:rounded-full before:border-2 before:border-gray-200 before:left-1/2 before:top-1/2 before:-translate-1/2"
          >
            <span className="sr-only">SPIN</span>
          </button>

          <div
            ref={slotRef}
            className="size-20 bg-linear-to-br from-slate-100 to-slate-300 rounded-full shadow-lg relative after:content-[''] after:absolute after:h-10 after:w-3 after:bg-black/60 after:left-1/2 after:top-1/2 after:-translate-1/2"
          >
            <div
              className={cn(
                "absolute -top-1 -right-1 size-3 rounded-full border transition-colors duration-300 pointer-events-none",
                meterFull
                  ? "bg-green-400 border-green-600 shadow-[0_0_10px_rgba(74,222,128,0.95)]"
                  : "bg-red-400 border-red-600 shadow-[0_0_8px_rgba(248,113,113,0.85)] animate-pulse",
              )}
            />

            {/* PHYSICAL MUTE TOGGLE */}
            <button
              onClick={toggleMute}
              className="absolute -bottom-4 -left-3 p-1 rounded-full bg-slate-400 hover:bg-slate-600 text-slate-100 transition-colors shadow-sm border border-slate-300 active:scale-95"
              title={isMuted ? "Unmute sounds" : "Mute sounds"}
            >
              {isMuted ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-3"
                >
                  <path d="M11 4.702a.7.7 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.7.7 0 0 0 11 19.298z" />
                  <path d="m16.5 14.5 5-5" />
                  <path d="m16.5 9.5 5 5" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-3"
                >
                  <path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" />
                  <path d="M16 9a5 5 0 0 1 0 6" />
                  <path d="M19.364 18.364a9 9 0 0 0 0-12.728" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div
          id="prize-chute"
          className="absolute left-1/2 -ml-12 -bottom-5.25 flex flex-col items-center w-24"
        >
          <div className="relative w-24 h-18 bg-linear-to-b from-gray-100 to-gray-400 rounded shadow-[0_0_15px_rgba(255,255,255,0.4)] z-35">
            <div className="absolute inset-1.5 bg-gray-900 shadow-[inset_0_4px_8px_rgba(0,0,0,1),inset_0_0_12px_rgba(200,240,255,0.15)]">
              <div className="absolute top-1 left-2 right-2 h-0.5 bg-gray-300 blur"></div>
            </div>
          </div>
          <div
            id="chute-bucket"
            className="relative w-24 h-8 bg-linear-to-b from-gray-50 to-gray-300 shadow-[0_6px_12px_rgba(0,0,0,0.3),0_0_10px_rgba(255,255,255,0.3)] border-t-2 border-white -mt-5 z-60 rounded-b-md"
          ></div>
        </div>
      </div>

      {/* PHONE & COIN BOX */}
      <div className="flex flex-col-reverse md:flex-col items-center gap-8 w-72">
        <div className="phone-container w-full h-137.5 bg-stone-900 rounded-[40px] p-2 shadow-2xl border-4 border-stone-800 relative flex flex-col select-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-stone-900 rounded-b-2xl z-20 flex items-center justify-center">
            <div className="w-12 h-1.5 bg-stone-700 rounded-full"></div>
          </div>
          <div
            className="phone-screen bg-stone-50 rounded-4xl flex-1 flex flex-col overflow-hidden relative cursor-none"
            onPointerDown={handleScreenPointerDown}
            onPointerMove={handleScreenPointerMove}
            onPointerLeave={handleScreenPointerLeave}
          >
            <div className="h-7 bg-white flex items-center justify-between px-6 text-[10px] font-semibold text-stone-600 z-10">
              <span className="tabular-nums">{clockLabel}</span>
              <div className="flex gap-1.5 items-center">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M2 22h20V2z" />
                </svg>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
                </svg>
                <svg
                  width="16"
                  height="12"
                  viewBox="0 0 24 16"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z" />
                </svg>
              </div>
            </div>
            <div className="h-12 bg-white flex items-center px-4 shadow-sm border-b border-stone-200 z-10">
              <span className="text-stone-800 text-base font-bold leading-tight">
                Daily Missions
              </span>
            </div>
            <div
              ref={listRef}
              className="flex-1 overflow-y-auto touch-none p-3 space-y-3 bg-stone-100"
              onPointerDown={handleListPointerDown}
              onPointerMove={handleListPointerMove}
              onPointerUp={handleListPointerEnd}
              onPointerCancel={handleListPointerEnd}
              onPointerLeave={handleListPointerEnd}
              onClickCapture={handleListClickCapture}
            >
              <div
                className="flex flex-col items-center justify-center gap-1 overflow-hidden"
                style={{ height: isRefreshing ? 56 : pullDistance }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={cn(
                    "h-4 w-4 text-stone-400",
                    isRefreshing && "animate-spin",
                  )}
                  style={{
                    transform: isRefreshing
                      ? undefined
                      : `rotate(${-pullDistance * 5}deg)`,
                  }}
                >
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                  <path d="M8 16H3v5" />
                </svg>
                {pullDistance > 0 && (
                  <span className="text-[10px] text-stone-400">
                    Refresh missions...
                  </span>
                )}
              </div>

              {missions.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-stone-400 gap-3 pb-8">
                  <MascotCapsule />
                  <div className="text-center">
                    <p className="text-sm font-semibold text-stone-500">
                      All caught up!
                    </p>
                    <p className="text-[11px] text-stone-400 mt-1">
                      Come back tomorrow for more.
                    </p>
                  </div>
                </div>
              )}

              {missions.map((m) => {
                const visited = visitedIds[m.id] === jstDateStr()
                const holding = hold?.id === m.id
                return (
                  <div
                    key={m.id}
                    className="bg-white p-4 rounded-2xl shadow-sm border border-stone-200/50 transition-all active:scale-[0.98]"
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="text-sm font-bold text-stone-800 leading-tight">
                        {m.title}
                      </span>
                      <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <CatPawIcon className="w-3 h-3" /> +{m.coins}
                      </span>
                    </div>
                    {m.description && (
                      <p className="text-[11px] text-stone-500 leading-snug mb-3">
                        {m.description}
                      </p>
                    )}
                    <div className="flex gap-2">
                      {m.completed ? (
                        <span className="flex-[1.5] text-center text-xs py-2 rounded-lg font-bold bg-green-50 text-green-500 border border-green-100">
                          Claimed
                        </span>
                      ) : m.url ? (
                        visited ? (
                          <button
                            onClick={() => claimById(m)}
                            className="flex-[1.5] text-xs py-2 rounded-lg font-bold transition-all shadow-sm bg-sky-500 text-white hover:bg-sky-600 active:scale-95"
                          >
                            Claim
                          </button>
                        ) : (
                          <a
                            href={m.url}
                            target="_blank"
                            rel="noopener"
                            onClick={() => markVisited(m.id)}
                            className="flex-1 text-center text-xs bg-stone-100 hover:bg-stone-200 text-stone-600 py-2 rounded-lg font-medium transition-colors"
                          >
                            {m.cta_text || "Visit"}
                          </a>
                        )
                      ) : !holdCompletedIds.has(m.id) && !visited ? (
                        <button
                          onPointerDown={(e) => startHold(e, m.id)}
                          onPointerUp={cancelHold}
                          onPointerLeave={cancelHold}
                          onPointerCancel={cancelHold}
                          className="relative overflow-hidden flex-[1.5] text-xs py-2 rounded-lg font-bold transition-all shadow-sm bg-sky-500 text-white hover:bg-sky-600 active:scale-95"
                        >
                          {holding && (
                            <span
                              className="absolute inset-y-0 left-0 bg-white/30"
                              style={{ width: `${(hold?.p ?? 0) * 100}%` }}
                            />
                          )}
                          <span className="relative">
                            {holding ? "Charging…" : "Hold to confirm"}
                          </span>
                        </button>
                      ) : holdCompletedIds.has(m.id) && !visited ? (
                        <button
                          onClick={() => markVisited(m.id)}
                          className="flex-[1.5] text-xs py-2 rounded-lg font-bold transition-all shadow-sm bg-pink-500 text-white hover:bg-pink-600 active:scale-95"
                        >
                          {m.cta_text || "Claim reward"}
                        </button>
                      ) : (
                        <button
                          onClick={() => claimById(m)}
                          className="flex-[1.5] text-xs py-2 rounded-lg font-bold transition-all shadow-sm bg-sky-500 text-white hover:bg-sky-600 active:scale-95"
                        >
                          Claim
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            {ripples.map((r) => (
              <span
                key={r.id}
                className="phone-ripple"
                style={{ left: r.x, top: r.y }}
              />
            ))}
            {cursorPos.active && (
              <div
                className="absolute w-4 h-4 bg-white/80 border border-black/10 rounded-full pointer-events-none z-50 -translate-x-1/2 -translate-y-1/2 shadow-sm"
                style={{ left: cursorPos.x, top: cursorPos.y }}
              />
            )}
            <div className="h-10 bg-white border-t border-stone-200 flex items-center justify-center gap-16">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-stone-400"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              </svg>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-stone-400"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10"></circle>
              </svg>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
                className="text-stone-400"
                aria-hidden="true"
              >
                <polygon points="19 3 5 12 19 21 19 3"></polygon>
              </svg>
            </div>
          </div>
        </div>

        <div
          ref={coinBoxRef}
          className="coin-box-container relative w-full rounded-xl bg-linear-to-b from-pink-100 to-pink-200 border-4 border-white shadow-xl px-3 pt-3 pb-2 flex flex-col items-center gap-2 select-none"
        >
          <div className="text-[10px] font-bold tracking-widest text-pink-600">
            COIN BOX
          </div>
          <div className="relative flex h-16 w-full items-end justify-center px-1">
            {Array.from({ length: staticRender }, (_, i) => ({
              id: `box-coin-${i}`,
              tilt: tiltFor(i),
            })).map((boxCoin) => (
              <div
                key={boxCoin.id}
                className="flex h-12 w-6 items-end justify-center"
              >
                <div
                  className="h-10 w-10 shrink-0 rounded-full bg-linear-to-br from-yellow-300 via-yellow-400 to-yellow-500 border-2 border-yellow-600 shadow-md flex items-center justify-center"
                  style={{ transform: `rotate(${boxCoin.tilt}deg)` }}
                >
                  <CatPawIcon className="w-6 h-6 text-yellow-700" />
                </div>
              </div>
            ))}
            <div
              ref={coinAnchorRef}
              className="flex h-12 w-6 items-end justify-center"
            >
              {coinMounted && (
                <div
                  ref={coinRef}
                  onPointerDown={handleCoinPointerDown}
                  className="h-10 w-10 shrink-0 rounded-full bg-linear-to-br from-yellow-300 via-yellow-400 to-yellow-500 border-2 border-yellow-600 shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing select-none touch-none pointer-events-auto"
                >
                  <CatPawIcon className="w-6 h-6 text-yellow-700" />
                </div>
              )}
            </div>
            {coins === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-pink-400/60 text-sm">
                Empty
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 rounded-md bg-white/70 px-3 py-0.5 text-xs font-bold text-pink-600 shadow-inner">
            <CatPawIcon className="w-3.5 h-3.5 text-yellow-600" />
            <span>× {coins}</span>
          </div>
        </div>
      </div>

      {floorCoins.map((coin) => (
        <div
          key={`floor-${coin.id}`}
          onPointerDown={(e) => handleFloorCoinPointerDown(e, coin.id)}
          className="fixed z-120 h-10 w-10 rounded-full bg-linear-to-br from-yellow-300 via-yellow-400 to-yellow-500 border-2 border-yellow-600 shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing select-none touch-none"
          style={{
            left: coin.left,
            top: floorTop(),
            transform: `rotate(${coin.rotation}deg)`,
          }}
          title="Pick up coin"
        >
          <CatPawIcon className="w-6 h-6 text-yellow-700" />
        </div>
      ))}

      {isPresenting && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-170 bg-black/25 backdrop-blur-md pointer-events-none"
        />
      )}
      {prizeData && (
        <PrizeModal data={prizeData} onClose={() => setPrizeData(null)} />
      )}
    </div>
  )
}

export default VendingMachine
