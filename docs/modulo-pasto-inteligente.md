============================== PROMPT PROFISSIONAL

“MÓDULO DE Pasto Inteligente
Você é um especialista sênior em desenvolvimento de sistemas agropecuários e sua tarefa é criar um módulo completo, altamente visual, intuitivo e lúdico para produtores rurais.
O módulo deve incluir:

• Cadastro de PROPRIEDADES
• Cadastro de PIQUETES vinculados a cada propriedade
• Controle de manejo do gado por piquete
• Distribuição dos lotes por piquete
• Cálculo da capacidade de suporte
• Alertas inteligentes
• Mapa satelital (OpenStreetMap) exibindo propriedades, piquetes e quantidade de animais
• Navegação extremamente simples e visual

Sempre com foco em: facilidade, clareza e usabilidade no celular.


=========================== ABAS DO MÓDULO (UX super simples, lúdico e intuitivo, visão web e mobile (igual um app))

o módulo Pasto Inteligente deve ter essas abas:

1) Propriedades
• Lista de propriedades
• Cadastro rápido
• Selecionar a propriedade antes de ver piquetes
• Ícone de mapa / fazenda

2) Piquetes
• Lista dos piquetes da propriedade selecionada
• Cadastrar piquete
• Editar área, tipo de pasto
• Ver lotação atual e alerta de capacidade

3) Mapa Satelital
• OpenStreetMap
• Piquetes desenhados como polígonos
• Cada piquete com número de animais
• Cores: verde, amarelo, vermelho
• Toque abre painel lateral do piquete

4) Manejo do Gado
• Mover lote entre piquetes
• Ver quantos animais estão no piquete
• Registrar entrada/saída
• Visualização lúdica e simplificada

5) Capacidade de Suporte
• Cálculo automático
• Dias de suporte do pasto
• Consumo vs oferta
• Alertas (verde/amarelo/vermelho)
• Texto explicativo simples para o produtor

=========================== COMO FICA NA PRÁTICA (exemplo final)

Nome do módulo: Pasto Inteligente
Abas:

Propriedades
Piquetes
Mapa Satelital
Manejo
Capacidade

============================== 1) OBJETIVO DO MÓDULO Criar uma experiência simples e completa para o produtor:

• cadastrar propriedades
• desenhar ou registrar piquetes dentro de cada propriedade
• visualizar o rebanho distribuído no mapa satelital
• entender se o pasto aguenta o lote
• ver rapidamente: onde o gado está, quanto gado tem e por quanto tempo aguenta

Tudo deve ser muito intuitivo, com linguagem simples de fazenda.

============================== 2) CADASTRO DE PROPRIEDADES (OBRIGATÓRIO)

Cada propriedade deve conter: • nome da propriedade
• localização geográfica
• área total
• opcional: código de inscrição estadual, município, etc.

Fluxo simples: • “Adicionar Propriedade”
• escolher ponto no mapa ou digitar endereço
• marcar área (se aplicável)
• salvar

O produtor precisa entender facilmente que cada propriedade pode ter vários piquetes.

============================== 3) CADASTRO DE PIQUETES (DENTRO DA PROPRIEDADE)

Cada piquete deve conter: • nome
• área em hectares
• tipo de pastagem
• produção estimada de matéria seca (kg MS/ha/dia)
• polígono desenhado no mapa dentro da propriedade

Fluxo visual: • acessar uma propriedade
• clicar em “Adicionar Piquete”
• desenhar no mapa com o dedo
• preencher dados básicos
• salvar

============================== 4) DISTRIBUIÇÃO DE LOTES NO PIQUETE O usuário deve conseguir:

• escolher o piquete
• adicionar lote(s) de animais
• definir quantidade, faixa etária e data de entrada
• mover rapidamente de um piquete para outro

Tudo deve ser extremamente simples: • selecionar piquete → adicionar animais → salvar

============================== 5) CÁLCULO AUTOMÁTICO DA CAPACIDADE DE SUPORTE

O agente deve implementar:

Consumo diário do lote = peso médio × 0.02
(2% do peso vivo)

Produção diária do piquete =
área × produção MS/ha

Dias de suporte =
produçao total MS ÷ consumo do lote

Regras de alerta: • verde: mais de 10 dias
• amarelo: 5 a 10 dias
• vermelho: menos de 5 dias

Texto lúdico: • “Esse pasto tá folgado.”
• “Atenção, produtor! Esse lote precisa rodar logo.”
• “O gado segura aqui por mais uns 4 dias.”

============================== 6) MAPA SATELITAL (OPENSTREETMAP)

O agente deve utilizar OpenStreetMap para:

• exibir propriedades como polígonos grandes
• exibir piquetes como polígonos dentro da propriedade
• mostrar o número de animais dentro de cada piquete
• colorir pela capacidade de suporte (verde, amarelo, vermelho)
• permitir tocar para abrir painel detalhado

O mapa deve ser simples, de leitura rápida, e funcionar bem no celular.

============================== 7) UX LÚDICO E AGRÍCOLA

Sempre usar linguagem simples:

