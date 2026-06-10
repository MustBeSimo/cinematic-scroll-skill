#!/usr/bin/env node
/* Back-compat shim. The canonical entry point is cli.mjs.
   `node tools/cinematic-doctor/index.mjs ...` keeps working; new docs use cli.mjs. */
export * from './cli.mjs';
