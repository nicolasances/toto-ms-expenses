import request from 'request'
import moment from 'moment-timezone'

const exchangeRateUrl = 'https://v3.exchangerate-api.com/pair/4c53838ecdaca2a7f1849fb3';

export function getExchangeRate(currency: string): Promise<Rate> {

  return new Promise(function (success, failure) {

    var data = {
      url: `${exchangeRateUrl}/${currency}/EUR`,
      headers: {
        'User-Agent': 'node.js',
        'Accept': 'application/json'
      }
    };

    request.get(data, function (error, response, body) {

      var rates = JSON.parse(body);

      // Fallback: if I went over the quota
      // TEMPORARY!!
      // TO BE FIXED: cache every day the rate, since it only changes once a day
      if (rates.error) {
        if (currency == 'DKK') rates.rate = 0.13;
      }

      success({ rate: rates.rate });

    });

  });
}

export interface Rate {

  rate: number

}