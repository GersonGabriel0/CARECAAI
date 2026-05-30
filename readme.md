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

No PHP, habilite `pdo_mysql` e pelo menos uma forma de realizar requisicoes
HTTPS: a extensao `curl` ou `allow_url_fopen` com suporte a OpenSSL.

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

Nunca envie `api/config/database.php`, `api/config/gemini.php` ou
`api/config/xai.php` para o GitHub.

## Estado atual

- Pagina inicial responsiva.
- Upload de imagem analisado pelo Gemini.
- Seletor de IA: Gemini ou Grok para analise e para o filtro.
- Bald Mode propositalmente dificil de ler.
- Login por usuario e foto integrado ao PHP/MySQL.
- Ranking e galeria alimentados pelos usuarios cadastrados.
- Script SQL para criar a tabela `rankings`.

## Proximas entregas

1. Salvar os arquivos enviados e exibi-los na galeria.
2. Montar o painel visual com todas as metricas da analise.
3. Substituir os mocks restantes da galeria pelo banco.
4. Salvar a imagem editada quando o usuario aplicar o filtro por IA.
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
