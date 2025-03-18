import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { findClientById, replaceClient } from '../api'; // Добавляем replaceClient
import { FaUser, FaEnvelope, FaBook, FaEdit } from 'react-icons/fa'; // Добавляем FaEdit для иконки редактирования
import '../styles/RoomPage.css';

const RoomPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [clientData, setClientData] = useState(null);
    const userRole = localStorage.getItem('userRole');
    const [isModalOpen, setIsModalOpen] = useState(false); // Состояние для модального окна
    const [formData, setFormData] = useState({
        firstName: '',
        middleName: '',
        userEmail: '',
        userName: '',
    });

    useEffect(() => {
        findClientById(id)
            .then((response) => {
                setClientData(response.data);
                // Предзаполняем форму данными клиента при загрузке
                setFormData({
                    firstName: response.data.firstName,
                    middleName: response.data.middleName,
                    userEmail: response.data.userEmail,
                    userName: response.data.userName,
                });
            })
            .catch((error) => {
                console.error('Ошибка загрузки данных клиента:', error);
                if (error.response?.status === 401) {
                    navigate('/');
                }
            });
    }, [id, navigate]);

    const handleBack = () => {
        navigate('/home');
    };

    const handleAdminPanel = () => {
        navigate('/admin');
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        try {
            await replaceClient(id, formData); // Отправляем POST-запрос на /client/{id}
            // После успешного сохранения обновляем данные и закрываем модальное окно
            const response = await findClientById(id);
            setClientData(response.data);
            setIsModalOpen(false);
            // Перезагружаем страницу
            window.location.reload();
        } catch (error) {
            console.error('Ошибка сохранения данных:', error);
            alert('Не удалось сохранить изменения. Попробуйте снова.');
        }
    };

    return (
        <div className="room-page">
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
                    <button onClick={handleLogout} className="header-button logout-button">
                        Выйти
                    </button>
                </div>
            </header>
            <main className="main-content">
                {clientData ? (
                    <>
                        {/* Карточка клиента с кнопкой "Изменить" */}
                        <div className="client-card">
                            <div className="client-header">
                                <h1 className="client-name">
                                    {clientData.firstName} {clientData.middleName}
                                </h1>
                                <button onClick={openModal} className="edit-button">
                                    <FaEdit /> Изменить
                                </button>
                            </div>
                            <div className="client-info">
                                <p>
                                    <FaUser className="info-icon" /> <strong>Username:</strong> {clientData.userName}
                                </p>
                                <p>
                                    <FaEnvelope className="info-icon" /> <strong>Email:</strong> {clientData.userEmail}
                                </p>
                            </div>
                        </div>

                        {/* Список книг в виде сетки */}
                        <div className="books-section">
                            <h2>
                                <FaBook className="section-icon" /> Мои книги
                            </h2>
                            {clientData.bookNameList.length > 0 ? (
                                <div className="book-grid">
                                    {clientData.bookNameList.map((bookName, index) => (
                                        <div key={index} className="book-item">
                                            {bookName}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="no-books">У вас пока нет книг.</p>
                            )}
                        </div>

                        {/* Модальное окно */}
                        {isModalOpen && (
                            <div className="modal-overlay">
                                <div className="modal-content">
                                    <h2>Редактировать профиль</h2>
                                    <form>
                                        <div className="form-group">
                                            <label>Имя</label>
                                            <input
                                                type="text"
                                                name="firstName"
                                                value={formData.firstName}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Фамилия</label>
                                            <input
                                                type="text"
                                                name="middleName"
                                                value={formData.middleName}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Почта</label>
                                            <input
                                                type="email"
                                                name="userEmail"
                                                value={formData.userEmail}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Юзернейм</label>
                                            <input
                                                type="text"
                                                name="userName"
                                                value={formData.userName}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    </form>
                                    <div className="modal-buttons">
                                        <button onClick={closeModal} className="modal-button cancel-button">
                                            Отмена
                                        </button>
                                        <button onClick={handleSave} className="modal-button save-button">
                                            Сохранить
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <p className="loading">Загрузка данных...</p>
                )}
            </main>
        </div>
    );
};

export default RoomPage;