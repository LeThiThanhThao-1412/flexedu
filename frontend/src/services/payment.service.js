// frontend/src/services/payment.service.js
import api from './api';

export const paymentService = {
  // Tạo order mới
  createOrder: async (data) => {
    const response = await api.post('/api/orders', data);
    return response.data;
  },
  
  // Lấy danh sách order của user
  getOrders: async () => {
    const response = await api.get('/api/orders');
    return response.data;
  },
  
  // Test endpoint - chỉ dùng trong mock mode
  testPaymentSuccess: async (data) => {
    const response = await api.post('/api/test-success', data);
    return response.data;
  },
  
  // Webhook - không cần gọi từ frontend
  // webhook sẽ được Stripe gọi trực tiếp
};