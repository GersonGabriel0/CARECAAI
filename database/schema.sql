CREATE DATABASE IF NOT EXISTS carecai
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE carecai;

-- login por foto: tipo e score substituem senha

CREATE TABLE IF NOT EXISTS usuarios (
    id   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario VARCHAR(60) NOT NULL UNIQUE,
    tipo    ENUM('careca', 'calvo') NOT NULL,
    score   TINYINT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- galeria: fotos e tapas
CREATE TABLE IF NOT EXISTS fotos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL,
    arquivo    VARCHAR(255) NOT NULL DEFAULT 'placeholder',
    score      TINYINT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- tapa (careca) ou maquinada (calvo): uma interacao por usuario por foto
CREATE TABLE IF NOT EXISTS interacoes (
    foto_id    INT UNSIGNED NOT NULL,
    usuario_id INT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (foto_id, usuario_id),
    FOREIGN KEY (foto_id)    REFERENCES fotos(id)    ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
