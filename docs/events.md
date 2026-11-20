# Events in Toto Payments

An *Event* is an alternative (similar) to a tag that is applied to an expense (payment).

Examples of *events* can be: 
 * The name of a trip (e.g. "Sardegna 2023"), that can be used to mark all expenses related to that specific trip
 * The name of an event of construction work on the house (e.g. "Baby Room") that could be useful to track all expenses that happened because of the making of a new baby room

Events are useful because they allow the user to access reports on the expenses that are part of a given event, allowing them, for example, to see **the total amount spent on (for) that event**. 

In general an expense can be associated with **only a single event**.

## Creating an Event

The creation of an *event* happens by *POSTing** an event through the `POST /expenses/events` API. <br>

## Pub/Sub events (technical)

Not to be confused with the *Events* described above: the service also publishes and consumes **messages** on Pub/Sub (`expenseTagged`, `expenseUntagged`, `tagDeleted`).

Messaging is handled by the `totoms` message bus (see `src/index.ts`, `messageBusConfiguration`):
* **Topics**: the logical topics `expenses` and `tags` are resolved through the secrets `topic-name-expenses` and `topic-name-tags` (the secret value is the actual Pub/Sub topic name). Messages are published through `EventPublisher` (`src/evt/EventPublisher.ts`).
* **Handlers**: handlers extend `TotoMessageHandler` and are registered in `src/index.ts`. Each handler declares the message type it handles: `OnExpenseTagged` (`expenseTagged`), `OnExpenseUntagged` (`expenseUntagged`) and `OnTagDeleted` (`tagDeleted`) in `src/evt/handlers/`.
* **Push endpoint**: Pub/Sub push subscriptions call `POST /expenses/events`, which totoms registers. `POST /expenses/events/tag` is kept for existing subscriptions and forwards to the same message bus handling (`EventsTagHook`).
