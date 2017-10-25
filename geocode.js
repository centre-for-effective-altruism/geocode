#! /usr/bin/env node
const console = require('better-console')
const _ = require('lodash')
const throat = require('throat')
const pify = require('pify')
const promiseRetry = require('promise-retry')
// cli
const getArgs = pify(require('cli-pipe'), {errorFirst: false})
const program = require('commander')
const fs = require('mz/fs')
const path = require('path')
var json2csv = require('json2csv')

const WORKING_DIRECTORY = process.cwd()
const HOME = require('homedir')()

program
  .usage('[options]')
  .option('-a, --api-key <key>', `Init with Google API key`)
  .option('-c, --columns <headers ...>', `CSV column header (or comma separated list of headers) with address string. Defaults to 'address'`, h => h.split(',').map(h => h.trim()))
  .option('-f, --file <file>', `Path to CSV file with 'address' key`)
  .parse(process.argv)

// lib
if (!program.apiKey) {
  const loadCSV = require('./lib/loadCSV')
  const {geocodeAddress, normalizeAddress} = require('./lib/geocoding')
}

async function run () {
  try {
    // generate RC file
    if (program.apiKey) {
      const rcFile = `GOOGLE_API_KEY=${program.apiKey}`
      const RC_FILE_NAME = '.geocoderc'
      console.log(`Creating ${RC_FILE_NAME}`)
      const filePath = path.resolve(path.join(HOME, '.config', RC_FILE_NAME))
      await fs.writeFile(filePath, rcFile)
      console.log(`Wrote config file to ${filePath}`)
      return
    }

    // run the geocoder
    let UncodedAddresses = []
    const args = await getArgs()
    // if we supply a file
    if (program.file) {
      const csvData = await loadCSV(program.file)
      const columns = program.columns || ['address']
      UncodedAddresses = csvData.map(row => columns.map(column => row[column] ? row[column].trim() : '').filter(a => a).join(', '))
    } else {
      if (!args[2]) throw new Error('No addresses supplied')
      UncodedAddresses = args[2].split('\n').map(a => a.trim())
    }

    // extract addresses from webforms where people have claimed Gift Aid
    const Addresses = await Promise.all(UncodedAddresses
      .map(throat(20, async function (AddressString) {
        // handle empty rows
        if (!AddressString) {
          console.warn('Empty address string...')
          return normalizeAddress()
        }
        console.info(`Geocoding ${AddressString}...`)
        try {
          const AddressData = await promiseRetry((retry) => {
            return geocodeAddress(AddressString)
              .catch(err => {
                console.warn(err.toString())
                retry(err)
              })
          })
          const Address = AddressData[0]
          return normalizeAddress(Address, AddressString)
        } catch (err) {
          console.error(`Error processing ${AddressString}`)
          console.error(err.toString())
          return normalizeAddress(null, AddressString)
        }
      }))
    )

    // write to data directory
    await fs.writeFile(path.join(WORKING_DIRECTORY, 'GeocodedAddresses.csv'), json2csv({data:Addresses}))
    await fs.writeFile(path.join(WORKING_DIRECTORY, 'GeocodedAddresses.json'), JSON.stringify(Addresses))
    console.log(`Wrote ${Addresses.length} addresses to data directory`)
  } catch (err) {
    console.error(err)
  }
}

run()
