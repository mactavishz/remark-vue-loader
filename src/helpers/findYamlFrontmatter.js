const { select } = require('unist-util-select')
const yaml = require('js-yaml')

/**
 * @description find yaml frontmatter node
 * @param {string} name code block name to find
 * @param {object} tree ast
 * @returns
 */
function findYamlFrontmatter (tree) {
  const node = select('yaml', tree)
  if (node) {
    return yaml.safeLoad(node.value)
  } else {
    return {}
  }
}

module.exports = findYamlFrontmatter
