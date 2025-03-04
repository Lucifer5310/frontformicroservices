import axios from 'axios';

export const internshipApi = axios.create({
    baseURL: 'http://localhost:8080',
});

const imageServiceApi = axios.create({
    baseURL: 'http://localhost:8081',
});

// Функция для декодирования JWT
export const decodeJWT = (token) => {
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

// Функция для обновления токена
const refreshToken = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
        console.error('Refresh токен отсутствует');
        localStorage.clear();
        window.location.href = '/';
        throw new Error('Refresh токен отсутствует');
    }

    try {
        console.log('Отправка запроса на обновление токена...');
        const response = await axios.post('http://localhost:8080/auth/refresh', { refreshToken });
        const newAccessToken = response.data.accessToken;
        console.log('Получен новый токен:', newAccessToken);
        localStorage.setItem('accessToken', newAccessToken);
        return newAccessToken;
    } catch (refreshError) {
        console.error('Ошибка обновления токена:', refreshError);
        if (refreshError.response?.status === 401) {
            console.error('Refresh токен истёк или недействителен');
            localStorage.clear();
            window.location.href = '/';
        }
        throw refreshError;
    }
};

// Переменные для предотвращения гонки при обновлении токена
let isRefreshing = false;
let refreshSubscribers = [];

const onTokenRefreshed = (newAccessToken) => {
    refreshSubscribers.forEach((callback) => callback(newAccessToken));
    refreshSubscribers = [];
};

// Интерцептор для проверки и обновления токена перед каждым запросом (кроме логина/регистрации)
internshipApi.interceptors.request.use(
    async (config) => {
        // Пропускаем запросы на логин и регистрацию
        if (config.url === '/auth/sign-in' || config.url === '/auth/sign-up') {
            return config; // Не проверяем и не добавляем токен
        }

        let accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
            console.error('Access токен отсутствует');
            localStorage.clear();
            window.location.href = '/';
            throw new Error('Access токен отсутствует');
        }

        config.headers.Authorization = `Bearer ${accessToken}`;
        return config;
    },
    (error) => Promise.reject(error)
);

// Интерцептор для обработки 401 (на случай, если токен всё же истёк, кроме логина/регистрации)
internshipApi.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Пропускаем запросы на логин и регистрацию
        if (originalRequest.url === '/auth/sign-in' || originalRequest.url === '/auth/sign-up') {
            return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                console.log('Ожидание обновления токена...');
                return new Promise((resolve) => {
                    refreshSubscribers.push((newAccessToken) => {
                        console.log('Получен новый токен, повторяем запрос...');
                        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                        resolve(internshipApi(originalRequest));
                    });
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                console.log('Попытка обновить токен...');
                const newAccessToken = await refreshToken(); // Обновляем токен
                console.log('Новый токен:', newAccessToken); // Логируем новый токен
                onTokenRefreshed(newAccessToken);
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return internshipApi(originalRequest);
            } catch (refreshError) {
                console.error('Не удалось обновить токен:', refreshError);
                localStorage.clear();
                window.location.href = '/';
                throw refreshError;
            } finally {
                isRefreshing = false;
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
export const findAllAuthorName = () => internshipApi.get('/author/list');
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
export const findAllBooks = () => internshipApi.get('/book');
export const findOneBookById = (id) => internshipApi.get(`/book/${id}`);
export const addOneBook = (bookdata) => internshipApi.post('/book', bookdata);
export const replaceBook = (id) => internshipApi.put(`/book/${id}`);
export const deleteBook = (id) => internshipApi.delete(`/book/${id}`);

//ClientApi
export const findAllClient = () => internshipApi.get('/client');
export const findClientById = (id) => internshipApi.get(`/client/${id}`);
export const addOneClient = () => internshipApi.post('/client');
export const replaceClient = (id) => internshipApi.put(`/client/${id}`);
export const deleteClient = (id) => internshipApi.delete(`/client/${id}`);

//UserApi
export const findAllUsers = () => internshipApi.get('/users');
export const replaceUser = (id) => internshipApi.put(`/users/${id}`);
export const deleteUser = (id) => internshipApi.delete(`/users/${id}`);

//ShelfApi
export const findAllShelf = () => internshipApi.get('/shelf');
export const findAllShelfName = () => internshipApi.get('/shelf/list');
export const addOneShelf = () => internshipApi.post('/shelf');
export const replaceShelf = (id) => internshipApi.put(`/shelf/${id}`);
export const deleteShelf = (id) => internshipApi.delete(`/shelf/${id}`);

//ImageApi
export const getAllImages = () => internshipApi.get('/images/all');
export const getAllImageFilenames = () => internshipApi.get('/images/list');
export const getImageByFilename = (filename) => internshipApi.get(`/images/download/${filename}`, { responseType: 'blob' });
export const getImageContentByFilename = (filename) => internshipApi.get(`/images/${filename}`, { responseType: 'blob' });
export const uploadImage = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return internshipApi.post('/images/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};
export const deleteImageByFilename = (filename) => internshipApi.delete(`/images/delete/${filename}`);
