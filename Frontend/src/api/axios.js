import axios from 'axios';

const api = axios.create({
    baseURL: '/api', // Proxy is set in vite.config.js usually, or use full URL
    withCredentials: true,
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized access (e.g., clear matching user state)
            console.warn("Unauthorized access");
        }
        return Promise.reject(error);
    }
);

export default api;
