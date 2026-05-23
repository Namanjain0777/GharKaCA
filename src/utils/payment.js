require('dotenv').config();
const Razorpay = require('razorpay');
const { createPaymentRecord, markPaymentPaid, setUserSubscribed } = require('../utils/db');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create a Razorpay payment order and return a payment link
 */
async function createPaymentLink(phone) {
  const amount = parseInt(process.env.SUBSCRIPTION_AMOUNT) || 19900; // ₹199 in paise

  // Create order
  const order = await razorpay.orders.create({
    amount,
    currency: 'INR',
    receipt: `gharka_${phone.replace(/\D/g, '')}_${Date.now()}`,
    notes: { phone, product: 'Ghar Ka CA Annual Subscription' },
  });

  // Save to DB
  await createPaymentRecord(phone, order.id, amount);

  // Create payment link (simpler flow for WhatsApp users)
  const paymentLink = await razorpay.paymentLink.create({
    amount,
    currency: 'INR',
    accept_partial: false,
    description: 'Ghar Ka CA — Annual Subscription (₹199/year)',
    customer: { contact: phone.replace('whatsapp:', '') },
    notify: { sms: true, email: false },
    reminder_enable: true,
    notes: { phone, order_id: order.id },
    callback_url: `${process.env.APP_URL}/payment/success?order_id=${order.id}`,
    callback_method: 'get',
  });

  return {
    orderId: order.id,
    paymentUrl: paymentLink.short_url,
  };
}

/**
 * Verify and process a successful payment
 */
async function handlePaymentSuccess(orderId, paymentId) {
  try {
    await markPaymentPaid(orderId, paymentId);

    // Get phone from order notes
    const order = await razorpay.orders.fetch(orderId);
    const phone = order.notes.phone;

    if (phone) {
      await setUserSubscribed(phone);
    }

    return { success: true, phone };
  } catch (err) {
    console.error('Payment processing error:', err);
    return { success: false, error: err.message };
  }
}

module.exports = { createPaymentLink, handlePaymentSuccess };
