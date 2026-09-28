const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const typescript = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'segmentation.ts'), 'utf8');
const compiled = typescript.transpileModule(source, {
  compilerOptions: { module: typescript.ModuleKind.CommonJS, target: typescript.ScriptTarget.ES2022 }
}).outputText;
const moduleExports = {};
new Function('exports', 'require', 'module', compiled)(moduleExports, require, { exports: moduleExports });

const { splitThoughts, classifyThought } = moduleExports;

assert.deepEqual(
  splitThoughts('What should the first Unsorted launch include? Maybe a daily review could help people return to ideas. I should ask three friends to try the beta.'),
  ['What should the first Unsorted launch include? Maybe a daily review could help people return to ideas. I should ask three friends to try the beta.']
);
assert.deepEqual(splitThoughts('- One loose idea\r\n* What should happen next?'), ['One loose idea', 'What should happen next?']);
assert.deepEqual(splitThoughts('First thought.\n\nSecond thought.'), ['First thought.', 'Second thought.']);
assert.equal(classifyThought('What should happen next?'), 'question');
assert.equal(classifyThought('Maybe a daily review could help.'), 'idea');
assert.equal(classifyThought('I should ask three friends.'), 'thought');

console.log('Segmentation checks passed.');
