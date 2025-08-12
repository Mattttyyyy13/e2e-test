const fs = require('fs');
const path = require('path');

const RESULTS_DIR = path.resolve(process.cwd(), 'allure-results');

if (!fs.existsSync(RESULTS_DIR)) {
  console.log('no allure-results dir, skipping cleanup');
  process.exit(0);
}

const files = fs.readdirSync(RESULTS_DIR);

// find all result jsons ending with -result.json
const resultFiles = files.filter(f => f.endsWith('-result.json'));

for (const rf of resultFiles) {
  const full = path.join(RESULTS_DIR, rf);
  let json;
  try {
    json = JSON.parse(fs.readFileSync(full, 'utf8'));
  } catch (e) {
    continue; // skip non-json or unreadable
  }
  const labels = json.labels || [];
  // detect our setup tag (or owner/system if you prefer)
  const isSetup = labels.some(l =>
    (l.name === 'tag' && l.value === 'setup') ||
    (l.name === 'owner' && l.value === 'system')
  );

  if (isSetup) {
    const prefix = rf.replace(/-result\.json$/, '');
    console.log(`Removing Allure files with prefix: ${prefix}`);
    for (const f of files) {
      if (f.startsWith(prefix)) {
        fs.unlinkSync(path.join(RESULTS_DIR, f));
      }
    }
  }
}
