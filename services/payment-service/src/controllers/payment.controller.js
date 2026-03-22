// services/payment-service/src/controllers/payment.controller.js
const { PrismaClient } = require('@prisma/client');
const Stripe = require('stripe');
const redisClient = require('../config/redis');

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

class PaymentController {
  // Tạo order và payment intent
  // services/payment-service/src/controllers/payment.controller.js

async createOrder(req, res) {
  try {
    const { courseId, amount, currency = 'usd' } = req.body;
    const userId = req.headers['x-user-id'];

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // 1. Tạo order trong DB (Giữ nguyên)
    const order = await prisma.order.create({
      data: {
        userId,
        courseId,
        amount,
        currency: currency.toUpperCase(),
        status: 'PENDING'
      }
    });

    // 2. GIẢ LẬP STRIPE (Thay thế đoạn stripe.paymentIntents.create)
    // Thay vì gọi sang Stripe thật, mình tự tạo một ID giả
    const mockPaymentIntent = {
      id: `pi_mock_${Math.random().toString(36).substr(2, 9)}`,
      client_secret: `secret_mock_${Math.random().toString(36).substr(2, 9)}`
    };

    // 3. Lưu transaction với ID giả (Giữ nguyên cấu trúc)
    await prisma.transaction.create({
      data: {
        orderId: order.id,
        paymentIntent: mockPaymentIntent.id,
        amount,
        status: 'PENDING',
        metadata: { clientSecret: mockPaymentIntent.client_secret }
      }
    });

    res.json({
      success: true,
      message: "MOCK MODE: Order created without real Stripe call",
      data: {
        orderId: order.id,
        clientSecret: mockPaymentIntent.client_secret,
        paymentIntentId: mockPaymentIntent.id
      }
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

  // Webhook từ Stripe
  async handleWebhook(req, res) {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Xử lý event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        await this.handlePaymentSuccess(paymentIntent);
        break;
      
      case 'payment_intent.payment_failed':
        const failedIntent = event.data.object;
        await this.handlePaymentFailed(failedIntent);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  }

  // services/payment-service/src/controllers/payment.controller.js

// services/payment-service/src/controllers/payment.controller.js

  // services/payment-service/src/controllers/payment.controller.js

  async handlePaymentSuccess(paymentIntent) {
    try {
      console.log(`🔔 Đang xử lý thanh toán cho Intent: ${paymentIntent.id}`);

      // 1. Tìm transaction và thông tin order liên quan (Bắt buộc phải có bước này)
      const transaction = await prisma.transaction.findUnique({
        where: { paymentIntent: paymentIntent.id },
        include: { order: true } // Lấy thông tin order để có userId và courseId
      });

      // Nếu không tìm thấy thì dừng lại để tránh lỗi "undefined"
      if (!transaction) {
        console.error(`❌ Không tìm thấy giao dịch cho ID: ${paymentIntent.id}`);
        return;
      }

      // 2. Cập nhật trạng thái thành công trong Database của Payment
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'SUCCESS' }
      });

      await prisma.order.update({
        where: { id: transaction.orderId },
        data: { status: 'COMPLETED' }
      });

      // 3. Gọi sang Enrollment Service để ghi nhận khóa học
      // Lưu ý: .toString() để đảm bảo gửi dạng text thay vì ObjectId của Mongo
      const userIdStr = transaction.order.userId.toString();
      const courseIdStr = transaction.order.courseId.toString();
      
      const axios = require('axios');
      const enrollmentUrl = `${process.env.ENROLLMENT_SERVICE_URL}/api/enrollments/${courseIdStr}`;

      console.log(`🚀 Gửi yêu cầu ghi danh tới: ${enrollmentUrl}`);

      await axios.post(enrollmentUrl, {}, {
        headers: { 
          'x-user-id': userIdStr,
          'Content-Type': 'application/json'
        }
      });

      console.log(`✅ Ghi danh thành công cho User: ${userIdStr}`);

    } catch (error) {
      console.error('❌ Lỗi tại handlePaymentSuccess:', error.message);
    }
  }

  async handlePaymentFailed(paymentIntent) {
    try {
      const transaction = await prisma.transaction.findUnique({
        where: { paymentIntent: paymentIntent.id },
        include: { order: true }
      });

      if (transaction) {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { status: 'FAILED' }
        });

        await prisma.order.update({
          where: { id: transaction.orderId },
          data: { status: 'FAILED' }
        });
      }

      console.log(`Payment failed for intent ${paymentIntent.id}`);
    } catch (error) {
      console.error('Handle payment failed error:', error);
    }
  }

  // Lấy lịch sử order của user
  async getOrders(req, res) {
    try {
      const userId = req.headers['x-user-id'];
      const cacheKey = `orders:${userId}`;
      
      let orders = await redisClient.get(cacheKey);
      
      if (!orders) {
        orders = await prisma.order.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' }
        });
        await redisClient.set(cacheKey, orders, 3600);
      }

      res.json({ success: true, data: orders });
    } catch (error) {
      console.error('Get orders error:', error);
      res.status(500).json({ success: false, message: 'Internal error' });
    }
  }
  // Thêm hàm này vào trong class PaymentController, trước dấu đóng } cuối cùng
async testInstantSuccess(req, res) {
  try {
    const { paymentIntentId } = req.body;
    
    // Giả lập object giống như Stripe gửi về
    const mockEvent = {
      id: paymentIntentId,
      status: 'succeeded'
    };

    // Gọi hàm xử lý thành công có sẵn của bạn
    await this.handlePaymentSuccess(mockEvent);

    res.json({ success: true, message: "Mock payment confirmed! Enrollment triggered." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
}

module.exports = new PaymentController();