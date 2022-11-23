const { privateDecrypt } = require("crypto");
const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
function list(req, res) {
    // return resource of json formated response of all dishes as property of data 
    res.json({ data: dishes });
};

function dishExists(req, res, next) {
    const { dishId } = req.params;
    const foundDish = dishes.find((dish) => dish.id === dishId);
    if (foundDish) {
        return next();
    }
    next({
        status: 404,
        message: `Dish id not found: ${dishId}`,
    });
};

function nameValidation(req, res, next) {
    const { data: { name } = {} } = req.body;
    if (name && name != "") {
        return next();
    }
    next({
        status: 400, 
        message: `Dish must include a name`
    });
};

function descriptionValidation(req, res, next) {
    const { data: { description } = {} } = req.body;
    if (description && description != "") {
        return next();
    }
    next({
        status: 400, 
        message: `Dish must include a description`
    });
};

function priceValidation(req, res, next) {
    const { data: { price } = {} } = req.body;
    if (price && price != "") {
        return next();
    }
    next({
        status: 400, 
        message: `Dish must include a price`
    });
};

function priceNumberValidation(req, res, next) {
    const { data: { price } = {} } = req.body;
    if (price > 0 && Number.isInteger(price)) {
        return next();
    }
    next({
        status: 400, 
        message: `Dish must have a price that is an integer greater than 0`
    });
};

function imageValidation(req, res, next) {
    const { data: { image_url } = {} } = req.body;
    if (image_url && image_url != "") {
        return next();
    }
    next({
        status: 400, 
        message: `Dish must include a image_url`
    });
};

function dishIDValidation(req, res, next) {
    const { dishId } = req.params;
    const { id } = req.body.data;
    if (!id || id === dishId) {
      return next();
    } else {
      next({
        status: 400,
        message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
      });
    }
    next();
  }

function read(req, res) {
    const { dishId } = req.params;
    const foundDish = dishes.find((dish) => dish.id === dishId);
    res.json({ data: foundDish });
};

function create(req, res) {
    const { data: { name, description, price, image_url } = {} } = req.body;
    const newDish = {
        id: nextId(), // provided by API utils
        name: name,
        description: description,
        price: price,
        image_url: image_url
    };
    dishes.push(newDish);
    res.status(201).json({ data: newDish });
};

function update(req, res) {
    const { dishId } = req.params;
    const foundDish = dishes.find((dish) => dish.id === dishId);
    const { data: { name, description, price, image_url } = {} } = req.body;
  
    foundDish.name = name;
    foundDish.description = description;
    foundDish.price = price;
    foundDish.image_url = image_url;

    res.json({ data: foundDish });
  }
  
module.exports = {
    list,
    read: [dishExists, read],
    create: [
        nameValidation,
        descriptionValidation,
        priceValidation,
        priceNumberValidation,
        imageValidation,
        create
    ],
    update: [
        dishExists,
        dishIDValidation,
        nameValidation,
        descriptionValidation,
        priceValidation,
        priceNumberValidation,
        imageValidation,
        update
    ]
};
