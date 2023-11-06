import request from 'request'
import moment from 'moment-timezone'
import { ExecutionContext } from '../model/ExecutionContext';

const exchangeRateUrl = 'https://v3.exchangerate-api.com/pair/125b58078cb8ba5b129942e9';

export class CurrencyConversion {

  execContext: ExecutionContext;

  constructor(execContext: ExecutionContext) {
    this.execContext = execContext;
  }

  getExchangeRate(currency: string): Promise<Rate> {

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

  convertEURToTargetCurrency(targetCurrency: string): Promise<Rate> {

    return new Promise( (success, failure) =>  {

      var data = {
        url: `${exchangeRateUrl}/EUR/${targetCurrency}`,
        headers: {
          'User-Agent': 'node.js',
          'Accept': 'application/json'
        }
      };

      request.get(data, (error, response, body) => {

        var rates = JSON.parse(body);

        // Fallback: if I went over the quota
        // TEMPORARY!!
        // TO BE FIXED: cache every day the rate, since it only changes once a day
        if (rates.error) {
          
          this.execContext.logger.compute(this.execContext.cid, rates.error, "error")
          
          if (targetCurrency == 'DKK') rates.rate = 7.5;
        }

        success({ rate: rates.rate });

      });

    });
  }

}



export interface Rate {

  rate: number

}