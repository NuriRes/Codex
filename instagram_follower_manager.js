/**
 * Instagram Followers Cleaner (Console Script)
 *
 * Usage:
 * 1) Open instagram.com profile page on desktop and open Followers modal.
 * 2) Paste this script in DevTools Console and press Enter.
 * 3) Tick followers from the panel and click "Seçilenleri Çıkar".
 *
 * NOTE: Instagram UI can change any time. Use carefully and slowly to avoid rate limits.
 */
(() => {
  const PANEL_ID = "ig-follower-cleaner-panel";
  const CHECKBOX_ATTR = "data-ig-cleaner-checkbox";

  if (document.getElementById(PANEL_ID)) {
    console.info("[IG Cleaner] Panel zaten açık.");
    return;
  }

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function getFollowersDialog() {
    return (
      document.querySelector('div[role="dialog"]') ||
      document.querySelector('div[aria-modal="true"]')
    );
  }

  function getRows() {
    const dialog = getFollowersDialog();
    if (!dialog) return [];

    return [...dialog.querySelectorAll("li")].filter((li) => {
      const hasProfileLink = li.querySelector('a[href^="/"]');
      const hasRemoveButton = [...li.querySelectorAll("button")].some((btn) => {
        const t = (btn.textContent || "").trim().toLowerCase();
        return t === "remove" || t === "kaldır";
      });
      return hasProfileLink && hasRemoveButton;
    });
  }

  function getUsernameFromRow(row) {
    const link = row.querySelector('a[href^="/"]');
    if (!link) return "(bilinmiyor)";
    const href = link.getAttribute("href") || "";
    return href.replaceAll("/", "") || link.textContent?.trim() || "(bilinmiyor)";
  }

  function ensureCheckboxOnRow(row) {
    if (row.querySelector(`input[${CHECKBOX_ATTR}]`)) return;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.setAttribute(CHECKBOX_ATTR, "1");
    checkbox.style.marginRight = "10px";
    checkbox.style.width = "16px";
    checkbox.style.height = "16px";
    checkbox.style.cursor = "pointer";

    const firstDiv = row.querySelector("div");
    if (firstDiv) {
      firstDiv.prepend(checkbox);
    } else {
      row.prepend(checkbox);
    }
  }

  function refreshRows() {
    const rows = getRows();
    rows.forEach(ensureCheckboxOnRow);
    countEl.textContent = `${rows.length} kişi yüklü`;
    selectedEl.textContent = `${getSelectedRows().length} seçili`;
    return rows;
  }

  function getSelectedRows() {
    const rows = getRows();
    return rows.filter((row) => row.querySelector(`input[${CHECKBOX_ATTR}]`)?.checked);
  }

  async function removeSelected() {
    const rows = getSelectedRows();
    if (!rows.length) {
      alert("Önce en az 1 takipçi seç.");
      return;
    }

    const delay = Number(delayInput.value) || 1200;
    removeBtn.disabled = true;
    removeBtn.textContent = "İşleniyor...";

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const username = getUsernameFromRow(row);
      statusEl.textContent = `${i + 1}/${rows.length}: ${username} çıkarılıyor...`;

      const removeButton = [...row.querySelectorAll("button")].find((btn) => {
        const t = (btn.textContent || "").trim().toLowerCase();
        return t === "remove" || t === "kaldır";
      });

      if (!removeButton) {
        statusEl.textContent = `${username} satırında 'Kaldır' butonu bulunamadı.`;
        continue;
      }

      removeButton.click();
      await sleep(350);

      const confirmButton = [...document.querySelectorAll('div[role="button"], button')].find((btn) => {
        const t = (btn.textContent || "").trim().toLowerCase();
        return t === "remove" || t === "kaldır";
      });

      if (confirmButton) {
        confirmButton.click();
      }

      await sleep(delay);
      refreshRows();
    }

    statusEl.textContent = "Tamamlandı.";
    removeBtn.disabled = false;
    removeBtn.textContent = "Seçilenleri Çıkar";
  }

  function selectAll(value) {
    getRows().forEach((row) => {
      const cb = row.querySelector(`input[${CHECKBOX_ATTR}]`);
      if (cb) cb.checked = value;
    });
    selectedEl.textContent = `${getSelectedRows().length} seçili`;
  }

  const panel = document.createElement("div");
  panel.id = PANEL_ID;
  panel.style.position = "fixed";
  panel.style.right = "16px";
  panel.style.bottom = "16px";
  panel.style.zIndex = "999999";
  panel.style.width = "300px";
  panel.style.background = "#111";
  panel.style.color = "#fff";
  panel.style.border = "1px solid #333";
  panel.style.borderRadius = "10px";
  panel.style.padding = "12px";
  panel.style.fontFamily = "system-ui, sans-serif";
  panel.style.boxShadow = "0 8px 25px rgba(0,0,0,0.4)";

  panel.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
      <strong>IG Takipçi Çıkarıcı</strong>
      <button id="ig-cleaner-close" style="cursor:pointer;">✕</button>
    </div>
    <div style="margin-top:8px;font-size:13px;opacity:0.9;">
      <div id="ig-cleaner-count">0 kişi yüklü</div>
      <div id="ig-cleaner-selected">0 seçili</div>
      <div id="ig-cleaner-status" style="margin-top:4px;min-height:18px;"></div>
    </div>
    <label style="display:block;margin-top:8px;font-size:12px;">İşlem aralığı (ms)</label>
    <input id="ig-cleaner-delay" type="number" min="500" step="100" value="1200" style="width:100%;margin-top:4px;padding:6px;box-sizing:border-box;" />
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px;">
      <button id="ig-cleaner-refresh">Listeyi Tara</button>
      <button id="ig-cleaner-select-all">Hepsini Seç</button>
      <button id="ig-cleaner-clear">Seçimi Temizle</button>
      <button id="ig-cleaner-remove" style="background:#d62976;color:#fff;">Seçilenleri Çıkar</button>
    </div>
  `;

  document.body.appendChild(panel);

  const closeBtn = panel.querySelector("#ig-cleaner-close");
  const refreshBtn = panel.querySelector("#ig-cleaner-refresh");
  const selectAllBtn = panel.querySelector("#ig-cleaner-select-all");
  const clearBtn = panel.querySelector("#ig-cleaner-clear");
  const removeBtn = panel.querySelector("#ig-cleaner-remove");
  const countEl = panel.querySelector("#ig-cleaner-count");
  const selectedEl = panel.querySelector("#ig-cleaner-selected");
  const statusEl = panel.querySelector("#ig-cleaner-status");
  const delayInput = panel.querySelector("#ig-cleaner-delay");

  closeBtn.addEventListener("click", () => panel.remove());
  refreshBtn.addEventListener("click", refreshRows);
  selectAllBtn.addEventListener("click", () => selectAll(true));
  clearBtn.addEventListener("click", () => selectAll(false));
  removeBtn.addEventListener("click", removeSelected);

  document.addEventListener("change", (event) => {
    const target = event.target;
    if (target instanceof HTMLInputElement && target.hasAttribute(CHECKBOX_ATTR)) {
      selectedEl.textContent = `${getSelectedRows().length} seçili`;
    }
  });

  const dialog = getFollowersDialog();
  if (!dialog) {
    statusEl.textContent = "Önce takipçi penceresini aç (Followers/Takipçiler).";
  }

  refreshRows();
  console.info("[IG Cleaner] Hazır.");
})();
