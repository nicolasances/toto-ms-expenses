import assert from "assert";
import { Logger, MessageDestination, TotoMessage, TotoMessageBus } from "totoms";
import { EVENTS, EventPublisher } from "../../src/evt/EventPublisher";

/**
 * Fake message bus that records what gets published, or fails on demand.
 */
class FakeMessageBus {

    published: { destination: MessageDestination, message: TotoMessage }[] = [];
    shouldFail: boolean = false;

    async publishMessage(destination: MessageDestination, message: TotoMessage): Promise<void> {

        if (this.shouldFail) throw new Error("bus down");

        this.published.push({ destination, message });

    }

}

describe("EventPublisher.publishEvent", () => {

    before(() => { Logger.init("toto-ms-expenses-test"); });

    it("publishes the event on the configured topic with id, type, cid and data", async () => {

        const bus = new FakeMessageBus();
        const publisher = new EventPublisher(bus as unknown as TotoMessageBus, "cid-1", "expenses");

        const result = await publisher.publishEvent("exp1", EVENTS.expenseTagged, "tagged", { tagId: "t1" });

        assert.strictEqual(result.published, true);
        assert.strictEqual(bus.published.length, 1);
        assert.strictEqual(bus.published[0].destination.topic, "expenses");
        assert.strictEqual(bus.published[0].message.id, "exp1");
        assert.strictEqual(bus.published[0].message.type, "expenseTagged");
        assert.strictEqual(bus.published[0].message.cid, "cid-1");
        assert.deepStrictEqual(bus.published[0].message.data, { tagId: "t1" });

    });

    it("reports published=false instead of throwing when the bus fails", async () => {

        const bus = new FakeMessageBus();
        bus.shouldFail = true;
        const publisher = new EventPublisher(bus as unknown as TotoMessageBus, "cid-2", "tags");

        const result = await publisher.publishEvent("tag1", EVENTS.tagDeleted, "deleted");

        assert.strictEqual(result.published, false);

    });

});
