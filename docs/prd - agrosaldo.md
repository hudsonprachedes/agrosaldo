PRD – AgroSaldo (Versão Atualizada e Completa)
Documento de Requisitos do Produto

1. Resumo Executivo
O AgroSaldo é um microsaas de gestão pecuária e operações rurais voltado para produtores, gestores e operadores de campo, com acesso mobile offline-first e dashboard web. O sistema também possui um painel SuperAdmin para gestão completa da plataforma.

O app mobile permite lançamentos diários (nascimentos, mortalidade, vendas, vacinas, fotos, atualizações de estoque de outras espécies), tudo funcionando offline com sincronização automática quando houver internet.

O painel web permite consultas avançadas, análises financeiras, relatórios oficiais e administração do saldo. O SuperAdmin controla aprovações, planos, clientes e financeiro.

O produto tem ambição nacional, sem menções a órgãos estaduais de fiscalização.

2. Público‑Alvo
• Pecuaristas de pequeno a grande porte
• Gestores de fazenda
• Operadores de campo
• Produtores que usam apenas celular
• Administradores corporativos via Web
• SuperAdmins responsáveis por planos, cadastros e financeiro do SaaS

3. Objetivos do Produto
Simplificar a gestão do rebanho com lançamentos rápidos e offline.
Garantir precisão de estoque, operações e histórico auditável.
Permitir operação simples no campo, com interface clara e botões grandes.
Oferecer relatórios confiáveis para uso pessoal e gestão rural.
Criar uma plataforma SaaS escalável e multi-tenant.
Facilitar vendas do sistema com site institucional completo.
Integrar mobile + web com sincronização automática.
4. Plataformas
• Mobile: React Native (Offline-first, fotos locais, sync automático)
• Web: Next.js + Tailwind + shadcn/ui
• Multi-tenant completo
• Painel Super admin com módulos avançados

5. Funcionalidades Principais (Mobile)
5.1. Header Inteligente
• Selecionar propriedade
• Botão de logout
• Botão de sincronização manual
• Barra de status (Verde / Amarelo / Vermelho) indicando sincronização

5.2. Grid de Ações (6 botões)
Nascimento – Verde – Ícone Bezerro
Mortalidade – Preto – Ícone Skull
Venda/Saída – Laranja – Ícone Caminhão
Vacinas – Azul – Ícone Seringa
Outras Espécies – Cinza – Ícone Pata
Ajuda (WhatsApp) – Verde WhatsApp
5.3. Lançamentos Offline
Todos os lançamentos ficam armazenados localmente (incluindo fotos).
Quando houver internet → sincronização automática.

5.3.1. Nascimento
• Data
• Sexo
• Quantidade
• Entrada automática em 0-4 meses

5.3.2. Mortalidade / Consumo Interno
• Data
• Faixa etária
• Tipo de baixa: Morte natural ou Consumo interno
• Foto obrigatória em morte natural
• Dedução imediata do estoque

5.3.3. Venda / Saída (Abate ou Engorda)
• Data
• Destino: Abate ou Engorda
• Comprador
• Quantidade por categoria
• Valor total em R$ (obrigatório)
• Número GTA (opcional)
• Dedução do estoque

5.3.4. Vacinas
• Data
• Campanha
• Aplicação em lote por categorias

5.3.5. Outras Espécies
• Ajuste simples de estoque para equinos, ovinos, suínos etc.

6. Funcionalidades Web (Produtor)
6.1. Dashboard
• Saldo total do rebanho
• Resumo de entradas e saídas
• Cards de Nascimentos / Mortes / Vendas
• Timeline

6.2. Relatórios & Espelho
• Tabela com estoque por faixa etária
• Histórico consolidado
• Geração de PDF
• Botão de compartilhar via WhatsApp

6.3. Análises e Gráficos
• Evolução do rebanho
• Taxa de mortalidade
• Preço médio de venda
• Fluxo de caixa
• Distribuição por destino (abate vs engorda)

