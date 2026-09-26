import { parentPort } from "node:worker_threads";
import { createWorkerHandler, type WorkerRequest } from "./worker-core.js";

// Entry point of a decoder worker thread in Node.js (dist/ft8ts-worker-node.mjs),
// started by FT8DecoderPool.

const port = parentPort;
if (!port) throw new Error("ft8ts-worker-node must run in a worker thread");
const handle = createWorkerHandler();
port.on("message", (request: WorkerRequest) => {
	port.postMessage(handle(request));
});
