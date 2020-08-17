import Vue from 'vue';
import App from './App.vue';
import Router from 'vue-router';

import navs from './navs';
import heightDynamic from './heightDynamic';
import heightFixed from './heightFixed';

Vue.use(Router);
Vue.config.productionTip = false;

new Vue({
  router: new Router({
    routes: [
      {
        path: '/',
        component: navs,
      },
      {
        path: '/height-dynamic',
        component: heightDynamic,
      },
      {
        path: '/height-fixed',
        component: heightFixed,
      },
    ],
  }),
  render: h => h(App),
}).$mount('#app');
