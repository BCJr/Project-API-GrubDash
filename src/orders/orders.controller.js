const path = require("path");
const orders = require(path.resolve("src/data/orders-data"));
const nextId = require("../utils/nextId");

function list(req, res, next) {
    res.json({ data: orders });
  }

function read(req, res, next) {
    res.json({ data: res.locals.order });
  }

function orderExists(req, res, next) {
    const {orderId} = req.params;
    const foundId = orders.find((order) => order.id === orderId);
    if (foundId) {
      res.locals.order = foundId;
      return next();
    }
    next({
      status: 404,
      message: `Order id does not exist: ${orderId}`,
    });
}

function create(req, res) {
    const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
    const id = nextId();
    const newOrder = {
      id,
      deliverTo,
      mobileNumber,
      dishes,
      status: "delivered",
    };
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
  }
 
function deliverToValidation(req, res, next) {
  const { data: { deliverTo } } = req.body;
  if(deliverTo) {
    res.locals.deliverTo = deliverTo;
    return next();
  }
  next({
    status: 400,
    message: "Order must include deliverTo"
  });
};
function mobileNumberValidation(req, res, next) {
  const { data: { mobileNumber } } = req.body;
  if(mobileNumber) {
    res.locals.mobileNumber = mobileNumber;
    return next();
  }
  next({
    status: 400,
    message: "Order must include mobileNumber"
  });
};
function dishesValidation(req, res, next) {
  const { data: { dishes } } = req.body;
  if(dishes) {
    res.locals.dishes = dishes;
    return next();
  }
  next({
    status: 400,
    message: "Order must include a dish"
  });
};
function dishesArrayValidation(req, res, next) {
  const dishes = res.locals.dishes;
  if((Array.isArray(dishes) && dishes.length > 0)) {
    return next();
  }
  next({
    status: 400,
    message: "Order must include at least one dish"
  })
}
function dishOfDishesValidation(req, res, next) {
  const dishes = res.locals.dishes;
  dishes.forEach((dish, i) => {
    if (!Number.isInteger(dish.quantity) || dish.quantity <= 0) {
        next({
          status: 400,
          message: `Dish ${i} must have a quantity that is an integer greater than 0`,
        });
    };
  });
  next();
}

function update(req, res) {
    const order = res.locals.order;
    const { data: { deliverTo, mobileNumber, dishes, quantity } = {} } = req.body;
    order.deliverTo = deliverTo;
    order.mobileNumber = mobileNumber;
    order.dishes = dishes;
    order.quantity = quantity;

    res.json({data: order})
}

function idValidation(req, res, next) {
  const { orderId } = req.params;
  const { data: { id } = {} } = req.body;

  if(id && id !== orderId) {
      next({
        status: 400,
        message:`Dish id does not match route id. Dish: ${id}, Route: ${orderId}`,
      });  
  }
  next();
};
function statusPendingValidation(req, res, next) {
  const { data: { status } = {} } = req.body;
  if (status && ["pending", "preparing", "out-for-delivery", "delivered"].includes(status)) {
    next();
  };
  next({
    status: 400,
    message: "Order must have a status of pending, preparing, out-for-delivery, delivered",
  });
};
function statusDeliveredValidation (req, res, next) {
  const order = res.locals.order;


  if(order.status === "delivered"){
    next({
        status: 400,
        message: "A delivered order cannot be changed",
    })
  };
  next();
};

function updateValidate(req, res, next) {
    const { orderId } = req.params;
    const order = res.locals.order
    const { data: { id, status } = {} } = req.body;

    if (id && id !== orderId) {
        next({
            status: 400,
            message: `Dish id does not match route id. Dish: ${id}, Route: ${orderId}`,
          });
    }  
      if(!status || !["pending", "preparing", "out-for-dellivery", "delivered"].includes(status)) {
            next({
                status: 400,
                message: "Order must have a status of pending, preparing, out-for-delivery, delivered",
        })
    }
      if(order.status === "delivered"){
          next({
              status: 400,
              message: "A delivered order cannot be changed",
          })
      }
      next()
}

  function destroy(req, res) {
    const { orderId } = req.params;
    const index = orders.findIndex((order) => order.id === Number(orderId));
      orders.splice(index, 1);
    res.sendStatus(204);
  }

  function deleteValidate(req, res, next){
      const order = res.locals.order
      if(order.status != "pending"){
          next({
              status: 400,
              message: "An order cannot be deleted unless it is pending",
          })

      }
      next()
  }

module.exports = {
    list,
    read: [orderExists, read],
    create: [
        deliverToValidation,
        mobileNumberValidation,
        dishesValidation,
        dishesArrayValidation,
        dishOfDishesValidation,
        create],
    update: [
        orderExists, 
        deliverToValidation,
        mobileNumberValidation,
        dishesValidation,
        dishesArrayValidation,
        dishOfDishesValidation,
        idValidation,
        statusPendingValidation,
        statusDeliveredValidation,  
        update
    ],
    delete: [orderExists, deleteValidate, destroy]
}