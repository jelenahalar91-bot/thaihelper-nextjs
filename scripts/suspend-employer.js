#!/usr/bin/env node
// Renamed 2026-09-28 to scripts/suspend-account.js, which takes helper refs
// too. Kept as a shim: alert mails sent before that date still name this file.
console.error('[deprecated] suspend-employer.js → suspend-account.js (handles TH- refs as well)\n');
require('./suspend-account.js');
