import { useState } from "react";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: "#32325d",
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: "antialiased",
      fontSize: "16px",
      "::placeholder": {
        color: "#aab7c4",
      },
    },
    invalid: {
      color: "#fa755a",
      iconColor: "#fa755a",
    },
  },
};

export default function PaymentForm({ onSuccess, onError, amount }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: elements.getElement(CardElement),
      });

      if (stripeError) {
        setError(stripeError.message);
        onError?.(stripeError);
        return;
      }

      // For now, simulate payment success
      // In production, you'd send paymentMethod.id to your server
      // to create a PaymentIntent and confirm payment
      setTimeout(() => {
        onSuccess?.(paymentMethod);
      }, 1000);

    } catch (err) {
      setError("Payment failed. Please try again.");
      onError?.(err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <div className="form-group">
        <label>Card Information</label>
        <div className="card-element-container">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
      </div>

      {error && (
        <div className="error-message" style={{ color: "#fa755a", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="btn primary full-width"
      >
        {processing ? "Processing…" : `Pay $${amount.toFixed(2)}`}
      </button>

      <p className="muted tiny" style={{ marginTop: "1rem" }}>
        Your payment information is secure and encrypted.
      </p>
    </form>
  );
}