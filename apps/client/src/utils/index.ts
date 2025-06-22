const createObjectId = () => {
  const timestamp = ((Date.now() / 1000) | 0).toString(16);
  const randomBytes = Array.from(window.crypto.getRandomValues(new Uint8Array(8)));
  const randomHex = randomBytes.map(byte => `0${byte.toString(16)}`.slice(-2)).join("");
  return `${timestamp}${randomHex}`;
};

const fadeAudio = (
  audioElement: HTMLAudioElement,
  fadeDirection: "in" | "out",
  duration = fadeDirection === "out" ? 50 : 20
) =>
  new Promise(resolve => {
    if (!audioElement) return void resolve(void 0);
    const initialVolume = audioElement.volume;
    const start = performance.now();

    const fade =
      fadeDirection === "out"
        ? (t: number) => initialVolume * Math.cos(((t - start) * (Math.PI / 2)) / duration)
        : (t: number) => (1 - initialVolume) * Math.sin(((t - start) * (Math.PI / 2)) / duration) + initialVolume;

    const tick = (timestamp: number) => {
      const elapsed = timestamp - start;
      if (elapsed >= duration) {
        audioElement.volume = fadeDirection === "out" ? 0 : 1;
        resolve(void 0);
      } else {
        audioElement.volume = Math.min(1, Math.max(0, fade(timestamp)));
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  });

const formatPrice = (value: string) => {
  const [integer = 0, float = 0] = value.toString().split(".");
  const priceAsFloatString = `${integer}.${float}`;
  const rounded = +(Math.ceil(Math.abs(Number.parseFloat(priceAsFloatString + "e+2"))) + "e-2");
  const price = Number.isNaN(rounded) ? Number.MAX_SAFE_INTEGER.toFixed(2) : rounded.toFixed(2);
  return price;
};

export { createObjectId, fadeAudio, formatPrice };
