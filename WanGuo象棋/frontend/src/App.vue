<script setup lang="ts">
import HelloWorld from './components/HelloWorld.vue'
/* import ContributorList from './components/ContributorList.vue' */
import eatMusic from './assets/audio/eat.mp3'
import fusionMusic from './assets/audio/fusion.mp3'
import moveMusic from './assets/audio/move.mp3'
import { onMounted } from 'vue'

onMounted(() => {
  const moveAudio = new Audio(moveMusic)
  const eatAudio = new Audio(eatMusic)
  const fusionAudio = new Audio(fusionMusic)
})
</script>

<template>
  <div class="QiPan">
    <HelloWorld />
    <!--     <ContributorList /> -->
  </div>

</template>

<style scoped>
.QiPan {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100%;
}
</style>
