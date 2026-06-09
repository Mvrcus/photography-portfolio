export function initMenu() {
  const menu = document.getElementById("menu");
  const menuBtn = document.getElementById("menu-btn");

  if (!menu || !menuBtn) {
    return;
  }

  menuBtn.addEventListener("click", () => {
    const isOpen = menuBtn.classList.toggle("is-open");
    menu.classList.toggle("h-32");
    menuBtn.setAttribute("aria-expanded", String(isOpen));
  });

  window.addEventListener("resize", () => {
    const windowSize = window.innerWidth || document.body.clientWidth;
    if (windowSize > 640) {
      menu.classList.remove("h-32");
      menuBtn.classList.remove("is-open");
      menuBtn.setAttribute("aria-expanded", "false");
    }
  });
}