7. Módulo SuperAdmin
7.1. Dashboard
• Total de clientes
• MRR
• Inadimplência
• Crescimento mensal
• Usuários ativos e inativos

7.2. Aprovação de Cadastros (Crítico)
• Lista de cadastros pendentes
• Aprovar ou rejeitar
• Motivo da rejeição
• Ativar cliente

7.3. Gestão de Clientes (CRM)
• Dados cadastrais
• Resetar senha
• Bloquear cliente
• Acessar painel como cliente (impersonate)
• Histórico de atividades

7.4. Gestão de Planos
Planos customizáveis:
• Nome
• Preço mensal
• Preço anual
• Limite de cabeças

Planos:
porteira - R$ 49,90 - até 500 cabeças
piquete - R$ 99,90 - até 1000 cabeças
retiro - R$ 149,90 - até 2000 cabeças
estância - R$ 249,90 - até 3000 cabeças
Barão - R$ 499,90 - gado ilimitado



7.5. Financeiro
• Histórico de pagamentos
• Correções, cobranças e suspensões
• Notificações automáticas de inadimplência

7.6. Comunicação (Broadcast)
• Envio de notificações push
• Mensagens segmentadas

7.7. Logs e Auditoria
• Erros
• Ações administrativas
• Acessos

8. Site Institucional
8.1. Sessões
• Hero comercial
• Sobre nós
• Missão, visão e valores
• Funcionalidades do sistema
• Prints do app e dashboard
• Planos e preços
• CTA para teste gratuito
• Contato (WhatsApp e email)

9. Regras Técnicas
9.1. Offline-first
• Banco local
• Fotos salvas localmente - comprimir primeiro para reduzir o tamanho antes de guardar no banco
• Sincronização automática com internet
• Sincronização manual no header

9.2. Multi-tenant
• Isolamento completo por empresa
• Perfis e permissões por usuário
• Múltiplas propriedades por empresa

9.3. Fotos e Evidências
• Guardar local primeiro
• comprimir o tamanho da foto antes de enviar para o banco
• Enviar ao servidor após sincronizar
• Usar estrutura otimizada

10. Requisitos Não Funcionais
• Performance alta em dispositivos simples
• Interface simples e direta
• Botões grandes para uso em campo
• Segurança forte (criptografia local + HTTPS)
• UX otimizada para operação com uma mão

11. Futuro (Roadmap de Evolução)
• Dashboard de safra estilo Gantt
• Integração com plataformas de risco
• Expansão do site institucional com blog
• Marketplace de serviços rurais

12. Conclusão
Este PRD reflete a versão mais atualizada e alinhada do AgroSaldo, consolidando todas as decisões e melhorias definidas ao longo da construção. O sistema está pronto para desenvolvimento imediato, com foco em operação mobile, gestão web completa e administração profissional via SuperAdmin.

✅ CORE PRINCIPAL DO SISTEMA — Evolução Automática do Rebanho (Texto Ajustado)
O AgroSaldo possui como núcleo fundamental o controle automático da evolução etária do rebanho. A partir do momento em que um animal nasce, o sistema deve acompanhar sua idade mês a mês e mover automaticamente cada cabeça para a faixa etária correta, sem qualquer ação manual do usuário.

✔ Regra Central (CORE)
Sempre que um animal completar a idade que o faz mudar de faixa, o sistema deve:

Adicionar +1 no saldo da nova faixa etária
Subtrair -1 da faixa anterior
Fazer isso de forma automática, diária e transparente
Garantir que o saldo total continue sempre fiel à realidade
Aplicar o cálculo a todos os animais criados por nascimento ou adicionados via saldo inicial
🧠 Como funciona (fluxo automático)
1. Registro de nascimento
Exemplo: nasceu 01/01
→ entra na faixa 0 a 4 meses.

2. Ao completar 5 meses
Exemplo: 01/05
→ o sistema move automaticamente para 5 a 12 meses.

3. Continuação automática
O processo se repete para todas as faixas subsequentes.

A lógica completa é assim:

