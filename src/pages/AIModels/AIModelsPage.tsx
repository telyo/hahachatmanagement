import { Box, Tab, Tabs } from '@mui/material';
import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AIModelList } from './AIModelList';
import { AIModelsGeneralConfigTab } from './AIModelsGeneralConfig';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export const AIModelsPage = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const tab = query.get('tab') || 'list';

  const tabIndex = tab === 'config' ? 1 : 0;

  return (
    <Box sx={{ px: 1 }}>
      <Tabs
        value={tabIndex}
        onChange={(_, next) => {
          const nextTab = next === 1 ? 'config' : 'list';
          navigate(`/ai-models?tab=${nextTab}`);
        }}
        sx={{ mb: 2 }}
      >
        <Tab label="模型列表" />
        <Tab label="通用配置" />
      </Tabs>

      <Box role="tabpanel" hidden={tabIndex !== 0}>
        {tabIndex === 0 && <AIModelList />}
      </Box>
      <Box role="tabpanel" hidden={tabIndex !== 1}>
        {tabIndex === 1 && <AIModelsGeneralConfigTab />}
      </Box>
    </Box>
  );
};

