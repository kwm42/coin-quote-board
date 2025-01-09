class AlarmClient {
  constructor() {
    this.alarms = [];
  }

  addAlarm(alarm) {
    this.alarms.push(alarm);
  }

  removeAlarm(alarm) {
    this.alarms = this.alarms.filter((a) => a !== alarm);
  }

  getAlarms() {
    return this.alarms;
  }

  playSound() {
    const audio = new Audio("./beep-07.mp3");
    audio.play();
  }
}

const Alarm = new AlarmClient();

export {
  Alarm
}