import axios from 'axios';

export const internshipApi = axios.create({
    baseURL: 'http://localhost:8080',
});

const imageServiceApi = axios.create({
    baseURL: 'http://localhost:8081',
});

//Auth
export const signUp = () => internshipApi.post('/auth/sign-up');
export const signIn = () => internshipApi.post('/auth/sign-in');

//Author API
export const findAllAuthor = () => internshipApi.get('/author');
export const addOneAuthor = () => internshipApi.post('/author');
export const replaceAuthor = (id) => internshipApi.put(`/author/${id}`);
export const deleteAuthor = (id) => internshipApi.delete(`/author/${id}`);

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
export const getAllImagesMetadata = () => imageServiceApi.get('/images');
export const getImage = (id) => imageServiceApi.get(`/images/${id}`, { responseType: 'blob' });
export const uploadImage = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return imageServiceApi.post('/images/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};
export const deleteImage = (id) => imageServiceApi.delete(`/images/${id}`);