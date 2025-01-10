const publicPath = import.meta.env.DEV ? import.meta.env.VITE_PUBLIC_PATH : './'

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
    const audio = new Audio(`${publicPath}sound/sound1.mp3`);
    audio.play();
  }
}

const Alarm = new AlarmClient();

export {
  Alarm
}