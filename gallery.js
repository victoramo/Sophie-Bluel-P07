// ================== Constantes ==================
const API_BASE = "http://localhost:5678/api/";
const WORKS_API = API_BASE + "works";
const CATEGORIES_API = API_BASE + "categories";

const GALLERY_DIV = document.querySelector(".gallery");
const FILTER_DIV  = document.querySelector(".filter");

// Origine des images (backend)
const ORIGIN = new URL(API_BASE).origin;

// Stock des travaux
let workList = [];

// ================== Helpers ==================
function buildImageUrl(imageUrl) {
  try { return new URL(imageUrl, `${ORIGIN}/`).href; }
  catch { return `${ORIGIN}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`; }
}

function renderGallery(works, targetDiv = GALLERY_DIV, withDelete = false) {
  targetDiv.innerHTML = "";
  works.forEach((w) => createWork(w, targetDiv, withDelete));
}

function createWork(work, targetDiv, withDelete) {
  const figure = document.createElement("figure");

  const img = document.createElement("img");
  img.src = buildImageUrl(work.imageUrl);
  img.alt = work.title || "Projet";
  img.loading = "lazy";

  const figcaption = document.createElement("figcaption");
  figcaption.textContent = work.title || "";

  figure.append(img, figcaption);
  targetDiv.appendChild(figure);

  // sécurise l'appel à createDeleteButton s'il existe ailleurs
  if (withDelete && typeof window.createDeleteButton === "function") {
    window.createDeleteButton(figure, work);
  }
}

function createFilterButton(category) {
  const a = document.createElement("a");
  a.id = "category" + category.id;
  a.className = "category";
  a.textContent = category.name;
  a.href = "#";
  a.addEventListener("click", (e) => {
    e.preventDefault();
    filterWorksByCategory(category.id);
  });
  FILTER_DIV.appendChild(a);
}

function addSelectedClass(categoryId) {
  const el = document.getElementById("category" + categoryId);
  if (el) el.classList.add("selected");
}
function removeSelectedClass() {
  document.querySelectorAll(".category").forEach((el) => el.classList.remove("selected"));
}

function filterWorksByCategory(categoryId) {
  const filtered = (categoryId === 0) ? workList : workList.filter((w) => w.categoryId === categoryId);
  renderGallery(filtered, GALLERY_DIV, false);
  removeSelectedClass();
  addSelectedClass(categoryId);
}

// ================== Fetchs ==================
async function initGallery() {
  const res = await fetch(WORKS_API);
  if (!res.ok) throw new Error("Impossible de charger les projets.");
  workList = await res.json();
  renderGallery(workList, GALLERY_DIV, false);
}

async function initFilters() {
  const res = await fetch(CATEGORIES_API);
  if (!res.ok) throw new Error("Impossible de charger les catégories.");
  const categories = await res.json();

  // "Tous"
  createFilterButton({ id: 0, name: "Tous" });
  addSelectedClass(0);

  // Uniques par id, puis création
  const uniqueCats = [...new Map(categories.map(c => [c.id, c])).values()];
  uniqueCats.forEach(createFilterButton);
}

// ================== API publique pour la modale ==================
async function fetchWorks(targetDiv, withDelete) {
  const res = await fetch(WORKS_API);
  const works = await res.json();
  // si on recharge la galerie principale, maj du cache local
  if (targetDiv === GALLERY_DIV) workList = works;
  renderGallery(works, targetDiv, withDelete);
}

function refreshWorks(targetDiv, withDelete) {
  targetDiv.innerHTML = "";
  fetchWorks(targetDiv, withDelete);
}

// utile après ajout/suppression : repasse sur "Tous" et refetch
function resetToAllAndRefresh() {
  const allBtn = document.getElementById("category0");
  if (allBtn) {
    removeSelectedClass();
    addSelectedClass(0);
  }
  refreshWorks(GALLERY_DIV, false);
}

// exposer pour les autres fichiers
window.GALLERY_DIV = GALLERY_DIV;
window.fetchWorks = fetchWorks;
window.refreshWorks = refreshWorks;
window.resetToAllAndRefresh = resetToAllAndRefresh;

// ================== Edition / Login ==================
function gestion_login() {
  if (sessionStorage.getItem("token")) {
    const loginLogoutLink = document.getElementById("login_logout") || document.getElementById("loginLink");
    if (loginLogoutLink) {
      loginLogoutLink.textContent = "logout";
      loginLogoutLink.href = "#";
      loginLogoutLink.addEventListener("click", function (event) {
        event.preventDefault();
        sessionStorage.removeItem("token");
        window.location.href = "index.html";
      });
    }
    const bandeau_edit = document.getElementById("edition");
    if (bandeau_edit) bandeau_edit.style.display = "flex";
    const projet_modif = document.getElementById("modif_projet");
    if (projet_modif) projet_modif.style.display = "inline";
    const button_filter = document.querySelector(".filter");
    if (button_filter) button_filter.style.display = "none";
  }
}

// ================== Boot ==================
(async function bootstrap() {
  try {
    await Promise.all([initGallery(), initFilters()]);
  } catch (err) {
    console.error(err);
    // fallback minimal (évite page vide)
    if (!GALLERY_DIV.innerHTML.trim()) {
      GALLERY_DIV.innerHTML = `<p style="text-align:center;color:#D65353">Erreur de chargement.</p>`;
    }
  } finally {
    // s'exécute quoi qu'il arrive (montre le bandeau, etc.)
    gestion_login();
  }
})();
