let audioContext: AudioContext | null = null;
let gainNode: GainNode | null = null;

const getAudioContext = () => {
  if (!audioContext) audioContext = new AudioContext();
  return audioContext;
};

const getGainNode = () => {
  if (gainNode) return gainNode;
  const audioContext = getAudioContext();
  const player = document.querySelector<HTMLAudioElement>("#player");
  const source = audioContext.createMediaElementSource(player!);
  gainNode = audioContext.createGain();
  gainNode.gain.value = 1;
  source.connect(gainNode).connect(audioContext.destination);
  return gainNode;
};

const fadeAudio = async (fadeDirection: "in" | "out") => {
  const audioContext = getAudioContext();
  const gainNode = getGainNode();

  return new Promise(resolve => {
    if (fadeDirection === "in") {
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(1, audioContext.currentTime + 0.05);
      resolve(void 0);
    } else {
      gainNode.gain.setValueAtTime(1, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.15);
      setTimeout(resolve, 150);
    }
  });
};

export { fadeAudio, getAudioContext, getGainNode };
