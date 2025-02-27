import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { internshipApi, findClientById } from '../api';// Используем api.js с токенами
import '../styles/RoomPage.css';

const RoomPage = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // Извлекаем id из URL
    const [clientData, setClientData] = useState(null);

    useEffect(() => {
        internshipApi
            .get(`/client/${id}`) // GET-запрос с id пользователя
            .then((response) => {
                setClientData(response.data);
            })
            .catch((error) => {
                console.error('Ошибка загрузки данных клиента:', error);
                if (error.response?.status === 401) {
                    navigate('/'); // Перенаправление на логин при истёкшем токене
                }
            });
    }, [id, navigate]);

    const handleBack = () => {
        navigate('/home');
    };

    return (
        <div className="room-page">
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
                {clientData ? (
                    <>
                        <h1>
                            {clientData.firstName.toUpperCase()} {clientData.middleName.toUpperCase()}
                        </h1>
                        <h2>Мои книги</h2>
                        <ul className="book-list">
                            {clientData.bookNameList.map((bookName, index) => (
                                <li key={index}>{bookName}</li>
                            ))}
                        </ul>
                    </>
                ) : (
                    <p>Загрузка данных...</p>
                )}
            </main>
        </div>
    );
};

export default RoomPage;