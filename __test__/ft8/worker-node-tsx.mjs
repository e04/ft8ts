// Test entry of a decoder worker thread: runs src/ft8/worker-node.ts through tsx.
import { register } from "tsx/esm/api";

register();
await import("../../src/ft8/worker-node.ts");
