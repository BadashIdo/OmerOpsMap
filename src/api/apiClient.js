import axios from 'axios';
import { appParams } from '@/lib/app-params';

const { serverUrl, token } = appParams;

const apiClient = axios.create({
  baseURL: serverUrl,
  headers: {
    'Content-Type': 'application/json',
  }
});

// If a token exists, add it to the Authorization header for all requests
if (token) {
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export default apiClient;
