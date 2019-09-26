import Vue from 'vue'
import App from './App.vue'
import Global from './components/Global.vue'

Vue.config.productionTip = false

Vue.component('Global', Global)

new Vue({
  render: h => h(App)
}).$mount('#app')
