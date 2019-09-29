const { root, code } = require('mdast-builder')
const AssertMdast = require('mdast-util-assert')
const findCodeBlocks = require('../findCodeBlocks')

const CODE_BLOCKS = [{
  lang: 'js',
  value: `console.log('Hello world')`
}, {
  lang: 'html',
  value: `<h1>Hello world</h1>`
}, {
  lang: 'c',
  value: `printf('Hello world');`
}, {
  lang: 'sh',
  value: `echo Hello world;`
}, {
  lang: 'SFC',
  value: `<template><p>Hello World</p></template>`
}]


describe('Helpers#findCodeBlocks', () => {
  const tree = root([
    ...CODE_BLOCKS.map(item => code(item.lang, item.value))
  ])

  for (let block of CODE_BLOCKS) {
    test(`should find ${block.lang} code block`, () => {
      const result = findCodeBlocks(block.lang, tree)
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(1)
      AssertMdast(result[0])
      expect(result[0].lang).toBe(block.lang)
      expect(result[0].value).toBe(block.value)
    })
  }
})
