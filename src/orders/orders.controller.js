const { type } = require('os');
const path = require('path');

// Use the existing order data
const orders = require(path.resolve('src/data/orders-data'));

// Use this function to assigh ID's when necessary
const nextId = require('../utils/nextId');

// Middleware functions:
function formValidation(req, res, next) {
  const data = req.body.data || {};
  const reqFields = ['deliverTo', 'mobileNumber', 'dishes'];

  for (let field of reqFields) {
    if (!data[field]) {
      next({
        status: 400,
        message: `Order must include a ${field}.`,
      });
    }
  }
  next();
}

function dishValidation(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  if (!Array.isArray(dishes) || dishes.length < 1) {
    return next({
      status: 400,
      message: 'Order must include at least one dish',
    });
  }
}

function dishQuantity(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  for (let index in dishes) {
    const quantity = dishes[index].quantity;
    if (typeof quantity !== 'number' || quantity < 1) {
      return next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
    }
  }
  next();
}

// TODO: Implement the /orders handlers needed to make the tests pass
const list = (req, res, next) => {
  res.json({ data: orders });
};

const create = (req, res, next) => {
  const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes: [...dishes],
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
};

module.exports = {
  list,
  create: [formValidation, dishValidation, dishQuantity, create],
};
