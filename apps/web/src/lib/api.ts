/**
 * Frontend API Client
 * fetch wrapper for JSON APIs with authorization header injection.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code?: string;
        message: string;
    };
}

export async function api<T>(
    path: string,
    options?: RequestInit,
    token?: string
): Promise<ApiResponse<T>> {
    const { headers: initialHeaders, ...restOptions } = options || {};

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(initialHeaders as Record<string, string>),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_URL}${path}`, {
            headers,
            ...restOptions,
        });

        if (response.status === 204) {
            return { success: true };
        }

        const json = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: {
                    code: json.code || response.status.toString(),
                    message: json.message || json.detail || 'An error occurred',
                },
            };
        }

        return {
            success: true,
            data: json as T,
        };
    } catch (error) {
        console.error('API Error:', error);
        return {
            success: false,
            error: {
                message: error instanceof Error ? error.message : 'Network error',
            },
        };
    }
}

/**
 * Utility to stringify query parameters
 */
export function buildQueryString(params?: Record<string, string | number | boolean | undefined>): string {
    if (!params) return '';

    const filteredParams = Object.entries(params)
        .filter(([_, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => [key, String(value)]);

    if (filteredParams.length === 0) return '';

    const searchParams = new URLSearchParams(filteredParams);
    return `?${searchParams.toString()}`;
}

/**
 * Upload File helper
 * Uses standard fetch, but does NOT set Content-Type so browser sets boundary strings for FormData
 */
export async function uploadFile<T>(
    path: string,
    file: File,
    token?: string
): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_URL}${path}`, {
            method: 'POST',
            headers,
            body: formData,
        });

        if (response.status === 204) return { success: true };

        const json = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: {
                    code: json.code || response.status.toString(),
                    message: json.message || json.detail || 'An error occurred during upload',
                },
            };
        }

        return { success: true, data: json as T };
    } catch (error) {
        console.error('File Upload Error:', error);
        return {
            success: false,
            error: { message: error instanceof Error ? error.message : 'Network error during upload' },
        };
    }
}
