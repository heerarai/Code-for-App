def detect_tone(choice):
  tone_map = {
    'A': 'neutral',
    'B': 'happy',
    'C': 'sad'
  }
  return tone_map.get(choice, 'neutral')
