export const generateUPIUrl = ({
  merchantId,
  merchantName,
  amount,
  orderId
}) => {

  return `upi://pay?pa=${merchantId}&pn=${merchantName}&am=${amount}&cu=INR&tn=Order${orderId}`;
};
const generateUPIPayment = () => {
  const paymentData = generateUPIPaymentData(
    amount,
    orderId,
    merchantId,
    merchantName
  );

  const upiLink = paymentData.url;
  setUpiUrl(upiLink);

  // Try multiple QR code services with fallback
  const encodedData = encodeURIComponent(upiLink);
  
  // Primary QR service
  const primaryQrUrl = `https://quickchart.io/qr?size=300&text=${encodedData}&ecLevel=H&margin=1`;
  
  // Fallback QR service
  const fallbackQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedData}`;
  
  setQrCodeUrl(primaryQrUrl);
  
  // Preload fallback in case primary fails
  const img = new Image();
  img.onerror = () => {
    setQrCodeUrl(fallbackQrUrl);
  };
  img.src = primaryQrUrl;
};