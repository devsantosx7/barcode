module.exports = {
  isLicensed: () => true,
  flags: () => ({
    outputToExcelEnabled: true,
    appendCSVEnabled: true,
    maxScanSessionsNumber: Number.MAX_SAFE_INTEGER,
  }),
  cfg: {},
};
