export interface MenuItem {
  path: string
  name: string
  label: string
  icon: string
  iconColor?: string
  component: () => Promise<any>
  adminOnly?: boolean
}

export const menuRoutes: MenuItem[] = [
  {
    path: '',
    name: 'dashboard',
    label: '概览',
    icon: 'i-carbon-chart-pie',
    iconColor: '#f59e0b',
    component: () => import('@/views/Dashboard.vue'),
  },
  {
    path: 'personal',
    name: 'personal',
    label: '个人',
    icon: 'i-carbon-user',
    iconColor: '#38bdf8',
    component: () => import('@/views/Personal.vue'),
  },
  {
    path: 'friends',
    name: 'friends',
    label: '好友',
    icon: 'i-carbon-user-multiple',
    iconColor: '#22c55e',
    component: () => import('@/views/Friends.vue'),
  },
  {
    path: 'shop',
    name: 'shop',
    label: '商城',
    icon: 'i-carbon-store',
    iconColor: '#f97316',
    component: () => import('@/views/Shop.vue'),
  },
  {
    path: 'analytics',
    name: 'analytics',
    label: '分析',
    icon: 'i-carbon-analytics',
    iconColor: '#a855f7',
    component: () => import('@/views/Analytics.vue'),
  },
  {
    path: 'settings',
    name: 'Settings',
    label: '设置',
    icon: 'i-carbon-settings',
    iconColor: '#0ea5e9',
    component: () => import('@/views/Settings.vue'),
  },
  {
    path: 'admin',
    name: 'admin',
    label: '后台',
    icon: 'i-carbon-settings-adjust',
    iconColor: '#8b5cf6',
    component: () => import('@/views/AdminPanel.vue'),
    adminOnly: true,
  },
]
