// modal-gallery.js (une modale, deux vues)
(function(){
  const API_BASE = "http://localhost:5678/api/";  // adapte si besoin
  const WORKS_API = API_BASE + "works";
  const CATS_API  = API_BASE + "categories";

  const openTrigger = document.getElementById("modif_projet");
  const modal       = document.getElementById("adminModal");
  if(!openTrigger || !modal) return;

  // refs
  const panel      = modal.querySelector(".amodal__panel");
  const closeBtn   = modal.querySelector(".amodal__close");
  const backBtn    = modal.querySelector(".amodal__back");
  const titleEl    = modal.querySelector("#amodalTitle");
  const viewGal    = modal.querySelector(".amodal__view--gallery");
  const viewForm   = modal.querySelector(".amodal__view--form");
  const grid       = modal.querySelector("#amodalGrid");
  const openForm   = modal.querySelector("#amodalOpenForm");

  // Form refs (montés ici pour éviter un 2e fichier)
  const form       = modal.querySelector("#amodalForm");
  const fileInput  = modal.querySelector("#amodalFile");
  const preview    = modal.querySelector("#amodalPreview");
  const icon       = modal.querySelector("#amodalUploadIcon");
  const titleInput = modal.querySelector("#amodalTitleInput");
  const catSelect  = modal.querySelector("#amodalCategory");
  const submitBtn  = modal.querySelector("#amodalSubmit");

  let escHandler = null;

  // ---- helpers
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);
  const token = () => sessionStorage.getItem("token");
  const isValidFile = f => f && /^image\/(jpeg|jpg|png)$/i.test(f.type) && f.size <= 4*1024*1024;

  // ---- open/close
  function open(){
    if(!token()) return;         // sécurité
    renderGrid();
    showGallery();
    modal.setAttribute("aria-hidden","false");
    document.body.classList.add("amodal-open");

    on(modal, "click", onBackdrop);
    on(closeBtn, "click", close);
    escHandler = (e)=>{ if(e.key==="Escape") close(); };
    document.addEventListener("keydown", escHandler, { once:false });
  }
  function close(){
    modal.setAttribute("aria-hidden","true");
    document.body.classList.remove("amodal-open");
    document.removeEventListener("keydown", escHandler);
  }
  function onBackdrop(e){
    if(e.target === modal) close();
  }

  // ---- views
  function showGallery(){
    viewForm.classList.remove("amodal__view--active");
    viewGal.classList.add("amodal__view--active");
    titleEl.textContent = "Galerie photo";
    backBtn.style.visibility = "hidden";
  }
  function showForm(){
    viewGal.classList.remove("amodal__view--active");
    viewForm.classList.add("amodal__view--active");
    titleEl.textContent = "Ajout photo";
    backBtn.style.visibility = "visible";
    loadCats();
    resetForm();
  }

  // ---- gallery rendering
  async function renderGrid(){
    grid.innerHTML = "";
    try{
      const res = await fetch(WORKS_API);
      const works = await res.json();
      works.forEach(w=>{
        const fig = document.createElement("figure");
        fig.innerHTML = `
          <img src="${w.imageUrl}" alt="${w.title||""}">
          <button class="amodal__trash" aria-label="Supprimer" data-id="${w.id}">
            <i class="fa-solid fa-trash-can"></i>
          </button>`;
        grid.appendChild(fig);
      });
      grid.querySelectorAll(".amodal__trash").forEach(btn=>{
        btn.addEventListener("click", ()=> removeWork(btn.dataset.id, btn.closest("figure")));
      });
    }catch(e){
      grid.innerHTML = `<p style="text-align:center;color:#D65353">Erreur de chargement.</p>`;
    }
  }

  async function removeWork(id, fig){
    if(!token()) return;
    if(!confirm("Supprimer ce projet ?")) return;
    const res = await fetch(`${WORKS_API}/${id}`, {
      method:"DELETE",
      headers:{ "Authorization": `Bearer ${token()}` }
    });
    if(res.ok){
      fig.remove();
      // rafraîchit la galerie publique si présente
      if(window.refreshWorks && window.GALLERY_DIV){
        window.refreshWorks(window.GALLERY_DIV, false);
      }
    }else{
      alert("Suppression impossible.");
    }
  }

  // ---- form
  async function loadCats(){
    if(!catSelect.options.length){
      try{
        const r = await fetch(CATS_API);
        const cats = await r.json();
        catSelect.innerHTML = "";
        cats.forEach(c=>{
          const opt = document.createElement("option");
          opt.value = c.id; opt.textContent = c.name;
          catSelect.appendChild(opt);
        });
      }catch{}
    }
  }
  function resetForm(){
    form.reset();
    preview.style.display = "none";
    icon.style.display = "block";
    submitBtn.disabled = true;
  }
  function validate(){
    const f = fileInput.files?.[0];
    const ok = isValidFile(f) && titleInput.value.trim() && catSelect.value;
    submitBtn.disabled = !ok;
  }

  on(fileInput, "change", ()=>{
    const f = fileInput.files?.[0];
    if(!f){ resetForm(); return; }
    if(!isValidFile(f)){
      alert("Format ou taille invalide (jpg/png, 4 Mo max).");
      fileInput.value = "";
      resetForm();
    }else{
      preview.src = URL.createObjectURL(f);
      preview.style.display = "block";
      icon.style.display = "none";
      validate();
    }
  });
  on(titleInput,"input",validate);
  on(catSelect,"change",validate);

  on(form, "submit", async (e)=>{
    e.preventDefault();
    const f = fileInput.files?.[0];
    const t = titleInput.value.trim();
    const c = catSelect.value;
    if(!token() || !isValidFile(f) || !t || !c) return;

    const fd = new FormData();
    fd.append("image", f);
    fd.append("title", t);
    fd.append("category", c);

    const resp = await fetch(WORKS_API, {
      method:"POST",
      headers:{ "Authorization": `Bearer ${token()}` },
      body: fd
    });
    if(resp.ok){
      // refresh galerie modale + publique
      await renderGrid();
      if(window.refreshWorks && window.GALLERY_DIV){
        window.refreshWorks(window.GALLERY_DIV, false);
      }
      showGallery();
    }else{
      alert("Échec de l’ajout.");
    }
  });

  // ---- events
  openTrigger.addEventListener("click", (e)=>{ e.preventDefault(); open(); });
  backBtn.addEventListener("click", showGallery);
  openForm.addEventListener("click", showForm);
  closeBtn.addEventListener("click", close);
  modal.addEventListener("click", onBackdrop);
})();
