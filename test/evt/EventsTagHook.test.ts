import assert from "assert";
import { Request } from "express";
import { TotoControllerConfig, TotoMessageBus } from "totoms";
import { EventsTagHook } from "../../src/evt/EventsTagHook";

describe("EventsTagHook", () => {

    it("forwards the push request to the message bus and returns its result", async () => {

        let received: any = null;
        const bus = { onPushMessageReceived: async (req: Request) => { received = req; return { status: "processed" }; } };
        const hook = new EventsTagHook(bus as unknown as TotoMessageBus, {} as TotoControllerConfig);
        const httpRequest = { body: { message: {} } } as Request;

        const result = await hook.do(hook.parseRequest(httpRequest));

        assert.strictEqual(received, httpRequest);
        assert.deepStrictEqual(result, { status: "processed" });

    });

});
