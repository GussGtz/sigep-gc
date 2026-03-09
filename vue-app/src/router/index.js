import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

// Views — lazy loaded para performance
const LoginView           = () => import('../views/LoginView.vue')
const RegisterView        = () => import('../views/RegisterView.vue')
const ForgotPasswordView  = () => import('../views/ForgotPasswordView.vue')
const AdminDashboard      = () => import('../views/admin/AdminDashboard.vue')
const AdminPedidos        = () => import('../views/admin/AdminPedidos.vue')
const AdminConductores    = () => import('../views/admin/AdminConductores.vue')
const AdminUsuarios       = () => import('../views/admin/AdminUsuarios.vue')
const AdminInventario     = () => import('../views/admin/AdminInventario.vue')
const VentasDashboard     = () => import('../views/ventas/VentasDashboard.vue')
const ProduccionDashboard = () => import('../views/produccion/ProduccionDashboard.vue')
const ConductorDashboard  = () => import('../views/conductor/ConductorDashboard.vue')
const ConductorEntrega    = () => import('../views/conductor/ConductorEntrega.vue')
const ChatDirecto         = () => import('../views/chat/ChatDirecto.vue')

const routes = [
  { path: '/', redirect: '/login' },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { public: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterView,
    meta: { public: true }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: ForgotPasswordView,
    meta: { public: true }
  },

  // ── ADMIN ──────────────────────────────────────────────
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: AdminDashboard,
    meta: { requiresAuth: true, roles: [1] }
  },
  {
    path: '/admin/pedidos',
    name: 'AdminPedidos',
    component: AdminPedidos,
    meta: { requiresAuth: true, roles: [1] }
  },
  {
    path: '/admin/conductores',
    name: 'AdminConductores',
    component: AdminConductores,
    meta: { requiresAuth: true, roles: [1] }
  },
  {
    path: '/admin/usuarios',
    name: 'AdminUsuarios',
    component: AdminUsuarios,
    meta: { requiresAuth: true, roles: [1] }
  },
  {
    path: '/admin/inventario',
    name: 'AdminInventario',
    component: AdminInventario,
    meta: { requiresAuth: true, roles: [1] }
  },

  // ── VENTAS ─────────────────────────────────────────────
  {
    path: '/ventas',
    name: 'VentasDashboard',
    component: VentasDashboard,
    meta: { requiresAuth: true, roles: [2], departamento: 'ventas' }
  },

  // ── PRODUCCIÓN ─────────────────────────────────────────
  {
    path: '/produccion',
    name: 'ProduccionDashboard',
    component: ProduccionDashboard,
    meta: { requiresAuth: true, roles: [2], departamento: 'produccion' }
  },

  // ── CONDUCTOR (PWA) ────────────────────────────────────
  {
    path: '/conductor',
    name: 'ConductorDashboard',
    component: ConductorDashboard,
    meta: { requiresAuth: true, roles: [3] }
  },
  {
    path: '/conductor/entrega/:id',
    name: 'ConductorEntrega',
    component: ConductorEntrega,
    meta: { requiresAuth: true, roles: [3] }
  },

  // ── CHAT 1-A-1 (todos los roles autenticados) ──────────
  {
    path: '/chat',
    name: 'ChatDirecto',
    component: ChatDirecto,
    meta: { requiresAuth: true, roles: [1, 2, 3] }
  },

  // ── 404 ────────────────────────────────────────────────
  { path: '/:pathMatch(.*)*', redirect: '/login' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Guard global
router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore()

  // Ruta pública → siempre permitir
  if (to.meta.public) {
    if (auth.isAuthenticated) return next(auth.homeRoute)
    return next()
  }

  // Ruta protegida → verificar token
  if (to.meta.requiresAuth) {
    if (!auth.token) return next('/login')

    // Verificar que el token sea válido (primera navegación)
    if (!auth.user) {
      const valid = await auth.verifyToken()
      if (!valid) return next('/login')
    }

    // Verificar rol permitido
    const allowedRoles = to.meta.roles || []
    if (allowedRoles.length && !allowedRoles.includes(auth.user.role_id)) {
      return next(auth.homeRoute)
    }

    // Verificar departamento si aplica
    const requiredDept = to.meta.departamento
    if (requiredDept && auth.user.departamento !== requiredDept) {
      return next(auth.homeRoute)
    }

    return next()
  }

  next()
})

export default router
