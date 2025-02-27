import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { internshipApi } from '../api';
import '../styles/AuthPageStyle.css';

// Функция для декодирования JWT Payload
export const decodeJWT = (token) => {
    try {
        const base64Url = token.split('.')[1]; // Берём Payload (вторая часть)
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Ошибка декодирования JWT:', error);
        return {};
    }
};

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [firstName, setFirstName] = useState('');
    const [middleName, setMiddleName] = useState('');
    const [nickname, setNickname] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = isLogin
            ? { username: nickname, password }
            : { firstName, middleName, username: nickname, email, password };

        if (isLogin) {
            internshipApi
                .post('/auth/sign-in', payload)
                .then((response) => {
                    console.log('Успешный логин:', response.data);
                    const accessToken = response.data.accessToken;
                    const refreshToken = response.data.refreshToken;
                    localStorage.setItem('accessToken', accessToken);
                    localStorage.setItem('refreshToken', refreshToken);

                    // Извлекаем роль из accessToken
                    const decodedToken = decodeJWT(accessToken);
                    const userRole = decodedToken.role || 'ROLE_USER'; // Предполагаем, что роль в поле "role"
                    localStorage.setItem('userRole', userRole);

                    navigate('/home');
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
                    setFirstName('');
                    setMiddleName('');
                    setNickname('');
                    setEmail('');
                    setPassword('');
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
                {!isLogin && (
                    <>
                        <input
                            type="text"
                            placeholder="Имя"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Фамилия"
                            value={middleName}
                            onChange={(e) => setMiddleName(e.target.value)}
                            required
                        />
                    </>
                )}
                <input
                    type="text"
                    placeholder="Никнейм"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
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