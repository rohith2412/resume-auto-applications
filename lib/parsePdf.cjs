const pdfParse = require('pdf-parse')

module.exports = async function parsePdf(buffer) {
  const result = await pdfParse(buffer)
  return result.text.trim()
}
