const csv = require('neat-csv')
const fs = require('mz/fs')

async function loadCSV (filePath) {
  const data = await fs.readFile(filePath)
  return csv(data)
}

module.exports = loadCSV
