/* Turns the numbered index bar into real tabs: one section visible at a
   time, driven by the URL hash so links/back-button/bookmarks still work. */

(function () {
  const sections = Array.from(document.querySelectorAll("main > section[id]"));
  const tabs = Array.from(document.querySelectorAll("nav.index a"));
  if (!sections.length || !tabs.length) return;

  function idFromHref(href) {
    return href.replace(/^#/, "");
  }

  function validId(id) {
    return sections.some((section) => section.id === id) ? id : sections[0].id;
  }

  function showSection(id) {
    id = validId(id);
    sections.forEach((section) => {
      const isActive = section.id === id;
      const wasHidden = section.hidden;
      section.hidden = !isActive;
      if (isActive && wasHidden) {
        section.dispatchEvent(new CustomEvent("tab:shown"));
      }
    });
    tabs.forEach((tab) => {
      const isActive = idFromHref(tab.getAttribute("href")) === id;
      tab.classList.toggle("active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
    });
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", (event) => {
      event.preventDefault();
      const id = idFromHref(tab.getAttribute("href"));
      if (location.hash === "#" + id) {
        showSection(id);
      } else {
        location.hash = id;
      }
    });
  });

  window.addEventListener("hashchange", () => showSection(idFromHref(location.hash)));

  showSection(idFromHref(location.hash));
})();
