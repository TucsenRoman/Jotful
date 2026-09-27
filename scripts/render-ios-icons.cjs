const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const projectRoot = path.resolve(__dirname, '..');
const brandDir = path.join(projectRoot, 'assets', 'brand');
const outputDir = path.join(projectRoot, 'assets', 'ios-icons');

const icons = [
  { source: 'moth-light-loop.svg', output: 'jotful-light.png' },
  // iOS supplies the dark appearance background; this source intentionally keeps only the moth artwork.
  { source: 'moth-dark-loop.svg', output: 'jotful-dark.png', transparentBackground: true },
  { source: 'moth-tinted-loop.svg', output: 'jotful-tinted.png' },
];

for (const icon of icons) {
  let svg = fs.readFileSync(path.join(brandDir, icon.source), 'utf8');
  if (icon.transparentBackground) {
    svg = svg.replace(/<rect\b[^>]*\/>\s*/, '');
  }

  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1024 } }).render().asPng();
  const output = path.join(outputDir, icon.output);
  fs.writeFileSync(output, png);
  console.log(`Wrote ${output}`);
}
