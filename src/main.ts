import colResize from '@/directives/colResize';
import '@/style.css'; // ensure global styles include resizer styles
import 'nprogress/nprogress.css';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

const app = createApp(App)
app.use(createPinia())
app.use(router)

// register directive globally
app.directive('col-resize', colResize)

app.mount('#app')

