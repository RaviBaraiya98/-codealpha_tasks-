import Cart from '../models/cartModel.js';
import Product from '../models/productModel.js';

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    // Validate product exists and has enough stock
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Not enough stock available' });
    }
    
    // Find user's cart or create new one
    let cart = await Cart.findOne({ userId: req.user._id });
    
    if (!cart) {
      cart = new Cart({
        userId: req.user._id,
        items: []
      });
    }
    
    // Check if product already in cart
    const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
    
    if (itemIndex > -1) {
      // Update quantity if item exists
      cart.items[itemIndex].quantity += quantity;
    } else {
      // Add new item
      cart.items.push({ productId, quantity });
    }
    
    cart.updatedAt = Date.now();
    
    const updatedCart = await cart.save();
    
    // Populate product details
    await updatedCart.populate('items.productId');
    
    res.status(201).json(updatedCart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get cart items
// @route   GET /api/cart
// @access  Private
export const getCartItems = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId');
    
    if (!cart) {
      return res.json({ items: [], userId: req.user._id });
    }
    
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:id
// @access  Private
export const removeFromCart = async (req, res) => {
  try {
    const productId = req.params.id;
    const cart = await Cart.findOne({ userId: req.user._id });
    
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    
    // Remove item
    cart.items = cart.items.filter(item => item.productId.toString() !== productId);
    cart.updatedAt = Date.now();
    
    const updatedCart = await cart.save();
    await updatedCart.populate('items.productId');
    
    res.json(updatedCart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/:id
// @access  Private
export const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const productId = req.params.id;
    
    // Validate quantity
    if (quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }
    
    // Check product stock
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Not enough stock available' });
    }
    
    const cart = await Cart.findOne({ userId: req.user._id });
    
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    
    // Find and update item
    const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
    
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }
    
    cart.items[itemIndex].quantity = quantity;
    cart.updatedAt = Date.now();
    
    const updatedCart = await cart.save();
    await updatedCart.populate('items.productId');
    
    res.json(updatedCart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};