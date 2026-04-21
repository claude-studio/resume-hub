import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'resume-hub',
    description: '통합 이력 관리 서비스 자동 완성 익스텐션',
    permissions: ['storage', 'activeTab'],
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
