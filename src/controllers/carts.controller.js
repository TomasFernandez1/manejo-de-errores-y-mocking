import { cartService, productService, ticketService } from '../repositories/index.js'
import { EErrors } from '../repositories/errors/enums.js'
import CustomError from '../repositories/errors/CustomError.js'
import { addCartProductErrorInfo } from '../repositories/errors/info.js'

export default class cartController {
  constructor() {
    this.service = cartService
  }

  getCart = async (req, res) => {
    try {
      const { cid } = req.params // ID Cart
      const { products } = await this.service.getCartBy(cid)
      const productsArray = products.map((product) => {
        return {
          id: product.product._id,
          title: product.product.title,
          price: product.product.price,
          quantity: product.quantity
        }
      })
      res.render('cart', { products: productsArray, user: req.user })
    } catch (error) {
      res.sendServerError(error)
    }
  }

  getCarts = async (req, res) => {
    res.status(200).send(await this.service.getCart())
  }

  addProductToCart = async (req, res, next) => {
    try {
      const { cid, pid } = req.params
      let cart
      try {
        cart = await this.service.getCartBy(cid)
      } catch (error) {
        CustomError.createError({
          name: 'Error add product to cart',
          cause: addCartProductErrorInfo(),
          message: 'Error cart',
          code: EErrors.DATABASE_ERROR
        })
      }

      const productIndex = cart.products.findIndex((p) => p.product && p.product.id === pid)

      if (productIndex !== -1) {
        cart.products[productIndex].quantity += 1
      } else {
        cart.products.push({ product: pid, quantity: 1 })
      }

      const result = await this.service.updateCart(cid, cart)
      res.sendSuccess(result)
    } catch (error) {
      next(error)
    }
  }

  updateCart = async (req, res) => {
    try {
      const { cid } = req.params
      const { products } = req.body
      const cart = await this.service.getCartBy(cid)
      cart.products = products
      await this.service.updateCart(cid, cart)
      res.sendSuccess('Cart updated successfully')
    } catch (error) {
      res.sendServerError(error)
    }
  }

  updateQuantityProductCart = async (req, res) => {
    try {
      const { cid, pid } = req.params
      const { quantity } = req.body
      const result = await this.service.updateQuantityProductCart(cid, pid, quantity)

      res.sendSuccess('The quantity was updated successfully')
    } catch (error) {
      res.sendServerError(error)
    }
  }

  deleteProductCart = async (req, res) => {
    try {
      const { cid, pid } = req.params
      const result = await this.service.deleteProductCart(cid, pid)
      res.sendSuccess('The product was deleted successfully')
    } catch (error) {
      res.sendServerError(error)
    }
  }

  deleteAllProductsCart = async (req, res) => {
    try {
      const { cid } = req.params
      const result = await this.service.deleteProductsCart(cid)
      res.status(200).send(result)
    } catch (error) {
      res.sendServerError(error)
    }
  }

  purchase = async (req, res) => {
    try {
      const { cid } = req.params
      const cart = await this.service.getCartBy(cid)
      const insufficientStock = []
      const buyProducts = []

      if (!cart) return res.status(404).send({ status: 'Error', message: 'Cart not found' })

      cart.products.forEach(async (item) => {
        const product = item.product
        const productId = item.product._id
        const quantity = item.quantity
        const stock = item.product.stock

        quantity > stock
          ? insufficientStock.push(product)
          : buyProducts.push({ product, quantity }) &&
            (await productService.updateProduct(productId, { stock: stock - quantity })) &&
            (await cartService.deleteProductCart(cart, productId))
      })

      const totalAmount = buyProducts.reduce((acc, item) => acc + item.quantity, 0)

      if (!buyProducts.length) {
        return res.status(404).send({
          status: 'Error',
          message: 'Insufficient stock in the products',
          products: insufficientStock.map((prod) => prod._id)
        })
      }

      let ticket = {}
      if (buyProducts.length > 0) {
        ticket = await ticketService.createTicket(totalAmount, req.user.email)
      }

      return res.sendSuccess({ message: 'Successful purchase', toTicket: ticket })
    } catch (error) {
      res.sendServerError(error)
    }
  }
}
