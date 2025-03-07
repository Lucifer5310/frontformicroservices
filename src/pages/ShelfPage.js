import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { findAllShelf, getAllBookcaseNumbers, addOneShelf, deleteShelf, getShelfById, updateShelf } from '../api';
import { decodeJWT } from '../api';
import '../styles/ShelfPage.css';

const ShelfPage = () => {
    const navigate = useNavigate();
    const [shelves, setShelves] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const userRole = localStorage.getItem('userRole');
    const shelvesPerPage = 12; // 3 ряда по 4 колонки
    const [currentPage, setCurrentPage] = useState(1);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [newShelf, setNewShelf] = useState({
        name: '',
        bookcaseNumber: '',
    });
    const [editShelf, setEditShelf] = useState({
        id: null,
        name: '',
        bookcaseNumber: '',
        originalName: '',
        originalBookcaseNumber: '',
    });
    const [bookcaseNumbers, setBookcaseNumbers] = useState([]);
    const [modalError, setModalError] = useState(null);

    useEffect(() => {
        fetchShelves();
        if (userRole === 'ROLE_ADMIN') {
            fetchBookcaseNumbers();
        }
    }, []);

    const fetchShelves = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await findAllShelf();
            console.log('Список полок с сервера:', response.data);
            setShelves(response.data);
        } catch (error) {
            console.error('Ошибка загрузки полок:', error);
            setError('Не удалось загрузить данные полок. Проверьте подключение или права доступа.');
            if (error.response?.status === 401) {
                navigate('/');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const fetchBookcaseNumbers = async () => {
        try {
            const response = await getAllBookcaseNumbers();
            console.log('Список номеров шкафов:', response.data);
            setBookcaseNumbers(response.data);
        } catch (error) {
            console.error('Ошибка загрузки номеров шкафов:', error);
            setModalError('Не удалось загрузить номера шкафов.');
            if (error.response?.status === 401) {
                navigate('/');
            }
        }
    };

    const fetchShelfById = async (id) => {
        try {
            const response = await getShelfById(id);
            console.log('Данные полки для редактирования:', response.data);
            const { name, bookcaseNumber } = response.data;
            setEditShelf({
                id,
                name,
                bookcaseNumber: bookcaseNumber.toString(), // Преобразуем в строку для select
                originalName: name,
                originalBookcaseNumber: bookcaseNumber.toString(),
            });
        } catch (error) {
            console.error('Ошибка загрузки данных полки:', error);
            setModalError('Не удалось загрузить данные полки.');
            if (error.response?.status === 401) {
                navigate('/');
            } else if (error.response?.status === 403) {
                setModalError('Доступ запрещён: У вас нет прав для редактирования полки.');
            }
        }
    };

    // Пагинация
    const indexOfLastShelf = currentPage * shelvesPerPage;
    const indexOfFirstShelf = indexOfLastShelf - shelvesPerPage;
    const currentShelves = useMemo(() => {
        return shelves.slice(indexOfFirstShelf, indexOfLastShelf).sort((a, b) => a.bookcaseNumber - b.bookcaseNumber);
    }, [shelves, currentPage, indexOfFirstShelf, indexOfLastShelf]);
    const totalPages = useMemo(() => Math.ceil(shelves.length / shelvesPerPage), [shelves, shelvesPerPage]);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleBack = () => {
        navigate('/home');
    };

    const handleAdminPanel = () => {
        navigate('/admin');
    };

    const handleAddShelfClick = () => {
        if (userRole === 'ROLE_ADMIN') {
            setIsAddModalOpen(true);
        }
    };

    const handleEditShelfClick = (id) => {
        if (userRole === 'ROLE_ADMIN') {
            setIsEditModalOpen(true);
            fetchShelfById(id);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewShelf((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        setEditShelf((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSelectChange = (e) => {
        const { name, value } = e.target;
        setNewShelf((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleEditSelectChange = (e) => {
        const { name, value } = e.target;
        setEditShelf((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const isAddButtonDisabled = !newShelf.name || !newShelf.bookcaseNumber;

    const isEditButtonDisabled = editShelf.name === editShelf.originalName && editShelf.bookcaseNumber === editShelf.originalBookcaseNumber;

    const handleAddSubmit = async () => {
        if (userRole !== 'ROLE_ADMIN') return;

        try {
            const shelfData = {
                name: newShelf.name,
                bookcaseNumber: parseInt(newShelf.bookcaseNumber),
            };
            console.log('Отправляемые данные для новой полки:', shelfData);

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

            const response = await addOneShelf(shelfData);
            console.log('Ответ сервера при добавлении полки:', response);

            setIsAddModalOpen(false);
            setNewShelf({
                name: '',
                bookcaseNumber: '',
            });
            setModalError(null);
            await fetchShelves();
        } catch (error) {
            console.error('Ошибка добавления полки:', error);
            if (error.response?.status === 403) {
                setModalError('Доступ запрещён: У вас нет прав для добавления полки.');
            } else if (error.response?.status === 401) {
                alert('Сессия истекла. Пожалуйста, войдите заново.');
                navigate('/');
            } else {
                setModalError('Ошибка при добавлении полки: ' + (error.response?.data?.message || 'Попробуйте снова'));
            }
        }
    };

    const handleCancel = () => {
        setIsAddModalOpen(false);
        setNewShelf({
            name: '',
            bookcaseNumber: '',
        });
        setModalError(null);
    };

    const handleEditCancel = () => {
        setIsEditModalOpen(false);
        setEditShelf({
            id: null,
            name: '',
            bookcaseNumber: '',
            originalName: '',
            originalBookcaseNumber: '',
        });
        setModalError(null);
    };

    const handleEditSubmit = async () => {
        if (userRole !== 'ROLE_ADMIN') return;

        try {
            const shelfData = {
                name: editShelf.name,
                bookcaseNumber: parseInt(editShelf.bookcaseNumber),
            };
            console.log(`Отправляемые данные для редактирования полки ${editShelf.id}:`, shelfData);

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

            const response = await updateShelf(editShelf.id, shelfData);
            console.log('Ответ сервера при редактировании полки:', response);

            setIsEditModalOpen(false);
            setEditShelf({
                id: null,
                name: '',
                bookcaseNumber: '',
                originalName: '',
                originalBookcaseNumber: '',
            });
            setModalError(null);
            await fetchShelves();
        } catch (error) {
            console.error('Ошибка редактирования полки:', error);
            if (error.response?.status === 403) {
                setModalError('Доступ запрещён: У вас нет прав для редактирования полки.');
            } else if (error.response?.status === 401) {
                alert('Сессия истекла. Пожалуйста, войдите заново.');
                navigate('/');
            } else {
                setModalError('Ошибка при редактировании полки: ' + (error.response?.data?.message || 'Попробуйте снова'));
            }
        }
    };

    const handleDeleteShelf = async (id) => {
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

            console.log(`Отправляем DELETE запрос на /shelf/${id}`);
            const response = await deleteShelf(id);
            console.log('Ответ сервера при удалении полки:', response);
            await fetchShelves();
        } catch (error) {
            console.error('Ошибка удаления полки:', error);
            if (error.response?.status === 403) {
                setError('Доступ запрещён: У вас нет прав для удаления полки.');
            } else if (error.response?.status === 401) {
                alert('Сессия истекла. Пожалуйста, войдите заново.');
                navigate('/');
            } else {
                setError('Ошибка при удалении полки: ' + (error.response?.data?.message || 'Попробуйте снова'));
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
                <h1>Полки</h1>
                {userRole === 'ROLE_ADMIN' && (
                    <div className="add-book-card" onClick={handleAddShelfClick}>
                        <div className="add-plus">+</div>
                    </div>
                )}
                {isLoading && <p>Загрузка данных...</p>}
                {error && <p className="error-message">{error}</p>}
                <div className="shelf-grid">
                    {currentShelves.map((shelf) => (
                        <div key={shelf.name || shelf.bookcaseNumber} className="shelf-card">
                            <div className="shelf-header">
                                <div className="shelf-title-container">
                                    <span className="shelf-label">Полка:</span>
                                    <h3 className="shelf-title">{shelf.name}</h3>
                                </div>
                                <div className="shelf-bookcase-container">
                                    <span className="shelf-label">Шкаф:</span>
                                    <p className="shelf-bookcase">{shelf.bookcaseNumber}</p>
                                </div>
                            </div>
                            <div className="shelf-books">
                                <h4>Книги на полке:</h4>
                                <div className="book-list">
                                    {shelf.bookNameList && shelf.bookNameList.length > 0 ? (
                                        shelf.bookNameList.map((book, index) => (
                                            <span key={index} className="book-item">{book}</span>
                                        ))
                                    ) : (
                                        <span className="book-item empty">Нет книг</span>
                                    )}
                                </div>
                            </div>
                            {userRole === 'ROLE_ADMIN' && (
                                <div className="shelf-actions">
                                    <button
                                        className="edit-button"
                                        onClick={() => handleEditShelfClick(shelf.id)}
                                    >
                                        Изменить
                                    </button>
                                    <button
                                        className="delete-button1"
                                        onClick={() => handleDeleteShelf(shelf.id)}
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

            {isAddModalOpen && userRole === 'ROLE_ADMIN' && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Добавить полку</h2>
                        {modalError && <p className="error-message">{modalError}</p>}
                        <form onSubmit={(e) => { e.preventDefault(); handleAddSubmit(); }}>
                            <input
                                type="text"
                                name="name"
                                placeholder="Название полки"
                                value={newShelf.name}
                                onChange={handleInputChange}
                                required
                            />
                            <select
                                name="bookcaseNumber"
                                value={newShelf.bookcaseNumber}
                                onChange={handleSelectChange}
                                required
                            >
                                <option value="">Выберите шкаф</option>
                                {bookcaseNumbers.map((number) => (
                                    <option key={number} value={number}>
                                        {number}
                                    </option>
                                ))}
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
                                    Сохранить
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isEditModalOpen && userRole === 'ROLE_ADMIN' && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Редактировать полку</h2>
                        {modalError && <p className="error-message">{modalError}</p>}
                        <form onSubmit={(e) => { e.preventDefault(); handleEditSubmit(); }}>
                            <input
                                type="text"
                                name="name"
                                placeholder="Название полки"
                                value={editShelf.name}
                                onChange={handleEditInputChange}
                                required
                            />
                            <select
                                name="bookcaseNumber"
                                value={editShelf.bookcaseNumber}
                                onChange={handleEditSelectChange}
                                required
                            >
                                <option value="">Выберите шкаф</option>
                                {bookcaseNumbers.map((number) => (
                                    <option key={number} value={number}>
                                        {number}
                                    </option>
                                ))}
                            </select>
                            <div className="modal-buttons">
                                <button type="button" onClick={handleEditCancel} className="modal-button cancel">
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

export default ShelfPage;