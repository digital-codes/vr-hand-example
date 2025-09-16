import { ref, onMounted, onBeforeUnmount } from 'vue';
// ------------------------------------------------------------------
// 1️⃣  IMPORT MediaPipe from the local NPM packages
// ------------------------------------------------------------------
import Hands from '@mediapipe/hands';
import HAND_CONNECTIONS from '@mediapipe/hands';
import { drawConnectors, drawLandmarks, } from '@mediapipe/drawing_utils';
// ------------------------------------------------------------------
// 2️⃣  ELEMENT REFERENCES
// ------------------------------------------------------------------
const videoEl = ref();
const drawCanvas = ref();
const overlayCanvas = ref();
// ------------------------------------------------------------------
// 4️⃣  APPLICATION STATE
// ------------------------------------------------------------------
const objects = [
    { id: 1, x: 100, y: 80, w: 120, h: 80, color: '#ff6666' },
    { id: 2, x: 300, y: 200, w: 150, h: 100, color: '#66ff66' },
    { id: 3, x: 200, y: 350, w: 100, h: 120, color: '#6666ff' },
];
let grabbedObj = null;
let grabOffset = { x: 0, y: 0 };
// ------------------------------------------------------------------
// 5️⃣  SMALL UTILS
// ------------------------------------------------------------------
function pointInRect(px, py, r) {
    return (px >= r.x &&
        px <= r.x + r.w &&
        py >= r.y &&
        py <= r.y + r.h);
}
// ------------------------------------------------------------------
// 6️⃣  DRAWING THE SCENE
// ------------------------------------------------------------------
function drawScene() {
    const ctx = drawCanvas.value.getContext('2d');
    ctx.clearRect(0, 0, drawCanvas.value.width, drawCanvas.value.height);
    for (const obj of objects) {
        ctx.fillStyle = obj.color;
        ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 2;
        ctx.strokeRect(obj.x, obj.y, obj.w, obj.h);
    }
}
// ------------------------------------------------------------------
// 7️⃣  INITIALISE MediaPipe Hands (local)
// ------------------------------------------------------------------
let hands; // will be instantiated in onMounted()
/* `import.meta.url` points to the compiled JS file that Vite emitted.
   Going up two levels lands us in the virtual `/src/assets/…` folder where
   Vite will copy the whole @mediapipe/hands directory. */
