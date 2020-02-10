const Price = ({ price, priceError, xemPriceUsd }) => {
  if (priceError) return `$${price} USD`;

  if (price === 0) return 'Name Your Price';

  if (xemPriceUsd) {
    const priceInXem = price / xemPriceUsd;
    return `$${price} USD (~${priceInXem.toFixed(2)} XEM)`;
  } else {
    return 'Loading…';
  }
};

export default Price;
