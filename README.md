# Barbearia do Enzo — demonstração de agendamento

Site mobile primeiro para uma barbearia pequena: o cliente reserva sozinho e o profissional acompanha a agenda, inclusive em outra aba. Interface escura com dourado, fontes do sistema, ilustrações SVG locais, React 18, TypeScript, Vite e CSS puro. Sem backend, banco, variáveis de ambiente ou carregamento de fontes/imagens externas.

## Diagnóstico, preservação e decisões

Antes de qualquer alteração, `git status --short` estava limpo. A branch original é `work`. O estado anterior foi preservado na branch **`backup-antes-da-repaginacao`**, commit `5882637dee535b41b86500abe07da2aa5425458b`. O backup não deve ser apagado. Não houve push, deploy ou alteração de história publicada.

O projeto anterior usava React 19, TanStack Start/Router, Vite 8, Nitro e Tailwind, com dezenas de componentes Radix. O README citava npm, mas o único lockfile era `bun.lock` e havia `bunfig.toml`; por isso foi mantido **Bun**. Scripts antigos: `dev`, `build`, `build:dev`, `preview`, `lint`, `format`, `test`, `test:watch`. Node disponível no diagnóstico: **24.19.0**. Não havia pin de Node nem configuração exigindo versão da hospedagem; agora `.nvmrc` recomenda Node 20 e `engines` exige >=20.19.0.

A publicação existente está ligada ao Lovable. Não foram encontrados workflows GitHub Actions, `vercel.json`, `netlify.toml`, `CNAME`, `firebase.json`, Dockerfile, `wrangler.toml`, configuração Next, `homepage`, basePath ou subcaminho de GitHub Pages. O build anterior `npm run build` produzia `.output/public` e um módulo Cloudflare em `.output/server`, com configuração Wrangler gerada. **Esse comando e esses destinos foram mantidos**. A camada SSR/Nitro foi substituída por um módulo mínimo que entrega assets, gerado por `build/cloudflare.mjs`; nenhuma lógica de agendamento roda no servidor. A associação `.lovable/project.json` e as instruções `AGENTS.md` foram preservadas como metadados da plataforma. As configurações Vercel e Netlify foram acrescentadas para hospedagem estática e fallback de `index.html`. A configuração antiga do Vite foi necessariamente substituída para retirar os plugins TanStack, Tailwind e Nitro.

### Dados reaproveitados e fictícios

- Nome atualizado a pedido do usuário para **Barbearia do Enzo**. Foram mantidos o slogan **“Seu estilo, nossa paixão.”**, texto de apresentação, WhatsApp **55 62 99957-7706**, serviços/preços/durações: corte R$50/30min, barba R$40/30min, combo R$80/60min, sobrancelha R$20/15min, completo R$100/75min. Expediente seg–sáb 09h–20h, domingo fechado.
- O repositório não comprova que esses dados pertencem a uma empresa real; foram preservados como os dados mais específicos disponíveis. O WhatsApp não foi acionado nem validado externamente. O logo/foto solicitado ainda precisa ser anexado novamente para ser incorporado como asset local.
- Endereço **Rua das Estrelas, 123, São Paulo–SP** e nome **Rafael Lima** vieram do site anterior, mas aparentam ser demonstrativos: não devem ser apresentados como verificados. Foi escolhido um único profissional, com estrutura preparada para vários em `config.barbers`.
- Instagram `@barbeariadoenzo`, corte infantil R$35/30min, clientes, telefones de seed e ilustrações são fictícios. Os telefones de seed são deliberadamente não utilizáveis como números reais. Almoço recorrente seg–sex **11:30–13:30**, grade 30min, antecedência 1h e janela de 30 dias.
- Não havia fotos próprias ou logo local utilizáveis. As fotos eram hotlinks Unsplash: foram removidas, substituídas por SVGs locais desenhados para a demonstração. Não há imagens a otimizar herdadas.

## Rodar e testar

Use Node 20.19+ e **Bun 1.3.14**. Há apenas um lockfile, `bun.lock`, com versões diretas fixas. O `bunfig.toml` mantém a proteção de idade mínima das versões; não foram acrescentadas exceções.

```sh
bun install --frozen-lockfile
npm run dev
npx tsc --noEmit
npm run test
npm run build
npm run preview -- --host 0.0.0.0 --port 4173
```

