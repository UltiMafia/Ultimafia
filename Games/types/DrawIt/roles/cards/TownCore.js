module.exports = class TownCore {
  constructor(role) {
    this.role = role;
    this.meetings = {};
    this.actions = [];
    this.listeners = {};
  }
};
