
export interface Expense {
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
    monthly?: boolean 
}