• “Onde o gado tá agora?”
• “Esse piquete tá no limite.”
• “Aqui você vê sua fazenda do alto.”
• “Passe o gado daqui pra cá.”

Cores vibrantes e ícones intuitivos.

============================== 8) ENTREGAS DO AGENTE

O agente deve gerar:

• arquitetura completa do módulo
• telas e componentes
• fluxos do usuário
• lógica de cálculo
• comportamento dos alertas
• integração com mapa OSM
• explicação lúdica ao produtor
• associação entre Propriedades → Piquetes → Lotes

O resultado precisa ser extremamente funcional e simples.

==============================


==================================================== PROMPT PROFISSIONAL

“MÓDULO DE MANEJO, PIQUETES, CAPACIDADE DE SUPORTE E MAPA SATELITAL”
Você é um especialista sênior em desenvolvimento de sistemas agropecuários e sua tarefa é criar um módulo completo, lúdico e extremamente fácil de usar para produtores rurais.
O foco é simplicidade, visual limpo e navegação intuitiva, sempre pensando em quem está no campo usando o celular.

O módulo deve incluir:

==================================================== 1) OBJETIVO DO MÓDULO Criar o “Manejo Inteligente de Pasto” composto por:

• Controle de piquetes
• Registro de quantos animais estão em cada piquete
• Cálculo automático da capacidade de suporte da pastagem
• Alertas de superlotação
• Mapa satelital (OpenStreetMap) mostrando a distribuição dos animais

Tudo deve ser apresentado de forma lúdica, clara e amigável ao produtor.

Exemplo de abordagem visual:
• ícones simples
• mapas com pins
• cores intuitivas (verde=ok, amarelo=atenção, vermelho=superlotado)
• fluxos curtos com 2–3 toques no celular

==================================================== 2) REGRAS DO UX (OBRIGATÓRIAS) O agente deve sempre priorizar:

• entendimento rápido
• poucos botões
• nada de telas poluídas
• textos curtos e diretos
• navegação com “arrastar”, “tocar”, “escolher lote”

==================================================== 3) ENTREGAS DO AGENTE O agente deve criar:

A) Arquitetura do módulo
– telas
– componentes
– fluxos do usuário
– experiência no mobile

B) Lógica funcional
– como registrar piquetes
– como registrar entrada de lotes
– como mover lotes entre piquetes
– como calcular capacidade de suporte
– como gerar alertas

C) Telas e componentes
– lista de piquetes
– editor de piquete
– mapa satelital
– indicador de animais por piquete
– tela de movimentação de lote
– indicadores de capacidade

D) Integração com o mapa satelital
– usar OpenStreetMap
– pins personalizados mostrando número de animais
– cores por status (capacidade, risco, crítica)

E) Explicação do usuário
Criar textos amigáveis para orientar o produtor, como:
“Esse piquete aguenta seu lote por 12 dias.”
“Atenção! Esse pasto está quase no limite.”

==================================================== 4) LÓGICA DO SISTEMA (OBRIGATÓRIA) O agente deve implementar:

Cadastro de Piquetes
Cada piquete deve ter: • nome
• área (hectares)
• tipo de pastagem
• produção estimada de matéria seca (kg MS/ha/dia)

Distribuição de Animais
Registrar: • lote
• sexo
• faixa etária
• quantidade
• data de entrada no piquete

Cálculo da Capacidade de Suporte
O agente deve implementar a fórmula:

Consumo diário = Peso médio do lote × 0.02
(2% do peso vivo)

Produção diária do piquete =
Área × Produção de MS por hectare

Dias de suporte =
Produção diária total ÷ Consumo diário total

Regras de alerta
– verde: suporte > 10 dias
– amarelo: suporte entre 5 e 10 dias
– vermelho: suporte < 5 dias

==================================================== 5) MAPA SATELITAL (OBRIGATÓRIO) O agente deve:

• usar OpenStreetMap
• mostrar cada piquete como polígono
• exibir o número de animais dentro de cada polígono
• cor do piquete = nível de suporte (verde/amarelo/vermelho)
• toque abre o painel do piquete com:
– animais dentro
– dias de suporte
– área
– tipo de pasto

==================================================== 6) TONS LÚDICOS E AGRÍCOLAS (OBRIGATÓRIO) O agente deve utilizar:

• metáforas de campo
• imagens com sensação rural
• termos simples
• mensagens curtas e diretas

Exemplos: “Esse pasto ainda tá bonito.”
“O gado aguenta aqui mais uns 7 dias.”
“Hora de girar esse lote pro próximo piquete.”

==================================================== 7) RESULTADO FINAL QUE O AGENTE DEVE ENTREGAR O agente deve produzir:

Estrutura completa do módulo
Telas e componentes (esboçados ou descritos)
Lógica de cálculo
Fluxos do usuário
Textos lúdicos para o produtor
Integração com mapa OSM
Explicação clara de como tudo funciona
O foco é sempre SIMPLICIDADE + LUDICIDADE + UTILIDADE.

====================================================

Quando estiver pronto, gere todo o módulo conforme solicitado.

====================================================