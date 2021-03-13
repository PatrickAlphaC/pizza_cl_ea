const { Requester, Validator } = require('@chainlink/external-adapter')
const fs = require('fs')
const exec = require('child_process').exec
const path = require('path')

// Define custom error scenarios for the API.
// Return true for the adapter to retry.
const customError = (data) => {
    if (data.Response === 'Error') return true
    return false
}

const customParams = {
    random_number: false,
    place_order: false
}

// 92015063487167061781633754907867692445044031125743928571486643870357111455063
// X=0:0.5:1:1.5,Xm=0:0.5:1:1.5,Bq,Xw=0:0.5:1:1.5,C,H,B,Sa,P,S,Du,K,Pm,Ht,F,J,O,Z,Td,R,M,N,Cp,E,G,Si,Rr,Fe,Cs,Xf=0:0.5:1:1.5,Rd
const pizza_sizes = [
    "10SCREEN",
    "12SCREEN",
    "12THIN",
    "PBKIREZA",
    "14SCREEN",
    "14THIN",
    "P16IBKZA",
    "P10IGFZA",
    "P12IPAZA"
]

// times by 5 and have that range define the amount of toppings
const toppings = ["C", "H", "B", "Sa", "P", "S", "Du", "K", "Pm", "Ht", "F", "J", "O", "Z", "Td", "R", "M", "N", "Cp", "E", "G", "Si", "Rr", "Fe", "Cs", "Bq"]
const topping_sizes = [0, 0.5, 1, 1.5, 2]

// these can go from 0 to 1.5
const sauces = ["X", "Xm", "Xw", "Xf"]
const sauce_sizes = [0, 0.5, 1, 1.5]
// 1st 4th is pizza size
// then number of topping per side (1-4)
// then toppings and level of topping
// sauces and amount of sauces
const create_random_pizza = (random_number) => {
    let pizza = { 'options': {}, 'code': {} }
    console.log(random_number)
    let pizza_size = random_number % pizza_sizes.length
    pizza['code'] = pizza_sizes[pizza_size]
    let number_of_toppings_left = Math.round(random_number / 10) % 5
    let number_of_toppings_right = Math.round(random_number / 100) % 5
    let i
    for (i = 0; i < number_of_toppings_left; i++) {
        topping_id = Math.round((random_number / 1000) * i) % toppings.length
        topping_size_id = Math.round((random_number / 10000) * i) % topping_sizes.length
        topping = toppings[topping_id]
        topping_size = topping_sizes[topping_size_id]
        pizza['options'][topping] = { '1/2': topping_size }
    }
    for (i = 0; i < number_of_toppings_right; i++) {
        topping_id = Math.round((random_number / 100000) * i) % toppings.length
        topping_size_id = Math.round((random_number / 1000000) * i) % topping_sizes.length
        topping = toppings[topping_id]
        topping_size = topping_sizes[topping_size_id]
        pizza['options'][topping] = { '2/2': topping_size }
    }
    for (i = 0; i < sauces.length; i++) {
        sauce_size = Math.round((random_number / 10000000) * i) % sauce_sizes.length
        sauce = Math.round((random_number / 100000000) * i) % sauces.length
        pizza['options'][sauces[sauce]] = { '1/1': sauce_sizes[sauce_size] }
    }
    console.log("pizza created!")
    return (pizza)
}

