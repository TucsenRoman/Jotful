const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const projectRoot = path.resolve(__dirname, '..');
const source = path.join(projectRoot, 'assets', 'moth-mark.svg');
const output = path.join(projectRoot, 'assets', 'widget-moth.png');
const svg = fs.readFileSync(source);
const png = new Resvg(svg, { fitTo: { mode: 'width', value: 256 } }).render().asPng();

fs.writeFileSync(output, png);
console.log(`Wrote ${output}`);
