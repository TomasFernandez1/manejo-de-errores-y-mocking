import RouterClass from './router.js'
import { generateProducts } from '../utils/generateProducts.js'

export default class pruebasRouter extends RouterClass {
  init() {
    this.get('/mockingProducts', ['PUBLIC'], (req, res) => {
      let products = []
      for (let index = 0; index < 100; index++) {
        products.push(generateProducts(index))
      }

      res.send(products)
    })
  }
}
