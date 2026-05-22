const navLinks = document.querySelectorAll("nav a[href^='#']");
const observedItems = document.querySelectorAll(".hero, .highlights article, .writing-lab, .language-lab");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const scrollProgress = document.createElement("div");
scrollProgress.className = "scroll-progress";
document.body.prepend(scrollProgress);

const setActiveNavigation = () => {
  const visibleSections = [...document.querySelectorAll("main section, footer")].filter(
    (section) => section.offsetTop <= window.scrollY + 180
  );
  const currentSection = visibleSections[visibleSections.length - 1];

  navLinks.forEach((link) => {
    link.classList.toggle("is-active", link.getAttribute("href") === `#${currentSection?.id}`);
  });
};

const updateScrollProgress = () => {
  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollableHeight > 0 ? (window.scrollY / scrollableHeight) * 100 : 0;
  scrollProgress.style.width = `${Math.min(progress, 100)}%`;
};

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.18,
  }
);

observedItems.forEach((item) => revealObserver.observe(item));

document.querySelectorAll(".highlights article").forEach((card) => {
  const title = card.querySelector("h2")?.textContent.trim();
  const certificateImage = card.querySelector(".certificate-image");
  const link = certificateImage?.getAttribute("src");

  if (!link) {
    return;
  }

  card.classList.add("is-clickable");
  card.setAttribute("role", "link");
  card.setAttribute("tabindex", "0");
  card.setAttribute("aria-label", `Buka sertifikat ${title}`);

  const openCertificate = () => {
    window.open(link, "_blank", "noopener");
  };

  card.addEventListener("click", openCertificate);
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openCertificate();
    }
  });

  if (!prefersReducedMotion) {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;

      card.style.setProperty("--tilt-x", `${x * 8}deg`);
      card.style.setProperty("--tilt-y", `${y * -8}deg`);
    });

    card.addEventListener("pointerleave", () => {
      card.style.removeProperty("--tilt-x");
      card.style.removeProperty("--tilt-y");
    });
  }
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.forEach((navLink) => navLink.classList.remove("is-active"));
    link.classList.add("is-active");
  });
});

document.querySelectorAll(".blog-links a").forEach((link) => {
  link.addEventListener("click", () => {
    link.classList.remove("is-tapped");
    window.requestAnimationFrame(() => link.classList.add("is-tapped"));
  });

  link.addEventListener("animationend", () => link.classList.remove("is-tapped"));
});

const shootWebBurst = (x, y) => {
  if (prefersReducedMotion) {
    return;
  }

  const burst = document.createElement("span");
  burst.className = "web-burst";
  burst.style.setProperty("--web-x", `${x}px`);
  burst.style.setProperty("--web-y", `${y}px`);
  burst.style.setProperty("--web-rotate", `${Math.random() * 80 - 40}deg`);
  document.body.append(burst);
  burst.addEventListener("animationend", () => burst.remove());
};

let lastWebBurst = 0;

const maybeShootWebBurst = (event) => {
  const now = Date.now();

  if (now - lastWebBurst < 850) {
    return;
  }

  lastWebBurst = now;
  shootWebBurst(event.clientX, event.clientY);
};

const createWebCanvas = () => {
  if (prefersReducedMotion) {
    return;
  }

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const pointer = {
    x: window.innerWidth * 0.5,
    y: window.innerHeight * 0.28,
  };
  let strands = [];

  canvas.className = "web-canvas";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);

  const resizeCanvas = () => {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * pixelRatio);
    canvas.height = Math.floor(window.innerHeight * pixelRatio);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const amount = window.innerWidth < 640 ? 18 : 30;
    strands = Array.from({ length: amount }, (_, index) => ({
      angle: (Math.PI * 2 * index) / amount,
      radius: 100 + Math.random() * Math.min(window.innerWidth, window.innerHeight) * 0.55,
      speed: 0.004 + Math.random() * 0.006,
      wobble: Math.random() * Math.PI * 2,
    }));
  };

  const movePointer = (event) => {
    const point = event.touches?.[0] || event;
    pointer.x = point.clientX;
    pointer.y = point.clientY;
  };

  const draw = () => {
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);

    strands.forEach((strand, index) => {
      strand.wobble += strand.speed;

      const endX = pointer.x + Math.cos(strand.angle + Math.sin(strand.wobble) * 0.08) * strand.radius;
      const endY = pointer.y + Math.sin(strand.angle + Math.cos(strand.wobble) * 0.08) * strand.radius;
      const controlX = (pointer.x + endX) * 0.5 + Math.sin(strand.wobble) * 28;
      const controlY = (pointer.y + endY) * 0.5 + Math.cos(strand.wobble) * 28;

      context.beginPath();
      context.moveTo(pointer.x, pointer.y);
      context.quadraticCurveTo(controlX, controlY, endX, endY);
      context.strokeStyle = index % 3 === 0 ? "rgba(229, 27, 45, 0.18)" : "rgba(237, 245, 255, 0.16)";
      context.lineWidth = index % 4 === 0 ? 1.4 : 0.8;
      context.stroke();
    });

    context.beginPath();
    context.arc(pointer.x, pointer.y, 4, 0, Math.PI * 2);
    context.fillStyle = "rgba(255, 255, 255, 0.76)";
    context.fill();

    requestAnimationFrame(draw);
  };

  resizeCanvas();
  draw();

  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("pointermove", movePointer);
  window.addEventListener("touchmove", movePointer, { passive: true });
};

createWebCanvas();

document.addEventListener("click", (event) => {
  shootWebBurst(event.clientX, event.clientY);
});

document.addEventListener("pointermove", maybeShootWebBurst);

window.addEventListener("scroll", () => {
  setActiveNavigation();
  updateScrollProgress();
});

window.addEventListener("load", () => {
  setActiveNavigation();
  updateScrollProgress();
});
