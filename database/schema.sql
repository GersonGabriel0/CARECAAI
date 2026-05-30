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

-- rankeamento da careca perfeita
CREATE TABLE IF NOT EXISTS rankings (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL,
    name  VARCHAR(80) NOT NULL,
    score TINYINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
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

CREATE TABLE IF NOT EXISTS tapas (
    foto_id    INT UNSIGNED NOT NULL,
    ip         VARCHAR(45) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (foto_id, ip),
    FOREIGN KEY (foto_id) REFERENCES fotos(id) ON DELETE CASCADE
);

-- ================================================================
-- DADOS DE TESTE
-- tipo: careca >= 80 pts | calvo < 80 pts
-- ================================================================

INSERT INTO usuarios (usuario, tipo, score) VALUES
    ('gerson',        'careca', 97),
    ('gui',           'careca', 89),
    ('kety',          'calvo',  72),
    ('thomaz',        'calvo',  34),
    ('gabriel_nunes', 'careca', 95),
    ('giokozz',       'careca', 88),
    ('lojhan',        'calvo',  61);

-- uma foto por usuario para popular a galeria
INSERT INTO fotos (usuario_id, arquivo, score) VALUES
    (1, 'placeholder', 97),
    (2, 'placeholder', 89),
    (3, 'placeholder', 72),
    (4, 'placeholder', 34),
    (5, 'placeholder', 95),
    (6, 'placeholder', 88),
    (7, 'placeholder', 61);

-- usuario_id: 1=gerson 2=gui 3=kety 4=thomaz 5=gabriel_nunes 6=giokozz 7=lojhan
INSERT INTO rankings (usuario_id, name, score, created_at) VALUES
    (1, 'Gerson O Cara Brilhante',     97, '2026-05-28 10:15:00'),
    (2, 'Gui Caveira de Luz',          89, '2026-05-28 11:30:00'),
    (3, 'Kety Reflexo Solar',          72, '2026-05-28 14:00:00'),
    (4, 'Thomaz Primeiro Fio Caindo',  34, '2026-05-28 16:45:00'),
    (5, 'Gabriel Nunes Careca Total',  95, '2026-05-29 09:00:00'),
    (6, 'Giokozz Careca Ofuscante',    88, '2026-05-29 10:20:00'),
    (7, 'Lojhan Calvo Aspirante',      61, '2026-05-29 13:10:00');
