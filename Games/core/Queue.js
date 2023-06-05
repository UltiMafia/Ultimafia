module.exports = class Queue {
  constructor() {
    this.items = [];
  }

  enqueue(item) {
    if (item.priority == null) item.priority = 0;

    for (let i = 0; i < this.items.length; i++) {
      if (item.priority < this.items[i].priority) {
        this.items.splice(i, 0, item);
        return;
      }
    }

    this.items.push(item);
  }

  dequeue() {
    return this.items.splice(0, 1)[0];
  }

  peek() {
    return this.items[0];
  }

  remove(item) {
    var index = this.items.indexOf(item);

    if (index == -1) return;

    return this.items.splice(index, 1)[0];
  }

  removeIndex(i) {
    return this.items.splice(i, 1)[0];
  }

  empty() {
    this.items = [];
  }

  [Symbol.iterator]() {
    var i = 0;

    return {
      next: () => {
        if (i >= this.items.length) return { done: true };

        return { value: this.items[i++], done: false };
      },
    };
  }
};
