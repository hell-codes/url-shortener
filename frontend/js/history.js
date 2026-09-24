(function () {
  const navToggle = document.getElementById("nav-toggle");
  const navLinks = document.getElementById("nav-links");

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      navLinks.classList.toggle("open");
    });
  }

  const historyContent = document.getElementById("history-content");
  const statTotal = document.getElementById("stat-total");
  const statClicks = document.getElementById("stat-clicks");

  function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value;
    return div.innerHTML;
  }

  function truncateUrl(url, maxLength) {
    if (url.length <= maxLength) {
      return url;
    }
    return url.slice(0, maxLength) + "…";
  }

  function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function renderEmptyState() {
    historyContent.innerHTML = `
      <div class="empty-state">
        <div class="icon-wrap">
          <svg width="26" height="26" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6">
            <rect x="3" y="4" width="14" height="12" rx="2" />
            <path d="M7 8h6M7 12h4" />
          </svg>
        </div>
        <h2>No shortened URLs yet</h2>
        <p>Create your first short link and it will show up here with its click count and actions.</p>
        <a href="index.html" class="btn btn-primary">Shorten a URL</a>
      </div>
    `;
  }

  function renderList(records) {
    const cardsHtml = records
      .map((record) => {
        const safeShortUrl = escapeHtml(record.short_url);
        const safeOriginal = escapeHtml(record.original_url);
        const truncatedOriginal = escapeHtml(truncateUrl(record.original_url, 72));

        return `
          <div class="url-card" data-short-code="${escapeHtml(record.short_code)}">
            <div class="url-card-main">
              <div class="url-card-top">
                <span class="url-short">${safeShortUrl}</span>
                <span class="url-clicks">${record.click_count} click${record.click_count === 1 ? "" : "s"}</span>
              </div>
              <a class="url-original" href="${safeOriginal}" target="_blank" rel="noopener" title="${safeOriginal}">${truncatedOriginal}</a>
              <span class="url-date">${formatDate(record.created_at)}</span>
            </div>
            <div class="url-card-actions">
              <button class="btn btn-secondary btn-sm copy-action" data-url="${safeShortUrl}">Copy</button>
              <button class="btn btn-ghost btn-sm open-action" data-url="${safeShortUrl}">Open</button>
              <button class="btn btn-danger btn-sm delete-action" data-code="${escapeHtml(record.short_code)}">Delete</button>
            </div>
          </div>
        `;
      })
      .join("");

    historyContent.innerHTML = `<div class="history-list">${cardsHtml}</div>`;
    attachCardListeners();
  }

  function attachCardListeners() {
    document.querySelectorAll(".copy-action").forEach((button) => {
      button.addEventListener("click", async () => {
        const url = button.getAttribute("data-url");
        try {
          await navigator.clipboard.writeText(url);
          const originalText = button.textContent;
          button.textContent = "Copied ✓";
          window.setTimeout(() => {
            button.textContent = originalText;
          }, 1600);
        } catch (error) {
          button.textContent = "Press Ctrl+C";
        }
      });
    });

    document.querySelectorAll(".open-action").forEach((button) => {
      button.addEventListener("click", () => {
        const url = button.getAttribute("data-url");
        window.open(url, "_blank", "noopener");
      });
    });

    document.querySelectorAll(".delete-action").forEach((button) => {
      button.addEventListener("click", async () => {
        const shortCode = button.getAttribute("data-code");
        const card = document.querySelector(`.url-card[data-short-code="${CSS.escape(shortCode)}"]`);
        button.disabled = true;
        button.textContent = "Deleting...";

        try {
          const response = await fetch(`${APP_CONFIG.API_BASE_URL}/api/urls/${encodeURIComponent(shortCode)}`, {
            method: "DELETE",
          });
          const data = await response.json();

          if (!response.ok || !data.success) {
            button.disabled = false;
            button.textContent = "Delete";
            return;
          }

          const saved = localStorage.getItem("slotly:lastResult");
          if (saved) {
            try {
              const savedRecord = JSON.parse(saved);
              if (savedRecord.short_code === shortCode) {
                localStorage.removeItem("slotly:lastResult");
              }
            } catch (error) {
              localStorage.removeItem("slotly:lastResult");
            }
          }

          if (card) {
            card.style.opacity = "0";
            card.style.transition = "opacity 0.2s ease";
            window.setTimeout(() => {
              loadHistory();
            }, 180);
          }
        } catch (error) {
          button.disabled = false;
          button.textContent = "Delete";
        }
      });
    });
  }

  async function loadHistory() {
    try {
      const response = await fetch(`${APP_CONFIG.API_BASE_URL}/api/urls`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        renderEmptyState();
        return;
      }

      const records = data.urls || [];
      statTotal.textContent = records.length;
      statClicks.textContent = records.reduce((total, record) => total + record.click_count, 0);

      if (records.length === 0) {
        renderEmptyState();
      } else {
        renderList(records);
      }
    } catch (error) {
      historyContent.innerHTML = `
        <div class="empty-state">
          <h2>Could not load history</h2>
          <p>Make sure the Flask backend is running at ${APP_CONFIG.API_BASE_URL}.</p>
        </div>
      `;
    }
  }

  loadHistory();
})();
