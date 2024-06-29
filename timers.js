let pausedTime = 0;

class Timer {
  constructor(threshold = 0, offset = 0) {
    this.offset = offset;
    this.time = millis() - pausedTime + this.offset;
    this.threshold = threshold;
  }

  getTime() {
    return millis() - pausedTime - this.time;
  }

  pastTime(threshold = this.threshold) {
    return this.getTime() > threshold;
  }

  reset() {
    this.time = millis() - pausedTime + this.offset;
  }
}