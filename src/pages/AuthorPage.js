import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { findAllAuthor, deleteAuthorById, getAuthorById, updateAuthor, addOneAuthor } from '../api'; // Используем методы
import '../styles/AuthorPage.css';

const AuthorPage = () => {
    const navigate = useNavigate();
    const [authors, setAuthors] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedAuthor, setSelectedAuthor] = useState(null); // Для редактирования
    const [editName, setEditName] = useState(''); // Поле для имени
    const [editDate, setEditDate] = useState(''); // Поле для даты
    const [newAuthorName, setNewAuthorName] = useState(''); // Поле для нового автора (имя)
    const [newAuthorDate, setNewAuthorDate] = useState(''); // Поле для нового автора (дата)
    const authorsPerPage = 10;
    const userRole = localStorage.getItem('userRole');

    useEffect(() => {
        fetchAuthors(); // Загружаем авторов при монтировании
    }, [navigate]);

    // Загрузка авторов с сервера
    const fetchAuthors = () => {
        findAllAuthor()
            .then((response) => {
                console.log('Данные авторов с сервера:', response.data);
                setAuthors(response.data);
            })
            .catch((error) => {
                console.error('Ошибка загрузки авторов:', error);
                if (error.response?.status === 401) {
                    navigate('/');
                }
            });
    };

    // Форматирование даты из long в ДД.MM.ГГ
    const formatDate = (longDate) => {
        if (!longDate) return '';
        const date = new Date(longDate);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // +1, т.к. месяцы с 0
        const year = date.getFullYear(); // Полный год (4 цифры)
        return `${day}.${month}.${year}`;
    };

    // Преобразование даты из ДД.ММ.ГГГГ в long
    const parseDateToLong = (dateStr) => {
        if (!dateStr) return null;
        const [day, month, year] = dateStr.split('.').map(Number);
        const date = new Date(year, month - 1, day);
        if (isNaN(date.getTime())) {
            console.error('Неверный формат даты:', dateStr);
            return null;
        }
        return date.getTime(); // Преобразуем в миллисекунды
    };

    // Пагинация
    const indexOfLastAuthor = currentPage * authorsPerPage;
    const indexOfFirstAuthor = indexOfLastAuthor - authorsPerPage;
    const currentAuthors = authors.slice(indexOfFirstAuthor, indexOfLastAuthor);
    const totalPages = Math.ceil(authors.length / authorsPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleBack = () => {
        navigate('/home');
    };

    // Удаление автора (прямое, без подтверждения)
    const handleDelete = (authorId) => {
        deleteAuthorById(authorId)
            .then(() => {
                fetchAuthors(); // Обновляем список авторов с сервера
                console.log('Автор удалён:', authorId);
            })
            .catch((error) => console.error('Ошибка удаления автора:', error));
    };

    // Открытие модального окна для редактирования
    const handleEdit = (authorId) => {
        setSelectedAuthor(authorId); // Устанавливаем id автора для открытия модального окна
        setEditName(''); // Очищаем поля перед загрузкой
        setEditDate('');
    };

    // Эффект для загрузки данных автора при открытии модального окна
    useEffect(() => {
        if (selectedAuthor) {
            getAuthorById(selectedAuthor)
                .then((response) => {
                    console.log('Данные автора для редактирования:', response.data);
                    const author = response.data;
                    setEditName(author.name); // Заполняем имя
                    setEditDate(formatDate(author.dateOfBirth)); // Заполняем дату в формате ДД.ММ.ГГГГ
                })
                .catch((error) => console.error('Ошибка загрузки данных автора:', error));
        }
    }, [selectedAuthor]);

    // Сохранение изменений (с ожиданием и обновлением страницы)
    const handleSaveEdit = async () => {
        if (!editName || !editDate) {
            alert('Пожалуйста, заполните все поля');
            return;
        }

        const dateLong = parseDateToLong(editDate);
        if (!dateLong) {
            alert('Неверный формат даты. Используйте ДД.ММ.ГГГГ');
            return;
        }

        const updatedAuthor = {
            id: selectedAuthor,
            name: editName,
            dateOfBirth: dateLong
        };

        try {
            await updateAuthor(selectedAuthor, updatedAuthor); // Ожидаем завершения запроса
            await fetchAuthors(); // Обновляем список после успешного обновления
            setSelectedAuthor(null); // Закрываем модальное окно
            setEditName('');
            setEditDate('');
            console.log('Автор обновлён:', updatedAuthor);
        } catch (error) {
            console.error('Ошибка обновления автора:', error);
            if (error.response?.status === 403) {
                alert('У вас нет прав для обновления автора. Проверьте роль или токен.');
            }
        }
    };

    // Отмена редактирования
    const handleCancelEdit = () => {
        setSelectedAuthor(null);
        setEditName('');
        setEditDate('');
    };

    // Добавление нового автора
    const handleAddAuthor = () => {
        if (!newAuthorName || !newAuthorDate) {
            alert('Пожалуйста, заполните все поля');
            return;
        }

        const dateLong = parseDateToLong(newAuthorDate);
        if (!dateLong) {
            alert('Неверный формат даты. Используйте ДД.ММ.ГГГГ');
            return;
        }

        const newAuthor = {
            name: newAuthorName,
            dateOfBirth: dateLong
        };

        addOneAuthor(newAuthor)
            .then((response) => {
                console.log('Ответ на добавление автора:', response.data);
                fetchAuthors(); // Обновляем список авторов с сервера
                setNewAuthorName('');
                setNewAuthorDate('');
                console.log('Автор добавлен:', response.data);
            })
            .catch((error) => {
                console.error('Ошибка добавления автора:', error);
                if (error.response) {
                    console.error('Статус:', error.response.status);
                    console.error('Данные:', error.response.data);
                }
            });
    };

    const handleAdminPanel = () => {
        navigate('/admin');
    };

    return (
        <div className="author-page">
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
                <h1>Список авторов</h1>
                {userRole === 'ROLE_ADMIN' && (
                    <div className="add-author">
                        <input
                            type="text"
                            value={newAuthorName}
                            onChange={(e) => setNewAuthorName(e.target.value)}
                            placeholder="Имя автора"
                        />
                        <input
                            type="text"
                            value={newAuthorDate}
                            onChange={(e) => setNewAuthorDate(e.target.value)}
                            placeholder="Дата рождения (ДД.ММ.ГГГГ)"
                        />
                        <button
                            onClick={handleAddAuthor}
                            className="add-button"
                            disabled={!newAuthorName || !newAuthorDate}
                        >
                            Добавить
                        </button>
                    </div>
                )}
                <ul className="author-list">
                    {currentAuthors.map((author) => (
                        <li key={author.id} className="author-item">
                            {author.name} (Дата рождения: {formatDate(author.dateOfBirth)})
                            {userRole === 'ROLE_ADMIN' && (
                                <div className="author-actions">
                                    <button onClick={() => handleEdit(author.id)} className="edit-button">
                                        Редактировать
                                    </button>
                                    <button onClick={() => handleDelete(author.id)} className="delete-button">
                                        Удалить
                                    </button>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
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
                {userRole === 'ROLE_ADMIN' && selectedAuthor && (
                    <div className="modal">
                        <div className="modal-content">
                            <h2>Редактировать автора</h2>
                            <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="Имя"
                            />
                            <input
                                type="text"
                                value={editDate}
                                onChange={(e) => setEditDate(e.target.value)}
                                placeholder="Дата рождения (ДД.ММ.ГГГГ)"
                            />
                            <div className="modal-actions">
                                <button onClick={handleSaveEdit} className="save-button">
                                    Изменить
                                </button>
                                <button onClick={handleCancelEdit} className="cancel-button">
                                    Отмена
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AuthorPage;