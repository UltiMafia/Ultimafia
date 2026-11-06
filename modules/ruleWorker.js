// Inference worker: owns the ONNX session on its own thread so a forward pass
// never blocks the web server's event loop. The main thread talks to it with
// postMessage and stays responsive; the worker serialises calls exactly as the
// in-process session did.
const { parentPort } = require("node:worker_threads");
const ruleFilter = require("./ruleFilter");

let ready = false;

ruleFilter
  .init()
  .then(() => {
    ready = typeof ruleFilter.isReady === "function" ? ruleFilter.isReady() : true;
    parentPort.postMessage({ type: "ready", ready });
  })
  .catch((e) => {
    parentPort.postMessage({ type: "ready", ready: false, error: String(e) });
  });

parentPort.on("message", async (message) => {
  if (!message || message.type !== "classify") return;
  try {
    const result = await ruleFilter.classify(message.text);
    parentPort.postMessage({ type: "result", id: message.id, result: result || null });
  } catch (e) {
    parentPort.postMessage({ type: "result", id: message.id, result: null });
  }
});
