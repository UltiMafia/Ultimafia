module.exports = class ArrayHash {
  [Symbol.iterator]() {
    let i = 0;
    const values = Object.values(this);

    return {
      next: () => {
        if (i >= values.length) return { done: true };

        return { value: values[i++], done: false };
      },
    };
  }

  push(item) {
    this[item.id] = item;
  }

  map(f) {
    const values = Object.values(this);
    return values.map(f);
  }

  filter(f) {
    const values = Object.values(this);
    return values.filter(f);
  }

  reduce(f, initial) {
    const values = Object.values(this);
    return values.reduce(f, initial);
  }

  array() {
    return Object.values(this);
  }

  concat(arr) {
    return this.array().concat(arr);
  }

  at(index) {
    return this.array()[index];
  }

  indexOf(item) {
    const arr = this.array();
    for (const i in arr) if (arr[i] == item) return i;

    return -1;
  }

  get length() {
    return Object.values(this).length;
  }
};
