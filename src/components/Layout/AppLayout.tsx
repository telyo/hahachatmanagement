import { Layout, AppBar, Title, UserMenu, Logout, MenuItemLink } from 'react-admin';
import { Menu } from './Menu';

const MyAppBar = () => {
  return (
    <AppBar userMenu={
      <UserMenu>
        <MenuItemLink
          to="/profile/change-password"
          primaryText="修改密码"
          leftIcon={<span>🔒</span>}
        />
        <Logout />
      </UserMenu>
    }>
      <Title title="HahaChat 后台管理" />
    </AppBar>
  );
};

export const AppLayout = (props: any) => <Layout {...props} appBar={MyAppBar} menu={Menu} />;

