import axios from 'axios';

export const internshipApi = axios.create({
    baseURL: 'http://localhost:8080',
});

const imageServiceApi = axios.create({
    baseURL: 'http://localhost:8081',
});

// Функция для декодирования JWT (взята из AuthPage, можно вынести в утилиты)
const decodeJWT = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Ошибка декодирования JWT:', error);
        return {};
    }
};

// Интерцептор для проверки и обновления токена перед запросом
internshipApi.interceptors.request.use(
    async (config) => {
        let accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
            const decodedToken = decodeJWT(accessToken);
            const expTime = decodedToken.exp * 1000; // В миллисекундах (JWT exp в секундах)
            const currentTime = Date.now();
            const timeLeft = expTime - currentTime;
            const bufferTime = 5 * 60 * 1000; // 5 минут в миллисекундах

            // Если токен истекает через менее чем 5 минут
            if (timeLeft < bufferTime) {
                const refreshToken = localStorage.getItem('refreshToken');
                try {
                    const response = await axios.post(
                        'http://localhost:8080/auth/refresh',
                        { refreshToken }
                    ); // Используем axios напрямую, чтобы избежать рекурсии
                    accessToken = response.data.accessToken;
                    localStorage.setItem('accessToken', accessToken);
                    console.log('Токен обновлён проактивно');
                } catch (refreshError) {
                    console.error('Ошибка обновления токена:', refreshError);
                    localStorage.clear();
                    window.location.href = '/';
                    return Promise.reject(refreshError);
                }
            }
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Интерцептор для обработки 401 (на случай, если токен всё же истёк)
internshipApi.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem('refreshToken');
            try {
                const response = await axios.post(
                    'http://localhost:8080/auth/refresh',
                    { refreshToken }
                );
                const newAccessToken = response.data.accessToken;
                localStorage.setItem('accessToken', newAccessToken);
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return internshipApi(originalRequest);
            } catch (refreshError) {
                console.error('Ошибка обновления токена:', refreshError);
                localStorage.clear();
                window.location.href = '/';
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

//Auth
export const signUp = () => internshipApi.post('/auth/sign-up');
export const signIn = () => internshipApi.post('/auth/sign-in');

//Author API
export const findAllAuthor = () => internshipApi.get('/author');
export const getAuthorById = (id) => internshipApi.get(`/author/${id}`);
export const addOneAuthor = (authorData) => internshipApi.post('/author', authorData);
export const updateAuthor = (id, authorData) => internshipApi.put(`/author/${id}`, authorData);
export const deleteAuthorById = (id) => internshipApi.delete(`/author/${id}`);

//BookcaseApi
export const findAllBookcase = () => internshipApi.get('/bookcase');
export const addOneBookcase = () => internshipApi.post('/bookcase');
export const replaceBookcase = (id) => internshipApi.put(`/bookcase/${id}`);
export const deleteBookcase = (id) => internshipApi.delete(`/bookcase/${id}`);

//BookApi
export const findAllBook = () => internshipApi.get('/book');
export const addOneBook = () => internshipApi.post('/book');
export const replaceBook = (id) => internshipApi.put(`/book/${id}`);
export const deleteBook = (id) => internshipApi.delete(`/book/${id}`);

//ClientApi
export const findAllClient = () => internshipApi.get('/client');
export const addOneClient = () => internshipApi.post('/client');
export const findClientById = (id) => internshipApi.get(`/client/${id}`);
export const replaceClient = (id) => internshipApi.put(`/client/${id}`);
export const deleteClient = (id) => internshipApi.delete(`/client/${id}`);

//UserApi
export const findAllUsers = () => internshipApi.get('/users');
export const replaceUser = (id) => internshipApi.put(`/users/${id}`);
export const deleteUser = (id) => internshipApi.delete(`/users/${id}`);

//ShelfApi
export const findAllShelf = () => internshipApi.get('/shelf');
export const addOneShelf = () => internshipApi.post('/shelf');
export const replaceShelf = (id) => internshipApi.put(`/shelf/${id}`);
export const deleteShelf = (id) => internshipApi.delete(`/shelf/${id}`);

//ImageApi
export const getAllImages = () => internshipApi.get('/images/all');
export const getAllImagesMetadata = () => internshipApi.get('/images/metadata');
export const getImageByFilename = (filename) => internshipApi.get(`/images/download/${filename}`, { responseType: 'blob' });
export const uploadImage = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return internshipApi.post('/images/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};
export const deleteImageByFilename = (filename) => internshipApi.delete(`/images/delete/${filename}`);