Idade	Faixa
0–4 meses	Bezerro(a)
5–12 meses	Desmamado(a)
13–24 meses	Novilho(a)
25–36 meses	Sobreano / Vaca / Reprodutor jovem
36+ meses	Adultos


Obs: As faixas podem ser ajustadas conforme sua tabela final, mas o comportamento deve ser esse.

🔒 Objetivo da funcionalidade
Manter o saldo sempre atualizado, mesmo sem lançamentos manuais
Eliminar erros de digitação e cálculos manuais
Facilitar auditorias, relatórios e evolução histórica
Garantir confiança total nos números do rebanho
⚙️ Como o sistema calcula (regra técnica)
A cada dia, durante o processo de sincronização ou rotina agendada, o sistema deve:

Verificar a data de nascimento de cada animal
Calcular a idade em meses
Identificar em qual faixa ele deve estar
Comparar com a faixa atual
Se houver divergência → mover de uma faixa para outra
Tudo isso deve acontecer automaticamente, sem exigir que o produtor realize qualquer ajuste.

✅ Regra de Validação – Nascimentos x Matrizes (CORE DO SISTEMA)
O sistema deve impedir que o usuário registre um número de nascimentos maior do que a quantidade de fêmeas aptas a parir (matrizes) existentes no rebanho no momento do lançamento.

✔ Regra Oficial
Nascimentos do dia ≤ Total de Matrizes disponíveis

Se a quantidade de nascimentos informada for maior do que o número de matrizes existentes, o sistema deve bloquear o lançamento e exibir mensagem clara.

🔍 Como validar (lógica base)
Buscar o saldo atual de fêmeas adultas (matrizes)
Comparar com a quantidade de nascimentos lançados
Se exceder → rejeitar
Fórmula:
if (nascimentos_lançados > total_matrizes) {
   bloquear_lançamento
}
⚠️ Mensagem recomendada para o usuário
"Quantidade de nascimentos maior que o número de matrizes disponíveis.
Verifique o saldo antes de continuar."

🧠 Por que essa regra é importante?
Mantém a consistência do estoque
Evita fraudes ou erros de digitação
Garante que relatórios e evolução etária permaneçam confiáveis
Protege a lógica automática de evolução de faixas etárias
📌 Onde essa regra deve ser aplicada
App Mobile (imediato, antes de registrar)
Web (se houver lançamento manual)
API (back‑end)
Sincronização offline (validação ao enviar para o servidor)
🧩 Atenção especial no modo offline
Se o lançamento for feito offline, o sistema deve:

Aceitar temporariamente (para não travar o operador no campo)
Marcar como “pendente de validação”
Validar ao sincronizar
Se inválido →
• Rejeitar
• Informar ao usuário
• Permitir ajuste ou exclusão


## 🛠️ Tecnologias Utilizadas

### **Backend**
- **Node.js** + **Nest.js** - Framework backend modular e escalável
- **TypeScript** - Linguagem de programação
- **Prisma** - ORM para banco de dados
- **PostgreSQL** - Banco de dados principal
- **JWT** - Autenticação com refresh tokens
- **class-validator** + **class-transformer** - Validação e transformação de dados
- **@nestjs/swagger** - Documentação automática da API
- **Passport** - Estratégias de autenticação

### **Frontend**
- **React** + **TypeScript** - Interface do usuário
- **Vite** - Build tool
- **Tailwind CSS** - Estilização
- **shadcn/ui** - Componentes UI
- **ApexCharts** - Gráficos e visualizações
- **Nunito Sans** - Fonte principal (tema agro)

### **Segurança Multicamadas**
- **Helmet** - Headers de segurança obrigatórios
- **CORS** - Controle de origem restritivo
- **Rate Limiting** - Limitação de requisições por IP e usuário
- **bcryptjs** - Hash de senhas
- **SQL Injection Protection** - Validação automática de queries
- **XSS Protection** - Sanitização de inputs
- **JWT Blacklist** - Controle de tokens inválidos
- **Isolamento de Dados** - Filtro obrigatório por `empresaId` em todas as queries
- **Role-based Access Control** - Middleware `requireRole()` para controle granular