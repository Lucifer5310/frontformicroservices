import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AdminPage.css';

const AdminPage = () => {
    const navigate = useNavigate();

    const handleBack = () => {
        navigate('/home');
    };

    const handleLogout = () => {
        localStorage.removeItem('jwt');
        localStorage.removeItem('userRole');
        navigate('/');
    };

    return (
        <div className="admin-page">
            <header className="header">
                <div className="left-section">

                </div>
                <div className="right-section">
                    <button onClick={handleBack} className="header-button">
                        Назад
                    </button>
                    <button onClick={handleLogout} className="header-button logout-button">
                        Выйти
                    </button>
                </div>
            </header>
            <main className="main-content">
                <h1>Панель администратора</h1>
                <div className="button-grid">
                    <div className="button-row">
                        <button
                            onClick={() => navigate('/admin/users')}
                            className="admin-button"
                        >
                            Пользователи
                        </button>
                        <button
                            onClick={() => navigate('/client')}
                            className="admin-button"
                        >
                            Клиенты
                        </button>
                    </div>
                    <div className="button-row">
                        <button
                            onClick={() => navigate('/book')}
                            className="admin-button"
                        >
                            Книги
                        </button>
                        <button
                            onClick={() => navigate('/author')}
                            className="admin-button"
                        >
                            Авторы
                        </button>
                    </div>
                    <div className="button-row">
                        <button
                            onClick={() => navigate('/bookcase')}
                            className="admin-button"
                        >
                            Шкафы
                        </button>
                        <button
                            onClick={() => navigate('/shelf')}
                            className="admin-button"
                        >
                            Полки
                        </button>
                    </div>
                    <div className="button-row">
                        <button
                            onClick={() => navigate('/images')}
                            className="admin-button1"
                        >
                            Галерея обложек
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminPage;