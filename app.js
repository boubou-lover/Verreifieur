// ─── Config par défaut ───────────────────────────────────────────────────────
const DEFAULT_CONFIG = {
  caution: 2.00,
  prix2:   2.00,
  prix4:   4.00,
  produits: [
    { nom: '', prix: 0.00, caution: false },
    { nom: '', prix: 0.00, caution: false },
    { nom: '', prix: 0.00, caution: false }
  ]
};

// ─── État global ──────────────────────────────────────────────────────────────
let soldeDu       = 0;
let produitActif  = 0; // index 0-2 du formulaire produit affiché

// ─── Helpers ──────────────────────────────────────────────────────────────────
function clearZero(input) {
  if (parseFloat(input.value) === 0 || input.value === '') {
    input.value = '';
  }
}

function resetToZero(input) {
  if (input.value === '' || input.value === null) {
    // Si c'est un champ prix (step="0.01"), remettre 0.00
    input.value = input.step === '0.01' ? '0.00' : '0';
  }
  // Si c'est un champ prix, synchroniser le produit actif
  if (input.id === 'prixProduitActif') {
    syncProduitActif();
  }
}

function vibrate(pattern) {
  if ('vibrate' in navigator) navigator.vibrate(pattern);
}

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadConfig();
  majAffichagePrix();
  majProduitsSupplementaires();
  afficherFormulaireProductActif();
  displayVersion();

  document.getElementById('prix2').addEventListener('input', majAffichagePrix);
  document.getElementById('prix4').addEventListener('input', majAffichagePrix);
  document.getElementById('caution').addEventListener('input', () => {
    majAffichagePrix();
    majProduitsSupplementaires();
  });

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
  const cfg = raw ? JSON.parse(raw) : null;

  document.getElementById('prix2').value   = cfg?.prix2   ?? DEFAULT_CONFIG.prix2;
  document.getElementById('prix4').value   = cfg?.prix4   ?? DEFAULT_CONFIG.prix4;
  document.getElementById('caution').value = cfg?.caution ?? DEFAULT_CONFIG.caution;

  const produits = cfg?.produits ?? DEFAULT_CONFIG.produits;
  for (let i = 0; i < 3; i++) {
    const p = produits[i] ?? { nom: '', prix: 0.00, caution: false };
    // On stocke dans des attributs data sur les inputs cachés
    setDataProduit(i, p.nom, p.prix, p.caution);
  }
}

function saveConfig() {
  const produits = [];
  for (let i = 0; i < 3; i++) {
    produits.push(getDataProduit(i));
  }
  localStorage.setItem('verrifieur-config', JSON.stringify({
    prix2:   parseFloat(document.getElementById('prix2').value)   || 0,
    prix4:   parseFloat(document.getElementById('prix4').value)   || 0,
    caution: parseFloat(document.getElementById('caution').value) || 0,
    produits
  }));
}

// ─── Stockage produits via dataset sur le DOM ──────────────────────────────────
// On utilise des inputs cachés pour stocker les 3 produits indépendamment
// du formulaire "actif" affiché.

function getDataProduit(i) {
  const el = document.getElementById(`produitData${i}`);
  if (!el) return { nom: '', prix: 0, caution: false };
  return {
    nom:     el.dataset.nom     ?? '',
    prix:    parseFloat(el.dataset.prix) || 0,
    caution: el.dataset.caution === 'true'
  };
}

function setDataProduit(i, nom, prix, caution) {
  let el = document.getElementById(`produitData${i}`);
  if (!el) {
    el = document.createElement('span');
    el.id = `produitData${i}`;
    el.style.display = 'none';
    document.body.appendChild(el);
  }
  el.dataset.nom     = nom;
  el.dataset.prix    = prix;
  el.dataset.caution = caution;
}

// ─── Affichage des prix principaux ────────────────────────────────────────────
function majAffichagePrix() {
  const prix2   = parseFloat(document.getElementById('prix2').value)   || 0;
  const prix4   = parseFloat(document.getElementById('prix4').value)   || 0;
  const caution = parseFloat(document.getElementById('caution').value) || 0;

  document.getElementById('prix2E').textContent       = prix2.toFixed(2);
  document.getElementById('prix4E').textContent       = prix4.toFixed(2);
  document.getElementById('cautionBubble').textContent = `Caution : ${caution.toFixed(2)} €`;

  saveConfig();
}

// ─── Produits supplémentaires (lignes calculator) ─────────────────────────────
function majProduitsSupplementaires() {
  const cautionGlobale = parseFloat(document.getElementById('caution').value) || 0;
  let nbActifs = 0;

  for (let i = 0; i < 3; i++) {
    const p     = getDataProduit(i);
    const group = document.getElementById(`produitGroup${i}`);

    if (p.nom.trim() !== '') {
      nbActifs++;
      document.getElementById(`nomProduit${i}Label`).textContent  = p.nom;
      document.getElementById(`prixProduit${i}Label`).textContent = p.prix.toFixed(2);

      const tag = document.getElementById(`cautionProduit${i}Tag`);
      if (p.caution) {
        tag.textContent    = `+ ${cautionGlobale.toFixed(2)} € caution`;
        tag.style.display  = 'inline';
      } else {
        tag.textContent    = '';
        tag.style.display  = 'none';
      }
      group.style.display = 'flex';
    } else {
      group.style.display = 'none';
      document.getElementById(`nombreProduit${i}`).value = '0';
    }
  }

  // Badge sur le bouton sous-menu
  const badge = document.getElementById('produitsBadge');
  badge.textContent = nbActifs > 0 ? nbActifs : '';
  badge.style.display = nbActifs > 0 ? 'inline-flex' : 'none';
}

