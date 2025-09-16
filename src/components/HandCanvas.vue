<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Hands, Results } from '@mediapipe/hands'
import { Camera } from '@mediapipe/camera_utils'
import * as drawingUtils from '@mediapipe/drawing_utils'

const videoEl = ref<HTMLVideoElement | null>(null)
const canvasEl = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null

// Gesture detection helper functions
function isPointing(landmarks: { x: number; y: number }[]): boolean {
  if (!landmarks) return false
  const indexTip = landmarks[8]
  const middleTip = landmarks[12]
  const wrist = landmarks[0]

  const distIndexWrist = Math.hypot(indexTip.x - wrist.x, indexTip.y - wrist.y)
  const distMiddleWrist = Math.hypot(middleTip.x - wrist.x, middleTip.y - wrist.y)

  return distIndexWrist > distMiddleWrist &&
         Math.abs(indexTip.y - middleTip.y) > 0.05
}

function isGrabbing(landmarks: { x: number; y: number }[]): boolean {
  if (!landmarks) return false
  const wrist = landmarks[0]
  const fingerTips = [8, 12, 16, 20].map(i => landmarks[i])
  const avgDist =
    fingerTips.reduce((acc, tip) => acc + Math.hypot(tip.x - wrist.x, tip.y - wrist.y), 0) /
    fingerTips.length

  return avgDist < 0.15 // tweak as needed
}

onMounted(() => {
  if (!canvasEl.value || !videoEl.value) return
  ctx = canvasEl.value.getContext('2d')

  const hands = new Hands({
    locateFile: (file: string) => `/mediapipe/hands/${file}`
  })

  hands.setOptions({
    maxNumHands: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7,
    modelComplexity: 1 // (0 = lite, 1 = full, 2 = heavy) – all available in packed .data

  })

hands.onResults(results => {
  if (!ctx || !canvasEl.value) return

  const w = canvasEl.value.width
  const h = canvasEl.value.height

  ctx.save()
  ctx.clearRect(0, 0, w, h)

  // Mirror video + drawing
  ctx.translate(w, 0)
  ctx.scale(-1, 1)
  ctx.drawImage(results.image, 0, 0, w, h)

  if (results.multiHandLandmarks) {
    for (const landmarks of results.multiHandLandmarks) {
      // Draw skeleton
      drawingUtils.drawConnectors(ctx, landmarks, Hands.HAND_CONNECTIONS, {
        color: '#00FF00',
        lineWidth: 2
      })
      drawingUtils.drawLandmarks(ctx, landmarks, {
        color: '#FF0000',
        radius: 3
      })

      // 👉 fingertip positions
      const indexTip = landmarks[8]
      const thumbTip = landmarks[4]

      // Pixel positions (unmirrored  )
      const ix = indexTip.x * w
      const iy = indexTip.y * h
      const tx = thumbTip.x * w
      const ty = thumbTip.y * h

      // Draw circles
      ctx.beginPath()
      ctx.arc(ix, iy, 8, 0, 2 * Math.PI)
      ctx.fillStyle = 'rgba(255,0,0,0.7)'
      ctx.fill()

      ctx.beginPath()
      ctx.arc(tx, ty, 8, 0, 2 * Math.PI)
      ctx.fillStyle = 'rgba(0,0,255,0.7)'
      ctx.fill()

      // 👉 Detect "catch" (pinch = thumb close to index)
      const dx = tx - ix
      const dy = ty - iy
      const dist = Math.hypot(dx, dy)

      // Midpoint (catch position, mirror compensation)
      const cx = canvasEl.value.width - (ix + tx) / 2
      const cy = (iy + ty) / 2

      const catchThreshold = 40 // px, adjust for your setup
      const isCatch = dist < catchThreshold

      // Draw status indicator (small rect in lower-left corner)
      const rectSize = 30
      ctx.fillStyle = isCatch ? 'rgba(0,255,0,0.7)' : 'rgba(255,0,0,0.7)'
      ctx.fillRect(5, h - rectSize - 5, rectSize, rectSize)

      if (isCatch) {
        console.log('🤏 Catch detected at', { x: cx, y: cy })
      }
    }
  }

  ctx.restore()
})


  const camera = new Camera(videoEl.value, {
    onFrame: async () => {
      await hands.send({ image: videoEl.value! })
    },
    width: 640,
    height: 480
  })
  camera.start()
})
</script>

<template>
  <div class="flex flex-col items-center">
    <video ref="videoEl" class="hidden"></video>
    <canvas ref="canvasEl" width="640" height="480"></canvas>
  </div>
</template>

<style scoped>
canvas {
  border: 1px solid #ccc;
  border-radius: 8px;
}
video.hidden {
  display: none;
} /* Hide the video element */
</style>
