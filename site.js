"use strict";

function setUpCatalog(catalog) {
  const cards = Array.from(catalog.querySelectorAll("[data-card]"));
  const filters = Array.from(catalog.querySelectorAll("[data-filter]"));
  const search = catalog.querySelector("input[type=search]");
  const result = catalog.querySelector("[data-result]");
  const empty = catalog.querySelector("[data-empty]");
  const pager = catalog.querySelector("[data-pages]");
  const pageLabel = pager.querySelector("[data-page-label]");
  const previous = pager.querySelector("[data-page-prev]");
  const next = pager.querySelector("[data-page-next]");
  const pageSize = 24;
  const query = new URLSearchParams(location.search);
  let requestedFilter = query.get("category");
  if (catalog.dataset.catalog === "products" && requestedFilter === "seasonal") requestedFilter = "greenery";
  let category = filters.some((item) => item.dataset.filter === requestedFilter) ? requestedFilter : "";
  let page = Math.max(1, Number.parseInt(query.get("page"), 10) || 1);
  search.value = (query.get("q") || "").slice(0, 120);
  catalog.querySelector(".filters").hidden = false;
  search.form.hidden = false;

  function rememberState(values) {
    const url = new URL(location.href);
    for (const [name, value] of Object.entries(values)) {
      if (value) url.searchParams.set(name, value);
      else url.searchParams.delete(name);
    }
    if (location.protocol === "http:" || location.protocol === "https:") history.replaceState(null, "", url);
  }

  function render() {
    const keyword = search.value.trim().normalize("NFKC").toLocaleLowerCase("en");
    const matches = cards.filter((card) =>
      (!category || card.dataset.category === category) && (!keyword || card.dataset.search.includes(keyword))
    );
    const pages = Math.max(1, Math.ceil(matches.length / pageSize));
    page = Math.min(page, pages);
    const start = (page - 1) * pageSize;
    const shown = new Set(matches.slice(start, start + pageSize));
    const values = { category, q: search.value.trim(), page: page > 1 ? String(page) : "" };
    const context = new URLSearchParams({ from: "gallery" });
    for (const [name, value] of Object.entries(values)) if (value) context.set(name, value);
    for (const card of cards) {
      card.hidden = !shown.has(card);
      card.toggleAttribute("data-lead", catalog.dataset.catalog === "fashion" && !category && !keyword && card === matches[start]);
      if (!card.hidden) card.setAttribute("href", card.getAttribute("href").split("?", 1)[0] + "?" + context);
    }
    for (const filter of filters) filter.setAttribute("aria-pressed", String(filter.dataset.filter === category));
    result.textContent = matches.length ? `找到 ${matches.length} 个项目` : "未找到项目";
    empty.hidden = matches.length > 0;
    pager.hidden = pages < 2;
    pageLabel.textContent = page + " / " + pages;
    previous.disabled = page <= 1;
    next.disabled = page >= pages;
    rememberState(values);
  }

  catalog.querySelector("form").addEventListener("submit", (event) => event.preventDefault());
  search.addEventListener("input", () => { page = 1; render(); });
  for (const filter of filters) {
    filter.addEventListener("click", () => {
      category = filter.dataset.filter;
      page = 1;
      render();
    });
  }
  empty.querySelector("button").addEventListener("click", () => {
    category = "";
    page = 1;
    search.value = "";
    render();
    search.focus();
  });
  function changePage(offset) {
    page += offset;
    render();
    result.focus({ preventScroll: true });
    catalog.scrollIntoView({ block: "start" });
  }
  previous.addEventListener("click", () => changePage(-1));
  next.addEventListener("click", () => changePage(1));
  render();
}

function setUpCaseReturn(links) {
  const from = new URLSearchParams(location.search);
  if (from.get("from") !== "gallery") return;
  const allowed = links[0].dataset.allowedFilters.split(" ");
  const context = new URLSearchParams();
  const category = from.get("category");
  const search = (from.get("q") || "").trim().slice(0, 120);
  const page = from.get("page");
  if (allowed.includes(category)) context.set("category", category);
  if (search) context.set("q", search);
  if (page && /^[1-9]\d{0,2}$/.test(page)) context.set("page", page);
  for (const link of links) {
    const url = new URL(link.href);
    url.search = context.toString();
    link.href = url.href;
  }
  context.set("from", "gallery");
  for (const link of document.querySelectorAll(".case-neighbours a")) {
    const url = new URL(link.href);
    url.search = context.toString();
    link.href = url.href;
  }
}

function setUpLightbox(dialog) {
  if (typeof dialog.showModal !== "function") return;
  const galleries = Array.from(document.querySelectorAll("[data-enlarge]"));
  const display = dialog.querySelector("img");
  const index = dialog.querySelector("[data-lightbox-index]");
  const previous = dialog.querySelector("[data-lightbox-prev]");
  const next = dialog.querySelector("[data-lightbox-next]");
  const fullSize = dialog.querySelector("[data-lightbox-full]");
  const close = dialog.querySelector("[data-lightbox-close]");
  const singleLabel = dialog.dataset.singleLabel;
  previous.hidden = next.hidden = galleries.length < 2;
  let active = 0;
  let trigger;

  function showCurrent() {
    const link = galleries[active];
    display.alt = link.querySelector("img").alt;
    display.src = link.href;
    fullSize.href = link.href;
    index.textContent = singleLabel || ((active + 1) + " / " + galleries.length);
    previous.disabled = active === 0;
    next.disabled = active === galleries.length - 1;
  }

  function move(offset) {
    const target = active + offset;
    if (target < 0 || target >= galleries.length) return;
    active = target;
    showCurrent();
  }

  galleries.forEach((link, position) => link.addEventListener("click", (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    event.preventDefault();
    active = position;
    trigger = link;
    showCurrent();
    dialog.showModal();
    close.focus();
  }));
  previous.addEventListener("click", () => move(-1));
  next.addEventListener("click", () => move(1));
  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
    if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
  });
  dialog.addEventListener("close", () => {
    display.removeAttribute("src");
    trigger?.focus({ preventScroll: true });
  });
}

const catalog = document.querySelector("[data-catalog]");
if (catalog) setUpCatalog(catalog);
const returnLinks = document.querySelectorAll("[data-back-results]");
if (returnLinks.length) setUpCaseReturn(returnLinks);
const dialog = document.querySelector("[data-lightbox]");
if (dialog) setUpLightbox(dialog);
