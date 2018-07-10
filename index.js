const express = require('express');
const app = express();

const config = require('./config');

const Api = require('./src/Api');

const name = 'api.openbanking.local';
const port = 3001;

app.get('/', function (req, res) {
  console.log('/');
  res.json({ name });
});

app.get('/api', (req, res) => {
  console.log('/api');
  res.json({ data: new Date() });
});

app.get('/api/banks', (req, res) => {
  console.log('/api/banks');
  res.json({ data: config.banks });
});

app.get('/api/banks/:bankId', (req, res) => {
  console.log('/api/banks/:bankId');
  let { bankId } = req.params;
  res.json({ data: config.banks[bankId] });
});

// separate resource of atms by bank
app.get('/api/banks/:bankId/atms', async (req, res) => {
  console.log('/api/banks/:bankId/atms');
  let data = [], meta = { start: new Date() }, error = null;
  try {
    let { bankId } = req.params;
    let { term, offset, limit } = req.query;
    const api = new Api(bankId);
    const result = await api.atms({ term, offset, limit });
    data = result.data;
    meta = Object.assign(meta, result.meta);
    error = result.error;
  } catch (err) {
    error = err;
  }
  meta.end = new Date();
  res.json({ data, meta, error });
});

// separate resource of branches by bank
app.get('/api/banks/:bankId/branches', async (req, res) => {
  console.log('/api/banks/:bankId/branches');
  let data = [], meta = { start: new Date() }, error = null;
  try {
    let { bankId } = req.params;
    let { term, offset, limit } = req.query;
    const api = new Api(bankId);
    const result = await api.branches({ term, offset, limit });
    data = result.data;
    meta = Object.assign(meta, result.meta);
    error = result.error;
  } catch (err) {
    error = err;
  }
  meta.end = new Date();
  res.json({ data, meta, error });
});

// combined resource of atms
const batch_get_atms = async (req, res) => {
  console.log('batch_get_atms');
  let data = {}, meta = { start: new Date() }, error = null;
  let { term, offset, limit } = req.query;
  try {

    const bankIds = Object.keys(config.banks);
    for (let bankId of bankIds) {// run for all banks
      let resultByBank = { data: [], meta: {}, error: null };
      try {
        const api = new Api(bankId);
        resultByBank = await api.atms();
      } catch (errBank) {
        resultByBank.error = errBank;
      }
      data[bankId] = resultByBank;
    }

    // TODO: filter combined output

  } catch (err) {
    error = err;
  }
  meta.end = new Date();
  res.json({ data, meta, error });
};
app.get('/api/batch/atms', batch_get_atms);

// combined resource of atms
const batch_get_branches = async (req, res) => {
  console.log('batch_get_branches');
  let data = {}, meta = { start: new Date() }, error = null;
  let { term, offset, limit } = req.query;
  try {

    const bankIds = Object.keys(config.banks);
    for (let bankId of bankIds) {// run for all banks
      let resultByBank = { data: [], meta: {}, error: null };
      try {
        const api = new Api(bankId);
        resultByBank = await api.branches();
      } catch (errBank) {
        resultByBank.error = errBank;
      }
      data[bankId] = resultByBank;
    }

    // TODO: filter combined output

  } catch (err) {
    error = err;
  }
  meta.end = new Date();
  res.json({ data, meta, error });
};
app.get('/api/batch/branches', batch_get_branches);

// combined resource of business current accounts
const batch_get_business_current_accounts = async (req, res) => {
  console.log('batch_get_business_current_accounts');
  let data = {}, meta = { start: new Date() }, error = null;
  let { term, offset, limit } = req.query;
  try {

    const bankIds = Object.keys(config.banks);
    for (let bankId of bankIds) {// run for all banks
      let resultByBank = { data: [], meta: {}, error: null };
      try {
        const api = new Api(bankId);
        resultByBank = await api.business_current_accounts();
      } catch (errBank) {
        resultByBank.error = errBank;
      }
      data[bankId] = resultByBank;
    }

    // TODO: filter combined output

  } catch (err) {
    error = err;
  }
  meta.end = new Date();
  res.json({ data, meta, error });
};
app.get('/api/batch/business-current-accounts', batch_get_business_current_accounts);

// combined resource of personal current accounts
const batch_get_personal_current_accounts = async (req, res) => {
  console.log('batch_get_personal_current_accounts');
  let data = {}, meta = { start: new Date() }, error = null;
  let { term, offset, limit } = req.query;
  try {

    const bankIds = Object.keys(config.banks);
    for (let bankId of bankIds) {// run for all banks
      let resultByBank = { data: [], meta: {}, error: null };
      try {
        const api = new Api(bankId);
        resultByBank = await api.personal_current_accounts();
      } catch (errBank) {
        resultByBank.error = errBank;
      }
      data[bankId] = resultByBank;
    }

    // TODO: filter combined output

  } catch (err) {
    error = err;
  }
  meta.end = new Date();
  res.json({ data, meta, error });
};
app.get('/api/batch/personal-current-accounts', batch_get_personal_current_accounts);

// combined resource of commercial credit cards
const batch_get_commercial_credit_cards = async (req, res) => {
  console.log('batch_get_commercial_credit_cards');
  let data = {}, meta = { start: new Date() }, error = null;
  let { term, offset, limit } = req.query;
  try {

    const bankIds = Object.keys(config.banks);
    for (let bankId of bankIds) {// run for all banks
      let resultByBank = { data: [], meta: {}, error: null };
      try {
        const api = new Api(bankId);
        resultByBank = await api.commercial_credit_cards();
      } catch (errBank) {
        resultByBank.error = errBank;
      }
      data[bankId] = resultByBank;
    }

    // TODO: filter combined output

  } catch (err) {
    error = err;
  }
  meta.end = new Date();
  res.json({ data, meta, error });
};
app.get('/api/batch/commercial-credit-cards', batch_get_commercial_credit_cards);

// combined resource of unsecured sme loans
const batch_get_unsecured_sme_loans = async (req, res) => {
  console.log('batch_get_unsecured_sme_loans');
  let data = {}, meta = { start: new Date() }, error = null;
  let { term, offset, limit } = req.query;
  try {

    const bankIds = Object.keys(config.banks);
    for (let bankId of bankIds) {// run for all banks
      let resultByBank = { data: [], meta: {}, error: null };
      try {
        const api = new Api(bankId);
        resultByBank = await api.unsecured_sme_loans();
      } catch (errBank) {
        resultByBank.error = errBank;
      }
      data[bankId] = resultByBank;
    }

    // TODO: filter combined output

  } catch (err) {
    error = err;
  }
  meta.end = new Date();
  res.json({ data, meta, error });
};
app.get('/api/batch/unsecured-sme-loans', batch_get_unsecured_sme_loans);

app.listen(port, () => console.log(name + ' listening on port ' + port));
