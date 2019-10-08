const { root, paragraph, text, html, heading } = require('mdast-builder')
const isNode = require('unist-util-is')
const mdastToHTML = require('../mdastToHTML')

describe('Helpers#mdastToHTML', () => {
  const simpleMdast = root([
    heading(1, [
      text('Hello World')
    ])
  ])

  const dangerMdast = root([
    html(`
      <script type="text/javascript">
        console.log('Hello World')
      </script>
    `)
  ])

  const invalidMdast = {
    content: 'This is not a invalid mdast'
  }

  test('Should succesfully transform simple mdast to html', async () => {
    const htmlStr = await mdastToHTML(simpleMdast)
    document.body.innerHTML = htmlStr
    expect(document.body.firstChild.tagName).toBe('H1')
    expect(document.body.firstChild.innerHTML).toBe('Hello World')
  })

  test('Should succesfully transform danger mdast to html', async () => {
    const htmlStr = await mdastToHTML(dangerMdast)
    document.body.innerHTML = htmlStr.trim()
    expect(document.body.firstChild.tagName).toBe('SCRIPT')
    expect(document.body.firstChild.innerHTML.trim()).toBe(`console.log('Hello World')`)
  })

  test('Should throw with invalid mdast', async () => {
    await expect(mdastToHTML(invalidMdast)).rejects.toThrow()
  })
})
