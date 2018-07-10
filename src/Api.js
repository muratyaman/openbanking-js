const fs = require('fs');
const path = require('path');
const axios = require('axios');

const config = require('../config');

const fileExistsAsync = async (file) => {
  console.log('checking ' + file);
  return new Promise((resolve, reject) => {
    fs.exists(file, (err, data) => {
      console.log('fileExistsAsync', file, 'err', err, 'data', data);
      if (err) reject(err);
      else resolve(data);
    });
  });
}

const readFileAsync = async (file) => {
  console.log('reading ' + file);
  return new Promise((resolve, reject) => {
    fs.readFile(file, 'utf8', (err, data) => {
      console.log('readFileAsync', file, 'err', err);
      if (err) reject(err);
      else resolve(data);
    });
  });
}

const writeFileAsync = async (file, data) => {
  console.log('writing ' + file);
  return new Promise((resolve, reject) => {
    fs.writeFile(file, data, 'utf8', (err) => {
      console.log('writeFileAsync', file, 'err', err);
      if (err) reject(err);
      else resolve(true);
    });
  });
}

const makeAddress = (postalAddress) => {
  const adr = postalAddress;//for shorter lines below
  return {
    address_line_1:  adr.AddressLine && (0 in adr.AddressLine) ? adr.AddressLine[0] : '',
    address_line_2:  adr.AddressLine && (1 in adr.AddressLine) ? adr.AddressLine[1] : '',
    building_number: adr.BuildingNumber ? adr.BuildingNumber : '',
    street:          adr.StreetName ? adr.StreetName : '',
    town:            adr.TownName ? adr.TownName : '',
    city:            adr.CountrySubDivision && (0 in adr.CountrySubDivision) ? adr.CountrySubDivision[0] : '',
    country_code:    adr.Country ? adr.Country : '',
    post_code:       adr.PostCode ? adr.PostCode : '',
  }
}

const makeAtmAddress = (row) => {
  return makeAddress(row.Location.PostalAddress);
}

const makeAtmGeoLocation = (row) => {
  const coords = row.Location.PostalAddress.GeoLocation.GeographicCoordinates;
  return {
    latitude:  coords.Latitude,
    longitude: coords.Longitude,
  }
}

const makeAtm = (row, BrandName) => {
  // extract atm info
  return {
    id: row.Identification,
    bank_name: BrandName,
    branch_id: row.Branch.Identification,
    site_id: row.Location.Site.Identification,
    currency_codes: row.SupportedCurrencies,
    address: makeAtmAddress(row),
    geolocation: makeAtmGeoLocation(row),
  };
}

const makeBranchAddress = (row) => {
  return makeAddress(row.PostalAddress);
}

const makeBranchGeoLocation = (row) => {
  const coords = row.PostalAddress.GeoLocation.GeographicCoordinates;
  return {
    latitude:  coords.Latitude,
    longitude: coords.Longitude,
  }
}

const makeBranch = (row, BrandName) => {
  // extract branch info
  return {
    id: row.Identification,
    bank_name: BrandName,
    branch_name: row.Name,
    sort_code: row.SortCode,
    address: makeBranchAddress(row),
    geolocation: makeBranchGeoLocation(row),
  };
}

const filterAtm = (atm, term) => {
  const adrs = JSON.stringify(atm.address);
  if (term === '') return true;

  return adrs.toUpperCase().includes(term.toUpperCase());
}

const filterPaginate = (offset, limit) => (row, index) => {
  return (offset <= index) && (index < offset + limit);// 0 <= [0..9] < 10
}

class Api {

  constructor(bankId){
    console.log('Api.constructor', bankId);
    this.bankId = bankId;
  }

  _bank(){
    if (this.bankId in config.banks) {
      return config.banks[this.bankId];
    }
    throw new Error('unknown bank ' + this.bankId);
  }

  _cacheDir(){
    return path.join(__dirname, '/../cache/' + this.bankId);
  }

