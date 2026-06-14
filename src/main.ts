import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import './style.css';

const app = createApp(App);

app.directive('grow', {
  mounted(el: HTMLElement) {
    el.style.overflow = 'hidden';
    el.style.resize = 'none';
    const grow = () => {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    };
    grow();
    el.addEventListener('input', grow);
  },
});

app.use(createPinia());
app.mount('#app');
