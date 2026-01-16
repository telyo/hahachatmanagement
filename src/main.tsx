import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// 调试信息：确认应用已加载
if (import.meta.env.DEV) {
  console.log('[main.tsx] 应用入口已加载', {
    pathname: window.location.pathname,
    hash: window.location.hash,
    fullUrl: window.location.href,
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

