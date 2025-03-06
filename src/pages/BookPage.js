import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    findAllBooks,
    getImageContentByFilename,
    getAllImageFilenames,
    findAllAuthorName,
    findAllShelfName,
    addOneBook,
    getBookById,
    updateBook,
    deleteBookById
} from '../api';
import { decodeJWT } from '../api'; // Импортируем decodeJWT для проверки роли
import '../styles/BookPage.css';

const BookPage = () => {
    const navigate = useNavigate();
    const [books, setBooks] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [bookImages, setBookImages] = useState({}); // Кэш URL изображений
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false); // Состояние для модального окна редактирования
    const [newBook, setNewBook] = useState({
        name: '',
        genre: '',
        imageName: '',
        isRead: false, // Всегда false для добавления
        authorName: '',
        shelfName: '',
        // Убрали clientId для добавления
    });
    const [editBook, setEditBook] = useState({
        id: null,
        name: '',
        genre: '',
        imageName: '',
        isRead: false,
        authorName: '',
        shelfName: '',
        clientId: null, // Сохраняем clientId для редактирования как число или null
    });
    const [imageFilenames, setImageFilenames] = useState([]);
    const [authors, setAuthors] = useState([]);
    const [shelves, setShelves] = useState([]);
    const [isLoading, setIsLoading] = useState(false); // Состояние для отслеживания загрузки данных
    const [error, setError] = useState(null); // Состояние для ошибок
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
            console.log('Список книг с оригинальными данными (после обновления, с clientId):', response.data);
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

    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        setEditBook(prev => ({
            ...prev,
            [name]: value,
        }));
        // Автоматически обновляем isRead на основе clientId для editBook
        if (name === 'clientId') {
            setEditBook(prev => ({
                ...prev,
                isRead: value !== 'null' && value !== '' // Если clientId не "null" и не пустое, то isRead = true
            }));
        }
    };

    const handleSelectChange = (e) => {
        const { name, value } = e.target;
        // Обновляем newBook: для isRead преобразуем в boolean, для остальных полей используем значение как есть
        setNewBook(prev => ({
            ...prev,
            [name]: name === 'isRead' ? value === 'true' : value,
        }));
        // Обновляем editBook: для isRead преобразуем в boolean, для остальных полей используем значение как есть
        setEditBook(prev => ({
            ...prev,
            [name]: name === 'isRead' ? value === 'true' : value,
        }));
    };

    const isAddButtonDisabled = !newBook.name || !newBook.genre || !newBook.imageName || !newBook.authorName || !newBook.shelfName;
    const isEditButtonDisabled = !editBook.name || !editBook.genre || !editBook.imageName || !editBook.authorName || !editBook.shelfName;

    const handleAddSubmit = async () => {
        try {
            const bookData = {
                name: newBook.name,
                genre: newBook.genre,
                imageName: newBook.imageName,
                isRead: false, // Всегда false для добавления
                authorName: newBook.authorName,
                shelfName: newBook.shelfName,
                // Убрали clientId для добавления
            };
            console.log('Отправляемые данные для новой книги:', bookData);

            const accessToken = localStorage.getItem('accessToken');
            if (!accessToken) {
                console.error('Access токен отсутствует');
                localStorage.clear();
                window.location.href = '/';
                throw new Error('Access токен отсутствует');
            }

            const decodedToken = decodeJWT(accessToken);
            console.log('Текущий токен и роль:', { accessToken, role: decodedToken.role || 'Не определена' });

            if (!decodedToken.role || !decodedToken.role.includes('ROLE_ADMIN')) {
                throw new Error('Роль не соответствует ROLE_ADMIN');
            }

            const response = await addOneBook(bookData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`, // Убедимся, что токен передаётся
                },
            });
            console.log('Ответ сервера при добавлении книги:', response);

            setIsAddModalOpen(false);
            setNewBook({
                name: '',
                genre: '',
                imageName: '',
                isRead: false, // Сбрасываем в false
                authorName: '',
                shelfName: '',
                // Убрали clientId
            });
            await fetchBooks(); // Ждём завершения обновления списка книг
        } catch (error) {
            console.error('Ошибка добавления книги:', error);
            if (error.response?.status === 403) {
                const errorMessage = error.response?.data?.message || 'Доступ запрещён: У вас нет прав для добавления книги. Проверьте роль или токен.';
                console.error('Ошибка 403:', error.response.data);
                alert(errorMessage);
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
            isRead: false, // Сбрасываем в false
            authorName: '',
            shelfName: '',
            // Убрали clientId
        });
    };

    // Функции для редактирования и удаления
    const handleEditBook = (bookId) => {
        if (userRole !== 'ROLE_ADMIN') return;

        // Открываем модальное окно сразу, устанавливая только id
        setEditBook({ id: bookId, name: '', genre: '', imageName: '', isRead: false, authorName: '', shelfName: '', clientId: null });
        setIsEditModalOpen(true);
        // Выполняем запрос на получение данных после открытия модального окна
        fetchBookData(bookId);
    };

    const fetchBookData = async (bookId) => {
        setIsLoading(true); // Начинаем загрузку
        setError(null); // Сбрасываем предыдущие ошибки
        try {
            const response = await getBookById(bookId);
            console.log('Данные книги для редактирования (с ID и clientId):', response.data);
            const book = response.data;
            // Убедимся, что все поля определены, устанавливаем значения по умолчанию
            setEditBook({
                id: book.id || bookId, // Гарантируем, что id всегда есть, даже если сервер не вернул его
                name: book.name || '',
                genre: book.genre || '',
                imageName: book.imageName || '',
                isRead: book.isRead || false, // Устанавливаем false, если isRead undefined
                authorName: book.authorName || '',
                shelfName: book.shelfName || '',
                clientId: book.clientId !== undefined && book.clientId !== null ? book.clientId.toString() : 'null', // Отображаем как "null", если clientId === null
            });
        } catch (error) {
            console.error('Ошибка загрузки данных книги:', error);
            setError('Не удалось загрузить данные книги. Проверьте подключение или права доступа.');
            if (error.response?.status === 401) {
                navigate('/');
            }
        } finally {
            setIsLoading(false); // Завершаем загрузку
        }
    };

    const handleSaveEdit = async () => {
        console.log('Попытка сохранить книгу. Текущие данные:', editBook); // Отладка
        if (userRole !== 'ROLE_ADMIN' || !editBook.id) {
            console.error('Не удалось сохранить: userRole или editBook.id отсутствует', { userRole, editBookId: editBook.id });
            alert('Не удалось сохранить книгу: ID книги отсутствует или пользователь не администратор.');
            return;
        }

        try {
            const bookData = {
                name: editBook.name,
                genre: editBook.genre,
                imageName: editBook.imageName,
                read: editBook.clientId !== 'null' && editBook.clientId !== '' && editBook.clientId !== null, // Используем read вместо isRead
                authorName: editBook.authorName,
                shelfName: editBook.shelfName,
                clientId: editBook.clientId === 'null' || editBook.clientId === '' ? null : Number(editBook.clientId), // Преобразуем в Long или null
            };
            console.log('Данные для обновления книги (с преобразованным clientId и read):', bookData);

            const accessToken = localStorage.getItem('accessToken');
            if (!accessToken) {
                console.error('Access токен отсутствует');
                localStorage.clear();
                window.location.href = '/';
                throw new Error('Access токен отсутствует');
            }

            const decodedToken = decodeJWT(accessToken);
            console.log('Текущий токен и роль:', { accessToken, role: decodedToken.role || 'Не определена' });

            if (!decodedToken.role || !decodedToken.role.includes('ROLE_ADMIN')) {
                throw new Error('Роль не соответствует ROLE_ADMIN');
            }

            // Явно используем editBook.id для PUT-запроса на /book/{id}
            await updateBook(editBook.id, bookData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`, // Убедимся, что токен передаётся
                },
            });
            console.log(`PUT-запрос отправлен на /book/${editBook.id}`);
            console.log('Книга обновлена');
            setIsEditModalOpen(false);
            setEditBook({
                id: null,
                name: '',
                genre: '',
                imageName: '',
                isRead: false,
                authorName: '',
                shelfName: '',
                clientId: null, // Сбрасываем clientId
            });
            await fetchBooks(); // Ждём завершения обновления списка книг
        } catch (error) {
            console.error('Ошибка обновления книги:', error);
            if (error.response?.status === 403) {
                const errorMessage = error.response?.data?.message || 'Доступ запрещён: У вас нет прав для обновления книги. Проверьте роль или токен.';
                console.error('Ошибка 403:', error.response.data);
                alert(errorMessage);
            } else if (error.response?.status === 401) {
                navigate('/');
                alert('Сессия истекла. Пожалуйста, войдите заново.');
            } else {
                alert('Ошибка при обновления книги: ' + (error.response?.data?.message || 'Попробуйте снова'));
            }
        }
    };

    const handleCancelEdit = () => {
        setIsEditModalOpen(false);
        setEditBook({
            id: null,
            name: '',
            genre: '',
            imageName: '',
            isRead: false,
            authorName: '',
            shelfName: '',
            clientId: null, // Сбрасываем clientId
        });
        setError(null); // Сбрасываем ошибки при закрытии
    };

    const handleDeleteBook = async (bookId) => {
        if (userRole !== 'ROLE_ADMIN') return;

        try {
            const accessToken = localStorage.getItem('accessToken');
            if (!accessToken) {
                console.error('Access токен отсутствует');
                localStorage.clear();
                window.location.href = '/';
                throw new Error('Access токен отсутствует');
            }

            const decodedToken = decodeJWT(accessToken);
            if (!decodedToken.role || !decodedToken.role.includes('ROLE_ADMIN')) {
                throw new Error('Роль не соответствует ROLE_ADMIN');
            }

            await deleteBookById(bookId, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`, // Убедимся, что токен передаётся
                },
            });
            console.log('Книга удалена:', bookId);
            await fetchBooks(); // Ждём завершения обновления списка книг
        } catch (error) {
            console.error('Ошибка удаления книги:', error);
            if (error.response?.status === 403) {
                const errorMessage = error.response?.data?.message || 'Доступ запрещён: У вас нет прав для удаления книги. Проверьте роль или токен.';
                console.error('Ошибка 403:', error.response.data);
                alert(errorMessage);
            } else if (error.response?.status === 401) {
                navigate('/');
                alert('Сессия истекла. Пожалуйста, войдите заново.');
            } else {
                alert('Ошибка при удалении книги: ' + (error.response?.data?.message || 'Попробуйте снова'));
            }
        }
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
                                    src={bookImages[book.imageName] || '/default-image.jpg'}
                                    alt={book.name}
                                    className="book-image"
                                    onError={(e) => (e.target.src = '/default-image.jpg')}
                                />
                            )}
                            <div className="book-details">
                                <h3 className="book-title">{book.name}</h3>
                                <p className="book-genre">{book.genre}</p>
                                <p className="book-author">{book.authorName}</p>
                                <p className="book-location">
                                    Шкаф: {book.bookcaseNumber}, Полка: {book.shelfName}
                                </p>
                                <div className={`book-status ${book.read !== false ? 'occupied' : 'available'}`}>
                                    {book.read !== false ? 'Книга занята' : 'Книга свободна'}
                                </div>
                            </div>
                            {userRole === 'ROLE_ADMIN' && (
                                <div className="book-actions">
                                    <button onClick={() => handleEditBook(book.id)} className="edit-button">
                                        Изменить
                                    </button>
                                    <button onClick={() => handleDeleteBook(book.id)} className="delete-button1">
                                        Удалить
                                    </button>
                                </div>
                            )}
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
                        <form onSubmit={(e) => { e.preventDefault(); handleAddSubmit(); }}>
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
                            {/* Убрали clientId */}
                            {/* isRead всегда false и заблокировано */}
                            <select
                                name="isRead"
                                value="false" // Всегда false для добавления
                                onChange={handleSelectChange}
                                required
                                disabled // Блокируем возможность изменения
                            >
                                <option value="false">Нет (свободна)</option>
                            </select>
                            <div className="modal-buttons">
                                <button type="button" onClick={handleCancel} className="modal-button cancel">
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    className="modal-button add"
                                    disabled={isAddButtonDisabled}
                                >
                                    Добавить
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {isEditModalOpen && userRole === 'ROLE_ADMIN' && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Редактировать книгу</h2>
                        {isLoading && <p>Загрузка данных книги...</p>}
                        {error && <p className="error-message">{error}</p>}
                        <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }}>
                            <input
                                type="text"
                                name="name"
                                placeholder="Название книги"
                                value={editBook.name || ''} // Устанавливаем пустую строку, если undefined
                                onChange={handleEditInputChange}
                                required
                                disabled={isLoading}
                            />
                            <input
                                type="text"
                                name="genre"
                                placeholder="Жанр"
                                value={editBook.genre || ''} // Устанавливаем пустую строку, если undefined
                                onChange={handleEditInputChange}
                                required
                                disabled={isLoading}
                            />
                            <select
                                name="imageName"
                                value={editBook.imageName || ''} // Устанавливаем пустую строку, если undefined
                                onChange={handleEditInputChange}
                                required
                                disabled={isLoading}
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
                                value={editBook.authorName || ''} // Устанавливаем пустую строку, если undefined
                                onChange={handleEditInputChange}
                                required
                                disabled={isLoading}
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
                                value={editBook.shelfName || ''} // Устанавливаем пустую строку, если undefined
                                onChange={handleEditInputChange}
                                required
                                disabled={isLoading}
                            >
                                <option value="">Выберите полку</option>
                                {shelves.map((shelfName) => (
                                    <option key={shelfName} value={shelfName}>
                                        {shelfName}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="text"
                                name="clientId"
                                placeholder="ID Клиента"
                                value={editBook.clientId} // Отображаем "null" или значение clientId
                                onChange={handleEditInputChange}
                                //required
                                disabled={isLoading}
                            />
                            <select
                                name="isRead"
                                value={editBook.isRead.toString()} // Преобразуем boolean в строку для select
                                onChange={handleSelectChange}
                                required
                                disabled // Блокируем возможность изменения isRead
                            >
                                <option value="true">Да (занята)</option>
                                <option value="false">Нет (свободна)</option>
                            </select>
                            <div className="modal-buttons">
                                <button type="button" onClick={handleCancelEdit} className="modal-button cancel" disabled={isLoading}>
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    className="modal-button save"
                                    disabled={isEditButtonDisabled || isLoading}
                                >
                                    Сохранить
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