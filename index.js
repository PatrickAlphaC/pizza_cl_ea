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

// Define custom parameters to be used by the adapter.
// Extra parameters can be stated in the extra object,
// with a Boolean value indicating whether or not they
// should be required.
const customParams = {
    random_number: false,
    place_order: false,
    tmp_file: false
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
const create_order = (random_number) => {
    let pizza = { 'options': {}, 'code': {} }
    console.log(pizza)
    console.log(random_number)
    let pizza_size = random_number % pizza_sizes.length
    pizza['code'] = pizza_sizes[pizza_size]
    console.log(pizza)
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
    return (pizza)
}

const createRequest = (input, callback) => {
    // The Validator helps you validate the Chainlink request data
    const validator = new Validator(callback, input, customParams)
    const id = validator.validated.id
    const random_number = validator.validated.data.random_number
    const place_order = validator.validated.data.place_order || 'false'
    const tmp_file = validator.validated.data.tmp_file || './'

    let order_placed
    let status_code = 200
    let pizza = create_order(random_number)
    console.log(pizza)
    let file_name = tmp_file + 'pizza_order.json'
    if (file_name[0] === '~') {
        file_name = path.join(process.env.HOME, file_name.slice(1))
    }
    fs.writeFile(file_name, JSON.stringify(pizza), function (err) {
        if (err) throw err
        console.log('Saved!')
    })
    exec(`node ./node-dominos-pizza-api/example/order_pizza.js ${file_name} ${place_order}`, (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`)
            order_placed = "Issue placing order"
            status_code = 400
            return
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`)
            order_placed = "Issue placing order"
            status_code = 400
            return
        }
        console.log(`stdout: ${stdout}`)
    })

    if (order_placed !== 'Issue placing order') {
        if (place_order !== 'true') {
            order_placed = 'Fake Order Placed'
        } else {
            order_placed = 'Real Order Placed'
        }
    }

    callback_object = {
        "jobRunID": `${id}`,
        "data": {
            "order_placed": order_placed
        },
        "statusCode": status_code,
        "result": order_placed
    }
    callback(status_code, callback_object)
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
