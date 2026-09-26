import { createWorkerHandler, type WorkerRequest, type WorkerResponse } from "./worker-core.js";

// Entry point of a decoder worker (dist/ft8ts-worker.mjs), started by
// FT8DecoderPool.

interface WorkerScope {
	onmessage: ((event: { data: WorkerRequest }) => void) | null;
	postMessage(message: WorkerResponse): void;
}

const scope = globalThis as unknown as WorkerScope;
const handle = createWorkerHandler();
scope.onmessage = (event) => {
	scope.postMessage(handle(event.data));
};
