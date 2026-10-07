const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const projectRoot = path.resolve(__dirname, '..');
const brandDir = path.join(projectRoot, 'assets', 'brand');
const outputDir = path.join(projectRoot, 'assets', 'ios-icons');

const icons = [
  { source: 'moth-light-loop.svg', output: 'jotful-light-clear.png' },
  // iOS supplies the appearance background for every iOS icon variant.
  { source: 'moth-dark-loop.svg', output: 'jotful-dark-clear.png' },
  { source: 'moth-tinted-loop.svg', output: 'jotful-tinted-clear.png' },
];

for (const icon of icons) {
  let svg = fs.readFileSync(path.join(brandDir, icon.source), 'utf8');
  // App Store appearance variants must contain only artwork. iOS provides the
  // canvas/background, so strip a full-canvas backdrop if one is reintroduced.
  svg = svg.replace(/<rect\s+width="32"\s+height="32"[^>]*\/>\s*/, '');
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1024 } }).render().asPng();
  const output = path.join(outputDir, icon.output);
  fs.writeFileSync(output, png);
  console.log(`Wrote ${output}`);
}
