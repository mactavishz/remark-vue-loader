module.exports = {
  verbose: true,
  testMatch: [ "**/__tests__/**/*.[jt]s?(x)" ],
  collectCoverage: true,
  coverageReporters: [
    'json-summary',
    'text',
    'text-summary',
    'html'
  ]
}
