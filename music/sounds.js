class Music{
  constructor(_path){
    loadSound(_path, (myMusic) => {
      this.music = myMusic;
    });
  }
  play(_wait){
    let isPlaying = false;
    if(_wait){
      if(this.music.isPlaying()){ 
        this.music.setVolume(0.2);
      }
    }
    else {
      if(this.music.isPlaying()){ 
        this.music.setVolume(0.8);
        isPlaying = true;
      }
      if(!isPlaying){
        this.music.play();
      }
    }
  }
}
  
class SFX {
  constructor(_path) {
    loadSound(_path, (mySfx) => {
      this.sfx = mySfx;
    });
  }
  play() {
    if (this.sfx) {
      this.sfx.play();
    } 
    else {
      console.error("Sound not loaded yet.");
    }
  }
}