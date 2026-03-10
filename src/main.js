import { jsx as _jsx } from "react/jsx-runtime";
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
// 调试信息：确认应用已加载
if (import.meta.env.DEV) {
    console.log('[main.tsx] 应用入口已加载', {
        pathname: window.location.pathname,
        hash: window.location.hash,
        fullUrl: window.location.href,
    });
}
ReactDOM.createRoot(document.getElementById('root')).render(
// 临时禁用 StrictMode 以调试重复渲染问题
// <React.StrictMode>
_jsx(App, {})
// </React.StrictMode>
);
