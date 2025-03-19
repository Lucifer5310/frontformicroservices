import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import RoomPage from "./pages/RoomPage";
import AdminPage from './pages/AdminPage';
import AuthorPage from "./pages/AuthorPage";
import ImagesPage from "./pages/ImagesPage";
import BookPage from "./pages/BookPage";
import ShelfPage from "./pages/ShelfPage";
import Bookcase from "./pages/Bookcase";
import UsersPage from "./pages/UsersPage";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<AuthPage />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/client/:id" element={<RoomPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/bookcase" element={<Bookcase />} />
                <Route path="/shelf" element={<ShelfPage />} />
                <Route path="/book" element={<BookPage />} />
                <Route path="/author" element={<AuthorPage />} />
                <Route path="/images" element={<ImagesPage />} />
            </Routes>
        </Router>
    );
}

export default App;