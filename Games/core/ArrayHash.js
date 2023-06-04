module.exports = class ArrayHash {
  [Symbol.iterator]() {
    var i = 0;
    var values = Object.values(this);

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
    var values = Object.values(this);
    return values.map(f);
  }

  filter(f) {
    var values = Object.values(this);
    return values.filter(f);
  }

  reduce(f, initial) {
    var values = Object.values(this);
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
    let arr = this.array();
    for (let i in arr) if (arr[i] == item) return i;

    return -1;
  }

  get length() {
    return Object.values(this).length;
  }
};
