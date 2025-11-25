<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-white text-gray-800">
    <div class="text-center">
      <h1 class="text-6xl font-bold text-red-500">403</h1>
      <p class="mt-4 text-xl font-medium">Доступ запрещен</p>
      <p class="mt-2 text-gray-600">
        Извините, у вас нет разрешения на доступ к этой странице.
      </p>
      <button
        @click="goHome"
        class="mt-6 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        На главную
      </button>
    </div>
  </div>
</template>

<script>
export default {
  methods: {
    goHome() {
      this.$router.push('/'); // Redirect to homepage
    },
  },
};
</script>

<style scoped>
/* Add any additional custom styles here if needed */
</style>