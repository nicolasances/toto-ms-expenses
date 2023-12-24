import request from 'request'
import moment from 'moment-timezone'
import { ExecutionContext } from '../controller/model/ExecutionContext';

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
    if (localCurrency == null || localCurrency == "EUR") return amount;

    // Get the EUR exchange rate to the local currency
    const eurToLocalRate = await this.getRateEURToTargetCurrency(localCurrency);

    // Invert the rate
    const rate = 1 / eurToLocalRate.rate

    // Apply the exchange rate and return the amount
    return parseFloat((rate * amount).toFixed(2));

  }

  getRateEURToTargetCurrency(targetCurrency: string): Promise<Rate> {

    return new Promise((success, failure) => {

      if (targetCurrency == null || targetCurrency == "EUR") {
        success({ rate: 1 })
        return;
      }

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