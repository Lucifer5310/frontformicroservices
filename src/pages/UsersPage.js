import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { findAllUsers, findRoleById, replaceUser, decodeJWT } from '../api'; // Импортируем decodeJWT
import { FaEdit } from 'react-icons/fa';
import '../styles/UsersPage.css';

const UsersPage = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [selectedRole, setSelectedRole] = useState('');
    const userRole = localStorage.getItem('userRole');

    // Извлекаем username из JWT-токена
    const accessToken = localStorage.getItem('accessToken');
    const decodedToken = accessToken ? decodeJWT(accessToken) : {};
    const currentUserName = decodedToken.sub || ''; // Поле sub обычно содержит username в JWT

    // Проверка доступа для администраторов
    useEffect(() => {
        if (userRole !== 'ROLE_ADMIN') {
            navigate('/home');
        }
    }, [userRole, navigate]);

    // Загрузка списка пользователей
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await findAllUsers();
                setUsers(response.data);
            } catch (error) {
                console.error('Ошибка загрузки пользователей:', error);
                if (error.response?.status === 401) {
                    navigate('/');
                }
            }
        };

        fetchUsers();
    }, [navigate]);

    const openModal = async (userId) => {
        try {
            const response = await findRoleById(userId);
            setSelectedUserId(userId);
            setSelectedRole(response.data.role);
            setIsModalOpen(true);
        } catch (error) {
            console.error('Ошибка загрузки данных пользователя:', error);
            alert('Не удалось загрузить данные пользователя.');
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedUserId(null);
        setSelectedRole('');
    };

    const handleRoleChange = (e) => {
        setSelectedRole(e.target.value);
    };

    const handleSave = async () => {
        if (!selectedUserId) return;

        try {
            const updatedUserData = { role: selectedRole };
            await replaceUser(selectedUserId, updatedUserData);
            setIsModalOpen(false);
            window.location.reload();
        } catch (error) {
            console.error('Ошибка обновления роли:', error);
            alert('Не удалось обновить роль. Попробуйте снова.');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userRole');
        navigate('/');
    };

    const handleAdminPanel = () => {
        navigate('/admin');
    };

    const handleBack = () => {
        navigate('/home');
    };

    return (
        <div className="users-page">
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
                <h1>Пользователи</h1>
                {users.length > 0 ? (
                    <table className="users-table">
                        <thead>
                        <tr>
                            <th>Id</th>
                            <th>Юзернейм</th>
                            <th>Email</th>
                            <th>Роль</th>
                            <th>Имя пользователя</th>
                            <th>Фамилия пользователя</th>
                            <th></th>
                        </tr>
                        </thead>
                        <tbody>
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td>{user.id}</td>
                                <td>{user.username}</td>
                                <td>{user.email}</td>
                                <td>{user.role}</td>
                                <td>{user.clientFirstName}</td>
                                <td>{user.clientMiddleName}</td>
                                <td>
                                    {user.username !== currentUserName && (
                                        <button
                                            onClick={() => openModal(user.id)}
                                            className="edit-button"
                                        >
                                            <FaEdit /> Изменить
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="no-users">Пользователи не найдены.</p>
                )}

                {/* Модальное окно */}
                {isModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h2>Изменить роль пользователя</h2>
                            <form>
                                <div className="form-group">
                                    <label>Роль</label>
                                    <select
                                        value={selectedRole}
                                        onChange={handleRoleChange}
                                        className="role-select"
                                    >
                                        <option value="ROLE_ADMIN">ROLE_ADMIN</option>
                                        <option value="ROLE_USER">ROLE_USER</option>
                                    </select>
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
            </main>
        </div>
    );
};

export default UsersPage;