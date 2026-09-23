(function () {
  "use strict";

  var PRIORITY_CATEGORIES = ["行事写真", "授業・教材", "学科・部活紹介"];

  var sectionsContainer = document.getElementById("sections-container");
  var noResultsEl = document.getElementById("no-results");
  var loadingEl = document.getElementById("loading-message");
  var searchInput = document.getElementById("search-input");

  var allLinks = [];

  fetch("links.json")
    .then(function (res) {
      if (!res.ok) {
        throw new Error("HTTP " + res.status);
      }
      return res.json();
    })
    .then(function (data) {
      allLinks = Array.isArray(data) ? data : [];
      loadingEl.hidden = true;
      render(allLinks);
      searchInput.addEventListener("input", handleSearch);
    })
    .catch(function (err) {
      console.error("links.json の読み込みに失敗しました:", err);
      loadingEl.textContent =
        "リンク情報の読み込みに失敗しました。links.json を確認してください。";
    });

  function handleSearch() {
    var query = searchInput.value.trim().toLowerCase();
    if (!query) {
      render(allLinks);
      return;
    }
    var filtered = allLinks.filter(function (item) {
      var title = (item.title || "").toLowerCase();
      var category = (item.category || "").toLowerCase();
      var description = (item.description || "").toLowerCase();
      return (
        title.indexOf(query) !== -1 ||
        category.indexOf(query) !== -1 ||
        description.indexOf(query) !== -1
      );
    });
    render(filtered);
  }

  function groupByCategory(links) {
    var groups = {};
    var order = [];

    links.forEach(function (item) {
      var category = item.category && item.category.trim() ? item.category.trim() : "その他";
      if (!groups[category]) {
        groups[category] = [];
        order.push(category);
      }
      groups[category].push(item);
    });

    var sortedOrder = PRIORITY_CATEGORIES.filter(function (c) {
      return groups[c];
    }).concat(
      order.filter(function (c) {
        return PRIORITY_CATEGORIES.indexOf(c) === -1;
      })
    );

    return { groups: groups, order: sortedOrder };
  }

  function render(links) {
    sectionsContainer.innerHTML = "";

    if (!links.length) {
      noResultsEl.hidden = false;
      return;
    }
    noResultsEl.hidden = true;

    var grouped = groupByCategory(links);

    grouped.order.forEach(function (category) {
      var items = grouped.groups[category];
      var section = document.createElement("section");
      section.className = "category-section";

      var heading = document.createElement("h2");
      heading.className = "category-heading";
      heading.innerHTML =
        escapeHtml(category) +
        ' <span class="category-count">' + items.length + "</span>";
      section.appendChild(heading);

      var grid = document.createElement("div");
      grid.className = "card-grid";

      items.forEach(function (item) {
        grid.appendChild(buildCard(item));
      });

      section.appendChild(grid);
      sectionsContainer.appendChild(section);
    });
  }

  function buildCard(item) {
    var card = document.createElement("a");
    card.className = "card";
    card.href = item.url || "#";
    card.target = "_blank";
    card.rel = "noopener noreferrer";

    if (item.thumbnail) {
      var img = document.createElement("img");
      img.className = "card-thumb";
      img.src = item.thumbnail;
      img.alt = item.title || "";
      img.loading = "lazy";
      img.onerror = function () {
        var placeholder = document.createElement("div");
        placeholder.className = "card-thumb-placeholder";
        placeholder.textContent = "🌐";
        img.replaceWith(placeholder);
      };
      card.appendChild(img);
    } else {
      var placeholder = document.createElement("div");
      placeholder.className = "card-thumb-placeholder";
      placeholder.textContent = "🌐";
      card.appendChild(placeholder);
    }

    var body = document.createElement("div");
    body.className = "card-body";

    var title = document.createElement("h3");
    title.className = "card-title";
    title.textContent = item.title || "無題のページ";
    body.appendChild(title);

    if (item.description) {
      var desc = document.createElement("p");
      desc.className = "card-desc";
      desc.textContent = item.description;
      body.appendChild(desc);
    }

    var hint = document.createElement("span");
    hint.className = "card-link-hint";
    hint.textContent = "ページを開く";
    body.appendChild(hint);

    card.appendChild(body);
    return card;
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
})();
