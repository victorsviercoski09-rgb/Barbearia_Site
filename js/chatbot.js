// ==========================================================================
// chatbot.js — Assistente Virtual da Barbearia
// ==========================================================================
//
// Este arquivo já entrega a experiência completa do chatbot (botão flutuante,
// janela, mensagens, loading, tratamento de erro) funcionando com respostas
// locais baseadas em palavras-chave — ou seja, funciona agora, sem chave de
// API nenhuma.
//
// Quando você tiver uma IA para plugar (OpenAI, Anthropic, etc.), o ÚNICO
// lugar que precisa mudar é a função `getBotResponse()` lá embaixo, na seção
// "COMO PLUGAR UMA IA DE VERDADE". O resto (abrir/fechar, exibir mensagens,
// loading, erros) já está pronto e não precisa ser tocado.
// ==========================================================================

(function () {

  // --------------------------------------------------------------------
  // 1. Base de contexto da barbearia (usada nas respostas locais e é
  //    exatamente o que você mandaria como "system prompt" para uma IA real)
  // --------------------------------------------------------------------
  const CONTEXT = {
    nome: 'Barbearia Noturno',
    horario: 'Segunda a sábado das 09h às 20h, e domingo das 10h às 16h.',
    endereco: 'Rua das Figueiras, 1234 — Centro, São Paulo/SP.',
    telefone: '(11) 99999-9999',
    servicos: [
      { nome: 'Corte Masculino', preco: 50, duracao: 40 },
      { nome: 'Barba', preco: 40, duracao: 30 },
      { nome: 'Corte + Barba', preco: 80, duracao: 60 },
      { nome: 'Acabamento', preco: 30, duracao: 20 },
      { nome: 'Sobrancelha', preco: 20, duracao: 15 },
    ],
  };

  const SUGGESTIONS = [
    'Quanto custa o corte?',
    'Qual o horário de funcionamento?',
    'Quero marcar um horário',
  ];

  // --------------------------------------------------------------------
  // 2. Monta a UI do chatbot e injeta no #chatbot-root
  // --------------------------------------------------------------------
  const root = document.getElementById('chatbot-root');
  if (!root) return;

  root.innerHTML = `
    <button class="chatbot-launcher" id="chatbotLauncher" aria-label="Falar com o assistente">
      <svg viewBox="0 0 24 24" fill="none"><rect x="4" y="6" width="16" height="12" rx="4" stroke="currentColor" stroke-width="1.5"/><path d="M9 6V4.5a1.5 1.5 0 013 0V6" stroke="currentColor" stroke-width="1.5"/><circle cx="9" cy="12" r="1.2" fill="currentColor"/><circle cx="15" cy="12" r="1.2" fill="currentColor"/><path d="M4 14H2.5M22 14h-1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      <span class="chatbot-tooltip">Falar com o Assistente</span>
    </button>

    <div class="chatbot-window" id="chatbotWindow" role="dialog" aria-label="Assistente virtual da barbearia">
      <div class="chatbot-header">
        <div class="chatbot-header-id">
          <div class="chatbot-avatar">
            <svg viewBox="0 0 24 24" fill="none"><rect x="4" y="6" width="16" height="12" rx="4" stroke="currentColor" stroke-width="1.5"/><circle cx="9" cy="12" r="1.2" fill="currentColor"/><circle cx="15" cy="12" r="1.2" fill="currentColor"/></svg>
          </div>
          <div class="chatbot-header-text">
            <strong>Assistente Noturno</strong>
            <span><span class="status-dot"></span> Online agora</span>
          </div>
        </div>
        <button class="chatbot-close" id="chatbotClose" aria-label="Fechar assistente">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
        </button>
      </div>

      <div class="chatbot-body" id="chatbotBody"></div>

      <form class="chatbot-footer" id="chatbotForm">
        <input type="text" id="chatbotInput" placeholder="Digite sua mensagem..." autocomplete="off" maxlength="300">
        <button type="submit" class="chatbot-send" id="chatbotSend" aria-label="Enviar mensagem">
          <svg viewBox="0 0 24 24" fill="none"><path d="M4 20l17-8L4 4l0 6.5L15 12 4 13.5V20z" fill="currentColor"/></svg>
        </button>
      </form>
    </div>
  `;

  // --------------------------------------------------------------------
  // 3. Referências e estado
  // --------------------------------------------------------------------
  const launcher = document.getElementById('chatbotLauncher');
  const win = document.getElementById('chatbotWindow');
  const closeBtn = document.getElementById('chatbotClose');
  const body = document.getElementById('chatbotBody');
  const form = document.getElementById('chatbotForm');
  const input = document.getElementById('chatbotInput');
  const sendBtn = document.getElementById('chatbotSend');

  let isOpen = false;
  let isWaiting = false;

  // --------------------------------------------------------------------
  // 4. Abrir / fechar
  // --------------------------------------------------------------------
  function openChat() {
    isOpen = true;
    win.classList.add('open');
    if (body.children.length === 0) showWelcomeMessage();
    setTimeout(() => input.focus(), 250);
  }

  function closeChat() {
    isOpen = false;
    win.classList.remove('open');
  }

  launcher.addEventListener('click', () => (isOpen ? closeChat() : openChat()));
  closeBtn.addEventListener('click', closeChat);

  // --------------------------------------------------------------------
  // 5. Renderização de mensagens
  // --------------------------------------------------------------------
  function scrollToBottom() {
    body.scrollTop = body.scrollHeight;
  }

  function addBotMessage(text, { suggestions } = {}) {
    const wrap = document.createElement('div');
    wrap.className = 'msg msg-bot';
    wrap.innerHTML = `
      <div class="msg-avatar">
        <svg viewBox="0 0 24 24" fill="none"><rect x="4" y="6" width="16" height="12" rx="4" stroke="currentColor" stroke-width="1.5"/><circle cx="9" cy="12" r="1.2" fill="currentColor"/><circle cx="15" cy="12" r="1.2" fill="currentColor"/></svg>
      </div>
      <div>
        <div class="msg-bubble"></div>
        ${suggestions ? '<div class="msg-suggestions"></div>' : ''}
      </div>
    `;
    wrap.querySelector('.msg-bubble').textContent = text;

    if (suggestions) {
      const suggWrap = wrap.querySelector('.msg-suggestions');
      suggestions.forEach((s) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'msg-chip';
        chip.textContent = s;
        chip.addEventListener('click', () => sendMessage(s));
        suggWrap.appendChild(chip);
      });
    }

    body.appendChild(wrap);
    scrollToBottom();
  }

  function addUserMessage(text) {
    const wrap = document.createElement('div');
    wrap.className = 'msg msg-user';
    wrap.innerHTML = `<div class="msg-bubble"></div>`;
    wrap.querySelector('.msg-bubble').textContent = text;
    body.appendChild(wrap);
    scrollToBottom();
  }

  function showTyping() {
    const wrap = document.createElement('div');
    wrap.className = 'msg msg-bot';
    wrap.id = 'typingIndicator';
    wrap.innerHTML = `
      <div class="msg-avatar">
        <svg viewBox="0 0 24 24" fill="none"><rect x="4" y="6" width="16" height="12" rx="4" stroke="currentColor" stroke-width="1.5"/><circle cx="9" cy="12" r="1.2" fill="currentColor"/><circle cx="15" cy="12" r="1.2" fill="currentColor"/></svg>
      </div>
      <div class="msg-bubble typing-indicator"><span></span><span></span><span></span></div>
    `;
    body.appendChild(wrap);
    scrollToBottom();
  }

  function removeTyping() {
    const el = document.getElementById('typingIndicator');
    if (el) el.remove();
  }

  function showError() {
    const wrap = document.createElement('div');
    wrap.className = 'chatbot-error';
    wrap.textContent = 'Não consegui responder agora. Tente novamente em alguns instantes.';
    body.appendChild(wrap);
    scrollToBottom();
  }

  function showWelcomeMessage() {
    addBotMessage(
      `Olá! Sou o assistente da ${CONTEXT.nome}. Posso ajudar com preços, horários, endereço ou te dar uma mãozinha para marcar um horário. Como posso ajudar?`,
      { suggestions: SUGGESTIONS }
    );
  }

  // --------------------------------------------------------------------
  // 6. Envio de mensagem
  // --------------------------------------------------------------------
  function setSending(state) {
    isWaiting = state;
    sendBtn.disabled = state;
    input.disabled = state;
  }

  async function sendMessage(rawText) {
    const text = (rawText !== undefined ? rawText : input.value).trim();
    if (!text || isWaiting) return;

    addUserMessage(text);
    input.value = '';
    setSending(true);
    showTyping();

    try {
      const reply = await getBotResponse(text);
      removeTyping();
      addBotMessage(reply);
    } catch (err) {
      // detalhes técnicos ficam só no console — o usuário nunca vê stack trace
      console.error('Erro no assistente da barbearia:', err);
      removeTyping();
      showError();
    } finally {
      setSending(false);
      input.focus();
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    sendMessage();
  });

  // ======================================================================
  // 7. CHAMADA REAL À API DO GOOGLE GEMINI
  // ======================================================================
  // Agora que você já tem sua chave configurada em config.js, esta função
  // manda cada mensagem do usuário direto para a API do Gemini, com o
  // CONTEXT da barbearia como "system_instruction" — assim a IA só responde
  // sobre serviços, preços, horários, endereço e agendamento.
  // ======================================================================

  async function getBotResponse(userMessage) {
    if (typeof CONFIG === 'undefined' || !CONFIG.API_KEY || CONFIG.API_KEY === 'sua-chave-aqui') {
      // config.js não foi criado, não foi incluído no HTML, ou a chave
      // ainda não foi preenchida — avisa no console para facilitar o debug.
      console.error('CONFIG não encontrado ou API_KEY não preenchida. Verifique config.js.');
      throw new Error('Configuração da API ausente.');
    }

    const url = `${CONFIG.API_URL}/${CONFIG.MODEL}:generateContent`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': CONFIG.API_KEY,
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: buildSystemPrompt() }] },
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      }),
    });

    if (!response.ok) {
      // fetch() NÃO lança exceção em erros HTTP (400/500) — por isso este
      // `if` é obrigatório, ou o erro passaria despercebido.
      const errBody = await response.text();
      console.error(`Erro na API (${response.status}):`, errBody);
      throw new Error(`Erro na API: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  function buildSystemPrompt() {
    const servicos = CONTEXT.servicos
      .map((s) => `${s.nome} (R$ ${s.preco.toFixed(2).replace('.', ',')}, ${s.duracao} min)`)
      .join(', ');

    return `Você é o assistente virtual da ${CONTEXT.nome}, uma barbearia. ` +
      `Responda de forma breve, simpática e direta, apenas sobre assuntos da barbearia ` +
      `(serviços, preços, horários, endereço, telefone e agendamentos). ` +
      `Se perguntarem algo fora desse assunto, diga educadamente que só pode ajudar com o que é da barbearia. ` +
      `Horário de funcionamento: ${CONTEXT.horario} ` +
      `Endereço: ${CONTEXT.endereco} ` +
      `Telefone: ${CONTEXT.telefone} ` +
      `Serviços disponíveis: ${servicos}. ` +
      `Para agendar, o cliente deve ir até a página "Agendamentos" do site e preencher o formulário.`;
  }

})();
