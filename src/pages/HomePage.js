import React from 'react';
import { useNavigate } from 'react-router-dom';
import { decodeJWT } from './AuthPage'; // Импортируем функцию декодирования из AuthPage (или переместим её в утилиты)
import '../styles/HomePage.css';

const HomePage = () => {
    const navigate = useNavigate();
    const userRole = localStorage.getItem('userRole');

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userRole');
        navigate('/');
    };

    const handleAdminPanel = () => {
        navigate('/admin');
    };

    const handlePersonalRoom = () => {
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
            const decodedToken = decodeJWT(accessToken);
            const userId = decodedToken.id; // Предполагаем, что id в поле "sub" или "id"
            if (userId) {
                navigate(`/client/${userId}`);
            } else {
                console.error('ID пользователя не найден в токене');
                alert('Ошибка: ID пользователя не найден');
            }
        } else {
            console.error('Токен отсутствует');
            navigate('/'); // Возвращаем на логин, если токена нет
        }
    };

    const handleLibrary = () => {
        navigate('/books');
    };

    const handleAuthors = () => {
        navigate('/author');
    };

    return (
        <div className="home-page">
            <header className="header">
                <div className="left-section">
                    {userRole === 'ROLE_ADMIN' && (
                        <button onClick={handleAdminPanel} className="header-button">
                            Панель администратора
                        </button>
                    )}
                </div>
                <div className="right-section">
                    <button onClick={handlePersonalRoom} className="header-button">
                        Личный кабинет
                    </button>
                    <button onClick={handleLogout} className="header-button logout-button">
                        Выйти
                    </button>
                </div>
            </header>
            <main className="main-content">
                <h1>Добро пожаловать :)</h1>
                <div className="button-container">
                    <button onClick={handleLibrary} className="action-button">
                        Библиотека
                    </button>
                    <button onClick={handleAuthors} className="action-button">
                        Авторы
                    </button>
                </div>
            </main>
        </div>
    );
};

export default HomePage;