<script setup>
import { RouterLink, RouterView, useRoute } from 'vue-router';
import { computed } from 'vue';
const route = useRoute();
const home = computed(() => route.path === '/');
</script>

<template>
  <nav>
    <h1>
      <RouterLink to="/" v-if="!home" class="hl">wf-tools</RouterLink>
      <span v-else>wf-tools</span>
    </h1>
    <h4 v-if="home">Warframe utility tools collection</h4>
  </nav>
  <RouterView />
</template>