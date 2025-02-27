import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import RoomPage from "./pages/RoomPage";
import AdminPage from './pages/AdminPage';
import AuthorPage from "./pages/AuthorPage";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<AuthPage />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/client/:id" element={<RoomPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/admin/users" element={<div>Пользователи (в разработке)</div>} />
                <Route path="/admin/client" element={<div>Клиенты (в разработке)</div>} />
                <Route path="/admin/book" element={<div>Книги (в разработке)</div>} />
                <Route path="/admin/author" element={<div>Авторы (в разработке)</div>} />
                <Route path="/admin/bookcase" element={<div>Шкафы (в разработке)</div>} />
                <Route path="/admin/shelf" element={<div>Полки (в разработке)</div>} />
                <Route path="/books" element={<div>Библиотека (в разработке)</div>} />
                <Route path="/author" element={<AuthorPage />} />
            </Routes>
        </Router>
    );
}

export default App;