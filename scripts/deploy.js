// Mise en ligne sur alwaysdata : npm run deploy            (front + back)
//                                npm run deploy -- front   (front seulement)
//                                npm run deploy -- back    (back seulement)
//
// 1. construit le front (frontend/dist, avec frontend/.env.production)
// 2. envoie le tout en une seule connexion SSH (mot de passe demandé une fois)
//    - front : www/frontend/
//    - back  : www/backend/ (src, scripts, package.json) ; .env et uploads ne sont jamais touchés
//    - npm ci sur le serveur seulement si package-lock.json a changé
// 3. redémarre le site Node via l'API alwaysdata (si .env.deploy est rempli)
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const RACINE = path.join(__dirname, '..');
const SERVEUR = 'nad-nely@ssh-nad-nely.alwaysdata.net';
const COMPTE = 'nad-nely';

const choix = process.argv[2];
if (choix && !['front', 'back'].includes(choix)) {
  console.error('Usage : npm run deploy [-- front | -- back]');
  process.exit(1);
}
const avecFront = choix !== 'back';
const avecBack = choix !== 'front';

// Configuration locale (non versionnée) : jeton API et numéro du site Node
function lireConfig() {
  const fichier = path.join(RACINE, '.env.deploy');
  const config = {};
  if (!fs.existsSync(fichier)) return config;
  for (const ligne of fs.readFileSync(fichier, 'utf8').split(/\r?\n/)) {
    const m = ligne.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m) config[m[1]] = m[2];
  }
  return config;
}

function lancer(commande, options = {}) {
  execSync(commande, { stdio: 'inherit', ...options });
}

// tar (archive du dossier) → ssh (décompression sur le serveur), sans passer par un shell local
function envoyerArchive(dossier, commandeDistante) {
  return new Promise((resoudre, rejeter) => {
    const tar = spawn('tar', ['-cf', '-', '.'], { cwd: dossier, stdio: ['ignore', 'pipe', 'inherit'] });
    const ssh = spawn('ssh', [SERVEUR, commandeDistante], { stdio: ['pipe', 'inherit', 'inherit'] });
    tar.stdout.pipe(ssh.stdin);
    tar.on('error', rejeter);
    ssh.on('error', rejeter);
    ssh.on('close', (code) => (code === 0 ? resoudre() : rejeter(new Error(`ssh a échoué (code ${code})`))));
  });
}

async function redemarrerNode(config) {
  const { ALWAYSDATA_API_TOKEN: jeton, ALWAYSDATA_SITE_ID_API: idSite } = config;
  if (!jeton || !idSite) {
    console.log('\n⚠ .env.deploy incomplet : redémarrez le site Node dans le panneau alwaysdata (Web → Sites → Redémarrer).');
    return;
  }
  const auth = Buffer.from(`${jeton} account=${COMPTE}:`).toString('base64');
  const reponse = await fetch(`https://api.alwaysdata.com/v1/site/${idSite}/restart/`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!reponse.ok) {
    console.log(`\n⚠ Redémarrage refusé par l'API (${reponse.status}) : redémarrez le site Node dans le panneau alwaysdata.`);
    return;
  }
  console.log('✓ Site Node redémarré');
}

async function main() {
  const config = lireConfig();

  if (avecFront) {
    console.log('▶ Construction du front…');
    lancer('npm run build', { cwd: path.join(RACINE, 'frontend') });
  }

  // Dossier temporaire avec la même structure que www/ sur le serveur
  const envoi = fs.mkdtempSync(path.join(os.tmpdir(), 'nad-nely-deploy-'));
  try {
    if (avecFront) {
      fs.cpSync(path.join(RACINE, 'frontend', 'dist'), path.join(envoi, 'frontend'), { recursive: true });
    }
    if (avecBack) {
      for (const element of ['src', 'scripts', 'package.json', 'package-lock.json']) {
        fs.cpSync(path.join(RACINE, 'backend', element), path.join(envoi, 'backend', element), { recursive: true });
      }
    }

    const nettoyage = [avecFront && 'rm -rf frontend/assets', avecBack && 'rm -rf backend/src backend/scripts']
      .filter(Boolean).join(' && ');
    const apres = avecBack
      ? ' && cd backend && if [ "$avant" != "$(md5sum package-lock.json)" ]; then echo "▶ npm ci sur le serveur…" && npm ci --omit=dev; fi'
      : '';
    const distant = `set -e; cd www; avant=$(md5sum backend/package-lock.json 2>/dev/null || true); ${nettoyage} && tar -xf -${apres}`;

    console.log(`▶ Envoi vers alwaysdata (${[avecFront && 'front', avecBack && 'back'].filter(Boolean).join(' + ')})…`);
    await envoyerArchive(envoi, distant);
    console.log('✓ Fichiers envoyés');
  } finally {
    fs.rmSync(envoi, { recursive: true, force: true });
  }

  if (avecBack) await redemarrerNode(config);
  console.log('\n✓ Déploiement terminé : https://nad-nely.alwaysdata.net (Ctrl+F5 pour voir la nouvelle version)');
}

main().catch((erreur) => {
  console.error('\n✗ Déploiement interrompu :', erreur.message);
  process.exit(1);
});
