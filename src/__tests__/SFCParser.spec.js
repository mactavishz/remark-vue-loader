const fs = require('fs')
const path = require('path')
const SFCParser = require('../SFCParser')
const BabelTypes = require('@babel/types')

function getFixture (name) {
  const filePath = path.resolve(__dirname, `./fixtures/${name}.vue`)
  return fs.readFileSync(filePath, 'utf8')
}

describe('SFCParser#ComponentName', () => {
  const fixtures = [{
    componentName: 'test name',
    expect: 'TestName'
  }, {
    componentName: 'test-name',
    expect: 'TestName'
  }, {
    componentName: 'testname',
    expect: 'Testname'
  }, {
    componentName: 'testName',
    expect: 'TestName'
  }]
  test(`Pascal-case component name`, () => {
    fixtures.forEach(f => {
      const parser = new SFCParser({ source: '', componentName: f.componentName })
      expect(parser.componentName).toBe(f.expect)
    })
  })
})

describe('SFCParser#Parsing', () => {
  test(`Should successfully Parse template only SFC`, () => {
    const fixture = getFixture('template-only')
    const parser = new SFCParser({ source: fixture, componentName: 'template-only' })
    const result = parser.parse()
    expect(result).toEqual(expect.objectContaining({
      normalizedComponentName: 'TemplateOnly',
      componentDeclaration: expect.any(Object),
      importDeclarations: expect.any(Array),
      styles: expect.any(Array)
    }))
    expect(BabelTypes.isDeclaration(result.componentDeclaration)).toBe(true)
  })

  test(`Should successfully Parse script only SFC`, () => {
    const fixture = getFixture('script-only')
    const parser = new SFCParser({ source: fixture, componentName: 'script-only' })
    const result = parser.parse()
    expect(result).toEqual(expect.objectContaining({
      normalizedComponentName: 'ScriptOnly',
      componentDeclaration: expect.any(Object),
      importDeclarations: expect.any(Array),
      styles: expect.any(Array)
    }))
    expect(BabelTypes.isDeclaration(result.componentDeclaration)).toBe(true)
  })

  test(`Should successfully Parse standard SFC`, () => {
    const fixture = getFixture('standard')
    const parser = new SFCParser({ source: fixture, componentName: 'standard' })
    const result = parser.parse()
    expect(result).toEqual(expect.objectContaining({
      normalizedComponentName: 'Standard',
      componentDeclaration: expect.any(Object),
      importDeclarations: expect.any(Array),
      styles: expect.any(Array)
    }))
    expect(BabelTypes.isDeclaration(result.componentDeclaration)).toBe(true)
    expect(result.styles.length).toBe(1)
  })

  test(`Should throw error when encounter scoped style`, () => {
    const fixture = getFixture('scoped-style')
    const parser = new SFCParser({ source: fixture, componentName: 'scoped-style' })
    expect(() => {
      parser.parse()
    }).toThrowError('scoped style and css module is not supported')
  })

  test(`Should throw error when there is neither a template block nor script block`, () => {
    const parser = new SFCParser({ source: '', componentName: 'empty' })
    expect(() => {
      parser.parse()
    }).toThrowError(/^At least provide a script block or a template block/)
  })

  test(`Should detect and extract when there are import statements`, () => {
    const fixture = getFixture('has-imports')
    const parser = new SFCParser({ source: fixture, componentName: 'has-imports' })
    const result = parser.parse()
    expect(result).toEqual(expect.objectContaining({
      normalizedComponentName: 'HasImports',
      componentDeclaration: expect.any(Object),
      importDeclarations: expect.any(Array),
      styles: expect.any(Array)
    }))
    expect(result.importDeclarations.length).toBe(1)
    expect(BabelTypes.isImportDeclaration(result.importDeclarations[0])).toBe(true)
  })
})
