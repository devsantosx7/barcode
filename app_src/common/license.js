const fs = require('fs');
const path = require('path');

function loadConfig() {
  const locations = [
    path.join(process.cwd(), 'config.json'),
    path.join(process.cwd(), 'config', 'config.json'),
    path.join(__dirname, '../config.json'),
  ];
  for (const loc of locations) {
    try {
      if (fs.existsSync(loc)) {
        const data = fs.readFileSync(loc, 'utf-8');
        return JSON.parse(data);
      }
    } catch {}
  }
  return {};
}

function isLicensed(cfg) {
  if (cfg.developerMode === true) {
    return true;
  }
  const dateValid = Date.now() <= Number(cfg.storage_next_charge_date || 0);
  if (!dateValid) return false;
  if (cfg.storage_monthly_scan_count !== undefined || cfg.maxScanSessionsNumber !== undefined) {
    return Number(cfg.storage_monthly_scan_count || 0) < Number(cfg.maxScanSessionsNumber || 2000);
  }
  return true;
}

function premiumFlags(cfg) {
  if (cfg.developerMode === true) {
    return {
      outputToExcelEnabled: true,
      appendCSVEnabled: true,
      maxScanSessionsNumber: 999999,
    };
  }
  return {
    outputToExcelEnabled: Boolean(cfg.outputToExcelEnabled),
    appendCSVEnabled: Boolean(cfg.appendCSVEnabled),
    maxScanSessionsNumber: Number(cfg.maxScanSessionsNumber || 2000),
  };
}

const cfg = loadConfig();
console.log('[license] developerMode =', Boolean(cfg && cfg.developerMode));

module.exports = {
  cfg,
  isLicensed: () => isLicensed(cfg),
  flags: () => premiumFlags(cfg),
};
