module.exports = class History {
  constructor(game, player) {
    this.game = game;
    this.player = player;
    this.states = {
      [-1]: {
        name: "Pregame",
        meetings: {},
        alerts: [],
        stateEvents: {},
        obituaries: {},
        roles: {},
        dead: {},
        exorcised: {},
      },
    };
  }

  addState(name, state) {
    state = state == null ? this.game.currentState : state;
    var prevState;

    if (state != -2) prevState = state - 1;
    else prevState = Object.keys(this.states).sort((a, b) => b - a)[0];

    this.states[state] = {
      name: name,
      meetings: {},
      alerts: [],
      stateEvents: {},
      obituaries: {},
      roles: { ...this.states[prevState].roles },
      dead: { ...this.states[prevState].dead },
      exorcised: { ...this.states[prevState].exorcised },
      extraInfo: {},
    };
  }

  addStateEvents(events, state) {
    state = state == null ? this.game.currentState : state;
    state = this.states[state];

    for (let eventName in events)
      state.stateEvents[eventName] = events[eventName];
  }

  addStateExtraInfo(extraInfo, state) {
    state = state == null ? this.game.currentState : state;
    state = this.states[state];

    state.extraInfo = extraInfo;
  }

  addMeeting(meeting, state) {
    state = state == null ? this.game.currentState : state;
    this.states[state].meetings[meeting.id] = meeting;
  }

  getMeeting(meetingId, state) {
    state = state == null ? this.game.currentState : state;
    return this.states[state].meetings[meetingId];
  }

  addAlert(message, state) {
    state = state == null ? this.game.currentState : state;
    this.states[state].alerts.push(message);
  }

  addObituaries(obituariesMessage, state) {
    state = state == null ? this.game.currentState : state;
    this.states[state].obituaries[obituariesMessage.source] = obituariesMessage;
  }

  setStateName(name, state) {
    state = state == null ? this.game.currentState : state;
    this.states[state].name = name;
  }

  removeMeeting(meeting, state) {
    state = state == null ? this.game.currentState : state;
    delete this.states[state].meetings[meeting.id];
  }

  getPlayerId() {
    return this.player ? this.player.id : null;
  }

  getMeetings(state) {
    state = state == null ? this.game.currentState : state;
    return Object.values(this.states[state].meetings);
  }

  getMeetingInfo(state) {
    state = state == null ? this.game.currentState : state;

    var meetings = this.getMeetings(state);
    return meetings.map((meeting) => meeting.getMeetingInfo(this.player));
  }

  getHistoryInfo(targetState, isRecord) {
    var res = {};

    for (let state in this.states) {
      if (targetState && targetState != state) continue;

      let info = this.states[state];

      res[state] = {
        name: info.name,
        meetings: {},
        alerts: [],
        stateEvents: Object.keys(info.stateEvents),
        obituaries: info.obituaries,
        roles: info.roles,
        dead: info.dead,
        exorcised: info.exorcised,
        extraInfo: info.extraInfo,
      };

      for (let meetingId in info.meetings) {
        let meeting = info.meetings[meetingId];

        if (meeting.noRecord && isRecord) continue;

        res[state].meetings[meetingId] = meeting.getMeetingInfo(this.player);
      }

      for (let alert of info.alerts) {
        alert = alert.getMessageInfo(this.player);
        if (alert) res[state].alerts.push(alert);
      }

      if (targetState) break;
    }

    if (targetState) return res[targetState];
    else return res;
  }

  recordRole(player, appearance) {
    var state = this.game.currentState;
    this.states[state].roles[player.id] = appearance;
  }

  recordDead(player, dead) {
    var state = this.game.currentState;
    this.states[state].dead[player.id] = dead;
  }

  recordExorcised(player, exorcised) {
    var state = this.game.currentState;
    this.states[state].exorcised[player.id] = exorcised;
  }

  recordAllRoles() {
    var state = this.game.currentState;

    for (let player of this.game.players)
      if (player.role)
        this.states[state].roles[
          player.id
        ] = `${player.role.name}:${player.role.modifier}`;
  }

  recordAllDead() {
    var state = this.game.currentState;

    for (let player of this.game.players)
      this.states[state].dead[player.id] = !player.alive;
  }

  recordAllExorcised() {
    var state = this.game.currentState;

    for (let player of this.game.players)
      this.states[state].exorcised[player.id] = player.exorcised;
  }
};