  _apiUrl(apiId){
    const bank = this._bank();
    if (apiId in bank.api) {
      return bank.api[apiId];
    } else {
      throw new Error(this.bankId + ' does not support ' + apiId);
    }
  }

  _http(baseUrl){
    return axios.create({
      baseURL: baseUrl,
      timeout: 30 * 1000,
      //headers: {'X-Custom-Header': 'foobar'}
    });
  }

  async _get(apiId, url = '', params = null){
    try {
      const baseUrl = this._apiUrl(apiId);
      const response = await this._http(baseUrl).get(url, {params});
      //console.log('Api._get', url, 'response', response);
      return response.data; // ==> body ==> JSON
    } catch (err) {
      // e.g. 'unable to verify the first certificate'
      console.log('Api._get err', err);
      throw err;
    }
  }

  async _post(apiId, url = '', data = null){
    try {
      const baseUrl = this._apiUrl(apiId);
      const response = await this._http(baseUrl).post(url, { data });
      //console.log('Api._post', url, 'response', response);
      return response.data;// ==> body ==> JSON
    } catch (err) {
      console.log('Api._post err', err);
      throw err;
    }
  }

  async _apiCall(apiId, url, params = {}, cacheFileName){
    console.log('Api._apiCall START');
    let result = { data: [], meta: {}, error: null };
    try {

      let responseRaw = '', response = {};

      //check cache
      const cacheFile = path.join(this._cacheDir(), '/' + cacheFileName);
      let fileExists = false;

      try {
        fileExists = await fileExistsAsync(cacheFile);
        //TODO: check last modification date
      } catch (errFile) {
        console.log('Api._apiCall file does not exist', cacheFile, errFile);
      }

      if (fileExists) {
        // get cache
        console.log('reading cache: ' + apiId);
        responseRaw = await readFileAsync(cacheFile);
        response = JSON.parse(responseRaw);
      } else {
        console.log('no cache, calling ' + apiId);
        response = await this._get(apiId, url);
        // set cache
        const replacer = null;
        const space = 2;// spaces or ' ', or \t';
        responseRaw = JSON.stringify(response, replacer, space);
        const saved = await writeFileAsync(cacheFile, responseRaw);
        console.log('saved ' + cacheFile);
      }

      result.data = response.data;
      result.meta = response.meta;

    } catch (err) {
      console.log('Api._apiCall error', err);
      result.error = err;
    }
    console.log('Api._apiCall END');
    return result;
  }

  async atms(){
    console.log('Api.atms START');
    let result = { data: [], meta: {}, error: null };
    try {
      const apiId = 'atms';
      const url = '';
      const paramsPassed = {};
      const response = await this._apiCall(apiId, url, paramsPassed, apiId + '.json');
      result.data = response.data;
      result.meta = response.meta;
    } catch (err) {
      console.log('Api.atms error', err);
      result.error = err;
    }
    console.log('Api.atms END');
    return result;
  }

  async atms_short(params = {}){
    let { term, offset, limit } = params;
    console.log('Api.atms START');
    let result = { data: [], meta: {}, error: null };
    try {
      term   = term ? term : '';
      offset = offset ? offset : 0;
      limit  = limit ? limit : 10;

      const response = this.atms();

      const { data, meta } = response;
      //const { TotalResults } = meta;

      const atms = [];

      // there may be multiple brands for each bank
      data[0].Brand.forEach((brandRow) => {

        const { BrandName, ATM } = brandRow;
        ATM.forEach((atmRow) => {
          const atm = makeAtm(atmRow, BrandName);
          if (filterAtm(atm, term)) {
            atms.push(atm);
          }
        });

      });

      result.data = atms.filter(filterPaginate(offset, limit));

      result.meta = {
        page_count: result.data.length,
        total: ATM.length // TotalResults // there may be a mistake
      };
    } catch (err) {
      console.log('Api.atms error', err);
      result.error = err;
    }
    console.log('Api.atms END');
    return result;
  }

