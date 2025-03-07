import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { findAllBookcases, addOneBookcase, deleteBookcase, getBookcaseById, updateBookcase } from '../api';
import '../styles/BookcasePage.css';

const BookcasePage = () => {
    const navigate = useNavigate();
    const [bookcases, setBookcases] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const userRole = localStorage.getItem('userRole');
    const bookcasesPerPage = 9; // 3 ряда по 3 колонки
    const [currentPage, setCurrentPage] = useState(1);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [newBookcaseNumber, setNewBookcaseNumber] = useState('');
    const [editBookcase, setEditBookcase] = useState({
        id: null,
        number: '',
        originalNumber: '',
    });
    const [modalError, setModalError] = useState(null);

    useEffect(() => {
        fetchBookcases();
    }, []);

    const fetchBookcases = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await findAllBookcases();
            console.log('Список шкафов с сервера:', response.data);
            setBookcases(response.data.map(bookcase => ({
                ...bookcase,
                id: bookcase.id || bookcase.number // Сохраняем id (если есть, иначе number как запасной вариант)
            })));
        } catch (error) {
            console.error('Ошибка загрузки шкафов:', error);
            setError('Не удалось загрузить данные шкафов. Проверьте подключение или права доступа.');
            if (error.response?.status === 401) {
                navigate('/');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Пагинация
    const indexOfLastBookcase = currentPage * bookcasesPerPage;
    const indexOfFirstBookcase = indexOfLastBookcase - bookcasesPerPage;
    const currentBookcases = useMemo(() => {
        return bookcases.slice(indexOfFirstBookcase, indexOfLastBookcase).sort((a, b) => a.number - b.number);
    }, [bookcases, currentPage, indexOfFirstBookcase, indexOfLastBookcase]);
    const totalPages = useMemo(() => Math.ceil(bookcases.length / bookcasesPerPage), [bookcases, bookcasesPerPage]);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleBack = () => {
        navigate('/home');
    };

    const handleAdminPanel = () => {
        navigate('/admin');
    };

    // Добавление
    const handleAddBookcaseClick = () => {
        if (userRole !== 'ROLE_ADMIN') {
            setModalError('У вас нет прав для добавления шкафа.');
            return;
        }
        setIsAddModalOpen(true);
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        if (/^\d*$/.test(value)) {
            setNewBookcaseNumber(value);
        }
    };

    const handleCancelAdd = () => {
        setIsAddModalOpen(false);
        setNewBookcaseNumber('');
        setModalError(null);
    };

    const handleAddSubmit = async () => {
        if (userRole !== 'ROLE_ADMIN') {
            setModalError('У вас нет прав для добавления шкафа.');
            return;
        }

        try {
            const bookcaseData = {
                number: parseInt(newBookcaseNumber),
            };
            console.log('Отправляемые данные для нового шкафа:', bookcaseData);

            const response = await addOneBookcase(bookcaseData);
            console.log('Ответ сервера при добавлении шкафа:', response);

            setIsAddModalOpen(false);
            setNewBookcaseNumber('');
            setModalError(null);
            await fetchBookcases();
        } catch (error) {
            console.error('Ошибка добавления шкафа:', error);
            if (error.response?.status === 403) {
                setModalError('Доступ запрещён: У вас нет прав для добавления шкафа.');
            } else if (error.response?.status === 401) {
                alert('Сессия истекла. Пожалуйста, войдите заново.');
                navigate('/');
            } else {
                setModalError('Ошибка при добавлении шкафа: ' + (error.response?.data?.message || 'Попробуйте снова'));
            }
        }
    };

    const isAddButtonDisabled = !newBookcaseNumber || newBookcaseNumber === '';

    // Редактирование
    const handleEditBookcaseClick = (id) => {
        if (userRole !== 'ROLE_ADMIN') {
            setModalError('У вас нет прав для редактирования шкафа.');
            return;
        }
        setIsEditModalOpen(true);
        fetchBookcaseDetails(id);
    };

    const fetchBookcaseDetails = async (id) => {
        try {
            const response = await getBookcaseById(id);
            console.log('Данные шкафа для редактирования:', response.data);
            const { number } = response.data;
            setEditBookcase({
                id,
                number: number.toString(),
                originalNumber: number.toString(),
            });
        } catch (error) {
            console.error('Ошибка загрузки данных шкафа:', error);
            setModalError('Не удалось загрузить данные шкафа.');
            if (error.response?.status === 401) {
                navigate('/');
            } else if (error.response?.status === 403) {
                setModalError('Доступ запрещён: У вас нет прав для редактирования шкафа.');
            }
        }
    };

    const handleEditInputChange = (e) => {
        const value = e.target.value;
        if (/^\d*$/.test(value)) {
            setEditBookcase((prev) => ({
                ...prev,
                number: value,
            }));
        }
    };

    const handleCancelEdit = () => {
        setIsEditModalOpen(false);
        setEditBookcase({ id: null, number: '', originalNumber: '' });
        setModalError(null);
    };

    const handleEditSubmit = async () => {
        if (userRole !== 'ROLE_ADMIN') {
            setModalError('У вас нет прав для редактирования шкафа.');
            return;
        }

        try {
            const bookcaseData = {
                number: parseInt(editBookcase.number),
            };
            console.log(`Отправляемые данные для редактирования шкафа ${editBookcase.id}:`, bookcaseData);

            const response = await updateBookcase(editBookcase.id, bookcaseData);
            console.log('Ответ сервера при редактировании шкафа:', response);

            setIsEditModalOpen(false);
            setEditBookcase({ id: null, number: '', originalNumber: '' });
            setModalError(null);
            await fetchBookcases();
        } catch (error) {
            console.error('Ошибка редактирования шкафа:', error);
            if (error.response?.status === 403) {
                setModalError('Доступ запрещён: У вас нет прав для редактирования шкафа.');
            } else if (error.response?.status === 401) {
                alert('Сессия истекла. Пожалуйста, войдите заново.');
                navigate('/');
            } else {
                setModalError('Ошибка при редактировании шкафа: ' + (error.response?.data?.message || 'Попробуйте снова'));
            }
        }
    };

    const isEditButtonDisabled = editBookcase.number === editBookcase.originalNumber;

    // Удаление
    const handleDeleteBookcase = async (id) => {
        if (userRole !== 'ROLE_ADMIN') {
            setError('У вас нет прав для удаления шкафа.');
            return;
        }

        try {
            console.log(`Отправляем DELETE запрос на /delete/${id}`);
            const response = await deleteBookcase(id);
            console.log('Ответ сервера при удалении шкафа:', response);
            await fetchBookcases();
        } catch (error) {
            console.error('Ошибка удаления шкафа:', error);
            if (error.response?.status === 403) {
                setError('Доступ запрещён: У вас нет прав для удаления шкафа.');
            } else if (error.response?.status === 401) {
                alert('Сессия истекла. Пожалуйста, войдите заново.');
                navigate('/');
            } else {
                setError('Ошибка при удалении шкафа: ' + (error.response?.data?.message || 'Попробуйте снова'));
            }
        }
    };

    return (
        <div className="book-page">
            <header className="header">
                <div className="left-section">
                    {userRole === 'ROLE_ADMIN' && (
                        <button onClick={handleAdminPanel} className="header-button">
                            Панель администратора
                        </button>
                    )}
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
                <h1>Шкафы</h1>
                {userRole === 'ROLE_ADMIN' && (
                    <div className="add-book-card" onClick={handleAddBookcaseClick}>
                        <div className="add-plus">+</div>
                    </div>
                )}
                {isLoading && <p>Загрузка данных...</p>}
                {error && <p className="error-message">{error}</p>}
                <div className="bookcase-grid">
                    {currentBookcases.map((bookcase) => (
                        <div key={bookcase.number} className="bookcase-card">
                            <div className="bookcase-header">
                                <div className="bookcase-number-container">
                                    <span className="bookcase-label">Шкаф:</span>
                                    <h3 className="bookcase-number">{bookcase.number}</h3>
                                </div>
                            </div>
                            <div className="bookcase-shelves">
                                <h4>Полки:</h4>
                                <div className="shelf-list">
                                    {bookcase.shelfName && bookcase.shelfName.length > 0 ? (
                                        bookcase.shelfName.map((shelf, index) => (
                                            <span key={index} className="shelf-item">{shelf}</span>
                                        ))
                                    ) : (
                                        <span className="shelf-item empty">Нет полок</span>
                                    )}
                                </div>
                            </div>
                            {userRole === 'ROLE_ADMIN' && (
                                <div className="bookcase-actions">
                                    <button
                                        className="edit-button"
                                        onClick={() => handleEditBookcaseClick(bookcase.id)}
                                    >
                                        Изменить
                                    </button>
                                    <button
                                        className="delete-button1"
                                        onClick={() => handleDeleteBookcase(bookcase.id)}
                                    >
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

            {/* Модальное окно для добавления шкафа */}
            {isAddModalOpen && userRole === 'ROLE_ADMIN' && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Добавить шкаф</h2>
                        {modalError && <p className="error-message">{modalError}</p>}
                        <form onSubmit={(e) => { e.preventDefault(); handleAddSubmit(); }}>
                            <input
                                type="text"
                                name="number"
                                placeholder="Номер шкафа"
                                value={newBookcaseNumber}
                                onChange={handleInputChange}
                                required
                            />
                            <div className="modal-buttons">
                                <button type="button" onClick={handleCancelAdd} className="modal-button cancel">
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    className="modal-button add"
                                    disabled={isAddButtonDisabled}
                                >
                                    Сохранить
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Модальное окно для редактирования шкафа */}
            {isEditModalOpen && userRole === 'ROLE_ADMIN' && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Редактировать шкаф</h2>
                        {modalError && <p className="error-message">{modalError}</p>}
                        <form onSubmit={(e) => { e.preventDefault(); handleEditSubmit(); }}>
                            <input
                                type="text"
                                name="number"
                                placeholder="Номер шкафа"
                                value={editBookcase.number}
                                onChange={handleEditInputChange}
                                required
                            />
                            <div className="modal-buttons">
                                <button type="button" onClick={handleCancelEdit} className="modal-button cancel">
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    className="modal-button add"
                                    disabled={isEditButtonDisabled}
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

export default BookcasePage;