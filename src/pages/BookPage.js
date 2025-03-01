import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { findAllBooks, getImageContentByFilename } from '../api';
import '../styles/BookPage.css';

const BookPage = () => {
    const navigate = useNavigate();
    const [books, setBooks] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [bookImages, setBookImages] = useState({}); // Кэш URL изображений
    const booksPerPage = 9; // 3 ряда по 3 книги

    useEffect(() => {
        fetchBooks();
    }, []);

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
        </div>
    );
};

export default BookPage;