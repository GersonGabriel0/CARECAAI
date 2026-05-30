# CarecAI

> Ciencia avancada para superficies brilhantes.

Sistema web criado para hackathon. O CarecAI recebe uma foto, gera metricas
humoristicas e registra as melhores pontuacoes em um ranking de carecas.

## Stack

- HTML
- CSS
- JavaScript
- PHP
- MySQL

## Estrutura

```txt
CARECA/
  api/
    config/
      database.example.php   Modelo de configuracao local
    ranking.php              GET e POST do ranking
    tapas.php                GET fotos com contagem e POST tapa
  assets/
    css/
      style.css              Layout, responsividade e Bald Mode
    images/                  Imagens do projeto
    js/
      index.js               Bald Mode da landing
      app.js                 Logica de upload e analise simulada
      ranking.js             Consumo da API de ranking
      galeria.js             Galeria de tapas e animacoes
      login.js               Validacao do formulario de login
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
4. Copie `api/config/database.example.php` para `api/config/database.php`.
5. Ajuste as credenciais no arquivo criado.
6. Abra o projeto no navegador.

Exemplo com o servidor embutido do PHP:

```bash
php -S localhost:8000
```

Depois acesse:

```txt
http://localhost:8000
```

Nunca envie `api/config/database.php` para o GitHub.

## Estado atual

- Pagina inicial responsiva.
- Upload de imagem com analise simulada.
- Bald Mode propositalmente dificil de ler.
- Tela inicial de login pronta para integrar com o backend.
- Endpoint PHP do ranking com listagem e cadastro.
- Script SQL para criar a tabela `rankings`.

## Proximas entregas

1. Criar tabela de usuarios e endpoint PHP de autenticacao.
2. Montar o painel visual com todas as metricas da analise.
3. Consumir `api/ranking.php` no frontend.
4. Salvar a pontuacao do usuario autenticado.
5. Melhorar responsividade e incluir imagens.

## Divisao da equipe

| Responsavel | Nivel | Entrega | Arquivos principais |
| --- | --- | --- | --- |
| Tech lead | Senior (5 anos) | Backend PHP, autenticacao, integracao, deploy e code review de todos os PRs | `api/`, `database/` |

| Dev 1 | gui | Painel de resultado (HTML + JS) e consumo da API de ranking | `index.html`, `assets/js/app.js` |

| Dev 2 | kety | Layout completo, Bald Modonsividade | `assets/css/style.css`, `assets/js/login.js` |

| Dev 3 | thomaz | Estrutura HTML e CSS da tela de login, imagens e conteudo textual (sem JS) | `login.html`, `assets/images/` |

## Fluxo de trabalho

Cada pessoa deve criar uma branch para sua tarefa:

```bash
git checkout main
git pull
git checkout -b feat/nome-da-tarefa
```

Depois das alteracoes:

```bash
git add .
git commit -m "feat: descreva sua entrega"
git push -u origin feat/nome-da-tarefa
```

Abra um Pull Request para `main`. Evite alterar arquivos fora da sua tarefa sem
combinar com a equipe, principalmente `index.html` e `assets/css/style.css`.

Branches iniciais sugeridas tech lead:

```txt
feat/auth-api
feat/result-panel
feat/ranking-ui
feat/bald-mode
```