`npm run` apenas executa os scripts; **não use npm install na pasta do projeto**, pois o gerenciador é Bun. Para a instalação inicial em uma máquina sem Bun, instale Bun 1.3.14 por um método oficial que preserve a verificação de TLS/integridade. No ambiente Codex, Bun está em `/workspace/.onboarding-tools/node_modules/.bin/bun`; o cache gravável está em `/workspace/.bun-cache`.

O teste Vitest cobre a lógica pura de `src/lib/availability.ts`: grade, sobreposições, limites contíguos, serviços longos, almoço, fechamento, bloqueios, folga, cancelamento, antecedência, virada de dia, janela, profissionais distintos e remarcação. Agenda usa strings de data e minutos; `Intl.DateTimeFormat` determina o relógio em **America/Bahia**, independentemente do fuso do dispositivo. UTC só é usado no DTSTAMP técnico do arquivo de calendário, nunca para converter as datas da agenda.

### Explorar a demonstração

1. Abra o site em duas abas da **mesma origem**. Na segunda, entre em `#/admin` com PIN **1234**.
2. Na primeira, escolha serviço, dia, horário, nome e WhatsApp com DDD. Confirme. O painel recebe aviso, contador e destaque por 20 segundos, sem recarregar. Ative o som no painel para ouvir um toque opcional depois de interação.
3. Na agenda, alterne Hoje/Semana, navegue entre datas e conclua, cancele, registre falta ou remarque. Cancelar libera a vaga. Remarcar revalida e move a mesma reserva. Reservas concluídas/faltas continuam ocupando o período histórico.
4. Crie reservas manuais; crie/remova bloqueios, folgas e almoço recorrente; edite serviços e expediente. Bloqueios/expediente que conflitam com reservas são recusados para evitar esconder atendimentos existentes. Remarque ou cancele primeiro.
5. Baixe um `.ics` na confirmação ou abra a mensagem de WhatsApp para enviar manualmente. Nenhuma mensagem é enviada automaticamente. O reset solicita confirmação apenas dentro do produto para proteger reservas locais e restaura 12 registros fictícios, serviços, expediente e almoço.

As visões Hoje/Semana resumem o dia selecionado ou os sete dias exibidos: atendimentos excluem cancelados/faltas, faturamento previsto inclui confirmados/concluídos e realizado inclui apenas concluídos. Preço e duração ficam registrados na reserva; edição do catálogo não altera retroativamente reservas existentes. Serviços novos começam desativados para permitir edição antes de exibir ao cliente.

## Deploy e subcaminhos

Build: **`npm run build`**. A pasta estática é **`.output/public`**, contendo `index.html`, assets e imagens. Não publique `src` nem a raiz do repositório. Vercel e Netlify usam as configurações presentes. Em Cloudflare Pages, publique `.output/public`; o `_worker.js` encaminha ao binding `ASSETS`. Em Cloudflare Workers com assets, use `.output/server/wrangler.json`, gerado no build (main `index.mjs`, assets `../public`). `.wrangler/deploy/config.json` mantém a indicação desse destino. A publicação na conta Lovable/Cloudflare depende do fluxo da plataforma; não foi realizada nem comprovada remotamente por esta tarefa.

Navegação manual por hash: `#/`, `#/agendar`, `#/admin`. `base: './'` e referências `import.meta.env.BASE_URL` permitem servir o resultado em subpastas estáticas sem reescrever rotas. Nenhum subcaminho específico estava configurado antes. Caso o domínio real exija um prefixo explícito, ajuste `base` e teste nesse prefixo antes de publicar. Não houve arquivo CNAME a preservar.

## Personalizar

Edite **`src/config.ts`** para nome, slogan, cores, contatos, endereço, profissional, serviços, preços, durações, funcionamento e regras de agenda. Alterações dos valores iniciais aparecem após resetar a demonstração, pois preferências já salvas no navegador são preservadas. Imagens estão em **`public/images/`**: hero atmosférico, avatar, ilustrações dos serviços e Open Graph. Substitua por fotos próprias autorizadas e otimizadas (WebP/AVIF, largura adequada); ajuste os caminhos no Home/config e textos alternativos. As fontes usam system-ui e Georgia, sem CDN. Atualize também os metadados estáticos em `index.html` e a arte Open Graph ao trocar a identidade. JSON-LD e título em execução refletem config.

