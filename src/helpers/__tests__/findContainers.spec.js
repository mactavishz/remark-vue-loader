const { root } = require('mdast-builder')
const AssertMdast = require('mdast-util-assert')
const findContainers = require('../findContainers')

const CONTAINER_BLOCKS = [{
  name: 'js',
  value: `console.log('Hello world')`
}, {
  name: 'html',
  value: `<h1>Hello world</h1>`
}, {
  name: 'c',
  value: `printf('Hello world');`
}, {
  name: 'sh',
  value: `echo Hello world;`
}, {
  name: 'SFC',
  value: `<template><p>Hello World</p></template>`
}]


describe('Helpers#findContainerBlocks', () => {
  const tree = root([
    ...CONTAINER_BLOCKS.map(item => ({
      ...item,
      type: 'container'
    }))
  ])

  for (let container of CONTAINER_BLOCKS) {
    test(`should find ${container.name} container block`, () => {
      const result = findContainers(container.name, tree)
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(1)
      AssertMdast(result[0])
      expect(result[0].name).toBe(container.name)
      expect(result[0].value).toBe(container.value)
    })
  }
})
