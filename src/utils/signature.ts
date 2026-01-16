import CryptoJS from 'crypto-js';

/**
 * API 签名工具类
 * 用于计算 HMAC-SHA256 签名，用于接口的签名验证
 */

// 从环境变量获取签名密钥，如果没有配置则使用默认值
const SIGNATURE_SECRET_KEY =
  import.meta.env.VITE_API_SIGNATURE_SECRET_KEY || 'hahachat-secret-api-key';

/**
 * 计算签名
 * @param method HTTP 方法（如 'POST', 'GET'）
 * @param path 请求路径（如 '/api/v1/upload'）
 * @param queryString 查询字符串（如 'page=1&size=10'，无查询参数则为空字符串）
 * @param body 请求体（字符串，空请求体使用空字符串）
 * @param timestamp Unix 时间戳（秒）
 * @param nonce 随机字符串
 * @param secretKey 共享密钥
 * @returns HMAC-SHA256 签名的十六进制字符串
 */
export function calculateSignature(
  method: string,
  path: string,
  queryString: string,
  body: string,
  timestamp: number,
  nonce: string,
  secretKey: string = SIGNATURE_SECRET_KEY
): string {
  // 计算请求体哈希
  const bodyHash = CryptoJS.SHA256(body || '').toString(CryptoJS.enc.Hex);

  // 构建待签名字符串
  // 格式: METHOD\nPATH\nQUERY_STRING\nBODY_HASH\nTIMESTAMP\nNONCE
  const stringToSign = [
    method,
    path,
    queryString || '',
    bodyHash,
    timestamp.toString(),
    nonce,
  ].join('\n');

  // 计算 HMAC-SHA256
  const signature = CryptoJS.HmacSHA256(stringToSign, secretKey).toString(
    CryptoJS.enc.Hex
  );

  return signature;
}

/**
 * 生成随机 nonce
 * @returns 32 位十六进制字符串
 */
export function generateNonce(): string {
  const random = Date.now().toString() + Math.random().toString();
  const hash = CryptoJS.SHA256(random).toString(CryptoJS.enc.Hex);
  return hash.substring(0, 32);
}

/**
 * 获取当前 Unix 时间戳（秒）
 * 注意：后端使用 time.Unix(timestampInt, 0) 解析，所以这里返回秒级时间戳
 */
export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

