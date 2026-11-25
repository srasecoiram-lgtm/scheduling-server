# Scheduling Server

Dashboard para gerenciamento de agendamentos de recursos, com backend FastAPI e frontend standalone em HTML/CSS/JS.

## Visão geral

Aplicação web para criar, listar, filtrar e cancelar agendamentos de recursos (salas, projetores, etc.), com notificações por usuário e atualizações em tempo real via WebSocket.

## Estrutura do repositório

```
.
├── index.html        # Ponto de entrada da aplicação
├── css/
│   └── style.css     # Estilos globais e componentes
├── js/
│   ├── api.js        # Camada HTTP + WebSocket + utilitários
│   └── app.js        # Renderização e fluxos da UI
└── README.md
```

## Endpoints consumidos (backend)

A URL do backend é configurada em `js/api.js` via `const API = 'http://localhost:8000'`.

- `GET /schedules` — lista com filtros opcionais `resource_id` e `owner`
- `POST /schedules` — cria agendamento
- `DELETE /schedules/:id` — cancela agendamento
- `GET /notifications/:userId` — notificações de um usuário
- `WS /ws` — atualizações em tempo real

## Regras de negócio

- Campos obrigatórios para criar: `resource_id`, `owner`, `title`, `start`, `end`
- `end` deve ser maior que `start`
- Conflito de horário: o backend retorna mensagem e a UI exibe banner de aviso
- Cada agendamento cancelado gera notificação do tipo `schedule_cancelled`

## Como rodar

1. Suba o backend FastAPI na porta 8000
2. Ajuste `API` em `js/api.js` se necessário
3. Abra `index.html` em qualquer navegador

## Stack

- Frontend: HTML5 + CSS variables + JavaScript vanilla
- Backend esperado: FastAPI + WebSocket
- Ícones: Tabler Icons (CDN)
