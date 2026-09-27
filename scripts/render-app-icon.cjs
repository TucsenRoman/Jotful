const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const projectRoot = path.resolve(__dirname, '..');
const mark = fs.readFileSync(path.join(projectRoot, 'assets', 'brand', 'moth-light-loop.svg')).toString('base64');
const output = path.join(projectRoot, 'assets', 'icon-1024.png');
const iconSvg = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><image href="data:image/svg+xml;base64,${mark}" width="1024" height="1024"/></svg>`;

fs.writeFileSync(output, new Resvg(iconSvg).render().asPng());
console.log(`Wrote ${output}`);
