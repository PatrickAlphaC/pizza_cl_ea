
const main = async () => {
    const dominos = await import('dominos')

    console.log('wtf')
    //importing variables into the global like this just allows us to use the same code
    //from the ESM implementation for the commonJS implementation
    //This is the same as an ESM import of
    //import {Address,NearbyStores,Store,Menu,Customer,Item,Image,Order,Payment,Tracking,urls,IsDominos} from 'dominos'

    Object.assign(global, dominos)

    //need to await dominos promise completion
    //because ES6 is async by nature
    start()
}

function start() {
    //any example code would work as-is in here because the dominos guts are imported now.

    const n = '\n'
    let pizza_file = process.argv[2] || 'pizza_order.json'
    let place_order = process.argv[3] || 'false'

    if (pizza_file[0] === '~') {
        pizza_file = path.join(process.env.HOME, pizza_file.slice(1))
    } else if (pizza_file[0] == '.') {
        pizza_file = "../../" + pizza_file
    } else {
        pizza_file = pizza_file
    }
    let pizza_pie
    fs.readFile(pizza_file, 'utf8', (err, jsonString) => {
        if (err) {
            console.log("File read failed:", err)
            return
        }
        console.log('File data:', jsonString)
        pizza_pie = jsonString
    })
    // let pizza_pie = JSON.stringify(pizza_order)
    // console.log(pizza_order)
    //extra cheese thin crust pizza
    const pizza = new Item(pizza_pie)
    console.log(pizza)
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

    let storeID = 3755
    let distance = 100
    // find the nearest store
    const nearbyStores = await new NearbyStores(customer.address)
    // console.log(nearbyStores)
    //inspect nearby stores
    //console.log('\n\nNearby Stores\n\n')
    console.dir(nearbyStores, { depth: 5 })


    // get closest delivery store
    for (const store of nearbyStores.stores) {
        //inspect each store
        //console.dir(store,{depth:3});

        if (
            //we check all of these because the API responses seem to say true for some
            //and false for others, but it is only reliably ok for delivery if ALL are true
            //this may become an additional method on the NearbyStores class.
            store.IsOnlineCapable
            && store.IsDeliveryStore
            && store.IsOpen
            && store.ServiceIsOpen.Delivery
            && store.MinDistance < distance
        ) {
            distance = store.MinDistance
            storeID = store.StoreID
            //console.log(store)
        }
    }

    if (storeID == 0) {
        throw ReferenceError('No Open Stores')
    }

    console.log(storeID, distance)


    //create
    const order = new Order(customer)

    // console.log('\n\nInstance\n\n');
    // console.dir(order,{depth:0});

    order.storeID = storeID
    // console.log(order.storeId)
    // add pizza
    order.addItem(pizza)
    //validate order
    await order.validate()

    // console.log('\n\nValidate\n\n');
    //console.dir(order,{depth:3});

    //price order
    const price = await order.price()
    //console.log(price)

    // console.log('\n\nPrice\n\n');
    // console.dir(order,{depth:0});
    const tipAmount = 8
    //grab price from order and setup payment
    const myCard = new Payment(
        {
            amount: order.amountsBreakdown.customer + tipAmount,

            // dashes are not needed, they get filtered out
            number: process.env.CREDIT_CARD_NUMBER,

            //slashes not needed, they get filtered out
            expiration: process.env.CREDIT_CARD_EXPIRE,
            securityCode: process.env.CREDIT_CARD_SECURITY_CODE,
            postalCode: process.env.CREDIT_CARD_POSTAL_CODE,
            tipAmount: tipAmount
        }
    )
    order.payments.push(myCard)
}

main()