// ─── Sous-menu produits ───────────────────────────────────────────────────────
function toggleSousMenuProduits() {
  const panel = document.getElementById('sousMenuProduits');
  const arrow = document.getElementById('produitsArrow');
  const open  = panel.style.display === 'block';

  panel.style.display = open ? 'none' : 'block';
  arrow.textContent   = open ? '▼' : '▲';
}

// Navigation entre les 3 produits
function navProduit(delta) {
  // Sauvegarder d'abord le formulaire actuel
  sauvegarderFormulaireActif();
  produitActif = (produitActif + delta + 3) % 3;
  afficherFormulaireProductActif();
}

function allerProduit(index) {
  sauvegarderFormulaireActif();
  produitActif = index;
  afficherFormulaireProductActif();
}

function afficherFormulaireProductActif() {
  const p = getDataProduit(produitActif);

  document.getElementById('nomProduitActif').value       = p.nom;
  document.getElementById('prixProduitActif').value      = p.prix === 0 ? '0.00' : p.prix;
  document.getElementById('cautionProduitActif').checked = p.caution;

  document.getElementById('produitNavLabel').textContent = `Produit ${produitActif + 1} / 3`;

  // Pastilles
  for (let i = 0; i < 3; i++) {
    const dot = document.getElementById(`dot${i}`);
    const dp  = getDataProduit(i);
    dot.classList.toggle('active', i === produitActif);
    dot.classList.toggle('filled', dp.nom.trim() !== '');
  }
}

function sauvegarderFormulaireActif() {
  const nom     = document.getElementById('nomProduitActif').value.trim();
  const prix    = parseFloat(document.getElementById('prixProduitActif').value) || 0;
  const caution = document.getElementById('cautionProduitActif').checked;

  setDataProduit(produitActif, nom, prix, caution);
  majProduitsSupplementaires();
  saveConfig();
}

// Sync en temps réel quand on tape dans le formulaire actif
function syncProduitActif() {
  sauvegarderFormulaireActif();
  afficherFormulaireProductActif(); // rafraîchit les pastilles
}

// ─── Toggle paramètres ────────────────────────────────────────────────────────
function toggleParametres() {
  const params = document.getElementById('parametres');
  const open   = params.style.display === 'block';
  params.style.display = open ? 'none' : 'block';

  // Fermer le sous-menu si on ferme les paramètres
  if (open) {
    document.getElementById('sousMenuProduits').style.display = 'none';
    document.getElementById('produitsArrow').textContent = '▼';
  }
}

// ─── Calcul ───────────────────────────────────────────────────────────────────
function calculerSolde() {
  const nbGobeletsRendus = parseInt(document.getElementById('nombreGobeletsRendus').value) || 0;
  const nbBoissons2E     = parseInt(document.getElementById('nombreBoissons2E').value)     || 0;
  const nbBoissons4E     = parseInt(document.getElementById('nombreBoissons4E').value)     || 0;
  const nbEauPlate       = parseInt(document.getElementById('nombreEauPlate').value)       || 0;

  const prix2   = parseFloat(document.getElementById('prix2').value)   || 0;
  const prix4   = parseFloat(document.getElementById('prix4').value)   || 0;
  const caution = parseFloat(document.getElementById('caution').value) || 0;

  const totalBoissons       = (nbBoissons2E * prix2) + (nbBoissons4E * prix4);
  let   totalCautionDue     = caution * (nbBoissons2E + nbBoissons4E + nbEauPlate);
  let   totalProduitsSupp   = 0;

  for (let i = 0; i < 3; i++) {
    const p  = getDataProduit(i);
    if (p.nom.trim() === '') continue;
    const nb = parseInt(document.getElementById(`nombreProduit${i}`).value) || 0;
    totalProduitsSupp += nb * p.prix;
    if (p.caution) totalCautionDue += nb * caution;
  }

  const cautionRendue = caution * nbGobeletsRendus;
  const solde         = totalBoissons + totalProduitsSupp + totalCautionDue - cautionRendue;
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
  ['nombreGobeletsRendus','nombreBoissons2E','nombreBoissons4E','nombreEauPlate'].forEach(id => {
    document.getElementById(id).value = '0';
  });
  for (let i = 0; i < 3; i++) document.getElementById(`nombreProduit${i}`).value = '0';

  const r = document.getElementById('resultat');
  r.textContent = '';
  r.className   = 'result-box';

  document.getElementById('rendMonnaie').style.display  = 'none';
  document.getElementById('montantDonne').value          = '0';
  document.getElementById('renduMonnaie').textContent    = '';
  soldeDu = 0;
}

// ─── Reset complet ────────────────────────────────────────────────────────────
function resetForm() {
  nouveauClient();

  document.getElementById('prix2').value   = DEFAULT_CONFIG.prix2.toFixed(2);
  document.getElementById('prix4').value   = DEFAULT_CONFIG.prix4.toFixed(2);
  document.getElementById('caution').value = DEFAULT_CONFIG.caution.toFixed(2);

  for (let i = 0; i < 3; i++) {
    setDataProduit(i, '', 0, false);
  }

  produitActif = 0;
  majAffichagePrix();
  majProduitsSupplementaires();
  afficherFormulaireProductActif();
}