/*
const mediapipeBase = new URL(
'../../node_modules/@mediapipe/hands/',
import.meta.url
).pathname; // e.g. "/src/assets/@mediapipe/hands/"
*/
async function initHands() {
    hands = new Hands({
        locateFile: (file) => {
            return `node_modules/@mediapipe/hands/${file}`;
        }
    });
    /*
  hands = new Hands({
    locateFile: (file) => `${mediapipeBase}${file}`,
  });
  */
    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 0, // lite – fastest on mobiles
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6,
    });
    // Callback executed for every processed frame
    hands.onResults((results) => {
        // ------------------------------------------------------------
        // 7a️⃣  Clean overlay (hand drawing)
        // ------------------------------------------------------------
        const octx = overlayCanvas.value.getContext('2d');
        octx.clearRect(0, 0, overlayCanvas.value.width, overlayCanvas.value.height);
        if (!results.multiHandLandmarks?.length) {
            // Hand disappeared → release any grabbed object
            grabbedObj = null;
            drawScene();
            return;
        }
        const landmarks = results.multiHandLandmarks[0]; // single hand only
        // ------------------------------------------------------------
        // 7b️⃣  OPTIONAL: draw hand landmarks for debugging
        // ------------------------------------------------------------
        drawConnectors(octx, landmarks, HAND_CONNECTIONS, {
            color: '#00FF00',
            lineWidth: 2,
        });
        drawLandmarks(octx, landmarks, {
            color: '#FF0000',
            lineWidth: 1,
        });
        // ------------------------------------------------------------
        // 7c️⃣  Convert normalized (0‑1) coordinates → canvas pixels
        // ------------------------------------------------------------
        const ix = landmarks[8].x * drawCanvas.value.width; // index‑finger tip
        const iy = landmarks[8].y * drawCanvas.value.height;
        const tx = landmarks[4].x * drawCanvas.value.width; // thumb tip
        const ty = landmarks[4].y * drawCanvas.value.height;
        // ------------------------------------------------------------
        // 7d️⃣  Pinch detection (thumb close to index)
        // ------------------------------------------------------------
        const pinchDist = Math.hypot(ix - tx, iy - ty);
        const PINCH_THRESHOLD = 30; // pixels – tune for your camera
        const isPinching = pinchDist < PINCH_THRESHOLD;
        // ------------------------------------------------------------
        // 7e️⃣  Drag‑and‑drop logic
        // ------------------------------------------------------------
        if (isPinching) {
            if (!grabbedObj) {
                // First frame of pinch → hit‑test
                for (const obj of objects) {
                    if (pointInRect(ix, iy, obj)) {
                        grabbedObj = obj;
                        grabOffset.x = ix - obj.x;
                        grabOffset.y = iy - obj.y;
                        break;
                    }
                }
            }
            else {
                // Already holding → move with finger
                grabbedObj.x = ix - grabOffset.x;
                grabbedObj.y = iy - grabOffset.y;
            }
        }
        else {
            // Pinch opened → drop
            grabbedObj = null;
        }
        // ------------------------------------------------------------
        // 7f️⃣  Render everything
        // ------------------------------------------------------------
        drawScene();
    });
}
// ------------------------------------------------------------------
// 8️⃣  CAMERA & MAIN LOOP
// ------------------------------------------------------------------
async function startCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
    });
    videoEl.value.srcObject = stream;
    await videoEl.value.play();
}
// The detection loop simply forwards the video element to MediaPipe each frame.
function detectionLoop() {
    hands.send({ image: videoEl.value });
    requestAnimationFrame(detectionLoop);
}
// ------------------------------------------------------------------
// 9️⃣  COMPONENT LIFECYCLE
// ------------------------------------------------------------------
onMounted(async () => {
    await startCamera();
    await initHands();
    drawScene(); // draw the initial empty canvas
    detectionLoop(); // start the continuous hand‑tracking loop
});
onBeforeUnmount(() => {
    // Stop the webcam when the component is destroyed
    const tracks = videoEl.value?.srcObject
        ? videoEl.value.srcObject.getTracks()
        : [];
    tracks.forEach((t) => t.stop());
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['draw-canvas']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_elements.video, __VLS_elements.video)({
    ref: "videoEl",
    autoplay: true,
    playsinline: true,
    muted: true,
    width: "640",
    height: "480",
    ...{ class: "hidden-video" },
});
/** @type {typeof __VLS_ctx.videoEl} */ ;
// @ts-ignore
[videoEl,];
__VLS_asFunctionalElement(__VLS_elements.canvas, __VLS_elements.canvas)({
    ref: "drawCanvas",
    width: "640",
    height: "480",
    ...{ class: "draw-canvas" },
});
/** @type {typeof __VLS_ctx.drawCanvas} */ ;
// @ts-ignore
[drawCanvas,];
__VLS_asFunctionalElement(__VLS_elements.canvas, __VLS_elements.canvas)({
    ref: "overlayCanvas",
    width: "640",
    height: "480",
    ...{ class: "overlay-canvas" },
});
/** @type {typeof __VLS_ctx.overlayCanvas} */ ;
// @ts-ignore
[overlayCanvas,];
/** @type {__VLS_StyleScopedClasses['hidden-video']} */ ;
/** @type {__VLS_StyleScopedClasses['draw-canvas']} */ ;
/** @type {__VLS_StyleScopedClasses['overlay-canvas']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup: () => ({
        videoEl: videoEl,
        drawCanvas: drawCanvas,
        overlayCanvas: overlayCanvas,
    }),
});
export default (await import('vue')).defineComponent({});
; /* PartiallyEnd: #4569/main.vue */
