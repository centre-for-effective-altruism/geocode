# Geocode

Utility for geocoding addresses

## Requirements
- Node v8+
- `yarn`

## Installation

```sh
## Clone the repo
git clone https://github.com/centre-for-effective-altruism/geocode
cd geocode
## Ensure you're using the right version of Node
nvm use
## Install dependencies
yarn install
## (optional) Install globally to use on the CLI
## If you don't do this you'll need to run
## from the install dir with node ./geocode <args...>
npm install -g
## Add your Google API Key (creates ~/.geocoderc)
geocode -a <YOUR_GOOGLE_API_KEY>
```

## Usage

Geocode a file with address string in the `address` column

```sh
geocode -f /path/to/file.csv
```

Geocode a CSV file with address string across the `Location`, `Country` columns:

```sh
geocode -f /path/to/file.csv -c Location, Country
```

Geocode from STDIN:

```
geocode -f /path/to/file.csv -c Location, Country
```

## Help output:

```
 Usage: geocode [options]


  Options:

    -a, --api-key <key>          Init with Google API key
    -c, --columns <headers ...>  CSV column header (or comma separated list of headers) with address string. Defaults to 'address'
    -f, --file <file>            Path to CSV file with 'address' key
    -h, --help                   output usage information
```