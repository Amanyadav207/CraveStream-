import axios from 'axios';




const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized access by dispatching a custom event handle the logout
            window.dispatchEvent(new Event('auth:logout'));
            console.warn("Unauthorized access - dispatching logout event");
        }
        return Promise.reject(error);
    }
);

export default api;
