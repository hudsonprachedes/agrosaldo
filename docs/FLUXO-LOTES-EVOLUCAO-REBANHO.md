# AgroSaldo — Fluxo de Lotes e Evolução de Rebanho (Bovino + Bubalino)

## Objetivo (em 1 frase)
Garantir **saldo correto sem duplicação** e **evolução automática por idade** para `bovino` e `bubalino`, mantendo histórico de lançamentos e permitindo editar/excluir lançamentos com recomputação segura.

---

## Modelos (quem é o quê)

### 1) `Movimento`
- É o **histórico** do que aconteceu.
- Exemplos: `nascimento`, `compra`, `venda`, `morte`, `ajuste`, `vacina`.
- Campos relevantes:
  - `propriedadeId`
  - `especie` (`bovino` | `bubalino` | outras)
  - `sexo` (quando aplicável)
  - `faixaEtaria` (quando aplicável)
  - `quantidade`
  - `data`

### 2) `LoteRebanho` (tabela `HerdBatch`)
- É a **fonte da verdade operacional** para evolução e débito FIFO.
- Representa “coortes”/lotes com a mesma **data-base**.
- Campos relevantes:
  - `propriedadeId`
  - `especie` (`bovino` | `bubalino`)
  - `sexo`
  - `faixaInicial` (canônica, ex: `0-4m`)
  - `faixaAtual` (canônica, ex: `13-24m`)
  - `dataBase`
  - `quantidadeAtual`
  - `origem` (`saldo_inicial` | `nascimento` | `compra` | `ajuste`)

### 3) `Rebanho` (tabela `Livestock`)
- É um **espelho (cache)** do saldo atual por:
  - `propriedadeId + especie + sexo + faixaEtaria`
- Não é a fonte da verdade para evolução (quem envelhece é o lote).
- Continua existindo para:
  - retornar saldo rápido
  - alimentar dashboard/analytics
  - manter compatibilidade dos endpoints

---

## Regras de faixa etária (canônicas)
- `0-4m` (duração: 4 meses)
- `5-12m` (duração: 8 meses)
- `13-24m` (duração: 12 meses)
- `25-36m` (duração: 12 meses)
- `36+m` (infinito)

### Marcos de evolução
A evolução acontece quando completa o tempo dentro da faixa:
- `0-4m` -> `5-12m` ao completar **4 meses**
- `5-12m` -> `13-24m` ao completar **8 meses** adicionais
- `13-24m` -> `25-36m` ao completar **12 meses** adicionais
- `25-36m` -> `36+m` ao completar **12 meses** adicionais

---

## Fluxo principal: criar lançamento (MovementsService.create)

### Passo 0 — Determinar espécie
- Se o frontend enviar `species`, usamos esse valor.
- Se não enviar, **default é `bovino`** (retrocompatível).

### Passo 1 — Evoluir lotes até a data do evento
Antes de aplicar qualquer entrada/saída, o sistema roda:
- `evolveBatchesToDate(propertyId, species, eventDate)`

Se algum lote cruzou faixa, o sistema:
- ajusta `LoteRebanho.faixaAtual`
- aplica deltas no `Rebanho` (tira da faixa antiga e soma na nova)
- cria um `Movimento` do tipo `ajuste` com descrição:
  - `[SISTEMA] Evolução automática de faixa etária: ...`

### Passo 2 — Aplicar o movimento
Depende do tipo:

#### A) Entradas (criam lote)
- **`nascimento`**:
  - cria lote em `0-4m`
  - `dataBase = data do nascimento`
- **`compra`**:
  - cria lote na faixa informada
  - `dataBase = data da compra`
- **`ajuste`**:
  - cria lote na faixa informada
  - `dataBase = data do ajuste`

Em todos os casos, ao criar lote:
- incrementa `Rebanho` na faixa correspondente (espelho)

#### B) Saídas (debitam lote com FIFO)
- **`venda`** e **`morte`**:
  - debitam **FIFO** dos lotes (`LoteRebanho`) da mesma:
    - `especie`
    - `sexo`
    - `faixaAtual`
  - reduz `quantidadeAtual` dos lotes em ordem de `dataBase` mais antiga
  - aplica delta negativo no `Rebanho`

Se não houver saldo suficiente na faixa:
- retorna erro (`Saldo insuficiente...`)

---

## Fluxo para saldo inicial (AuthService.completeOnboarding)

Quando o usuário finaliza onboarding com um saldo inicial:
- o sistema apaga o que já existia de `bovino` e `bubalino` (espelho e lotes)
- cria lotes `LoteRebanho` para cada item informado
- cria movimentos `[SISTEMA] Saldo inicial (onboarding)`

### Regra importante (evitar “envelhecer pra trás”)
No saldo inicial:
- `dataBase = data do onboarding`

Ou seja: se o usuário colocou 100 animais em `0-4m` hoje, **eles só vão evoluir após 4 meses**, e não imediatamente.

---

## Fluxo de edição/exclusão de lançamento

### Por que precisa de rebuild?
Editar/excluir um movimento pode alterar saldos e lotes de forma complexa.

### Como garantimos consistência
Depois de `update` ou `delete`, o sistema roda:
- `rebuildFromMovements(propertyId)`

O rebuild faz:
- apaga lotes e espelho (`LoteRebanho` e `Rebanho`) de `bovino` e `bubalino`
- lê todos os movimentos dessas espécies em ordem cronológica
- reaplica a mesma regra do fluxo principal (incluindo FIFO e evoluções)
- ao final, evolui até “agora” e atualiza `quantidadeGado` na propriedade

Isso garante **zero duplicação** e **consistência determinística**.

---

## Por que NÃO remover `Rebanho` agora
Remover `Rebanho` implicaria:
- migrar schema com `DROP TABLE`
- reescrever endpoints/dashboards/queries que usam `rebanho`
- alterar contratos que o frontend já consome

A abordagem atual mantém:
- `LoteRebanho` como verdade para envelhecer/debitar
- `Rebanho` como espelho para leitura rápida e compatibilidade

---

## Checklist rápido (sanidade)
- Lançamentos de `bovino` e `bubalino` entram no mesmo motor
- Outras espécies continuam via ajuste simplificado (`unknown`/`all`)
- Evolução automática gera movimentos `[SISTEMA]` (apenas histórico)
- FIFO evita “vender animal que já evoluiu” ou duplicar contagem

---

## Exemplos rápidos

### Exemplo 1 — saldo inicial
- Hoje: onboarding com `bovino`, fêmea, `0-4m`, 100
- Resultado:
  - 1 lote em `LoteRebanho` com `dataBase=hoje`, `faixaAtual=0-4m`, `quantidadeAtual=100`
  - `Rebanho` espelha 100 em `bovino/femea/0-4m`
  - Só evolui para `5-12m` daqui a 4 meses.

### Exemplo 2 — venda
- Hoje: venda `bubalino`, macho, `25-36m`, 10
- Resultado:
  - debita FIFO dos lotes `bubalino/macho/25-36m`
  - reduz `Rebanho` nessa faixa
  - registra o movimento de venda normalmente
