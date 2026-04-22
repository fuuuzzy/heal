import {storage} from '../utils/storage';

// TODO: 替换为实际的公网 API 地址
const API_BASE = 'http://localhost:4000/api';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequestConfig {
    method?: HttpMethod;
    body?: unknown;
}

async function request<T>(path: string, config: RequestConfig = {}): Promise<T> {
    const {method = 'GET', body} = config;
    const token = await storage.getToken();

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `请求失败: ${response.status}`);
    }

    return response.json();
}

export const api = {
    get: <T>(path: string) => request<T>(path),
    post: <T>(path: string, body?: unknown) =>
        request<T>(path, {method: 'POST', body}),
    put: <T>(path: string, body?: unknown) =>
        request<T>(path, {method: 'PUT', body}),
    delete: <T>(path: string) =>
        request<T>(path, {method: 'DELETE'}),
};
