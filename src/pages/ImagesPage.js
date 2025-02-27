import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllImages, uploadImage, deleteImageByFilename, getImageByFilename } from '../api';
import '../styles/ImagesPage.css';

const ImagesPage = () => {
    const navigate = useNavigate();
    const [images, setImages] = useState([]);
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const userRole = localStorage.getItem('userRole');

    useEffect(() => {
        getAllImages()
            .then((response) => {
                console.log('Полный ответ от /images/all:', response.data);
                const imageData = response.data.map((image) => {
                    const byteCharacters = atob(image.content);
                    const byteArray = new Uint8Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteArray[i] = byteCharacters.charCodeAt(i);
                    }
                    const blob = new Blob([byteArray], { type: image.contentType });
                    const url = URL.createObjectURL(blob);
                    return { ...image, url };
                });
                setImages(imageData);
            })
            .catch((error) => {
                console.error('Ошибка загрузки изображений:', error);
                if (error.response?.status === 401) {
                    navigate('/');
                }
            });
    }, [navigate]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            const url = URL.createObjectURL(selectedFile);
            setPreviewUrl(url);
        }
    };

    const handleUpload = () => {
        if (file) {
            uploadImage(file)
                .then((response) => {
                    console.log('Изображение загружено, ID:', response.data);
                    getAllImages().then((res) => {
                        const imageData = res.data.map((image) => {
                            const byteCharacters = atob(image.content);
                            const byteArray = new Uint8Array(byteCharacters.length);
                            for (let i = 0; i < byteCharacters.length; i++) {
                                byteArray[i] = byteCharacters.charCodeAt(i);
                            }
                            const blob = new Blob([byteArray], { type: image.contentType });
                            const url = URL.createObjectURL(blob);
                            return { ...image, url };
                        });
                        setImages(imageData);
                    });
                    setFile(null);
                    setPreviewUrl(null);
                })
                .catch((error) => console.error('Ошибка загрузки:', error));
        }
    };

    const handleDelete = (filename) => {
        deleteImageByFilename(filename)
            .then(() => {
                console.log('Удалено изображение:', filename);
                setImages(images.filter((img) => img.filename !== filename));
            })
            .catch((error) => console.error('Ошибка удаления:', error));
    };

    const handleDownload = (filename) => {
        getImageByFilename(filename)
            .then((response) => {
                console.log('Скачивание изображения:', filename);
                const blob = new Blob([response.data], { type: response.headers['content-type'] });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            })
            .catch((error) => console.error('Ошибка скачивания:', error));
    };

    const handleBack = () => {
        navigate('/home');
    };

    return (
        <div className="images-page">
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
                <h1>Галерея книжных обложек</h1>
                <div className="image-list">
                    {userRole === 'ROLE_ADMIN' && (
                        <div className="image-item upload-card">
                            {previewUrl ? (
                                <img src={previewUrl} alt="Preview" className="image-preview" />
                            ) : (
                                <label className="upload-plus">
                                    <input type="file" onChange={handleFileChange} style={{ display: 'none' }} />
                                    <span>+</span>
                                </label>
                            )}
                            <div className="image-info">
                                <p>{file ? file.name : 'Добавить обложку'}</p>
                                {file && (
                                    <>
                                        <p>Размер: {Math.round(file.size / 1024)} КБ</p>
                                        <button onClick={handleUpload} className="upload-button">
                                            Загрузить
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                    {images.map((image) => (
                        <div key={image.id} className="image-item">
                            <img
                                src={image.url}
                                alt={image.filename}
                                className="image-preview"
                                onError={(e) => console.error('Ошибка отображения:', image.filename, e.target.src)}
                                onLoad={() => console.log('Изображение загружено:', image.filename)}
                            />
                            <div className="image-info">
                                <p>{image.filename}</p>
                                <p>Загружено: {new Date(image.uploadDate).toLocaleDateString()}</p>
                                <p>Размер: {Math.round(image.length / 1024)} КБ</p>
                                <button onClick={() => handleDownload(image.filename)} className="download-button">
                                    Скачать
                                </button>
                                {userRole === 'ROLE_ADMIN' && (
                                    <button onClick={() => handleDelete(image.filename)} className="delete-button">
                                        Удалить
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default ImagesPage;