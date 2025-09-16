<script setup lang="ts">
import HandCanvas from './components/HandCanvas.vue';
</script>

<template>
  <div class="app">
    <h1>Hand‑Controlled Canvas Demo</h1>
    <HandCanvas />
  </div>
</template>

<style>
.app {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 2rem;
}
</style>

