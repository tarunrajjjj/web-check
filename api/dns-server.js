const dns = require('dns');
const dnsPromises = dns.promises;
const axios = require('axios');
const middleware = require('./_common/middleware');

const resolveDomain = async (domain) => dnsPromises.resolve4(domain);

const reverseDnsLookup = async (address) => dnsPromises.reverse(address).catch(() => null);

const checkDohSupport = async (address) => {
  try {
    await axios.get(`https://${address}/dns-query`);
    return true;
  } catch (error) {
    return false;
  }
};

const handler = async (url) => {
  try {
    const domain = url.replace(/^(?:https?:\/\/)?/i, "");
    const addresses = await resolveDomain(domain);
    const results = await Promise.all(addresses.map(async (address) => {
      const hostname = await reverseDnsLookup(address);
      const dohDirectSupports = await checkDohSupport(address);
      return {
        address,
        hostname,
        dohDirectSupports,
      };
    }));

    return {
      domain,
      dns: results,
    };
  } catch (error) {
    throw new Error(`An error occurred while resolving DNS. ${error.message}`);
  }
};

module.exports = middleware(handler);
module.exports.handler = middleware(handler);
