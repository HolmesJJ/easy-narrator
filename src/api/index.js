export const baseUrl = 'http://47.84.73.57:5070'
// const baseUrl = 'http://localhost:8099';
const baseUrlHead = '/web';

/**
 * 通用请求方法
 * @param {string} url 请求地址
 * @param {object} options fetch 配置项，如 method、headers、body 等
 * @returns {Promise<any>} 返回解析后的数据
 */
export async function request(url, options = {}) {
  const defaultHeaders = {
    'Content-Type': 'application/json',
    // 可根据需要添加其他默认头部
  };

  const fetchOptions = {
    headers: { ...defaultHeaders, ...(options.headers || {}) },
    ...options,
  };

  // 如果是 POST/PUT 等，自动序列化 body
  if (
    fetchOptions.body &&
    typeof fetchOptions.body === 'object' &&
    fetchOptions.headers['Content-Type'] === 'application/json'
  ) {
    fetchOptions.body = JSON.stringify(fetchOptions.body);
  }

  try {
    const response = await fetch(baseUrlHead + url, fetchOptions);

    // 检查响应状态
    if (!response.ok) {
      const errorText = await response.text();
      // 根据状态码抛出不同的错误
      if (response.status === 400) {
        throw new Error(`请求参数错误: ${response.status} ${errorText}`);
      } else if (response.status === 401) {
        throw new Error(`未授权: ${response.status} ${errorText}`);
      } else if (response.status === 403) {
        throw new Error(`禁止访问: ${response.status} ${errorText}`);
      } else if (response.status === 404) {
        throw new Error(`未找到资源: ${response.status} ${errorText}`);
      } else if (response.status >= 500) {
        throw new Error(`服务器错误: ${response.status} ${errorText}`);
      } else {
        throw new Error(`请求失败: ${response.status} ${errorText}`);
      }
    }

    // 尝试解析为 JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    // 其他类型直接返回文本
    return await response.text();
  } catch (error) {
    // 可根据需要统一处理错误
    throw error;
  }
}

/**
 * 文件上传方法
 * @param {string} url 上传接口地址
 * @param {File} file 要上传的文件对象
 * @param {object} [extraData] 额外的表单字段
 * @returns {Promise<any>} 返回解析后的数据
 */
export async function uploadFile(url, file, extraData = {}) {
  const formData = new FormData();
  formData.append('file', file);
  // 添加额外字段
  Object.entries(extraData).forEach(([key, value]) => {
    formData.append(key, value);
  });

  try {
    const response = await fetch(baseUrlHead + url, {
      method: 'POST',
      body: formData,
      // 注意：不要设置 Content-Type，浏览器会自动处理
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`文件上传失败: ${response.status} ${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return await response.text();
  } catch (error) {
    throw error;
  }
}

export async function requestSSE(url, options, onMessage) {
  const response = await fetch(baseUrlHead + url, {
    method: 'POST',
    headers: {
      'Accept': 'text/event-stream',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ...options }),
  });
  // console.log(response.json());

  if (!response.body) {
    throw new Error('流式响应不可用');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // 按行分割处理SSE消息
    let lines = buffer.split('\n');
    buffer = lines.pop(); // 剩余部分留给下次

    for (const line of lines) {
      if (line.startsWith('data:')) {
        const data = line.replace(/^data:\s*/, '');
        if (onMessage) onMessage(data);
      }
    }
  }
}
