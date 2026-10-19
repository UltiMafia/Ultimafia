// Ownership is reserved before fetching, not when a response happens to arrive.
// A stale request/opener cannot show, update or dismiss a newer sheet.
export class SheetController {
  constructor() {
    this.current = null;
    this.snapshot = { sheet: null, open: false };
    this.listeners = new Set();
    this.nextOwnerId = 0;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  publish(snapshot) {
    this.snapshot = snapshot;
    for (const listener of this.listeners) listener(snapshot);
  }

  closeCurrent() {
    const previous = this.current;
    this.current = null;
    if (this.snapshot.open) this.publish({ ...this.snapshot, open: false });
    if (previous) previous.onClose?.();
  }

  reserve(onClose) {
    this.closeCurrent();
    const owner = { id: ++this.nextOwnerId, onClose };
    this.current = owner;
    return {
      isCurrent: () => this.current === owner,
      show: (render) => {
        if (this.current !== owner) return false;
        this.publish({ sheet: { owner, render }, open: true });
        return true;
      },
      update: (render) => {
        if (this.current !== owner || !this.snapshot.open) return false;
        this.publish({ sheet: { owner, render }, open: true });
        return true;
      },
      close: () => {
        if (this.current === owner) this.closeCurrent();
      },
    };
  }

  finishExit() {
    if (!this.snapshot.open) this.publish({ sheet: null, open: false });
  }
}
