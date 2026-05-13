const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const navLinks = document.querySelectorAll(".site-nav a[href^='#']");
const sections = document.querySelectorAll("section[id]");
const form = document.querySelector(".contact-form");
const formStatus = document.querySelector("[data-form-status]");
const commentForm = document.querySelector("[data-comment-form]");
const commentStatus = document.querySelector("[data-comment-status]");
const lightbox = document.querySelector("[data-lightbox]");
const lightboxImage = document.querySelector("[data-lightbox-image]");
const lightboxCaption = document.querySelector("[data-lightbox-caption]");
const lightboxClose = document.querySelector("[data-lightbox-close]");
const clickToast = document.querySelector("[data-click-toast]");
let toastTimer;

function updateHeader() {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 24);
}

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

function updateActiveLink() {
  let currentId = "home";

  sections.forEach((section) => {
    const sectionTop = section.offsetTop - 120;
    if (window.scrollY >= sectionTop) {
      currentId = section.id;
    }
  });

  navLinks.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === `#${currentId}`);
  });
}

updateActiveLink();
window.addEventListener("scroll", updateActiveLink, { passive: true });

if (location.pathname.endsWith("/") || location.pathname.endsWith("index.html") || location.pathname === "/") {
  fetch("/api/view", { method: "POST" }).catch(() => {});
}

function showToast(message) {
  if (!clickToast) return;
  clickToast.textContent = message;
  clickToast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    clickToast.classList.remove("is-visible");
  }, 2600);
}

if (navToggle && nav) {
  function closeMenu() {
    nav.classList.remove("is-open");
    document.body.classList.remove("menu-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open navigation");
  }

  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    document.body.classList.toggle("menu-open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
  });

  nav.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      closeMenu();
    }
  });

  document.addEventListener("click", (event) => {
    if (!document.body.classList.contains("menu-open")) return;
    if (nav.contains(event.target) || navToggle.contains(event.target)) return;
    closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
}

if (form && formStatus) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      service: formData.get("service"),
      message: formData.get("message"),
    };

    formStatus.textContent = "Sending your message...";

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Could not send message.");
      }

      formStatus.textContent = result.message;
      showToast("Message saved. KeyJunior Solution will respond soon.");
      form.reset();
    } catch (error) {
      formStatus.textContent = "Backend is not running. Start it with npm start, or contact WhatsApp: 0763367139.";
      showToast("Start the backend server to save contact messages.");
    }
  });
}

if (commentForm && commentStatus) {
  commentForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(commentForm);
    const payload = {
      name: formData.get("name"),
      message: formData.get("message"),
    };

    commentStatus.textContent = "Saving comment...";

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Could not save comment.");
      }

      commentStatus.textContent = result.message;
      showToast("Comment saved. You can see it in the admin dashboard.");
      commentForm.reset();
    } catch {
      commentStatus.textContent = "Backend is not running. Start it to save comments.";
      showToast("Start the backend server to save comments.");
    }
  });
}

document.querySelectorAll(".feature-grid article").forEach((card) => {
  const title = card.querySelector("h3")?.textContent || "Service";
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `View ${title} details`);

  const openService = () => {
    document.querySelector(".service-detail-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
    showToast(`${title}: scroll down for the full service details.`);
  };

  card.addEventListener("click", openService);
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openService();
    }
  });
});

document.querySelectorAll(".service-detail-grid article, .project-list article, .metric-card, .chart-card").forEach((card) => {
  const title = card.querySelector("h2, strong, .chart-head span")?.textContent || "KeyJunior Solution";
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.addEventListener("click", () => showToast(`${title} selected. Contact KeyJunior to start this work.`));
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      showToast(`${title} selected. Contact KeyJunior to start this work.`);
    }
  });
});

function closeLightbox() {
  if (!lightbox) return;
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("lightbox-open");
}

document.querySelectorAll(".gallery-grid figure").forEach((figure) => {
  const image = figure.querySelector("img");
  const caption = figure.querySelector("figcaption")?.textContent || image?.alt || "Gallery image";
  figure.tabIndex = 0;
  figure.setAttribute("role", "button");
  figure.setAttribute("aria-label", `Open ${caption} image`);

  const openLightbox = () => {
    if (!lightbox || !lightboxImage || !image) return;
    lightboxImage.src = image.src;
    lightboxImage.alt = image.alt;
    if (lightboxCaption) lightboxCaption.textContent = caption;
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("lightbox-open");
  };

  figure.addEventListener("click", openLightbox);
  figure.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openLightbox();
    }
  });
});

lightboxClose?.addEventListener("click", closeLightbox);
lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeLightbox();
});

document.querySelectorAll("a[href^='https://wa.me'], a[href*='instagram.com'], a[href^='mailto:']").forEach((link) => {
  link.addEventListener("click", () => {
    showToast("Opening KeyJunior Solution contact link.");
  });
});
