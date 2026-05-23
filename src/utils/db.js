require('dotenv').config();
const mongoose = require('mongoose');

// ── Connect ────────────────────────────────────────────────────────────────
let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: 'gharkaCA',
  });
  isConnected = true;
  console.log('[MongoDB] Connected to Atlas');
}

// ── SCHEMAS ────────────────────────────────────────────────────────────────

const UserSchema = new mongoose.Schema({
  phone:                  { type: String, unique: true, required: true }, // whatsapp:+919876543210
  name:                   { type: String, default: null },
  is_subscribed:          { type: Boolean, default: false },
  subscription_expires_at:{ type: Date, default: null },
  reports_generated:      { type: Number, default: 0 },
}, { timestamps: true });

const ConversationSchema = new mongoose.Schema({
  phone:    { type: String, required: true, index: true },
  messages: { type: Array, default: [] },      // [{role, content}]
  tax_data: { type: Object, default: {} },      // collected answers
  step:     { type: Number, default: 0 },       // 0-10
  status:   { type: String, default: 'collecting', enum: ['collecting','complete','paid','archived'] },
}, { timestamps: true });

const PaymentSchema = new mongoose.Schema({
  phone:               { type: String, required: true, index: true },
  razorpay_order_id:   { type: String },
  razorpay_payment_id: { type: String },
  amount:              { type: Number },        // in paise
  status:              { type: String, default: 'created', enum: ['created','paid','failed'] },
}, { timestamps: true });

const ReportSchema = new mongoose.Schema({
  phone:     { type: String, required: true, index: true },
  file_path: { type: String },
  tax_data:  { type: Object },
  analysis:  { type: Object },
}, { timestamps: true });

// ── Models ─────────────────────────────────────────────────────────────────
const User         = mongoose.models.User         || mongoose.model('User',         UserSchema);
const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);
const Payment      = mongoose.models.Payment      || mongoose.model('Payment',      PaymentSchema);
const Report       = mongoose.models.Report       || mongoose.model('Report',       ReportSchema);

// ── USER helpers ───────────────────────────────────────────────────────────

async function getOrCreateUser(phone) {
  await connectDB();
  let user = await User.findOne({ phone });
  if (!user) user = await User.create({ phone });
  return user;
}

async function setUserSubscribed(phone) {
  await connectDB();
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  await User.findOneAndUpdate(
    { phone },
    { is_subscribed: true, subscription_expires_at: expires },
    { upsert: true }
  );
}

async function isUserSubscribed(phone) {
  await connectDB();
  const user = await User.findOne({ phone });
  if (!user?.is_subscribed) return false;
  if (!user.subscription_expires_at) return false;
  return user.subscription_expires_at > new Date();
}

// ── CONVERSATION helpers ───────────────────────────────────────────────────

async function getConversation(phone) {
  await connectDB();
  return Conversation.findOne({ phone, status: { $in: ['collecting', 'complete', 'paid'] } })
    .sort({ createdAt: -1 });
}

async function createConversation(phone) {
  await connectDB();
  return Conversation.create({ phone });
}

async function updateConversation(phone, updates) {
  await connectDB();
  const conv = await getConversation(phone);
  if (!conv) throw new Error('Conversation not found');
  Object.assign(conv, updates);
  return conv.save();
}

async function appendMessage(phone, role, content) {
  await connectDB();
  const conv = await getConversation(phone);
  if (!conv) throw new Error('Conversation not found');
  conv.messages.push({ role, content });
  await conv.save();
  return conv.messages;
}

async function resetConversation(phone) {
  await connectDB();
  // Archive old ones
  await Conversation.updateMany({ phone, status: { $ne: 'archived' } }, { status: 'archived' });
  return Conversation.create({ phone });
}

// ── PAYMENT helpers ────────────────────────────────────────────────────────

async function createPaymentRecord(phone, orderId, amount) {
  await connectDB();
  return Payment.create({ phone, razorpay_order_id: orderId, amount });
}

async function markPaymentPaid(orderId, paymentId) {
  await connectDB();
  await Payment.findOneAndUpdate(
    { razorpay_order_id: orderId },
    { status: 'paid', razorpay_payment_id: paymentId }
  );
}

// ── REPORT helpers ─────────────────────────────────────────────────────────

async function saveReport(phone, filePath, taxData, analysis) {
  await connectDB();
  await Report.create({ phone, file_path: filePath, tax_data: taxData, analysis });
  await User.findOneAndUpdate({ phone }, { $inc: { reports_generated: 1 } });
}

// ── ADMIN helpers ──────────────────────────────────────────────────────────

async function getAdminStats() {
  await connectDB();
  const [totalUsers, subscribedUsers, payments, weekSignups, completedConvs] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ is_subscribed: true }),
    Payment.find({ status: 'paid' }).sort({ createdAt: -1 }).limit(10).lean(),
    User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
    Conversation.countDocuments({ status: { $in: ['complete', 'paid'] } }),
  ]);
  const totalRevenue = await Payment.aggregate([
    { $match: { status: 'paid' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  const recentUsers = await User.find().sort({ createdAt: -1 }).limit(20).lean();

  return {
    totalUsers, subscribedUsers,
    totalRevenue: (totalRevenue[0]?.total || 0) / 100,
    completedConversations: completedConvs,
    newThisWeek: weekSignups,
    recentUsers,
    recentPayments: payments,
  };
}

async function getAllSubscribedPhones() {
  await connectDB();
  const users = await User.find({ is_subscribed: true }).select('phone').lean();
  return users.map(u => u.phone);
}

async function getAllPhones(filter = 'all') {
  await connectDB();
  let query = {};
  if (filter === 'subscribed') query = { is_subscribed: true };
  if (filter === 'free') query = { is_subscribed: false };
  const users = await User.find(query).select('phone').lean();
  return users.map(u => u.phone);
}

module.exports = {
  connectDB,
  User, Conversation, Payment, Report,
  getOrCreateUser, setUserSubscribed, isUserSubscribed,
  getConversation, createConversation, updateConversation, appendMessage, resetConversation,
  createPaymentRecord, markPaymentPaid,
  saveReport,
  getAdminStats, getAllSubscribedPhones, getAllPhones,
};
