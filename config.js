// @see https://github.com/OpenBankingUK/opendata-api-spec-compiled/blob/master/participant_store.json
const providers = require('./providers.json');

const tempBanks = {
  adamco: 'Adam & Company',
  aibgb: 'Allied Irish Bank (GB)',
  bankofireland: 'Bank of Ireland (UK)',
  bankofscotland: 'Bank of Scotland',
  barclays: 'Barclays Bank',
  coutts: 'Coutts',
  danske: 'Danske Bank',
  esme: 'Esme',
  firsttrust: 'First Trust Bank',
  halifax: 'Halifax',
  hsbc: 'HSBC Group',
  lloyds: 'Lloyds Bank',
  nationwide: 'Nationwide Building Society',
  natwest: 'NatWest',
  rbs: 'Royal Bank of Scotland',
  santanderuk: 'Santander UK',
  ulster: 'Ulster Bank',
}

const config = {
  api: {
    atms: 'API for ATMs',
    branches: 'API for Branches',
    "personal-current-accounts": 'API for Personal Current Accounts',
    "business-current-accounts": 'API for Business Current Accounts',
    "unsecured-sme-loans": 'API for Unsecured SME Loans',
    "commercial-credit-cards": 'API for Commercial Credit Cards',
    //accounts: 'API for Accounts',
    //payments: 'API for Payments',
  },
  banks: {
    // to be filled below
  }
};

function findBankByName(name){
  return providers.data.find((row) => row.name === name);
}

Object.entries(tempBanks).forEach(([key, value]) => {
  const bankId = key;
  const bankName = value;

  const bankFound = findBankByName(bankName);

  if (bankFound) {

    const bank = {
      id: bankId,
      name: bankName,
      api: {

      }
    };
    const url = bankFound.baseUrl;

    Object.keys(config.api).forEach((apiId) => {
      if (apiId in bankFound.supportedAPIs) {
        const versions = bankFound.supportedAPIs[apiId];
        bank.api[apiId] = url + '/' + versions[0] + '/' + apiId;
      }
    });

    // append bank
    config.banks[bankId] = bank;
  }

});

module.exports = config;