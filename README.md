# ANY App — Medicina de Emergência

Ferramentas de apoio à decisão clínica para o departamento de emergência. Em produção em https://any.app.br.

## Onde está o quê

| Pasta | O que é | Estado |
|---|---|---|
| `v2/` | O app atual: React 19, TypeScript, Vite, Tailwind v4. Código em `v2/src/`, uma página por ferramenta em `v2/src/pages/`. | **Atual.** Vive na branch `v4`. |
| `v2/public/hetrinped/` | HETRIN Ped Guide: versão standalone do Ped Guide com a identidade do Hospital Estadual de Trindade. Um HTML único, offline, sem login. | **Atual** (v1.1.5). Publicado em https://hetrinped.netlify.app |
| `tools/`, `hub/`, `deploy/`, `build_combined.py` | O v1: monólito em HTML, CSS e JavaScript puros. `deploy/index.html` é o build combinado com todas as ferramentas. | Legado. Mantido como referência visual do v4. Não recebe mudanças. |
| `v4-handoff/` | Documentos de contexto escritos em abril de 2026 para iniciar o v4. | Histórico. |
| `CLAUDE.md` | Diretriz completa de desenvolvimento: regras, design system, linguagem clínica, checklist de deploy. | Leitura obrigatória antes de qualquer código. |

## Branches

- `v4` é a branch de trabalho e a padrão. Tudo que está no ar sai daqui.
- `main` é o v1 legado. Não recebe mais push.
- `handoff/v2-pre-launch` foi a fonte original do HETRIN. O conteúdo está espelhado em `v4`.

## Como rodar

```bash
cd v2
npm install
npm run dev
```

O login usa Google via Supabase. Para desenvolvimento local, `VITE_DEV_BYPASS_AUTH=1` em `v2/.env.local` dispensa o login; só tem efeito em modo dev, nunca no build de produção.

## Como publicar

O deploy é manual, por CLI. Nenhum site reconstrói sozinho a partir do git.

**App (any.app.br):**

```bash
cd v2 && npm run build
netlify deploy --prod --dir dist --site 0b8eea36-d3c5-40a4-85b0-19b302497f1c
```

**HETRIN (hetrinped.netlify.app):**

1. Editar `v2/public/hetrinped/index.html`. Subir a versão no rodapé e o `CACHE_NAME` em `sw.js`; sem isso os celulares seguem no cache antigo.
2. Copiar a pasta para um diretório vazio e, de lá, rodar `netlify deploy --prod --dir . --site 5e9b4e8e-eaa4-4986-87ec-d48e210016dd`.

## Conteúdo clínico

O Ped Guide do app (`v2/src/pages/PedGuide.tsx`) e o HETRIN carregam cada um a própria cópia do conteúdo clínico. Mudou uma dose em um, refletir no outro. Comparar sempre por `id`, nunca por nome: cetamina, propofol e bicarbonato existem mais de uma vez, com ids e doses diferentes.

Toda informação clínica precisa de fonte. As referências aceitas estão no `CLAUDE.md`. A biblioteca de PDFs fica fora do repositório, na pasta do OneDrive.
