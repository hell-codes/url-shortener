(function () {
  const navToggle = document.getElementById("nav-toggle");
  const navLinks = document.getElementById("nav-links");

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      navLinks.classList.toggle("open");
    });
  }

  const form = document.getElementById("shorten-form");
  const urlInput = document.getElementById("url-input");
  const submitButton = document.getElementById("submit-button");
  const aliasCheckbox = document.getElementById("alias-checkbox");
  const aliasWrap = document.getElementById("alias-wrap");
  const aliasInput = document.getElementById("alias-input");
  const formError = document.getElementById("form-error");
  const resultCard = document.getElementById("result-card");
  const resultUrl = document.getElementById("result-url");
  const resultOriginal = document.getElementById("result-original");
  const resultTimestamp = document.getElementById("result-timestamp");
  const copyButton = document.getElementById("copy-button");
  const openButton = document.getElementById("open-button");
  const resultClose = document.getElementById("result-close");

  let lastShortUrl = "";
  let copyResetTimeoutId = null;

  aliasCheckbox.addEventListener("change", () => {
    aliasWrap.classList.toggle("visible", aliasCheckbox.checked);
    if (aliasCheckbox.checked) {
      aliasInput.focus();
    }
  });

  function showError(message) {
    formError.textContent = message;
    formError.classList.add("visible");
  }

  function hideError() {
    formError.textContent = "";
    formError.classList.remove("visible");
  }

  function formatTimestamp(isoString) {
    const date = new Date(isoString);
    return "Created " + date.toLocaleString();
  }

  function showResult(record) {
    lastShortUrl = record.short_url;
    resultUrl.textContent = record.short_url;
    resultOriginal.textContent = record.original_url;
    resultTimestamp.textContent = formatTimestamp(record.created_at);
    resultCard.classList.remove("visible");
    void resultCard.offsetWidth;
    resultCard.classList.add("visible");

    localStorage.setItem("slotly:lastResult", JSON.stringify(record));
  }

  function restoreLastResult() {
    const saved = localStorage.getItem("slotly:lastResult");
    if (!saved) {
      return;
    }
    try {
      const record = JSON.parse(saved);
      showResult(record);
    } catch (error) {
      localStorage.removeItem("slotly:lastResult");
    }
  }

  function hideResult() {
    resultCard.classList.remove("visible");
    lastShortUrl = "";
    localStorage.removeItem("slotly:lastResult");
  }

  function setLoading(isLoading) {
    submitButton.disabled = isLoading;
    submitButton.textContent = isLoading ? "Shortening..." : "Shorten URL";
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    hideError();

    const url = urlInput.value.trim();
    if (!url) {
      showError("Please enter a URL to shorten.");
      return;
    }

    const payload = { url: url };
    if (aliasCheckbox.checked && aliasInput.value.trim()) {
      payload.alias = aliasInput.value.trim();
    }

    setLoading(true);

    try {
      const response = await fetch(`${APP_CONFIG.API_BASE_URL}/api/shorten`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        showError(data.error || "Something went wrong while shortening that URL.");
        return;
      }

      showResult(data);
      form.reset();
      aliasCheckbox.checked = false;
      aliasWrap.classList.remove("visible");
    } catch (error) {
      showError("Could not reach the backend. Is the Flask server running?");
    } finally {
      setLoading(false);
    }
  });

  copyButton.addEventListener("click", async () => {
    if (!lastShortUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(lastShortUrl);
      copyButton.textContent = "Copied ✓";
    } catch (error) {
      copyButton.textContent = "Press Ctrl+C";
    }

    if (copyResetTimeoutId) {
      window.clearTimeout(copyResetTimeoutId);
    }
    copyResetTimeoutId = window.setTimeout(() => {
      copyButton.textContent = "Copy";
    }, 1800);
  });

  openButton.addEventListener("click", () => {
    if (lastShortUrl) {
      window.open(lastShortUrl, "_blank", "noopener");
    }
  });

  resultClose.addEventListener("click", () => {
    hideResult();
  });

  restoreLastResult();
})();
