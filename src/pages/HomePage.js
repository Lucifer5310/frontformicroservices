import React from 'react';
import { useNavigate } from 'react-router-dom';
import { decodeJWT } from './AuthPage';
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
            const userId = decodedToken.id;
            if (userId) {
                navigate(`/client/${userId}`);
            } else {
                console.error('ID пользователя не найден в токене');
                alert('Ошибка: ID пользователя не найден');
            }
        } else {
            console.error('Токен отсутствует');
            navigate('/'); // Не нужно очищать localStorage здесь, интерцептор сделает это
        }
    };

    const handleLibrary = () => {
        navigate('/books');
    };

    const handleAuthors = () => {
        navigate('/author');
    };

    const handleGallery = () => {
        navigate('/images');
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
                    <button onClick={handleGallery} className="action-button">
                        Галерея обложек
                    </button>
                </div>
            </main>
        </div>
    );
};

export default HomePage;