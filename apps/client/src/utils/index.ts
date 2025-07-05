const createObjectId = () => {
  const timestamp = ((Date.now() / 1000) | 0).toString(16);
  const randomBytes = Array.from(window.crypto.getRandomValues(new Uint8Array(8)));
  const randomHex = randomBytes.map(byte => `0${byte.toString(16)}`.slice(-2)).join("");
  return `${timestamp}${randomHex}`;
};

const formatPrice = (value: string) => {
  const [integer = 0, float = 0] = value.toString().split(".");
  const priceAsFloatString = `${integer}.${float}`;
  const rounded = +(Math.ceil(Math.abs(Number.parseFloat(priceAsFloatString + "e+2"))) + "e-2");
  const price = Number.isNaN(rounded) ? Number.MAX_SAFE_INTEGER.toFixed(2) : rounded.toFixed(2);
  return price;
};

export { createObjectId, formatPrice };
