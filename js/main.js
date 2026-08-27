// ==========================================================================
// main.js — comportamento global (menu mobile + footer)
// ==========================================================================

(function () {
  const navToggle = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('mobileMenu');

  if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
    });

    // fecha o menu mobile ao clicar em um link
    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => mobileMenu.classList.remove('open'));
    });
  }

  // caminho relativo do footer muda conforme a pasta (raiz ou /pages)
  const isSubpage = window.location.pathname.includes('/pages/');
  const base = isSubpage ? '../' : '';

  const footerEl = document.getElementById('site-footer');
  if (footerEl) {
    footerEl.innerHTML = `
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <a href="${base}index.html" class="brand">
              <svg class="brand-mark" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="19" stroke="#C99A32" stroke-width="1"/>
                <path d="M13 13L27 27M27 13L13 27" stroke="#C99A32" stroke-width="1.3" stroke-linecap="round"/>
                <circle cx="13" cy="13" r="2.4" stroke="#C99A32" stroke-width="1.1"/>
                <circle cx="13" cy="27" r="2.4" stroke="#C99A32" stroke-width="1.1"/>
              </svg>
              <span class="brand-name">
                <span class="word">NOTURNO</span>
                <span class="est">BARBEARIA · EST. 2024</span>
              </span>
            </a>
            <p class="footer-tagline">Seu estilo. Nossa precisão.</p>
          </div>

          <div class="footer-col">
            <h4>Navegação</h4>
            <ul>
              <li><a href="${base}index.html">Início</a></li>
              <li><a href="${base}pages/servicos.html">Serviços</a></li>
              <li><a href="${base}pages/agendamentos.html">Agendamentos</a></li>
            </ul>
          </div>

          <div class="footer-col">
            <h4>Horário</h4>
            <ul>
              <li><p>Seg — Sáb: 09h — 20h</p></li>
              <li><p>Dom: 10h — 16h</p></li>
            </ul>
          </div>
        </div>

        <div class="footer-bottom">
          <p>© 2026 Barbearia Noturno. Todos os direitos reservados.</p>
          <p>Rua das Figueiras, 1234 — Centro, São Paulo/SP</p>
        </div>
      </div>
    `;
  }
})();
