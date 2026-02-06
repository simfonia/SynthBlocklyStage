import ddf.minim.*;
import ddf.minim.ugens.*;

void setup() {
  size(200, 200);
  println("--- Minim Class Detection (Phase 2) ---");

  String[] classes = {
    "ddf.minim.ugens.Reverb",
    "ddf.minim.ugens.Chorus",
    "ddf.minim.ugens.Flanger",
    "ddf.minim.ugens.Convolve"
  };

  for (String c : classes) {
    try {
      Class.forName(c);
      println("[FOUND] " + c);
    } catch (ClassNotFoundException e) {
      println("[NOT FOUND] " + c);
    }
  }
  
  println("--- Detection Finished ---");
  exit();
}
