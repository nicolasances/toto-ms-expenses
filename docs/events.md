# Events in Toto Payments

An *Event* is an alternative (similar) to a tag that is applied to an expense (payment).

Examples of *events* can be: 
 * The name of a trip (e.g. "Sardegna 2023"), that can be used to mark all expenses related to that specific trip
 * The name of an event of construction work on the house (e.g. "Baby Room") that could be useful to track all expenses that happened because of the making of a new baby room

Events are useful because they allow the user to access reports on the expenses that are part of a given event, allowing them, for example, to see **the total amount spent on (for) that event**. 

In general an expense can be associated with **only a single event**.

## Creating an Event

The creation of an *event* happens by *POSTing** an event through the `POST /events` API. <br>