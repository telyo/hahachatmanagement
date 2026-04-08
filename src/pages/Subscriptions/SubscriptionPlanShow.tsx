import {
  Show,
  SimpleShowLayout,
  TextField,
  NumberField,
  DateField,
  ArrayField,
  SingleFieldList,
  BooleanField,
  FunctionField,
} from 'react-admin';
import { formatUtils } from '../../utils/format';
import { Box, Typography, Paper, Grid, Chip } from '@mui/material';

export const SubscriptionPlanShow = () => {
  return (
    <Show>
      <SimpleShowLayout>
        {/* 基础信息 */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>基础信息</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField source="planId" label="套餐ID" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField source="name" label="套餐名称" />
            </Grid>
            <Grid item xs={12} md={4}>
              <NumberField source="duration" label="有效期（天）" />
            </Grid>
            <Grid item xs={12} md={4}>
              <FunctionField
                label="计费周期"
                render={(record: any) => {
                  const cycleMap: Record<string, string> = {
                    monthly: '连续包月',
                    annual: '连续包年',
                    onetime: '单次购买',
                  };
                  return cycleMap[record.billingCycle] || record.billingCycle;
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <BooleanField source="isPopular" label="最受欢迎" />
            </Grid>
            <Grid item xs={12} md={4}>
              <NumberField source="sortOrder" label="排序" />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField source="status" label="状态" format={(status) => formatUtils.status(status)} />
            </Grid>
          </Grid>
        </Paper>

        {/* 价格配置 */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>价格配置</Typography>
          <ArrayField source="pricing" label="价格项">
            <SingleFieldList>
              <FunctionField
                render={(pricingItem: any) => {
                  return (
                    <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {pricingItem.type || '未命名'}
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                          <Typography variant="body2" color="text.secondary">价格</Typography>
                          <Typography variant="body1">{pricingItem.displayPrice || `$${pricingItem.price} ${pricingItem.currency || 'USD'}`}</Typography>
                        </Grid>
                        {pricingItem.originalPrice && (
                          <Grid item xs={12} md={4}>
                            <Typography variant="body2" color="text.secondary">原价</Typography>
                            <Typography variant="body1">${pricingItem.originalPrice}</Typography>
                          </Grid>
                        )}
                        {pricingItem.savedAmount > 0 && (
                          <Grid item xs={12} md={4}>
                            <Typography variant="body2" color="text.secondary">节省金额</Typography>
                            <Typography variant="body1" color="success.main">${pricingItem.savedAmount} {pricingItem.savedLabel || ''}</Typography>
                          </Grid>
                        )}
                        <Grid item xs={12} md={4}>
                          <Typography variant="body2" color="text.secondary">自动续费</Typography>
                          <Typography variant="body1">{pricingItem.autoRenew ? '是' : '否'}</Typography>
                        </Grid>
                        {pricingItem.iosProductId && (
                          <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">iOS 商品ID</Typography>
                            <Typography variant="body1">{pricingItem.iosProductId}</Typography>
                          </Grid>
                        )}
                        {pricingItem.renewLabel && (
                          <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">续费说明</Typography>
                            <Typography variant="body1">{pricingItem.renewLabel}</Typography>
                          </Grid>
                        )}
                        {pricingItem.icon && (
                          <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">图标</Typography>
                            <Box sx={{ mt: 1 }}>
                              <img src={pricingItem.icon} alt="图标" style={{ maxWidth: '100px', maxHeight: '100px', objectFit: 'contain' }} />
                            </Box>
                          </Grid>
                        )}
                        {pricingItem.benefits && (
                          <Grid item xs={12}>
                            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>权益配置</Typography>
                            <Grid container spacing={2}>
                              <Grid item xs={12} md={4}>
                                <Typography variant="body2" color="text.secondary">每月积分</Typography>
                                <Typography variant="body1">{pricingItem.benefits.monthlyCredits?.toLocaleString() || '-'}</Typography>
                              </Grid>
                              {pricingItem.benefits.creditsLabel && (
                                <Grid item xs={12} md={4}>
                                  <Typography variant="body2" color="text.secondary">积分标签</Typography>
                                  <Typography variant="body1">{pricingItem.benefits.creditsLabel}</Typography>
                                </Grid>
                              )}
                              {pricingItem.benefits.creditsDescription && (
                                <Grid item xs={12}>
                                  <Typography variant="body2" color="text.secondary">积分说明</Typography>
                                  <Typography variant="body1">{pricingItem.benefits.creditsDescription}</Typography>
                                </Grid>
                              )}
                            </Grid>
                          </Grid>
                        )}
                        {pricingItem.advantages && pricingItem.advantages.length > 0 && (
                          <Grid item xs={12}>
                            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>优势列表</Typography>
                            {pricingItem.advantages.map((advantage: any, idx: number) => (
                              <Box key={idx} sx={{ mb: 1 }}>
                                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{advantage.title}</Typography>
                                {advantage.description && (
                                  <Typography variant="body2" color="text.secondary">{advantage.description}</Typography>
                                )}
                              </Box>
                            ))}
                          </Grid>
                        )}
                        {pricingItem.supportedModels && pricingItem.supportedModels.length > 0 && (
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>支持的模型</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                              {pricingItem.supportedModels.map((model: string, idx: number) => (
                                <Chip key={idx} label={model} size="small" variant="outlined" />
                              ))}
                            </Box>
                          </Grid>
                        )}
                        {pricingItem.exclusiveModels && pricingItem.exclusiveModels.length > 0 && (
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>独享模型</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                              {pricingItem.exclusiveModels.map((model: string, idx: number) => (
                                <Chip key={idx} label={model} size="small" color="primary" variant="outlined" />
                              ))}
                            </Box>
                          </Grid>
                        )}
                      </Grid>
                    </Paper>
                  );
                }}
              />
            </SingleFieldList>
          </ArrayField>
        </Paper>

        <DateField source="createdAt" label="创建时间" showTime />
        <DateField source="updatedAt" label="更新时间" showTime />
      </SimpleShowLayout>
    </Show>
  );
};
