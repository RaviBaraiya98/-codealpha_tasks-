import Order from '../models/orderModel.js';
import Cart from '../models/cartModel.js';
import Product from '../models/productModel.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req, res) => {
  try {
    const { shippingAddress } = req.body;
    
    // Get user's cart
    const cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId');
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'No items in cart' });
    }
    
    // Calculate total and prepare order items
    let totalAmount = 0;
    const orderItems = [];
    
    for (const item of cart.items) {
      const product = item.productId;
      
      // Check stock
      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Not enough stock for ${product.name}. Available: ${product.stock}` 
        });
      }
      
      // Add to order items
      orderItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity
      });
      
      // Update total
      totalAmount += product.price * item.quantity;
      
      // Update product stock
      await Product.findByIdAndUpdate(product._id, {
        $inc: { stock: -item.quantity }
      });
    }
    
    // Create order
    const order = new Order({
      userId: req.user._id,
      items: orderItems,
      totalAmount,
      shippingAddress
    });
    
    const createdOrder = await order.save();
    
    // Clear cart
    await Cart.findOneAndDelete({ userId: req.user._id });
    
    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all orders for user
// @route   GET /api/orders
// @access  Private
export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort('-createdAt');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if order belongs to user or user is admin
    if (order.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id
// @access  Private/Admin
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    order.status = status;
    const updatedOrder = await order.save();
    
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all orders (admin)
// @route   GET /api/orders/admin
// @access  Private/Admin
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).populate('userId', 'name email').sort('-createdAt');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};