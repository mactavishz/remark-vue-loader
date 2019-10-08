const unified = require('unified')
const markdownParser = require('remark-parse')
const remarkFormatter = require('remark-frontmatter')
const findYamlFrontmatter = require('../findYamlFrontmatter')
const fs = require('fs')
const path = require('path')

const withYAML = fs.readFileSync(path.resolve(__dirname, './fixtures/with-yaml.md'), 'utf8')
const withoutYAML = fs.readFileSync(path.resolve(__dirname, './fixtures/without-yaml.md'), 'utf8')

describe('Helpers#findYamlFrontmatter#non-empty', () => {

  const mdast = unified()
  .use(markdownParser)
  .use(remarkFormatter, ['yaml'])
  .parse(withYAML)
  const frontmatter = findYamlFrontmatter(mdast)

  test(`should parse yaml frontmatter correctly`, () => {
    expect(typeof frontmatter).toBe('object')
  })

  test(`should find non-empty yaml properties`, () => {
    expect(frontmatter).toHaveProperty('title', 'YAML Frontmatter title')
  })

  test(`should find non-empty deep yaml properties`, () => {
    expect(frontmatter).toHaveProperty('deep.key', 'value')
  })
})

describe('Helpers#findYamlFrontmatter#empty', () => {

  const mdast = unified()
  .use(markdownParser)
  .use(remarkFormatter, ['yaml'])
  .parse(withoutYAML)
  const frontmatter = findYamlFrontmatter(mdast)

  test(`should parse yaml frontmatter correctly`, () => {
    expect(typeof frontmatter).toBe('object')
  })

  test(`should empty yaml properties`, () => {
    expect(Object.keys(frontmatter).length).toBe(0)
  })
})
