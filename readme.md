# CarecAI

> Ciência avançada para superficies brilhantes.

Sistema web criado para hackathon. O CarecAI recebe uma foto, gera metricas
humoristicas e registra as melhores pontuacoes em um ranking de carecas.

## Stack

![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23F7DF1E.svg?style=for-the-badge&logo=javascript&logoColor=black)
![PHP](https://img.shields.io/badge/php-%23777BB4.svg?style=for-the-badge&logo=php&logoColor=white)
![MySQL](https://img.shields.io/badge/mysql-%2300f.svg?style=for-the-badge&logo=mysql&logoColor=white)

### Inteligencias Artificiais
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-8E75C2?style=for-the-badge&logo=googlegemini&logoColor=white)
![xAI Grok](https://img.shields.io/badge/xAI%20Grok-000000?style=for-the-badge&logo=xai&logoColor=white)

> **Configuracao do PHP:** Habilite `pdo_mysql` e pelo menos uma forma de realizar requisições HTTPS: a extensão `curl` ou `allow_url_fopen` com suporte a OpenSSL. 

No Windows, localize o arquivo carregado com:

```bash
php --ini
```

Depois habilite no `php.ini`, removendo o `;` do inicio das linhas:

```ini
extension=openssl
extension=curl
extension=pdo_mysql
```

## Estrutura

```txt
CARECA/
  api/
    config/
      database-example.php   Modelo de configuracao local
      gemini-example.php     Modelo da chave da API Gemini
      xai-example.php        Modelo da chave da API xAI
    analisar.php             Analise da foto com Gemini e login
    aplicar-filtro.php       Edicao careca da foto com xAI
    ranking.php              Ranking dinamico dos usuarios cadastrados
    tapas.php                GET fotos com contagem e POST tapa
  assets/
    css/
      style.css              Layout, responsividade e Bald Mode
    images/                  Imagens do projeto
    js/
      index.js               Bald Mode da landing
      app.js                 Upload e analise com Gemini
      ranking.js             Ranking, fotos e frases aleatorias do JSON
      galeria.js             Galeria dinamica de tapas e animacoes
      json_textos.json       Frases de zoeira por classificacao
      login.js               Login por foto conectado ao PHP
  database/
    schema.sql               Banco, tabelas e dados de teste
  index.html                 Landing page
  analise.html               Tela de upload e analise
  ranking.html               Tela do ranking
  galeria.html               Galeria de tapas (feed estilo insta)
  login.html                 Tela de login
```

## Preparando o ambiente

1. Instale XAMPP, Laragon ou outro ambiente com PHP e MySQL.
2. Coloque o projeto na pasta publica do servidor.
3. Execute `database/schema.sql` no MySQL.
4. Copie `api/config/database-example.php` para `api/config/database.php`.
5. Ajuste as credenciais no arquivo criado.
6. Copie `api/config/gemini-example.php` para `api/config/gemini.php`.
7. Informe sua chave da API Gemini no arquivo criado.
8. Copie `api/config/xai-example.php` para `api/config/xai.php`.
9. Informe sua chave da API xAI no arquivo criado.
10. Abra o projeto no navegador.

Exemplo com o servidor embutido do PHP:

```bash
C:\xampp\php\php.exe -S localhost:8000
php -S localhost:8000
```

Depois acesse:

```txt
http://localhost:8000
```

Segurança: Nunca envie api/config/database.php, api/config/gemini.php ou api/config/xai.php para o GitHub. Certifique-se de que eles estão listados no seu arquivo .gitignore.

## Demonstração

### Página Inicial

![Página Inicial](assets/images/home.png)

### Tela de Login

![Tela de Login](assets/images/analise.png)

### Tela de Análise de acesso

![Tela de Análise de acesso](assets/images/analise.png)

### Relatório de análise

![Relatório de análise](assets/images/ranking.png)

### Certificado análise

![Certificado análise](assets/images/ranking.png)

### Galeria

![Galeria](assets/images/ranking.png)

### Ranking

![Ranking](assets/images/ranking.png)

### Ringue

![Ringue](assets/images/ranking.png)

### Dark Mode brilho careca

![Dark Mode brilho careca](assets/images/ranking.png)


## Equipe

### Gerson
![Gerson](assets/Readme/Pessoas/Gerson.png)

**Analista de Software Sênior**

---

### Guilherme
![Guilherme](assets/Readme/Pessoas/Guilherme.png)

**Estudante de Engenharia de Software**

---

### Thomaz
![Thomaz](assets/Readme/Pessoas/Thomaz.png)

**Estudante de Engenharia de Software**

---

### Ketlyn
![Ketlyn](assets/Readme/Pessoas/Ketlyn.png)

**Estudante de Ciência da Computação**
