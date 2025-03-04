import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    findAllBooks,
    getImageContentByFilename,
    getAllImageFilenames,
    findAllAuthorName,
    findAllShelfName,
    addOneBook
} from '../api';
import { decodeJWT } from '../api'; // Импортируем decodeJWT для проверки роли
import '../styles/BookPage.css';

const BookPage = () => {
    const navigate = useNavigate();
    const [books, setBooks] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [bookImages, setBookImages] = useState({}); // Кэш URL изображений
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newBook, setNewBook] = useState({
        name: '',
        genre: '',
        imageName: '',
        isRead: false,
        authorName: '',
        shelfName: '',
    });
    const [imageFilenames, setImageFilenames] = useState([]);
    const [authors, setAuthors] = useState([]);
    const [shelves, setShelves] = useState([]);
    const userRole = localStorage.getItem('userRole');
    const booksPerPage = 9; // 3 ряда по 3 книги

    useEffect(() => {
        fetchBooks();
        if (userRole === 'ROLE_ADMIN') {
            fetchDropdownData();
        }
    }, [userRole]);

    const fetchBooks = async () => {
        try {
            const response = await findAllBooks();
            console.log('Список книг с оригинальными данными:', response.data);
            setBooks(response.data);
            // Загружаем изображения только для новых книг
            loadImagesForBooks(response.data.filter(book => book.imageName && !bookImages[book.imageName]));
        } catch (error) {
            console.error('Ошибка загрузки книг:', error);
            if (error.response?.status === 401) {
                navigate('/');
            }
        }
    };

    const fetchDropdownData = async () => {
        try {
            const [imagesResponse, authorsResponse, shelvesResponse] = await Promise.all([
                getAllImageFilenames(),
                findAllAuthorName(),
                findAllShelfName(),
            ]);
            setImageFilenames(imagesResponse.data);
            setAuthors(authorsResponse.data); // Предполагаем, что findAllAuthorName возвращает массив строк (authorName)
            setShelves(shelvesResponse.data); // Предполагаем, что findAllShelfName возвращает массив строк (shelfName)
        } catch (error) {
            console.error('Ошибка загрузки данных для выпадающих списков:', error);
            if (error.response?.status === 401) {
                navigate('/');
            }
        }
    };

    // Оптимизированная загрузка изображений для списка книг
    const loadImagesForBooks = useCallback(async (bookList) => {
        if (bookList.length === 0) return;

        const imagePromises = bookList.map(async (book) => {
            const url = await loadImage(book.imageName);
            console.log(`Загружено изображение для ${book.imageName}:`, url);
            return { filename: book.imageName, url };
        });

        try {
            const loadedImages = await Promise.all(imagePromises);
            setBookImages((prev) => {
                const newImages = { ...prev };
                loadedImages.forEach(({ filename, url }) => {
                    if (url) newImages[filename] = url;
                });
                return newImages;
            });
        } catch (error) {
            console.error('Ошибка при загрузке изображений:', error);
            if (error.response?.status === 401) {
                navigate('/');
            }
        }
    }, []); // Убрал loadImage из зависимостей, так как он вызывается внутри

    // Оптимизированная загрузка изображения с использованием useCallback
    const loadImage = useCallback(async (filename) => {
        if (!filename || bookImages[filename]) {
            console.log(`Изображение для ${filename} уже кэшировано или отсутствует`);
            return bookImages[filename] || null;
        }

        console.log(`Запрос изображения для ${filename}`);
        try {
            const response = await getImageContentByFilename(filename);
            let arrayBufferOrBlob = response.data;

            // Проверяем, является ли response.data ArrayBuffer или Blob
            if (arrayBufferOrBlob instanceof ArrayBuffer) {
                console.log(`Данные для ${filename} — ArrayBuffer`);
            } else if (arrayBufferOrBlob instanceof Blob) {
                console.log(`Данные для ${filename} — Blob`);
                arrayBufferOrBlob = await arrayBufferOrBlob.arrayBuffer(); // Преобразуем Blob в ArrayBuffer
            } else {
                console.error(`Данные для ${filename} не являются ArrayBuffer или Blob:`, arrayBufferOrBlob);
                throw new Error('Некорректный формат данных изображения');
            }

            const blob = new Blob([arrayBufferOrBlob], { type: response.headers['content-type'] });
            const url = URL.createObjectURL(blob);
            return url;
        } catch (error) {
            console.error(`Ошибка загрузки изображения ${filename}:`, error);
            if (error.response?.status === 401) {
                navigate('/');
            }
            // Логируем статус и данные ошибки
            if (error.response) {
                console.error('Статус ошибки:', error.response.status);
                console.error('Данные ошибки:', error.response.data);
                console.error('Заголовки ответа:', error.response.headers);
            }
            return '/default-image.jpg'; // Заглушка при ошибке
        }
    }, [bookImages, getImageContentByFilename]); // Зависимости только от bookImages и getImageContentByFilename

    // Пагинация
    const indexOfLastBook = currentPage * booksPerPage;
    const indexOfFirstBook = indexOfLastBook - booksPerPage;
    const currentBooks = useMemo(() => books.slice(indexOfFirstBook, indexOfLastBook), [books, currentPage, indexOfFirstBook, indexOfLastBook]);
    const totalPages = useMemo(() => Math.ceil(books.length / booksPerPage), [books, booksPerPage]);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleBack = () => {
        navigate('/home');
    };

    const handleAddBookClick = () => {
        if (userRole === 'ROLE_ADMIN') {
            setIsAddModalOpen(true);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewBook(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSelectChange = (e) => {
        const { name, value } = e.target;
        setNewBook(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const isAddButtonDisabled = !newBook.name || !newBook.genre || !newBook.imageName || !newBook.authorName || !newBook.shelfName;

    const handleAddSubmit = async () => {
        try {
            // Формируем объект в строго указанном порядке
            const bookData = {
                name: newBook.name,
                genre: newBook.genre,
                imageName: newBook.imageName,
                isRead: newBook.isRead, // Используем 'read', как в данных
                authorName: newBook.authorName,
                shelfName: newBook.shelfName,
            };
            console.log('Отправляемые данные для новой книги (в указанном порядке):', bookData);

            // Проверка токена и роли перед отправкой
            const accessToken = localStorage.getItem('accessToken');
            if (!accessToken) {
                console.error('Access токен отсутствует');
                localStorage.clear();
                window.location.href = '/';
                throw new Error('Access токен отсутствует');
            }

            const decodedToken = decodeJWT(accessToken);
            console.log('Полная структура декодированного токена:', decodedToken);
            console.log('Текущий токен и роль:', { accessToken, role: decodedToken.role || 'Не определена' });

            if (!decodedToken.role || !decodedToken.role.includes('ROLE_ADMIN')) {
                throw new Error('Роль не соответствует ROLE_ADMIN');
            }

            // Логируем полный запрос перед отправкой
            console.log('Полный запрос перед отправкой:', {
                url: 'http://localhost:8080/book',
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                data: bookData,
            });

            const response = await addOneBook(bookData);
            console.log('Ответ сервера при добавлении книги:', response);

            setIsAddModalOpen(false);
            setNewBook({
                name: '',
                genre: '',
                imageName: '',
                isRead: false,
                authorName: '',
                shelfName: '',
            });
            fetchBooks(); // Обновляем список книг
        } catch (error) {
            console.error('Ошибка добавления книги:', error);
            if (error.response?.status === 403) {
                console.error('Доступ запрещён (403): Проверь роль и токен');
                console.error('Тело ответа сервера:', error.response.data || 'Нет данных');
                console.error('Заголовки ответа:', error.response.headers);
                console.error('Полный запрос:', error.config);
                alert('Доступ запрещён: У вас нет прав для добавления книги. Убедитесь, что вы вошли как администратор.');
            } else if (error.response?.status === 401) {
                console.error('Токен истёк (401)');
                alert('Сессия истекла. Пожалуйста, войдите заново.');
                navigate('/');
            } else {
                alert('Ошибка при добавлении книги: ' + (error.response?.data?.message || 'Попробуйте снова'));
            }
        }
    };

    const handleCancel = () => {
        setIsAddModalOpen(false);
        setNewBook({
            name: '',
            genre: '',
            imageName: '',
            isRead: false,
            authorName: '',
            shelfName: '',
        });
    };

    return (
        <div className="book-page">
            <header className="header">
                <div className="left-section">
                    {/* Пусто */}
                </div>
                <div className="right-section">
                    <button onClick={handleBack} className="header-button">
                        Назад
                    </button>
                    <button onClick={() => navigate('/')} className="header-button logout-button">
                        Выйти
                    </button>
                </div>
            </header>
            <main className="main-content">
                <h1>Библиотека</h1>
                {userRole === 'ROLE_ADMIN' && (
                    <div className="add-book-card" onClick={handleAddBookClick}>
                        <div className="add-plus">+</div>
                    </div>
                )}
                <div className="book-grid">
                    {currentBooks.map((book) => (
                        <div key={book.id || book.name} className="book-card">
                            {book.imageName && (
                                <img
                                    src={bookImages[book.imageName] || '/default-image.jpg'} // Используем кэшированный URL
                                    alt={book.name}
                                    className="book-image"
                                    onError={(e) => {
                                        console.error('Ошибка отображения изображения:', book.imageName);
                                        e.target.src = '/default-image.jpg'; // Устанавливаем заглушку при ошибке
                                        // Предотвращаем бесконечные запросы, устанавливая заглушку один раз
                                        if (e.target.src !== '/default-image.jpg') {
                                            e.target.src = '/default-image.jpg';
                                        }
                                    }}
                                    onLoad={() => console.log('Изображение загружено:', book.imageName)}
                                />
                            )}
                            <div className="book-details">
                                <h3 className="book-title">{book.name}</h3>
                                <p className="book-genre">{book.genre}</p>
                                <p className="book-author">{book.authorName}</p>
                                <p className="book-location">
                                    Шкаф: {book.bookcaseNumber}, Полка: {book.shelfName}
                                </p>
                                <div className={`book-status ${book.read ? 'occupied' : 'available'}`}>
                                    {book.read ? 'Книга занята' : 'Книга свободна'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {totalPages > 1 && (
                    <div className="pagination">
                        {Array.from({ length: totalPages }, (_, index) => (
                            <button
                                key={index + 1}
                                onClick={() => handlePageChange(index + 1)}
                                className={currentPage === index + 1 ? 'active-page' : 'page-button'}
                            >
                                {index + 1}
                            </button>
                        ))}
                    </div>
                )}
            </main>
            {isAddModalOpen && userRole === 'ROLE_ADMIN' && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Добавить книгу</h2>
                        <form onSubmit={(e) => { e.preventDefault(); handleAddSubmit() }}>
                            <input
                                type="text"
                                name="name"
                                placeholder="Название книги"
                                value={newBook.name}
                                onChange={handleInputChange}
                                required
                            />
                            <input
                                type="text"
                                name="genre"
                                placeholder="Жанр"
                                value={newBook.genre}
                                onChange={handleInputChange}
                                required
                            />
                            <select
                                name="imageName"
                                value={newBook.imageName}
                                onChange={handleSelectChange}
                                required
                            >
                                <option value="">Выберите изображение</option>
                                {imageFilenames.map((filename) => (
                                    <option key={filename} value={filename}>
                                        {filename}
                                    </option>
                                ))}
                            </select>
                            <select
                                name="authorName"
                                value={newBook.authorName}
                                onChange={handleSelectChange}
                                required
                            >
                                <option value="">Выберите автора</option>
                                {authors.map((authorName) => (
                                    <option key={authorName} value={authorName}>
                                        {authorName}
                                    </option>
                                ))}
                            </select>
                            <select
                                name="shelfName"
                                value={newBook.shelfName}
                                onChange={handleSelectChange}
                                required
                            >
                                <option value="">Выберите полку</option>
                                {shelves.map((shelfName) => (
                                    <option key={shelfName} value={shelfName}>
                                        {shelfName}
                                    </option>
                                ))}
                            </select>
                            <div className="read-checkbox">
                                <label>
                                    <input
                                        type="checkbox"
                                        name="read"
                                        checked={newBook.isRead}
                                        onChange={() => setNewBook(prev => ({ ...prev, isRead: !prev.isRead }))}
                                        disabled // Бокс неизменяемый, всегда false
                                    />
                                    Книга свободна (неизменяемо)
                                </label>
                            </div>
                            <div className="modal-buttons">
                                <button type="button" onClick={handleCancel} className="modal-button cancel">
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    className="modal-button add"
                                    disabled={!newBook.name || !newBook.genre || !newBook.imageName || !newBook.authorName || !newBook.shelfName}
                                >
                                    Добавить
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookPage;