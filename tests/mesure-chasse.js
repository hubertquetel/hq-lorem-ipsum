// Mesure l'erreur de largeur du script, sans InDesign.
// Usage : node tests/mesure-chasse.js [chemin/vers/HQ_Lorem_Ipsum.jsx]
//
// Le script est chargé avec un faux objet `app`, puis on appelle directement ses
// fonctions internes buildJobs() et textWidth() (exposées juste avant la section 7).
// Ce n'est PAS un test du comportement dans InDesign.

const fs = require('fs');
const path = require('path');

const fichier = process.argv[2] || path.join(__dirname, '..', 'HQ_Lorem_Ipsum.jsx');
const marqueur = '// 7. S';
const source = fs.readFileSync(fichier, 'utf8').replace(/^#target.*$/m, '');
if (!source.includes(marqueur)) { console.error('Marqueur "' + marqueur + '" introuvable : le script a changé.'); process.exit(1); }

global.app = { documents: { length: 1 }, selection: [{ constructor: { name: 'X' } }], doScript: f => f() };
global.ScriptLanguage = {}; global.UndoModes = {}; global.alert = () => {};
new Function(source.replace(marqueur, 'global.__t = { textWidth, buildJobs };\n' + marqueur))();
const { textWidth, buildJobs } = global.__t;

const texte = ("La société a réalisé en 2024 un chiffre d'affaires de 15,5 M€ grâce à l'ensemble des équipes, " +
  "avec une croissance de 12 % sur l'année. Les investissements immobiliers restent soutenus, notamment dans " +
  "les villes moyennes où la demande locative demeure très forte. Le conseil d'administration a confirmé sa stratégie. ").repeat(40);

const taches = buildJobs(texte);
let erreur = 0, n = 0, ecart = 0, ecartMax = 0, avant = 0, apres = 0;
for (const t of taches) {
  if (t.txt === '' || t.txt === ' ') continue;          // % et retours forcés : pas des mots
  const o = texte.substr(t.pos, t.len);
  const w0 = textWidth(o), w1 = textWidth(t.txt);
  if (w0 === 0) continue;
  erreur += Math.abs(w1 - w0) / w0; n++;
  ecart += w1 - w0; ecartMax = Math.max(ecartMax, Math.abs(ecart));
  avant += w0; apres += w1;
}
console.log('mots remplacés                    :', n);
console.log('erreur relative moyenne par mot   :', (100 * erreur / n).toFixed(2) + ' %');
console.log('écart cumulé maximal              :', (ecartMax / 1000).toFixed(2) + ' em');
console.log('écart total de largeur            :', (100 * (apres - avant) / avant).toFixed(2) + ' %');
