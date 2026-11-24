// .vue 元件的型別由 VitePress / Vite 在 build 時處理；tsc 只檢查 .ts 檔
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent
  export default component
}

declare module '*.css'
