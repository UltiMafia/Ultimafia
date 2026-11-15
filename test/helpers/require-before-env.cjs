// Deliberately loads modules before any test file sets its environment.
//
// Required via `mocha --require`, so it runs first in every worker process.
// mocha --parallel recycles workers between files, which means a module can
// already be in the worker's require cache when a later test file sets the env
// that module wants. Any module that reads env at load time then runs with the
// wrong configuration and fails tests that pass in isolation -- the historical
// example is modules/pushNotifications reading VAPID_* at require time, which
// turned test/pushNotifications.test.js into 10 phantom failures.
//
// Loading such modules here makes that failure mode permanent and cheap to
// notice: if a module starts depending on its load-time environment again, the
// suite fails deterministically on every run instead of only when a worker
// happens to have handled a particular file first.
require("../../modules/pushNotifications");
