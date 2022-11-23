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
 
function hasAllProps(req, res, next){
    const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
    if(!deliverTo){
        next ({
            status: 400,
            message: "Order must include deliverTo"
        })
    } 
    if (!mobileNumber) {
        next({
            status: 400,
            message: "Order must include mobileNumber"
        })
    } 
    if (!dishes) {
        next({
            status: 400,
            message: "Order must include a dish"
        })
    }
    if(!(Array.isArray(dishes) && dishes.length > 0)){
        next({
            status: 400,
            message: "Order must include at least one dish"
        })
    }
    dishes.forEach((dish, i) => {
        if (!Number.isInteger(dish.quantity) || dish.quantity <= 0) {
            next({
              status: 400,
              message: `Dish ${i} must have a quantity that is an integer greater than 0`,
            })
        }
    })
    next()
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
    create: [hasAllProps, create],
    update: [orderExists, hasAllProps, updateValidate, update],
    delete: [orderExists, deleteValidate, destroy]
}