import { useState, useEffect } from "react";
import { generateUPIPaymentData } from "../utils/upiUtils.js";

export default function UPIPayment({
  amount,
  orderId,
  merchantId = "tkabhishek45@oksbi",
  merchantName = "tkabhishek45",
  onSuccess,
  onCancel
}) {

  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [upiUrl, setUpiUrl] = useState("");

  useEffect(() => {
    generateUPIPayment();
  }, [amount, orderId]);

  const generateUPIPayment = () => {

    const paymentData = generateUPIPaymentData(
      amount,
      orderId,
      merchantId,
      merchantName
    );

    const upiLink = paymentData.url;

    setUpiUrl(upiLink);

    // Generate QR code URL
const qrUrl =
`https://quickchart.io/qr?size=300&text=${encodeURIComponent(upiLink)}`;

    setQrCodeUrl(qrUrl);
  };


  const isMobile = () => {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  };


  const openUPIApp = () => {

    if (!isMobile()) {
      alert("UPI apps open only on mobile. Please scan the QR code.");
      return;
    }

    window.location.href = upiUrl;
  };


  return (
    <div className="upi-payment">

      <h3>Pay with UPI</h3>

      <p>
        Scan this QR code using Google Pay, PhonePe, Paytm or any UPI app.
      </p>

      <div className="qr-code-container">

        {qrCodeUrl ? (
          <img src={qrCodeUrl} alt="UPI QR Code" width="250" />
        ) : (
          <p>Generating QR Code...</p>
        )}

      </div>


      <div className="payment-details">

        <p><strong>Amount:</strong> ₹{amount}</p>
        <p><strong>Order ID:</strong> {orderId}</p>
        <p><strong>Merchant:</strong> {merchantName}</p>

      </div>


      <button onClick={openUPIApp}>
        Open UPI App
      </button>


      <button onClick={onCancel}>
        Cancel Payment
      </button>


      <div style={{ marginTop: 20 }}>

        <button onClick={onSuccess}>
          ✅ Payment Completed
        </button>

      </div>

    </div>
  );
}