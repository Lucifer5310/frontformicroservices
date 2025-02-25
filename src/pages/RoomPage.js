import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { findAllClient } from '../api'; // Используем сохранённый api.js
import '../styles/RoomPage.css';

const RoomPage = () => {
    const navigate = useNavigate();
    const [clientData, setClientData] = useState(null);

    useEffect(() => {
        findAllClient()
            .then((response) => {
                const clients = response.data;
                const currentClient = clients[0]; // Уточни логику выбора клиента
                setClientData(currentClient);
            })
            .catch((error) => {
                console.error('Ошибка загрузки данных клиента:', error);
            });
    }, []);

    const handleBack = () => {
        navigate('/home');
    };

    return (
        <div className="room-page">
            <header className="header">
                <div className="left-section">
                    {/* Оставляем пустым, как в HomePage */}
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