
export interface IEvent {

    id?: string,
    name?: string,
    amount?: number,
    creationDate?: string,  // Format YYYYMMDD
    user: string

}

export interface IEventPO extends IEvent {
    _id?: string
}

export class Event implements IEvent {

    id?: string;
    name?: string;
    amount?: number;
    creationDate?: string;
    user: string;

    constructor(event: IEventPO) {
        this.id = event.id;
        this.name = event.name;
        this.amount = event.amount;
        this.creationDate = event.creationDate;
        this.user = event.user;

        if (event._id) this.id = event._id;
    }

}

