import React from 'react';
import { useNavigate } from 'react-router-dom';
import { decodeJWT, findClientById, internshipApi } from '../api'; // Импортируем нужные методы и internshipApi
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

    const handlePersonalRoom = async () => {
        const accessToken = localStorage.getItem('accessToken');

        try {
            // Проверяем токен с помощью тестового запроса к API
            await internshipApi.get('/book'); // Простой GET-запрос для проверки токена
            const decodedToken = decodeJWT(accessToken);
            const userId = decodedToken.id;
            if (userId) {
                // Можно добавить запрос к API для проверки данных клиента, если нужно
                try {
                    const clientResponse = await findClientById(userId);
                    if (clientResponse.data) {
                        navigate(`/client/${userId}`);
                    } else {
                        console.error('Клиент не найден на сервере');
                        alert('Ошибка: Клиент не найден');
                    }
                } catch (clientError) {
                    console.error('Ошибка при загрузке данных клиента:', clientError);
                    alert('Ошибка: Не удалось загрузить данные клиента');
                }
            } else {
                console.error('ID пользователя не найден в токене');
                alert('Ошибка: ID пользователя не найден');
            }
        } catch (error) {
            console.error('Ошибка проверки токена:', error);
            if (error.response?.status === 401) {
                // Ждём обновления токена через интерцептор (1 секунда)
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Проверяем обновлённый токен
                const newAccessToken = localStorage.getItem('accessToken');
                if (!newAccessToken) {
                    console.error('Не удалось обновить токен');
                    navigate('/');
                    return;
                }

                const newDecodedToken = decodeJWT(newAccessToken);
                const userId = newDecodedToken.id;
                if (userId) {
                    try {
                        const clientResponse = await findClientById(userId);
                        if (clientResponse.data) {
                            navigate(`/client/${userId}`);
                        } else {
                            console.error('Клиент не найден на сервере после обновления токена');
                            alert('Ошибка: Клиент не найден после обновления токена');
                        }
                    } catch (clientError) {
                        console.error('Ошибка при загрузке данных клиента после обновления:', clientError);
                        alert('Ошибка: Не удалось загрузить данные клиента после обновления');
                    }
                } else {
                    console.error('ID пользователя не найден в обновлённом токене');
                    alert('Ошибка: ID пользователя не найден после обновления токена');
                    navigate('/');
                }
            } else {
                console.error('Неизвестная ошибка:', error);
                navigate('/');
            }
        }
    };

    const handleLibrary = () => {
        navigate('/book');
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