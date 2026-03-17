export const generateUPIUrl = ({
  merchantId,
  merchantName,
  amount,
  orderId
}) => {
  return `upi://pay?pa=${merchantId}&pn=${merchantName}&am=${amount}&cu=INR&tn=Order${orderId}`;
};

export const generateUPIPaymentData = (amount, orderId, merchantId, merchantName) => {
  return {
    url: generateUPIUrl({ merchantId, merchantName, amount, orderId }),
  };
};
