
export interface IExpense {
  id: string,
  amount: number,
  amountInEuro?: number,
  category: string,
  date: string,
  description: string,
  yearMonth: number,
  consolidated?: boolean,
  currency: string,
  user: string,
  monthly?: boolean,
  tags?: string
}

export interface PersistedExpense {
  _id: string,
  amount: number,
  amountInEuro?: number,
  category: string,
  date: string,
  description: string,
  yearMonth: number,
  consolidated?: boolean,
  currency: string,
  user: string,
  monthly?: boolean,
  tags?: string
}

export class ExpenseModel {

  fromPersistedObject(po: PersistedExpense): IExpense {

    return {
      id: po._id,
      amount: po.amount,
      amountInEuro: po.amountInEuro,
      category: po.category,
      date: po.date,
      description: po.description,
      yearMonth: po.yearMonth,
      consolidated: po.consolidated,
      currency: po.currency,
      user: po.user,
      monthly: po.monthly,
      tags: po.tags
    }

  }

  /**
   * Filter expenses
   */
  filterExpenses(filter: any) {

    // User filter is now mandatory
    let userFilter = {};
    if (filter.user != 'all') userFilter = { user: filter.user };

    var yearMonthFilter = {};
    if (filter.yearMonth != null) yearMonthFilter = { yearMonth: parseInt(filter.yearMonth) };

    var categoryFilter = {};
    if (filter.category != null) categoryFilter = { category: filter.category };

    var currencyFilter = {};
    if (filter.currency != null) currencyFilter = { currency: filter.currency };

    var dateGteFilter = {};
    if (filter.dateGte != null) dateGteFilter = { date: { $gte: parseInt(filter.dateGte) } };

    var monthlyNullFilter = {};
    if (filter.monthlyIsNull) monthlyNullFilter = { monthly: null };

    var monthlyFilter = {};
    if (filter.monthly != null) monthlyFilter = { monthly: Boolean(filter.monthly) };

    // Tag filters
    // Tag is expected as tagName:tagValue
    // It will be looked in the "additionalData" field
    var tagFilter = {};
    if (filter.tag) {

      let splittedFilter = filter.tag.split(":");
      let tagName = "additionalData." + splittedFilter[0];
      let tagValue = splittedFilter[1];

      tagFilter = JSON.parse("{\"" + tagName + "\": \"" + tagValue + "\"}");

    }

    return { $and: [userFilter, yearMonthFilter, categoryFilter, currencyFilter, dateGteFilter, tagFilter, monthlyNullFilter, monthlyFilter] };

  }

  /**
   * Sorts the expenses based on the provided sort fields
   */
  sortExpenses(sort: any): any {

    if (sort.sortAmount == 'true') {
      if (sort.sortDesc == 'true') return { amount: -1 };
      else return { amount: 1 };
    }

    if (sort.sortYearMonth == 'true') {
      if (sort.sortDesc == 'true') return { yearMonth: -1 };
      else return { yearMonth: 1 };
    }

    if (sort.sortDate == 'true') {
      if (sort.sortDesc == 'true') return { date: -1 };
      else return { date: 1 };
    }

    return {};
  }

  /**
   * Finds all the expenses with the specified tag
   * @param tagId the tag ID
   */
  findExpensesWithTag(tagId: string) {
    
    return {
      tags: tagId
    }
  }

  updateRemoveTag(tagId: string) {

    return {
      $set: {
        $pull: {tags: tagId}
      }
    }
  }
}