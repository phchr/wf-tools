import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/rivens',
      name: 'rivens',
      component: () => import('../views/RivenView.vue')
    },
    {
      path: '/prices',
      name: 'prices',
      component: () => import('../views/PricesView.vue')
    },
    {
      path: '/:pathMatch(.*)*',
      component: () => import('../views/UnknownView.vue')
    }
  ]
})

export default router
