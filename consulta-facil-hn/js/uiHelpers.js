// js/uiHelpers.js - Acessibilidade (Fonte Dinâmica), Loading Spinner e Toasts

const UIHelpers = (() => {
  const STORAGE_KEY = "consultaFacilFontScale";
  let currentScale = parseFloat(localStorage.getItem(STORAGE_KEY)) || 100;

  function applyFontScale(scale) {
    currentScale = Math.min(130, Math.max(85, scale));
    document.documentElement.style.fontSize = `${currentScale}%`;
    localStorage.setItem(STORAGE_KEY, currentScale);
  }

  function initAccessibilityBar() {
    applyFontScale(currentScale);
    if (document.querySelector(".a11y-bar")) return;

    const bar = document.createElement("div");
    bar.className = "a11y-bar";
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", "Controles de acessibilidade");
    bar.innerHTML = `
      <span>Tamanho do texto:</span>
      <button type="button" class="a11y-btn" id="btn-font-dec" aria-label="Diminuir fonte">A-</button>
      <button type="button" class="a11y-btn" id="btn-font-reset" aria-label="Tamanho de fonte padrão">A</button>
      <button type="button" class="a11y-btn" id="btn-font-inc" aria-label="Aumentar fonte">A+</button>
    `;
    document.body.prepend(bar);

    document.getElementById("btn-font-dec").addEventListener("click", () => applyFontScale(currentScale - 10));
    document.getElementById("btn-font-reset").addEventListener("click", () => applyFontScale(100));
    document.getElementById("btn-font-inc").addEventListener("click", () => applyFontScale(currentScale + 10));
  }

  function ensureOverlays() {
    if (!document.getElementById("global-loading")) {
      const overlay = document.createElement("div");
      overlay.id = "global-loading";
      overlay.className = "loading-overlay";
      overlay.setAttribute("role", "status");
      overlay.setAttribute("aria-live", "polite");
      overlay.innerHTML = `
        <div class="spinner"></div>
        <span id="global-loading-text">Processando...</span>
      `;
      document.body.appendChild(overlay);
    }

    if (!document.getElementById("toast-container")) {
      const container = document.createElement("div");
      container.id = "toast-container";
      container.className = "toast-container";
      container.setAttribute("aria-live", "assertive");
      document.body.appendChild(container);
    }
  }

  function mostrarLoading(mensagem = "Processando...") {
    ensureOverlays();
    const textEl = document.getElementById("global-loading-text");
    if (textEl) textEl.textContent = mensagem;
    document.getElementById("global-loading").classList.add("active");
  }

  function esconderLoading() {
    const overlay = document.getElementById("global-loading");
    if (overlay) overlay.classList.remove("active");
  }

  function mostrarToast(mensagem, tipo = "info", duracao = 4000) {
    ensureOverlays();
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast ${tipo}`;
    toast.textContent = mensagem;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transition = "opacity 0.25s";
      setTimeout(() => toast.remove(), 250);
    }, duracao);
  }

  document.addEventListener("DOMContentLoaded", () => {
    initAccessibilityBar();
    ensureOverlays();
  });

  return { mostrarLoading, esconderLoading, mostrarToast };
})();

window.UIHelpers = UIHelpers;

