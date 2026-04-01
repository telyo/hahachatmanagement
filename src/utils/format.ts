import { format, formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export const formatUtils = {
  date: (date: string | Date, pattern: string = 'yyyy-MM-dd HH:mm:ss'): string => {
    if (!date) return '-';
    return format(new Date(date), pattern, { locale: zhCN });
  },

  dateInTimeZone: (
    date: string | Date,
    timeZone: string = 'Asia/Shanghai',
    locale: string = 'zh-CN'
  ): string => {
    if (!date) return '-';
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '-';

    const parts = new Intl.DateTimeFormat(locale, {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(d);

    const map: Record<string, string> = {};
    for (const p of parts) {
      if (p.type !== 'literal') map[p.type] = p.value;
    }
    return `${map.year}-${map.month}-${map.day} ${map.hour}:${map.minute}:${map.second}`;
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

