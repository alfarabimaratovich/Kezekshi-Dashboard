<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
import ToastContainer from '@/components/ui/toast/ToastContainer.vue'

const route = useRoute()
const router = useRouter()
const routerReady = ref(false)
// wait until router finishes the initial navigation to avoid flicker
router.isReady().then(() => { routerReady.value = true })
const showNavbar = computed(() => routerReady.value && !((route.meta as any)?.hideNavbar))
</script>

<template>
  <Navbar v-if="showNavbar" />
  <main class="grid grid-cols-1 grid-rows-1 flex-1 w-full">
    <router-view v-slot="{ Component }">
      <transition name="page">
        <component :is="Component" class="col-start-1 row-start-1 w-full bg-background" />
      </transition>
    </router-view>
  </main>
  <ToastContainer />
</template>