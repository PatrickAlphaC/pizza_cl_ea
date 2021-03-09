const createRequest = require('./index.js').createRequest
const { exec } = require("child_process")
// const node_dominos = require('../node-dominos-pizza-api').Address
// import { Order, Customer, Item, Payment, NearbyStores } from '../node-dominos-pizza-api/index.js'

const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = process.env.EA_PORT || 8080

app.use(bodyParser.json())

app.post('/', (req, res) => {
  console.log('POST Data: ', req.body)
  createRequest(req.body, (status, result) => {
    console.log('Result: ', result)
    res.status(status).json(result)
  })
})

app.listen(port, () => console.log(`Listening on port ${port}!`))
