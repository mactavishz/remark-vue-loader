const crypto = require('crypto')

/**
 * @description generate MD5 Hash
 * @param {string} str target string
 * @returns
 */
function hash (str) {
  return crypto.createHash('MD5').update(str).digest('hex')
}

module.exports = hash
