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

  hands.onResults((results: Results) => {
    if (!ctx || !canvasEl.value) return
    ctx.save()


  // Mirror horizontally
  ctx.translate(canvasEl.value.width, 0)
  ctx.scale(-1, 1)


    ctx.clearRect(0, 0, canvasEl.value.width, canvasEl.value.height)
    ctx.drawImage(results.image, 0, 0, canvasEl.value.width, canvasEl.value.height)

    if (results.multiHandLandmarks) {
      for (const landmarks of results.multiHandLandmarks) {
        drawingUtils.drawConnectors(ctx, landmarks, Hands.HAND_CONNECTIONS, {
          color: '#00FF00',
          lineWidth: 2
        })
        drawingUtils.drawLandmarks(ctx, landmarks, {
          color: '#FF0000',
          radius: 3
        })

        if (isPointing(landmarks)) {
          console.log('👉 Pointing detected')
        } else if (isGrabbing(landmarks)) {
          console.log('✊ Grabbing detected')
        }
        //
        for (const landmarks of results.multiHandLandmarks) {
      // Index fingertip
      const indexTip = landmarks[8]

      // Convert normalized (0–1) → canvas pixels
      const px = indexTip.x * canvasEl.value.width
      const py = indexTip.y * canvasEl.value.height

      // Draw a red circle at the pointing position
      ctx.beginPath()
      ctx.arc(px, py, 10, 0, 2 * Math.PI)
      ctx.fillStyle = 'rgba(0,0,255,0.7)'
      ctx.fill()

      console.log('👉 pointing at screen position', { x: px, y: py })
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
