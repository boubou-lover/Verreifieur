// ─── Produits par défaut (non supprimables) ───────────────────────────────────
const PRODUITS_DEFAUT = [
  { nom: 'Bières & softs',   prix: 2.00, caution: true,  fixe: true },
  { nom: 'Bières spéciales', prix: 4.00, caution: true,  fixe: true },
  { nom: 'Eau plate',        prix: 0.00, caution: true,  fixe: true }
];

// ─── État global ──────────────────────────────────────────────────────────────
let produits  = [];   // tableau de tous les produits (défaut + ajoutés)
let soldeDu   = 0;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function clearZero(input) {
  if (parseFloat(input.value) === 0 || input.value === '') input.value = '';
}

function resetToZero(input) {
  if (input.value === '' || input.value === null) {
    input.value = input.step === '0.01' ? '0.00' : '0';
  }
}

function vibrate(pattern) {
  if ('vibrate' in navigator) navigator.vibrate(pattern);
}

function getCaution() {
  return parseFloat(document.getElementById('caution').value) || 0;
}

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadConfig();
  renderAll();
  displayVersion();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
      .catch(err => console.log('SW:', err));
  }
});

// ─── Version ──────────────────────────────────────────────────────────────────
async function displayVersion() {
  try {
    const text  = await (await fetch('/service-worker.js')).text();
    const match = text.match(/CACHE_NAME\s*=\s*["']verrifieur-v([\d.]+)["']/);
    document.getElementById('app-version').textContent = match ? match[1] : '1.0.1';
  } catch {
    document.getElementById('app-version').textContent = '1.0.1';
  }
}

// ─── LocalStorage ─────────────────────────────────────────────────────────────
function loadConfig() {
  const raw = localStorage.getItem('verrifieur-config');
  if (raw) {
    const cfg = JSON.parse(raw);
    document.getElementById('caution').value = cfg.caution ?? 2.00;

    // Si les produits sauvegardés n'ont pas la propriété 'fixe',
    // c'est une ancienne version — on repart des défauts
    const produitsSauv = cfg.produits ?? [];
    const valides = produitsSauv.every(p => 'fixe' in p && 'caution' in p);
    if (valides && produitsSauv.length >= 3) {
      produits = produitsSauv;
    } else {
      produits = cloneProduitsDef();
    }
  } else {
    document.getElementById('caution').value = 2.00;
    produits = cloneProduitsDef();
  }
}

function saveConfig() {
  localStorage.setItem('verrifieur-config', JSON.stringify({
    caution:  getCaution(),
    produits: produits
  }));
}

function cloneProduitsDef() {
  return PRODUITS_DEFAUT.map(p => ({ ...p }));
}

// ─── Rendu principal ──────────────────────────────────────────────────────────

// Rend les lignes du calculateur ET la liste dans les paramètres
function renderAll() {
  renderLignesProduits();
  renderListeParametres();
  updateCautionBubble();
  updateBadge();
}

// Lignes de saisie dans le calculateur
function renderLignesProduits() {
  const container = document.getElementById('lignesProduits');
  container.innerHTML = '';

  produits.forEach((p, i) => {
    const caution = getCaution();
    const prixTotal = p.caution ? p.prix + caution : p.prix;

    const div = document.createElement('div');
    div.className = p.fixe ? 'form-group' : 'form-group produit-extra';
    div.id = `ligneP${i}`;

    const labelEl = document.createElement('label');
    labelEl.innerHTML = `
      <span class="drink-name">${escHtml(p.nom || '—')}</span>
      <span class="price-tag">
        ${p.prix.toFixed(2)} €
        ${p.caution ? `<span class="caution-tag">+ ${caution.toFixed(2)} € caution</span>` : ''}
      </span>`;

    const input = document.createElement('input');
    input.type    = 'number';
    input.id      = `qte${i}`;
    input.value   = '0';
    input.min     = '0';
    input.setAttribute('onfocus', 'clearZero(this)');
    input.setAttribute('onblur',  'resetToZero(this)');

    div.appendChild(labelEl);
    div.appendChild(input);
    container.appendChild(div);
  });
}

// Liste éditable dans les paramètres
function renderListeParametres() {
  const container = document.getElementById('listeProduits');
  container.innerHTML = '';

  produits.forEach((p, i) => {
    const bloc = document.createElement('div');
    bloc.className = 'produit-config-block';

    // En-tête avec badge fixe/custom et bouton supprimer
    const header = document.createElement('div');
    header.className = 'produit-config-header';
    header.innerHTML = `
      <span>${p.fixe ? '🔒' : '🧃'} ${escHtml(p.nom || 'Nouveau produit')}</span>
      ${!p.fixe ? `<button class="btn-suppr" onclick="supprimerProduit(${i})">🗑</button>` : ''}
    `;

    // Champ nom
    const rowNom = makeFormRow('Nom :', `
      <input type="text" value="${escHtml(p.nom)}" maxlength="30"
        placeholder="Nom du produit"
        oninput="updateProduit(${i}, 'nom', this.value)">
    `);

    // Champ prix
    const rowPrix = makeFormRow('Prix unitaire :', `
      <input type="number" value="${p.prix.toFixed(2)}" step="0.01" min="0"
        onfocus="clearZero(this)" onblur="resetToZero(this)"
        oninput="updateProduit(${i}, 'prix', parseFloat(this.value)||0)">
    `);

    // Toggle caution
    const rowCaution = makeFormRow('Caution verre :', `
      <label class="toggle">
        <input type="checkbox" ${p.caution ? 'checked' : ''}
          onchange="updateProduit(${i}, 'caution', this.checked)">
        <span class="toggle-slider"></span>
      </label>
    `);

    bloc.appendChild(header);
    bloc.appendChild(rowNom);
    bloc.appendChild(rowPrix);
    bloc.appendChild(rowCaution);
    container.appendChild(bloc);
  });
}

function makeFormRow(labelText, inputHtml) {
  const div = document.createElement('div');
  div.className = 'form-group';
  div.innerHTML = `<label>${labelText}</label>${inputHtml}`;
  return div;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Mise à jour produit ──────────────────────────────────────────────────────
function updateProduit(i, champ, valeur) {
  produits[i][champ] = valeur;
  saveConfig();
  // Rafraîchir uniquement les lignes calculateur et le header du bloc param
  renderLignesProduits();
  updateBadge();
  updateCautionBubble();
  // Mettre à jour juste le titre du bloc sans re-render toute la liste
  const headers = document.querySelectorAll('.produit-config-header span:first-child');
  if (headers[i]) {
    headers[i].textContent = `${produits[i].fixe ? '🔒' : '🧃'} ${produits[i].nom || 'Nouveau produit'}`;
  }
}

// ─── Ajouter / Supprimer produit ──────────────────────────────────────────────
function ajouterProduit() {
  produits.push({ nom: '', prix: 0.00, caution: false, fixe: false });
  saveConfig();
  renderAll();
  // Scroller vers le nouveau bloc
  setTimeout(() => {
    const blocs = document.querySelectorAll('.produit-config-block');
    if (blocs.length) blocs[blocs.length - 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 50);
}

function supprimerProduit(i) {
  produits.splice(i, 1);
  saveConfig();
  renderAll();
}

// ─── Caution ─────────────────────────────────────────────────────────────────
function onCautionChange() {
  saveConfig();
  renderLignesProduits();
  updateCautionBubble();
}

function updateCautionBubble() {
  document.getElementById('cautionBubble').textContent = `Caution : ${getCaution().toFixed(2)} €`;
}

function updateBadge() {
  const extras = produits.filter(p => !p.fixe).length;
  const badge  = document.getElementById('produitsBadge');
  if (extras > 0) {
    badge.textContent   = extras;
    badge.style.display = 'inline-flex';
  } else {
    badge.style.display = 'none';
  }
}

// ─── Toggle paramètres / sous-menu ───────────────────────────────────────────
function toggleParametres() {
  const params = document.getElementById('parametres');
  const open   = params.style.display === 'block';
  params.style.display = open ? 'none' : 'block';
  if (open) closeSousMenu();
}

function toggleSousMenuProduits() {
  const panel = document.getElementById('sousMenuProduits');
  const arrow = document.getElementById('produitsArrow');
  const open  = panel.style.display === 'block';
  panel.style.display = open ? 'none' : 'block';
  arrow.textContent   = open ? '▼' : '▲';
}

function closeSousMenu() {
  document.getElementById('sousMenuProduits').style.display = 'none';
  document.getElementById('produitsArrow').textContent      = '▼';
}

// ─── Calcul ───────────────────────────────────────────────────────────────────
function calculerSolde() {
  const nbGobeletsRendus = parseInt(document.getElementById('nombreGobeletsRendus').value) || 0;
  const caution          = getCaution();

  let totalProduits   = 0;
  let totalCautionDue = 0;

  produits.forEach((p, i) => {
    const nb = parseInt(document.getElementById(`qte${i}`)?.value) || 0;
    totalProduits   += nb * p.prix;
    if (p.caution) totalCautionDue += nb * caution;
  });

  const cautionRendue = caution * nbGobeletsRendus;
  const solde         = totalProduits + totalCautionDue - cautionRendue;
  soldeDu = solde;

  vibrate(50);

  const resultat = document.getElementById('resultat');
  let texte, classe;

  if (solde > 0.001) {
    texte  = `Le client doit : ${solde.toFixed(2)} €`;
    classe = 'result-ok';
    document.getElementById('rendMonnaie').style.display = 'block';
    document.getElementById('montantDonne').value        = '0';
    document.getElementById('renduMonnaie').textContent  = '';
  } else if (solde < -0.001) {
    texte  = `À rendre au client : ${(-solde).toFixed(2)} €`;
    classe = 'result-warn';
    document.getElementById('rendMonnaie').style.display = 'none';
  } else {
    texte  = 'Solde nul ✓';
    classe = 'result-neutral';
    document.getElementById('rendMonnaie').style.display = 'none';
  }

  resultat.textContent = texte;
  resultat.className   = `result-box ${classe}`;
}

// ─── Rendu monnaie ────────────────────────────────────────────────────────────
function calculerRenduMonnaie() {
  const montantDonne = parseFloat(document.getElementById('montantDonne').value) || 0;
  const el           = document.getElementById('renduMonnaie');
  if (montantDonne === 0) { el.textContent = ''; return; }

  const diff = montantDonne - soldeDu;
  if (diff > 0.001) {
    el.textContent = `À rendre : ${diff.toFixed(2)} €`;
    el.style.color = '#ffa500';
  } else if (diff < -0.001) {
    el.textContent = `Manque : ${(-diff).toFixed(2)} €`;
    el.style.color = '#f44';
  } else {
    el.textContent = 'Montant exact ✓';
    el.style.color = '#4caf50';
  }
}

function setMontant(montant) {
  vibrate(30);
  document.getElementById('montantDonne').value = montant;
  calculerRenduMonnaie();
}

// ─── Nouveau client ───────────────────────────────────────────────────────────
function nouveauClient() {
  vibrate(30);
  document.getElementById('nombreGobeletsRendus').value = '0';
  produits.forEach((_, i) => {
    const el = document.getElementById(`qte${i}`);
    if (el) el.value = '0';
  });

  const r = document.getElementById('resultat');
  r.textContent = '';
  r.className   = 'result-box';

  document.getElementById('rendMonnaie').style.display = 'none';
  document.getElementById('montantDonne').value        = '0';
  document.getElementById('renduMonnaie').textContent  = '';
  soldeDu = 0;
}

// ─── Réinitialiser (prix + supprime produits ajoutés) ─────────────────────────
function resetForm() {
  if (!confirm('Réinitialiser les prix et supprimer les produits ajoutés ?')) return;

  nouveauClient();

  document.getElementById('caution').value = 2.00;
  produits = cloneProduitsDef();

  saveConfig();
  renderAll();
  closeSousMenu();
}