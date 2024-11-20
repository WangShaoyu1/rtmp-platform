import { defineConfig } from '@umijs/max';

export default defineConfig({
  antd: {
    dark: false,
    compact: false,
    import: false,
    configProvider: {},
    theme: {
      token: {
        fontSize: '14px',
      },
      components: {
        Tag: {
          colorPrimary: 'yellow',
        },
      },
    },
  },
  access: {},
  model: {},
  initialState: {},
  request: {},
  layout: {
    title: '@umijs/max',
  },
  routes: [
    {
      path: '/',
      redirect: '/home',
    },
    {
      name: '首页',
      path: '/home',
      component: './Home',
    },
    {
      name: '权限演示',
      path: '/access',
      component: './Access',
    },
    {
      name: ' CRUD 示例',
      path: '/table',
      component: './Table',
    },
    {
      name: '效果展示',
      path: '/content',
      component: './HlsMedia',
    },
  ],
  npmClient: 'pnpm',
  cssLoaderModules: {
    exportLocalsConvention: 'camelCase',
  },
  define: {
    'process.env': process.env,
  },
});

