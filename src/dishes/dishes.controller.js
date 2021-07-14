const path = require('path');

// Use the existing dishes data
const dishes = require(path.resolve('src/data/dishes-data'));

// Use this function to assign ID's when necessary
const nextId = require('../utils/nextId');

// TODO: Implement the /dishes handlers needed to make the tests pass

// Middleware functions:
function formValidation(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const requiredFields = ['name', 'description', 'price', 'image_url'];
  const data = req.body.data || {};

  for (const field of requiredFields) {
    if (!data[field]) {
      return next({
        status: 400,
        message: `Dish much include a ${field}`,
      });
    }
  }
  next();
}

function priceCheck(req, res, next) {
  const { data: { price } = {} } = req.body;
  if (typeof price !== 'number' || price < 0) {
    return next({
      status: 400,
      message: 'Dish must have a price that is an integer greater than 0',
    });
  }
  next();
}

function dishExist(req, res, next) {
  const { dishId } = req.params;
  let foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish does not exist: ${dishId}.`,
  });
}

function dishIdCheck(req, res, next) {
  const { dishId } = req.params;
  const { data: { id } = {} } = req.body;

  if (id) {
    if (dishId !== id) {
      next({
        status: 400,
        message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
      });
    }
  }
  next();
}

const list = (req, res, next) => {
  res.json({ data: dishes });
};

const create = (req, res, next) => {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);

  res.status(201).json({ data: newDish });
};

const read = (req, res, next) => {
  res.json({ data: res.locals.dish });
};

const update = (req, res, next) => {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const updatedDish = {
    ...res.locals.dish,
    name,
    description,
    price,
    image_url,
  };
  res.json({ data: updatedDish });
};

module.exports = {
  list,
  create: [formValidation, priceCheck, create],
  read: [dishExist, read],
  update: [dishExist, formValidation, priceCheck, dishIdCheck, update],
};
