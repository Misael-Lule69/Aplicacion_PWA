-- Script SQL para crear la base de datos y la tabla de contactos
CREATE DATABASE IF NOT EXISTS aplicacion_pwa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE aplicacion_pwa;

CREATE TABLE IF NOT EXISTS contactos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellidos VARCHAR(150) NOT NULL,
  edad TINYINT UNSIGNED NOT NULL,
  mensaje TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Fin
