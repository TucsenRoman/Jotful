// `npm run dev`: start the dev server for the Jotful Dev app (APP_VARIANT=development),
// which installs next to the App Store / TestFlight app. Works the same on Windows and macOS.
const { spawn } = require('child_process');

const child = spawn('npx', ['expo', 'start', '--dev-client', ...process.argv.slice(2)], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, APP_VARIANT: 'development' },
});
child.on('exit', (code) => process.exit(code ?? 0));
