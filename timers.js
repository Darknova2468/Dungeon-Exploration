let pausedTime = 0;

class Timer {
  constructor(threshold = 0, offset = 0) {
    this.time = millis() - pausedTime + offset;
    this.threshold = threshold;
  }

  getTime() {
    return millis() - pausedTime - this.time;
  }

  pastTime(threshold = this.threshold) {
    return this.getTime() > threshold;
  }
}