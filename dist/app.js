(() => {
  const guide = window.OOD_GUIDE;
  const root = document.documentElement;
  const themeKey = "ood-guide:theme";

  function setTheme(theme, persist = true) {
    root.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#0d1517" : "#f5f1e8");
    document.querySelectorAll(".theme-toggle").forEach((button) => {
      const next = theme === "dark" ? "light" : "dark";
      button.setAttribute("aria-label", `Switch to ${next} theme`);
      button.setAttribute("aria-pressed", String(theme === "dark"));
    });
    if (persist) localStorage.setItem(themeKey, theme);
  }

  document.querySelectorAll(".theme-toggle").forEach((button) => {
    button.addEventListener("click", () => setTheme(root.dataset.theme === "dark" ? "light" : "dark"));
  });
  setTheme(root.dataset.theme || "light", false);

  const escapeHtml = (value) => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  function cardLink(type, id) {
    return `reader.html?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`;
  }

  function renderHome() {
    const foundationGrid = document.querySelector("#foundation-grid");
    const projectGrid = document.querySelector("#project-grid");
    if (!foundationGrid || !projectGrid) return;

    foundationGrid.innerHTML = guide.fundamentals.map((item, index) => `
      <article class="guide-card">
        <span class="card-index">0${index + 1} · ${escapeHtml(item.minutes)} MIN</span>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.summary)}</p>
        <div class="card-meta"><span class="tag tag-accent">Foundation</span><span class="tag">Interview prompts</span></div>
        <a class="stretched" href="${cardLink("fundamental", item.id)}" aria-label="Open ${escapeHtml(item.title)}"></a>
      </article>`).join("");

    let activeFilter = "all";
    const search = document.querySelector("#project-search");
    const empty = document.querySelector("#empty-state");

    function drawProjects() {
      const query = search.value.trim().toLowerCase();
      const projects = guide.projects.filter((item) => {
        const matchesFilter = activeFilter === "all" || item.difficulty === activeFilter;
        const haystack = [item.title, item.summary, item.difficulty, ...item.focus].join(" ").toLowerCase();
        return matchesFilter && haystack.includes(query);
      });
      projectGrid.innerHTML = projects.map((item) => `
        <article class="guide-card">
          <span class="card-index">${escapeHtml(item.number)} · ${escapeHtml(item.difficulty)}</span>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.summary)}</p>
          <div class="card-meta">${item.focus.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
          <a class="stretched" href="${cardLink("project", item.id)}" aria-label="Open ${escapeHtml(item.title)}"></a>
        </article>`).join("");
      empty.hidden = projects.length > 0;
    }

    search.addEventListener("input", drawProjects);
    document.querySelectorAll("[data-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        activeFilter = button.dataset.filter;
        document.querySelectorAll("[data-filter]").forEach((item) => item.classList.toggle("is-active", item === button));
        drawProjects();
      });
    });
    drawProjects();
  }

  function section(id, title, body) {
    return `<section class="content-section" id="${id}"><h2>${escapeHtml(title)}</h2>${body}</section>`;
  }

  function renderFundamental(item) {
    const sections = [
      ["why", "Why this matters"], ["concepts", "Core concepts"], ["checklist", "Design checklist"],
      ["example", "Worked example"], ["questions", "Interview questions"]
    ];
    const content = [
      section("why", "Why this matters", `<p>${escapeHtml(item.why)}</p><div class="callout"><h3>Use it in the interview</h3><p>State the idea, apply it to the current design, then name the trade-off. A principle without a decision is only vocabulary.</p></div>`),
      section("concepts", "Core concepts", `<div class="concept-list">${item.concepts.map(([title, body]) => `<article class="concept-item"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(body)}</p></article>`).join("")}</div>`),
      section("checklist", "Design checklist", `<ul class="bullet-list">${item.checklist.map((entry) => `<li>${escapeHtml(entry)}</li>`).join("")}</ul>`),
      section("example", "Worked example", `<div class="code-card"><header>${escapeHtml(item.example.title)}</header><pre><code>${escapeHtml(item.example.code)}</code></pre></div>`),
      section("questions", "Interview questions", `<ol class="prompt-list">${item.questions.map((entry) => `<li>${escapeHtml(entry)}</li>`).join("")}</ol>`)
    ].join("");
    return { sections, content };
  }

  function parseApi(line) {
    const match = line.match(/^(GET|POST|PUT|PATCH|DELETE)\s+(.+)$/);
    return match ? [match[1], match[2]] : ["CALL", line];
  }

  function renderProject(item) {
    const sections = [
      ["scope", "Scope"], ["model", "Domain model"], ["flows", "Key flows"], ["decisions", "Decisions"],
      ["api", "API sketch"], ["edges", "Edge cases"], ["questions", "Interview prompts"]
    ];
    const content = [
      section("scope", "Scope and requirements", `<p>${escapeHtml(item.brief)}</p><ul class="bullet-list">${item.requirements.map((entry) => `<li>${escapeHtml(entry)}</li>`).join("")}</ul>`),
      section("model", "Domain model", `<p>Start with these responsibilities, then adapt the boundaries as requirements change.</p><div class="entity-grid">${item.entities.map(([name, purpose]) => `<article class="entity"><strong>${escapeHtml(name)}</strong><span>${escapeHtml(purpose)}</span></article>`).join("")}</div>`),
      section("flows", "Key object flows", `<div class="flow-grid">${item.flows.map(([name, steps]) => `<article class="flow-card"><h3>${escapeHtml(name)}</h3><ol>${steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol></article>`).join("")}</div>`),
      section("decisions", "Design decisions to defend", `<div class="decision-list">${item.decisions.map((entry) => `<article class="decision"><p>${escapeHtml(entry)}</p></article>`).join("")}</div>`),
      section("api", "API or service sketch", `<p>Use these as boundary-level conversation starters; adapt transport details to the interviewer’s scope.</p><div class="api-list">${item.api.map((entry) => { const [method, path] = parseApi(entry); return `<div class="api-line"><strong>${escapeHtml(method)}</strong><span>${escapeHtml(path)}</span></div>`; }).join("")}</div>`),
      section("edges", "Failure and edge cases", `<ul class="bullet-list">${item.edgeCases.map((entry) => `<li>${escapeHtml(entry)}</li>`).join("")}</ul><div class="callout"><h3>Pressure-test the model</h3><p>For each case, identify the invariant, the class that protects it, and whether the operation must be atomic or compensatable.</p></div>`),
      section("questions", "Interview prompts", `<ol class="prompt-list">${item.prompts.map((entry) => `<li>${escapeHtml(entry)}</li>`).join("")}</ol>`)
    ].join("");
    return { sections, content };
  }

  function renderReader() {
    const mount = document.querySelector("#reader-root");
    if (!mount) return;
    const params = new URLSearchParams(location.search);
    const type = params.get("type") === "project" ? "project" : "fundamental";
    const collection = type === "project" ? guide.projects : guide.fundamentals;
    const item = collection.find((entry) => entry.id === params.get("id"));
    if (!item) {
      mount.innerHTML = `<div class="not-found"><h1>Module not found</h1><p>The requested guide page does not exist.</p><a class="button button-primary" href="index.html">Return home</a></div>`;
      return;
    }

    const index = collection.indexOf(item);
    const previous = collection[index - 1];
    const next = collection[index + 1];
    const rendered = type === "project" ? renderProject(item) : renderFundamental(item);
    const label = type === "project" ? `Project ${item.number}` : item.kicker;
    const metricOne = type === "project" ? item.difficulty : `${item.minutes} min`;
    const metricTwo = type === "project" ? item.time : "Foundation";

    document.title = `${item.title} · OOD Field Guide`;
    mount.innerHTML = `
      <a class="reader-back" href="index.html#${type === "project" ? "projects" : "foundations"}">← All ${type === "project" ? "projects" : "foundations"}</a>
      <header class="reader-hero">
        <div><p class="eyebrow">${escapeHtml(label)}</p><h1>${escapeHtml(item.title)}</h1><p class="lede">${escapeHtml(item.summary)}</p></div>
        <div class="reader-meta"><div><span>Level</span><strong>${escapeHtml(metricOne)}</strong></div><div><span>Study time</span><strong>${escapeHtml(metricTwo)}</strong></div>${type === "project" ? `<div><span>Focus</span><strong>${escapeHtml(item.focus[0])}</strong></div><div><span>Prompts</span><strong>${item.prompts.length}</strong></div>` : `<div><span>Concepts</span><strong>${item.concepts.length}</strong></div><div><span>Questions</span><strong>${item.questions.length}</strong></div>`}</div>
      </header>
      <div class="reader-layout">
        <nav class="reader-nav" aria-label="On this page">${rendered.sections.map(([id, title]) => `<a href="#${id}">${escapeHtml(title)}</a>`).join("")}</nav>
        <article class="reader-content">${rendered.content}
          <nav class="reader-pager" aria-label="Adjacent modules">
            ${previous ? `<a class="pager-link" href="${cardLink(type, previous.id)}">← ${escapeHtml(previous.title)}</a>` : `<a class="pager-link" href="index.html">← Guide home</a>`}
            ${next ? `<a class="pager-link" href="${cardLink(type, next.id)}">${escapeHtml(next.title)} →</a>` : `<a class="pager-link" href="index.html#${type === "project" ? "projects" : "foundations"}">All modules →</a>`}
          </nav>
        </article>
      </div>`;
  }

  if (document.body.dataset.page === "home") renderHome();
  if (document.body.dataset.page === "reader") renderReader();
})();
