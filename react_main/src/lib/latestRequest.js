// One owner, one current async operation. Replacing or invalidating an operation
// aborts its transport and makes its result ineligible even if abort is ignored.
export class LatestRequest {
  constructor() {
    this.generation = 0;
    this.controller = null;
  }

  invalidate() {
    this.generation += 1;
    this.controller?.abort();
    this.controller = null;
  }

  begin() {
    this.invalidate();
    const generation = this.generation;
    const controller = new AbortController();
    this.controller = controller;
    return {
      signal: controller.signal,
      isCurrent: () => this.generation === generation && !controller.signal.aborted,
    };
  }
}
