// Parsing argv + dispatch. TIPIS: tidak ada logika tanggal di sini,
// hanya meneruskan argumen ke commands.js.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  cmdToday,
  cmdNext,
  cmdList,
  cmdCheck,
  cmdKejepit,
  cmdCuti,
  cmdRefresh,
  cmdHelp,
} from './commands.js';

function getVersion() {
  try {
    const pkg = JSON.parse(
      readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'package.json'), 'utf8'),
    );
    return pkg.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

const COMMANDS = {
  next: cmdNext,
  list: cmdList,
  cek: cmdCheck,
  kejepit: cmdKejepit,
  cuti: cmdCuti,
  refresh: cmdRefresh,
};

export async function run(argv) {
  const [cmd, ...rest] = argv;

  if (cmd === '--help' || cmd === '-h' || cmd === 'help') {
    const r = cmdHelp(getVersion());
    process.stdout.write(`${r.out}\n`);
    return r.code;
  }
  if (cmd === '--version' || cmd === '-v') {
    process.stdout.write(`${getVersion()}\n`);
    return 0;
  }

  let result;
  if (!cmd) {
    result = cmdToday();
  } else if (COMMANDS[cmd]) {
    result = await COMMANDS[cmd](rest);
  } else {
    const r = cmdHelp(getVersion());
    process.stdout.write(`Perintah tidak dikenal: ${cmd}\n\n${r.out}\n`);
    return 1;
  }

  process.stdout.write(`${result.out}\n`);
  return result.code;
}
