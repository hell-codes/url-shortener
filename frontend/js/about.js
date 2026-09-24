(function () {
  const navToggle = document.getElementById("nav-toggle");
  const navLinks = document.getElementById("nav-links");

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      navLinks.classList.toggle("open");
    });
  }

  document.querySelectorAll(".viva-question").forEach((button) => {
    button.addEventListener("click", () => {
      const item = button.closest(".viva-item");
      item.classList.toggle("open");
    });
  });

  const SLOT_COUNT = 8;
  const slotStrip = document.getElementById("slot-strip");
  const probeDemoButton = document.getElementById("probe-demo-button");
  const probeDemoReset = document.getElementById("probe-demo-reset");
  const probeDemoNote = document.getElementById("probe-demo-note");

  const DEMO_SEQUENCE = [
    { key: "a7K9x", hashIndex: 4, finalIndex: 4, note: "a7K9x hashes to index 4 — slot is empty, insert directly." },
    { key: "b3P2m", hashIndex: 4, finalIndex: 5, note: "b3P2m also hashes to index 4 — collision! Probe forward to index 5." },
    { key: "x8Q1z", hashIndex: 4, finalIndex: 6, note: "x8Q1z hashes to index 4 too — index 4 and 5 are full, probe lands on index 6." },
  ];

  function renderSlots() {
    slotStrip.innerHTML = "";
    for (let index = 0; index < SLOT_COUNT; index += 1) {
      const slotElement = document.createElement("div");
      slotElement.className = "slot";
      slotElement.id = `slot-${index}`;
      slotElement.innerHTML = `<span class="slot-index">${index}</span><span class="slot-key">—</span>`;
      slotStrip.appendChild(slotElement);
    }
  }

  function resetDemo() {
    renderSlots();
    probeDemoNote.textContent = "";
    probeDemoButton.disabled = false;
  }

  function sleep(milliseconds) {
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
  }

  async function runDemo() {
    probeDemoButton.disabled = true;
    renderSlots();

    for (const step of DEMO_SEQUENCE) {
      probeDemoNote.textContent = step.note;

      if (step.hashIndex !== step.finalIndex) {
        const startSlot = document.getElementById(`slot-${step.hashIndex}`);
        startSlot.classList.add("collision");
        await sleep(500);

        for (let probe = step.hashIndex + 1; probe <= step.finalIndex; probe += 1) {
          const probedSlot = document.getElementById(`slot-${probe}`);
          if (probe !== step.finalIndex) {
            probedSlot.classList.add("probed");
            await sleep(350);
          }
        }
      } else {
        await sleep(400);
      }

      const targetSlot = document.getElementById(`slot-${step.finalIndex}`);
      targetSlot.classList.remove("collision", "probed");
      targetSlot.classList.add("occupied");
      targetSlot.querySelector(".slot-key").textContent = step.key;
      await sleep(600);
    }

    probeDemoNote.textContent = "All three keys are stored — none overwrote another, thanks to linear probing.";
    probeDemoButton.disabled = false;
  }

  probeDemoButton.addEventListener("click", runDemo);
  probeDemoReset.addEventListener("click", resetDemo);

  renderSlots();
})();
