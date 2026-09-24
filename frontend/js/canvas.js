(() => {
  const canvas = document.getElementById("app-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: true });

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  let width = 0;
  let height = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  let nodes = [];
  let particles = [];
  let pulses = [];

  let animationId = null;
  let lastTime = 0;

  const CONFIG = {
    nodeCountDesktop: 65,
    nodeCountMobile: 35,

    maxDistance: 145,

    particleCount: 28,

    nodeSpeed: 0.12,

    particleSpeed: 0.7,

    backgroundGrid: true,

    colors: {
      violet: "124, 140, 255",
      coral: "255, 107, 94",
      white: "255, 255, 255",
    },
  };

  function random(min, max) {
    return Math.random() * (max - min) + min;
  }

  function distance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;

    return Math.sqrt(dx * dx + dy * dy);
  }

  class Node {
    constructor() {
      this.x = random(0, width);
      this.y = random(0, height);

      this.vx = random(-CONFIG.nodeSpeed, CONFIG.nodeSpeed);
      this.vy = random(-CONFIG.nodeSpeed, CONFIG.nodeSpeed);

      this.radius = random(1.2, 2.8);

      this.phase = random(0, Math.PI * 2);

      this.pulse = 0;
    }

    update(delta) {
      this.x += this.vx * delta;
      this.y += this.vy * delta;

      if (this.x < -30) this.x = width + 30;
      if (this.x > width + 30) this.x = -30;

      if (this.y < -30) this.y = height + 30;
      if (this.y > height + 30) this.y = -30;

      this.phase += 0.025 * delta;

      if (this.pulse > 0) {
        this.pulse -= 0.025 * delta;

        if (this.pulse < 0) {
          this.pulse = 0;
        }
      }
    }

    draw() {
      const breathing =
        Math.sin(this.phase) * 0.5 + 0.5;

      const glowRadius =
        this.radius + breathing * 2 + this.pulse * 7;

      const gradient = ctx.createRadialGradient(
        this.x,
        this.y,
        0,
        this.x,
        this.y,
        glowRadius * 4
      );

      gradient.addColorStop(
        0,
        `rgba(${CONFIG.colors.violet}, ${
          0.32 + this.pulse * 0.3
        })`
      );

      gradient.addColorStop(
        0.4,
        `rgba(${CONFIG.colors.violet}, 0.08)`
      );

      gradient.addColorStop(
        1,
        `rgba(${CONFIG.colors.violet}, 0)`
      );

      ctx.beginPath();
      ctx.fillStyle = gradient;

      ctx.arc(
        this.x,
        this.y,
        glowRadius * 4,
        0,
        Math.PI * 2
      );

      ctx.fill();

      ctx.beginPath();

      ctx.fillStyle = `rgba(${CONFIG.colors.violet}, ${
        0.45 + breathing * 0.25
      })`;

      ctx.arc(
        this.x,
        this.y,
        this.radius,
        0,
        Math.PI * 2
      );

      ctx.fill();
    }
  }

  class Particle {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = random(0, width);
      this.y = random(0, height);

      const angle = random(0, Math.PI * 2);

      this.vx =
        Math.cos(angle) * CONFIG.particleSpeed;

      this.vy =
        Math.sin(angle) * CONFIG.particleSpeed;

      this.life = random(0, 1);

      this.maxLife = random(0.6, 1.5);

      this.size = random(1, 2.2);

      this.coral = Math.random() < 0.18;
    }

    update(delta) {
      this.x += this.vx * delta;
      this.y += this.vy * delta;

      this.life += 0.008 * delta;

      if (
        this.x < -20 ||
        this.x > width + 20 ||
        this.y < -20 ||
        this.y > height + 20 ||
        this.life > this.maxLife
      ) {
        this.reset();
      }
    }

    draw() {
      const alpha =
        Math.sin(
          (this.life / this.maxLife) * Math.PI
        ) * 0.7;

      ctx.beginPath();

      ctx.fillStyle = this.coral
        ? `rgba(${CONFIG.colors.coral}, ${alpha})`
        : `rgba(${CONFIG.colors.violet}, ${alpha})`;

      ctx.arc(
        this.x,
        this.y,
        this.size,
        0,
        Math.PI * 2
      );

      ctx.fill();
    }
  }

  function createPulse(node) {
    pulses.push({
      x: node.x,
      y: node.y,
      radius: 2,
      alpha: 0.45,
    });
  }

  function updatePulses(delta) {
    pulses.forEach((pulse) => {
      pulse.radius += 1.4 * delta;
      pulse.alpha -= 0.012 * delta;
    });

    pulses = pulses.filter(
      (pulse) => pulse.alpha > 0
    );
  }

  function drawPulses() {
    pulses.forEach((pulse) => {
      ctx.beginPath();

      ctx.strokeStyle = `rgba(${CONFIG.colors.violet}, ${pulse.alpha})`;

      ctx.lineWidth = 1;

      ctx.arc(
        pulse.x,
        pulse.y,
        pulse.radius,
        0,
        Math.PI * 2
      );

      ctx.stroke();
    });
  }

  function drawBackground() {
    const gradient = ctx.createLinearGradient(
      0,
      0,
      width,
      height
    );

    gradient.addColorStop(
      0,
      "rgba(8, 10, 25, 1)"
    );

    gradient.addColorStop(
      0.5,
      "rgba(10, 12, 30, 1)"
    );

    gradient.addColorStop(
      1,
      "rgba(5, 7, 18, 1)"
    );

    ctx.fillStyle = gradient;

    ctx.fillRect(
      0,
      0,
      width,
      height
    );
  }

  function drawGrid() {
    if (!CONFIG.backgroundGrid) return;

    const size = width < 720 ? 42 : 55;

    ctx.lineWidth = 1;

    ctx.strokeStyle =
      `rgba(${CONFIG.colors.violet}, 0.025)`;

    for (
      let x = 0;
      x < width;
      x += size
    ) {
      ctx.beginPath();

      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);

      ctx.stroke();
    }

    for (
      let y = 0;
      y < height;
      y += size
    ) {
      ctx.beginPath();

      ctx.moveTo(0, y);
      ctx.lineTo(width, y);

      ctx.stroke();
    }
  }

  function drawConnections() {
    for (let i = 0; i < nodes.length; i++) {
      for (
        let j = i + 1;
        j < nodes.length;
        j++
      ) {
        const a = nodes[i];
        const b = nodes[j];

        const dist = distance(a, b);

        if (dist > CONFIG.maxDistance) {
          continue;
        }

        const opacity =
          (1 - dist / CONFIG.maxDistance) *
          0.13;

        ctx.beginPath();

        ctx.strokeStyle =
          `rgba(${CONFIG.colors.violet}, ${opacity})`;

        ctx.lineWidth = 0.7;

        ctx.moveTo(a.x, a.y);

        ctx.lineTo(b.x, b.y);

        ctx.stroke();
      }
    }
  }

  function randomPulse(delta) {
    if (Math.random() < 0.0025 * delta) {
      const node =
        nodes[
          Math.floor(
            Math.random() * nodes.length
          )
        ];

      if (node) {
        node.pulse = 1;
        createPulse(node);
      }
    }
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;

    dpr = Math.min(
      window.devicePixelRatio || 1,
      2
    );

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    canvas.style.width =
      `${width}px`;

    canvas.style.height =
      `${height}px`;

    ctx.setTransform(
      dpr,
      0,
      0,
      dpr,
      0,
      0
    );

    const nodeCount =
      width < 720
        ? CONFIG.nodeCountMobile
        : CONFIG.nodeCountDesktop;

    nodes = [];

    particles = [];

    pulses = [];

    for (
      let i = 0;
      i < nodeCount;
      i++
    ) {
      nodes.push(new Node());
    }

    for (
      let i = 0;
      i < CONFIG.particleCount;
      i++
    ) {
      particles.push(
        new Particle()
      );
    }
  }

  function update(delta) {
    nodes.forEach((node) => {
      node.update(delta);
    });

    particles.forEach((particle) => {
      particle.update(delta);
    });

    updatePulses(delta);

    randomPulse(delta);
  }

  function draw() {
    drawBackground();

    drawGrid();

    drawConnections();

    drawPulses();

    particles.forEach((particle) => {
      particle.draw();
    });

    nodes.forEach((node) => {
      node.draw();
    });

    const vignette =
      ctx.createRadialGradient(
        width / 2,
        height / 2,
        Math.min(width, height) * 0.2,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.75
      );

    vignette.addColorStop(
      0,
      "rgba(0,0,0,0)"
    );

    vignette.addColorStop(
      1,
      "rgba(0,0,0,0.42)"
    );

    ctx.fillStyle = vignette;

    ctx.fillRect(
      0,
      0,
      width,
      height
    );
  }

  function loop(timestamp) {
    if (!lastTime) {
      lastTime = timestamp;
    }

    const delta = Math.min(
      (timestamp - lastTime) / 16.67,
      3
    );

    lastTime = timestamp;

    update(delta);

    draw();

    animationId =
      requestAnimationFrame(loop);
  }

  resize();

  if (reducedMotion) {
    draw();
  } else {
    animationId =
      requestAnimationFrame(loop);
  }

  let resizeTimer;

  window.addEventListener(
    "resize",
    () => {
      clearTimeout(resizeTimer);

      resizeTimer = setTimeout(() => {
        resize();

        if (reducedMotion) {
          draw();
        }
      }, 150);
    },
    { passive: true }
  );

  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) {
        if (animationId) {
          cancelAnimationFrame(
            animationId
          );

          animationId = null;
        }

        lastTime = 0;
      } else if (
        !reducedMotion &&
        !animationId
      ) {
        animationId =
          requestAnimationFrame(loop);
      }
    }
  );
})();
