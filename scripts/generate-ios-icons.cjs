const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const root = path.resolve(__dirname, '..');
const variants = [
  ['jotful-light.png', 'assets/brand/moth-light-loop.svg', '#F5F0E6'],
  ['jotful-dark.png', 'assets/brand/moth-dark-loop.svg', null],
  ['jotful-tinted.png', 'assets/brand/moth-tinted-loop.svg', null],
  ['icon-1024.png', 'assets/brand/moth-light-loop.svg', '#F5F0E6'],
];

for (const [fileName, sourceName, background] of variants) {
  const source = fs.readFileSync(path.join(root, sourceName), 'utf8');
  const artwork = source.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const svg = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">${background ? `<rect width="1024" height="1024" fill="${background}"/>` : ''}<svg x="82" y="82" width="860" height="860" viewBox="0 0 32 32">${artwork}</svg></svg>`;
  const output = fileName === 'icon-1024.png'
    ? path.join(root, 'assets', 'icon-1024.padded.png')
    : path.join(root, 'assets', 'ios-icons', fileName.replace('.png', '.padded.png'));

  fs.writeFileSync(output, new Resvg(svg).render().asPng());
}
