import { Admin, Resource, CustomRoutes } from 'react-admin';
import { Route } from 'react-router-dom';
import { dataProvider } from './services/dataProvider';
import { authProvider } from './services/authProvider';
import { AppLayout } from './components/Layout/AppLayout';
import { Login } from './pages/Login/Login';
import { Dashboard } from './pages/Dashboard/Dashboard';

// Users
import { UserList } from './pages/Users/UserList';
import { UserShow } from './pages/Users/UserShow';
import UserEdit from './pages/Users/UserEdit';

// Orders
import { OrderList } from './pages/Orders/OrderList';
import { OrderShow } from './pages/Orders/OrderShow';

// Subscriptions
import { SubscriptionPlanList } from './pages/Subscriptions/SubscriptionPlanList';
import { SubscriptionPlanShow } from './pages/Subscriptions/SubscriptionPlanShow';
import { SubscriptionPlanCreate } from './pages/Subscriptions/SubscriptionPlanCreate';
import { SubscriptionPlanEdit } from './pages/Subscriptions/SubscriptionPlanEdit';


// AI Models
import { AIModelList } from './pages/AIModels/AIModelList';
import { AIModelShow } from './pages/AIModels/AIModelShow';
import { AIModelCreate } from './pages/AIModels/AIModelCreate';
import { AIModelEdit } from './pages/AIModels/AIModelEdit';
import { AIModelImportExport } from './pages/AIModels/AIModelImportExport';

// AI Usage
import { AIUsageList } from './pages/AIUsage/AIUsageList';

// Feedback
import { FeedbackList } from './pages/Feedback/FeedbackList';
import FeedbackShow from './pages/Feedback/FeedbackShow';

// Audit Logs
import { AuditLogList } from './pages/AuditLogs/AuditLogList';

// API Logger
import { APILoggerConfigList } from './pages/APILogger/APILoggerConfig';

// Admins
import { AdminList } from './pages/Admins/AdminList';
import { AdminShow } from './pages/Admins/AdminShow';
import AdminCreate from './pages/Admins/AdminCreate';
import AdminEdit from './pages/Admins/AdminEdit';

// Client Providers
import { ClientProviderList } from './pages/ClientProviders/ClientProviderList';
import { ClientProviderShow } from './pages/ClientProviders/ClientProviderShow';
import { ClientProviderCreate } from './pages/ClientProviders/ClientProviderCreate';
import ClientProviderEdit from './pages/ClientProviders/ClientProviderEdit';
import { ClientProviderImport } from './pages/ClientProviders/ClientProviderImport';

// Hahachat Providers
import { HahachatProviderList } from './pages/HahachatProviders/HahachatProviderList';
import { HahachatProviderShow } from './pages/HahachatProviders/HahachatProviderShow';
import { HahachatProviderCreate } from './pages/HahachatProviders/HahachatProviderCreate';
import HahachatProviderEdit from './pages/HahachatProviders/HahachatProviderEdit';
import { HahachatProviderImport } from './pages/HahachatProviders/HahachatProviderImport';

// Web Search
import { WebSearchConfig } from './pages/WebSearch/WebSearchConfig';

// Profile
import { ChangePassword } from './pages/Profile/ChangePassword';

import PeopleIcon from '@mui/icons-material/People';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import FeedbackIcon from '@mui/icons-material/Feedback';
import HistoryIcon from '@mui/icons-material/History';
import ChatIcon from '@mui/icons-material/Chat';
import SettingsIcon from '@mui/icons-material/Settings';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import CloudIcon from '@mui/icons-material/Cloud';
import SearchIcon from '@mui/icons-material/Search';

function App() {
  // 调试信息：确认 App 组件已渲染
  if (import.meta.env.DEV) {
    console.log('[App.tsx] App 组件已渲染', {
      pathname: window.location.pathname,
      hash: window.location.hash,
      fullUrl: window.location.href,
    });
  }

  return (
    <Admin
      dataProvider={dataProvider}
      authProvider={authProvider}
      layout={AppLayout}
      loginPage={Login}
      dashboard={Dashboard}
    >
      <Resource
        name="users"
        list={UserList}
        show={UserShow}
        edit={UserEdit}
        icon={PeopleIcon}
        options={{ label: '用户管理' }}
      />
      <Resource
        name="orders"
        list={OrderList}
        show={OrderShow}
        icon={ShoppingCartIcon}
        options={{ label: '订单管理' }}
      />
      <Resource
        name="subscription-plans"
        list={SubscriptionPlanList}
        show={SubscriptionPlanShow}
        create={SubscriptionPlanCreate}
        edit={SubscriptionPlanEdit}
        icon={CardMembershipIcon}
        options={{ label: '套餐管理' }}
      />
      <Resource
        name="ai-models"
        list={AIModelList}
        show={AIModelShow}
        create={AIModelCreate}
        edit={AIModelEdit}
        icon={SmartToyIcon}
        options={{ label: 'AI模型' }}
      />
      <Resource
        name="ai-usage"
        list={AIUsageList}
        icon={ChatIcon}
        options={{ label: 'AI使用统计' }}
      />
      <CustomRoutes>
        <Route path="/ai-models-import-export" element={<AIModelImportExport />} />
      </CustomRoutes>
      <Resource
        name="feedback"
        list={FeedbackList}
        show={FeedbackShow}
        icon={FeedbackIcon}
        options={{ label: '反馈管理' }}
      />
      <Resource
        name="audit-logs"
        list={AuditLogList}
        icon={HistoryIcon}
        options={{ label: '操作日志' }}
      />
      <Resource
        name="api-logger"
        list={APILoggerConfigList}
        icon={SettingsIcon}
        options={{ label: 'API日志配置' }}
      />
      <Resource
        name="admins"
        list={AdminList}
        show={AdminShow}
        create={AdminCreate}
        edit={AdminEdit}
        icon={AdminPanelSettingsIcon}
        options={{ label: '管理员管理' }}
      />
      <Resource
        name="client-providers"
        list={ClientProviderList}
        show={ClientProviderShow}
        create={ClientProviderCreate}
        edit={ClientProviderEdit}
        icon={CloudIcon}
        options={{ label: '客户端提供商管理' }}
      />
      <Resource
        name="hahachat-providers"
        list={HahachatProviderList}
        show={HahachatProviderShow}
        create={HahachatProviderCreate}
        edit={HahachatProviderEdit}
        icon={CloudIcon}
        options={{ label: 'Hahachat 提供商管理' }}
      />
      <CustomRoutes>
        <Route path="/ai-models-import-export" element={<AIModelImportExport />} />
        <Route path="/client-providers-import" element={<ClientProviderImport />} />
        <Route path="/hahachat-providers/import" element={<HahachatProviderImport />} />
        <Route path="/profile/change-password" element={<ChangePassword />} />
        <Route path="/web-search/config" element={<WebSearchConfig />} />
      </CustomRoutes>
    </Admin>
  );
}

export default App;