const build_and_send_order = async (pizza, place_order) => {
    console.log("building...")

    const dominos = await import('dominos')
    Object.assign(global, dominos)

    const pizza_pie = new Item(pizza)
    let address = process.env.DELIVER_ADDRESS
    const customer = new Customer(
        {
            //this could be an Address instance if you wanted 

            address: address,
            firstName: 'Patrick',
            lastName: 'Collins',
            //where's that 555 number from?
            phone: process.env.PHONE_NUMBER,
            email: process.env.EMAIL
        }
    )
    console.log("created customer...")

    let storeID = 3755
    let distance = 100
    // find the nearest store
    // const nearbyStores = await new NearbyStores(customer.address)
    // // console.log(nearbyStores)
    // //inspect nearby stores
    // //console.log('\n\nNearby Stores\n\n')
    // console.dir(nearbyStores, { depth: 5 })


    // // get closest delivery store
    // for (const store of nearbyStores.stores) {
    //     //inspect each store
    //     //console.dir(store,{depth:3});

    //     if (
    //         //we check all of these because the API responses seem to say true for some
    //         //and false for others, but it is only reliably ok for delivery if ALL are true
    //         //this may become an additional method on the NearbyStores class.
    //         store.IsOnlineCapable
    //         && store.IsDeliveryStore
    //         && store.IsOpen
    //         && store.ServiceIsOpen.Delivery
    //         && store.MinDistance < distance
    //     ) {
    //         distance = store.MinDistance
    //         storeID = store.StoreID
    //         //console.log(store)
    //     }
    // }

    // if (storeID == 0) {
    //     throw ReferenceError('No Open Stores')
    // }

    console.log(storeID, distance)


    //create
    const order = new Order(customer)

    // console.log('\n\nInstance\n\n');
    // console.dir(order,{depth:0});

    order.storeID = storeID
    // console.log(order.storeId)
    // add pizza_pie
    order.addItem(pizza_pie)
    //validate order
    console.log("added pizza to order")

    await order.validate()
    console.log("order validated")

    // console.log('\n\nValidate\n\n');
    //console.dir(order,{depth:3});
    //price order
    const price = await order.price()
    //console.log(price)
    console.log("order priced")

    // console.log('\n\nPrice\n\n');
    // console.dir(order,{depth:0});
    const tipAmount = 6

    //grab price from order and setup payment
    const myCard = new Payment(
        {
            amount: order.amountsBreakdown.customer,

            // dashes are not needed, they get filtered out
            number: process.env.CREDIT_CARD_NUMBER,

            //slashes not needed, they get filtered out
            expiration: process.env.CREDIT_CARD_EXPIRE,
            securityCode: process.env.CREDIT_CARD_SECURITY_CODE,
            postalCode: process.env.CREDIT_CARD_POSTAL_CODE,
            tipAmount: tipAmount
        }
    )
    console.log("payment added")

    order.payments.push(myCard)

    console.log(order)
    if (place_order !== 'true') {
        return 200
    } else {
        try {
            await order.place()
            console.log('\n\nPlaced Order\n\n')
            console.dir(order, { depth: 3 })
        } catch (err) {
            console.trace(err)

            //inspect Order Response to see more information about the 
            //failure, unless you added a real card, then you can inspect
            //the order itself
            console.log('\n\nFailed Order Probably Bad Card, here is order.priceResponse the raw response from Dominos\n\n')
            console.dir(
                order.placeResponse,
                { depth: 5 }
            )
            return 400
        }
    }
    return 200
}


const createRequest = (input, callback) => {
    // The Validator helps you validate the Chainlink request data
    console.log("request started")

    const validator = new Validator(callback, input, customParams)
    const jobRunID = validator.validated.id
    const random_number = validator.validated.data.random_number
    const place_order = validator.validated.data.place_order || 'false'
    console.log(`Parameters are ${random_number} and ${place_order}`)

    let callback_object
    let status_code
    let pizza = create_random_pizza(random_number)
    let result = "Fake Order Placed"
    if (place_order === 'true') {
        result = "Order Placed!"
    }
    build_and_send_order(pizza, place_order).then(response => {
        status_code = response
        callback_object = {
            "jobRunID": `${jobRunID}`,
            "data": {
                "place_order": place_order,
                "result": result
            },
            "statusCode": status_code,
            "result": result,
            "status": status_code
        }
        console.log("calling back...")

        // console.log(callback_object)
        callback(callback_object.status, Requester.success(jobRunID, callback_object))
    }
    ).catch(error => {
        status_code = 400
        callback_object = {
            "jobRunID": `${jobRunID}`,
            "data": {
                "place_order": place_order
            },
            "statusCode": status_code,
            "result": "Issue placing order",
            "status": status_code
        }
    })
}

// This is a wrapper to allow the function to work with
// GCP Functions
exports.gcpservice = (req, res) => {
    createRequest(req.body, (statusCode, data) => {
        res.status(statusCode).send(data)
    })
}

// This is a wrapper to allow the function to work with
// AWS Lambda
exports.handler = (event, context, callback) => {
    createRequest(event, (statusCode, data) => {
        callback(null, data)
    })
}

// This is a wrapper to allow the function to work with
// newer AWS Lambda implementations
exports.handlerv2 = (event, context, callback) => {
    createRequest(JSON.parse(event.body), (statusCode, data) => {
        callback(null, {
            statusCode: statusCode,
            body: JSON.stringify(data),
            isBase64Encoded: false
        })
    })
}

// This allows the function to be exported for testing
// or for running in express
module.exports.createRequest = createRequest
