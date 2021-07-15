const { type } = require('os');
const path = require('path');

// Use the existing order data
const orders = require(path.resolve('src/data/orders-data'));

// Use this function to assigh ID's when necessary
const nextId = require('../utils/nextId');

// Middleware functions:
function hasReqFields(req, res, next) {
  const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
  const requiredFields = ['deliverTo', 'mobileNumber', 'dishes'];
  for (const field of requiredFields) {
    if (!req.body.data[field]) {
      next({ status: 400, message: `A '${field}' property is required.` });
    }
  }
  next();
}

function dishValidation(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  if (!Array.isArray(dishes)) {
    return res.status(400).json({ error: 'dishes must be an array' });
  }
  if (dishes.length < 1) {
    return res.status(400).json({ error: 'dishes must be greater than one' });
  }
  next();
}

function dishQuantity(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  for (const index in dishes) {
    if (typeof dishes[index].quantity !== 'number') {
      return res.status(400).json({
        error: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
    }
    if (dishes[index].quantity < 1) {
      return res.status(400).json({
        error: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
    }
  }
  next();
}

function validateId(req, res, next) {
  const orderId = req.params.orderId;
  const {
    data: { id },
  } = req.body;
  if (id) {
    if (orderId !== id) {
      next({
        status: 400,
        message: `Dish id does not match route id. Dish: ${id}, Route: ${orderId}`,
      });
    }
  }
  next();
}

function validateStatus(req, res, next) {
  const { data: { status } = {} } = req.body;
  const validStatuses = ['delivered', 'out-for-delivery', 'pending'];
  if (!status) {
    return res.status(400).json({ error: 'order must have a status' });
  }
  if (status === 'delivered') {
    return res.status(400).json({ error: 'delivered order cannot be updated' });
  }
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'status invalid' });
  }
  next();
}

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({ status: 404, message: ` order does not exist: ${orderId}` });
}
function validatePendingStatus(req, res, next) {
  if (res.locals.order.status === 'pending') {
    next();
  }
  return res
    .status(400)
    .json({ error: 'an order cannot be deleted unless it is pending' });
}
// ------------------------------------------------------------------------------ //
// ------------------------------------------------------------------------------ //

// TODO: Implement the /orders handlers needed to make the tests pass
const list = (req, res, next) => {
  res.json({ data: orders });
};

const create = (req, res, next) => {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
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

const read = (req, res, next) => {
  res.json({ data: res.locals.order });
};

const destroy = (req, res, next) => {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === orderId);
  if (index > -1) {
    orders.splice(index, 1);
  }
  res.sendStatus(204);
};

const update = (req, res, next) => {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const updatedOrder = {
    ...res.locals.order,
    deliverTo,
    mobileNumber,
    status,
    dishes: [...dishes],
  };
  res.json({ data: updatedOrder });
};

module.exports = {
  list,
  create: [hasReqFields, dishValidation, dishQuantity, create],
  read: [orderExists, read],
  update: [
    orderExists,
    hasReqFields,
    validateId,
    validateStatus,
    dishValidation,
    dishQuantity,
    update,
  ],
  destroy: [orderExists, validatePendingStatus, destroy],
};