Ocorrências de `http`: `wa.me`, Google Maps e Instagram são links de navegação opcionais. `https://schema.org` é vocabulário JSON-LD; `http://www.w3.org/2000/svg` é namespace XML. Nenhum deles carrega recursos externamente para renderizar o site. O módulo Cloudflare usa `env.ASSETS.fetch` apenas para entregar arquivos locais da hospedagem, sem chamar API externa.

## Limitações e versão real

**É uma demonstração**, não um sistema de produção com autenticação. PIN 1234 está no código; a rota/hash e dados podem ser alterados pelo usuário. Não insira dados pessoais reais. `localStorage` (`barbearia-demo-v1`) só persiste no mesmo navegador/origem; BroadcastChannel sincroniza abas, com fallback para evento storage. Leitura/gravação são protegidas por try/catch e há fallback em memória com aviso quando storage falha. Sem storage persistente, novas abas/sessões não têm garantia de recuperação.

Web Locks serializa confirmações entre abas na mesma origem quando suportado. Todos os fluxos revalidam antes de gravar; navegadores sem Web Locks e dispositivos distintos não têm garantia transacional. Reservas offline não chegam a outra pessoa ou dispositivo. Nenhuma mensagem externa é disparada durante os testes.

Para versão real: backend com banco e restrição transacional de conflitos, autenticação/autorização do painel, múltiplos dispositivos, HTTPS, monitoramento, backups, tratamento de fuso, validação no servidor, lembretes oficiais automáticos por WhatsApp e política de consentimento/retenção/exclusão conforme LGPD. Confirmar endereço, contato, Instagram, fotos e permissões de uso antes de apresentar como negócio real.

## Verificação da repaginação

O resultado das verificações finais e do teste funcional em navegador está registrado abaixo após a execução. Não há dependências UI, router externo, Tailwind, biblioteca de datas ou animação. As únicas dependências diretas são as permitidas no pedido. O backup anterior segue intacto.

### Resultados finais

- Instalação limpa com Bun 1.3.14: concluída; repetição `bun install --frozen-lockfile`: sem alterações.
- `npx tsc --noEmit`: passou; validação também com Node **20.19.0**.
- `npm run test`: **15 testes passaram**, 1 arquivo, sem testes pulados.
- `npm run build` com Node 20.19.0: passou sem warnings de build; `.output/public/index.html` e saídas Cloudflare presentes. JS ~182,46 kB (58,68 kB gzip), CSS ~22,74 kB (5,43 kB gzip).
- Preview: HTML, hero e favicon responderam **HTTP 200**, com conteúdo esperado. Os processos de preview e servidor de subcaminho foram encerrados após a validação.
- Chromium real, 360px, duas abas: reserva completa, sucesso, download ICS, vaga ocupada removida, cancelamento liberando vaga, agenda/aviso/contador/destaque, reserva manual, remarcação sem duplicar, conclusão, falta, bloqueios avulso/dia inteiro, edição/criação/desativação de serviços, alteração de expediente/almoço e reset de 12 registros passaram.
- Confirmações concorrentes em duas abas: apenas uma reserva gravada; a outra voltou à grade com mensagem amigável.
- BroadcastChannel desabilitado: fallback `storage` passou. localStorage bloqueado: fallback em memória com aviso e reserva passou.
- Mobile: botão fixo visível no site, ausente no fluxo; sem overflow horizontal em 360px, inclusive todas as abas do painel autenticado. Capturas mobile/desktop foram inspecionadas.
- Subcaminho `/companion/`: assets relativos e navegação por hash passaram.
- Sem erros de JavaScript ou requisições externas durante o fluxo principal; busca de resíduos não encontrou imports/assets de TanStack, Nitro, Tailwind, UI antiga ou hotlinks em src/public/index.html. Metadados Lovable foram preservados conscientemente.
- Dependências diretas conferidas contra a lista permitida, apenas `bun.lock`; `git diff --check` passou. Nenhum deploy/push foi feito. A compatibilidade remota da conta Lovable/Cloudflare permanece dependente da publicação na plataforma; foi validada a saída local, sem alegar deploy remoto.

As instruções reutilizáveis de instalação e início do ambiente Codex foram atualizadas em rascunho para Node 20, Bun e o novo site estático. Elas deixam de referenciar a página HTML antiga; salvar o rascunho não publica o site nem executa deploy.
