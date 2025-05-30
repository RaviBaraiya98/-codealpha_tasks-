import express from 'express';
import { 
  createOrder, 
  getUserOrders, 
  getOrderById, 
  updateOrderStatus, 
  getAllOrders 
} from '../controllers/orderController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createOrder)
  .get(protect, getUserOrders);

router.route('/admin')
  .get(protect, admin, getAllOrders);

router.route('/:id')
  .get(protect, getOrderById)
  .put(protect, admin, updateOrderStatus);

export default router;