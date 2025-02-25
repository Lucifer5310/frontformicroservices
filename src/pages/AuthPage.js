import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { internshipApi } from '../api'; // Используем сохранённый api.js
import '../styles/AuthPageStyle.css';

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = isLogin
            ? { username, password }
            : { username, password, email };

        if (isLogin) {
            internshipApi
                .post('/auth/sign-in', payload)
                .then((response) => {
                    console.log('Успешный логин:', response.data);
                    localStorage.setItem('jwt', response.data.token); // Предполагаем, что бэкенд возвращает token
                    localStorage.setItem('userRole', response.data.role); // Предполагаем, что бэкенд возвращает роль
                    navigate('/home'); // Переход на домашнюю страницу
                })
                .catch((error) => {
                    console.error('Ошибка логина:', error);
                    alert('Ошибка при входе');
                });
        } else {
            internshipApi
                .post('/auth/sign-up', payload)
                .then((response) => {
                    console.log('Успешная регистрация:', response.data);
                    setIsLogin(true);
                    alert('Регистрация прошла успешно, теперь войдите');
                })
                .catch((error) => {
                    console.error('Ошибка регистрации:', error);
                    alert('Ошибка при регистрации');
                });
        }
    };

    return (
        <div className="auth-page">
            <h1>{isLogin ? 'Вход' : 'Регистрация'}</h1>
            <form onSubmit={handleSubmit} className="auth-form">
                <input
                    type="text"
                    placeholder="Имя пользователя"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                {!isLogin && (
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                )}
                <input
                    type="password"
                    placeholder="Пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit" className="auth-button">
                    {isLogin ? 'Войти' : 'Зарегистрироваться'}
                </button>
            </form>
            <button
                onClick={() => setIsLogin(!isLogin)}
                className="switch-button"
            >
                {isLogin ? 'Ещё не зарегистрированы?' : 'Уже есть аккаунт?'}
            </button>
        </div>
    );
};

export default AuthPage;