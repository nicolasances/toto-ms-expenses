import request from 'request'
import moment from 'moment-timezone'
import { ExecutionContext } from '../model/ExecutionContext';

// const exchangeRateUrl = 'https://v3.exchangerate-api.com/pair/125b58078cb8ba5b129942e9';
const exchangeRateUrl = `https://api.freecurrencyapi.com/v1/latest?apikey=fca_live_PAePHCpsXFjLaxqzUqSTKMTSPnqoj2qpfg5ThuZ2`

const cache = {} as any

export class CurrencyConversion {

  execContext: ExecutionContext;

  constructor(execContext: ExecutionContext) {
    this.execContext = execContext;
  }

  /**
   * Converts the provided amount into EUR. 
   * 
   * If the provided amount is already in EUR, no conversion is made.
   * 
   * @param amount the amount to convert in EUR
   * @param localCurrency the local currency used
   */
  async convertAmountToEUR(amount: number, localCurrency: string): Promise<number> {

    // If the currency is already EUR, don't do anythin
    if (localCurrency == "EUR") return amount;

    // Get the exchange rate
    const { rate } = await this.getExchangeRate(localCurrency);

    // Apply the exchange rate and return the amount
    return rate * amount;

  }

  /**
   * Returns the exchange rate from the provided currency to EUR
   * @param currency the currency that the expense is in
   * @returns the conversion rate in EUR
   */
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

  getRateEURToTargetCurrency(targetCurrency: string): Promise<Rate> {

    return new Promise((success, failure) => {

      if (cache[targetCurrency.toUpperCase()]) {
        success({ rate: cache[targetCurrency.toUpperCase()] });
        return;
      }

      var data = {
        url: `${exchangeRateUrl}&currencies=${targetCurrency.toUpperCase()}&base_currency=EUR`,
        headers: {
          'User-Agent': 'node.js',
          'Accept': 'application/json'
        }
      };

      request.get(data, (error, response, body) => {

        var rates = JSON.parse(body);

        let rate = 0;

        // Fallback: if I went over the quota
        // TEMPORARY!!
        // TO BE FIXED: cache every day the rate, since it only changes once a day
        if (error || rates.errors || !rates || !rates.data) {

          this.execContext.logger.compute(this.execContext.cid, rates.errors, "error")

          if (targetCurrency == 'DKK') {
            rate = 7.5;
            cache["DKK"] = rate;
          }
        }
        else {
          rate = rates.data[targetCurrency.toUpperCase()];
          cache[targetCurrency.toUpperCase()] = rate;
        }

        success({ rate: rate });

      });

    });
  }

}



export interface Rate {

  rate: number

}