  async branches(){
    console.log('Api.branches START');
    let result = { data: [], meta: {}, error: null };
    try {
      const apiId = 'branches';
      const url = '';
      const paramsPassed = {};
      const response = await this._apiCall(apiId, url, paramsPassed, apiId + '.json');
      result.data = response.data;
      result.meta = response.meta;
    } catch (err) {
      console.log('Api.branches error', err);
      result.error = err;
    }
    console.log('Api.branches END');
    return result;
  }

  async branches_short(params = {}){
    let { term, offset, limit } = params;
    console.log('Api.branches START');
    let result = { data: [], meta: {}, error: null };
    try {

      term   = term ? term : '';
      offset = offset ? offset : 0;
      limit  = limit ? limit : 10;

      const response = this.branches();

      const { data, meta } = response;
      //const { TotalResults } = meta;

      const branches = [];

      // there may be multiple brands for each bank
      data[0].Brand.forEach((brandRow) => {

        const { BrandName, Branch } = brandRow;
        Branch.forEach((branchRow) => {
          const branch = makeBranch(branchRow, BrandName);
          if (filterAtm(branch, term)) {
            branches.push(branch);
          }
        });

      });

      result.data = branches.filter(filterPaginate(offset, limit));

      result.meta = {
        page_count: result.data.length,
        total_count: Branch.length // TotalResults // HSBC sent incorrect value
      };
    } catch (err) {
      console.log('Api.branches error', err);
      result.error = err;
    }
    console.log('Api.branches END');
    return result;
  }

  async business_current_accounts(){
    console.log('Api.business_current_accounts START');
    let result = { data: [], meta: {}, error: null };
    try {
      const apiId = 'business-current-accounts';
      const url = '';
      const paramsPassed = {};
      const response = await this._apiCall(apiId, url, paramsPassed, apiId + '.json');
      result.data = response.data;
      result.meta = response.meta;
    } catch (err) {
      console.log('Api.business_current_accounts error', err);
      result.error = err;
    }
    console.log('Api.business_current_accounts END');
    return result;
  }

  async personal_current_accounts(){
    console.log('Api.personal_current_accounts START');
    let result = { data: [], meta: {}, error: null };
    try {
      const apiId = 'personal-current-accounts';
      const url = '';
      const paramsPassed = {};
      const response = await this._apiCall(apiId, url, paramsPassed, apiId + '.json');
      result.data = response.data;
      result.meta = response.meta;
    } catch (err) {
      console.log('Api.personal_current_accounts error', err);
      result.error = err;
    }
    console.log('Api.personal_current_accounts END');
    return result;
  }

  async commercial_credit_cards(){
    console.log('Api.commercial_credit_cards START');
    let result = { data: [], meta: {}, error: null };
    try {
      const apiId = 'commercial-credit-cards';
      const url = '';
      const paramsPassed = {};
      const response = await this._apiCall(apiId, url, paramsPassed, apiId + '.json');
      result.data = response.data;
      result.meta = response.meta;
    } catch (err) {
      console.log('Api.commercial_credit_cards error', err);
      result.error = err;
    }
    console.log('Api.commercial_credit_cards END');
    return result;
  }

  async unsecured_sme_loans(){
    console.log('Api.unsecured_sme_loans START');
    let result = { data: [], meta: {}, error: null };
    try {
      const apiId = 'unsecured-sme-loans';
      const url = '';
      const paramsPassed = {};
      const response = await this._apiCall(apiId, url, paramsPassed, apiId + '.json');
      result.data = response.data;
      result.meta = response.meta;
    } catch (err) {
      console.log('Api.unsecured_sme_loans error', err);
      result.error = err;
    }
    console.log('Api.unsecured_sme_loans END');
    return result;
  }

}


module.exports = Api;
