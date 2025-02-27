import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { findAllAuthor } from '../api'; // Используем api.js
import '../styles/AuthorPage.css';

const AuthorPage = () => {
    const navigate = useNavigate();
    const [authors, setAuthors] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const authorsPerPage = 10;

    useEffect(() => {
        findAllAuthor()
            .then((response) => {
                setAuthors(response.data);
            })
            .catch((error) => {
                console.error('Ошибка загрузки авторов:', error);
                if (error.response?.status === 401) {
                    navigate('/');
                }
            });
    }, [navigate]);

    // Форматирование даты из long в ДД.MM.ГГ
    const formatDate = (longDate) => {
        const date = new Date(longDate);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // +1, т.к. месяцы с 0
        const year = date.getFullYear(); // Полный год (4 цифры)
        return `${day}.${month}.${year}`;
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

    return (
        <div className="author-page">
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
                <h1>Список авторов</h1>
                <ul className="author-list">
                    {currentAuthors.map((author) => (
                        <li key={author.id}>
                            {author.name} (Дата рождения: {formatDate(author.dateOfBirth)})
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
            </main>
        </div>
    );
};

export default AuthorPage;