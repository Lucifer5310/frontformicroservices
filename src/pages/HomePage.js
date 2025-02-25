import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/HomePage.css';

const HomePage = () => {
    const navigate = useNavigate();
    const userRole = localStorage.getItem('userRole'); // Предполагаем, что роль хранится в localStorage

    const handleLogout = () => {
        localStorage.removeItem('jwt'); // Удаляем JWT
        localStorage.removeItem('userRole'); // Удаляем роль
        navigate('/'); // Возвращаемся на страницу авторизации
    };

    const handleAdminPanel = () => {
        navigate('/admin');
    };

    const handlePersonalRoom = () => {
        navigate('/room');
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
                    {/*{userRole === 'ROLE_ADMIN' && (
                        <button onClick={handleAdminPanel} className="header-button">
                            Панель администратора
                        </button>
                    )}*/}
                    <button onClick={handleAdminPanel} className="header-button">
                        Панель администратора
                    </button>
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