import { format, formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export const formatUtils = {
  date: (date: string | Date, pattern: string = 'yyyy-MM-dd HH:mm:ss'): string => {
    if (!date) return '-';
    return format(new Date(date), pattern, { locale: zhCN });
  },

  relativeTime: (date: string | Date): string => {
    if (!date) return '-';
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: zhCN });
  },

  currency: (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency,
    }).format(amount);
  },

  number: (num: number): string => {
    return new Intl.NumberFormat('zh-CN').format(num);
  },

  status: (status: string | null | undefined): string => {
    if (!status) return '-';
    const statusMap: Record<string, string> = {
      active: '活跃',
      inactive: '未激活',
      suspended: '已暂停',
      pending: '待处理',
      paid: '已支付',
      failed: '失败',
      refunded: '已退款',
      partially_refunded: '部分退款',
      processing: '处理中',
      resolved: '已解决',
      closed: '已关闭',
    };
    return statusMap[status] || String(status);
  },
};

