# Pizza Chainlink External Adapter

This repo is for demo purposes only and is filled with Garlic Bready Spaghetti code. If you know how to make this better, feel free to make a PR :D

Right now, it's a bit hardcoded to a dominos in Belmont. You'll need to uncomment a section in order_pizza.js to search for nearby pizza joints near you. 

THIS NEEDS TO BE nodejs v14!!

## Creating the adapter

```bash
git clone https://github.com/PatrickAlphaC/pizza_cl_ea
```

Enter into the newly-created directory

```bash
cd pizza_cl_ea
```

You can remove the existing git history by running:

```bash
rm -rf .git
```

FYI, this is about as spaghetti as spaghetti code gets. 

See [Install Locally](#install-locally) for a quickstart

## Input Params

- `random_number`: Random Number created by VRF to randomize the pizza
- `place_order`: If `true` it will place the order

## Environment Variables

- `CREDIT_CARD_EXPIRE=MM/YY`
- `CREDIT_CARD_NUMBER=####-####-####-####`
- `CREDIT_CARD_POSTAL_CODE=#####`
- `CREDIT_CARD_SECURITY_CODE=###`
- `DELIVERY_ADDRESS=address_here`
- `PHONE_NUMBER=###-###-####`
- `EMAIL=***********`


## Input 

```bash
curl -X POST -H "content-type:application/json" "http://localhost:8080/" --data '{ "id": 0, "data": { "random_number":32456743214256 } }'
```

## Output

```json
{
  "jobRunID":0,
  "data":{
    "order_placed":"false",
    "result":"Fake Order Placed"
  },
  "result":"Fake Order Placed",
  "statusCode":200
}
```

## Install Locally

Install dependencies:

```bash
yarn
```

### Test

Nope, tests suck here. 

Natively run the application (defaults to port 8080):

### Run

```bash
yarn start
```

## Call the external adapter/API server

```bash
curl -X POST -H "content-type:application/json" "http://localhost:8080/" --data '{ "id": 0, "data": { "random_number":32456743214256 } }'
```

## Docker

If you wish to use Docker to run the adapter, you can build the image by running the following command:

```bash
docker build . -t external-adapter
```

Then run it with:

```bash
docker run -p 8080:8080 -it external-adapter:latest
```

## Serverless hosts

After [installing locally](#install-locally):

### Create the zip

```bash
zip -r external-adapter.zip .
```

### Install to AWS Lambda

- In Lambda Functions, create function
- On the Create function page:
  - Give the function a name
  - Use Node.js 12.x for the runtime
  - Choose an existing role or create a new one
  - Click Create Function
- Under Function code, select "Upload a .zip file" from the Code entry type drop-down
- Click Upload and select the `external-adapter.zip` file
- Handler:
    - index.handler for REST API Gateways
    - index.handlerv2 for HTTP API Gateways
- Add the environment variable (repeat for all environment variables):
  - Key: API_KEY
  - Value: Your_API_key
- Save

#### To Set Up an API Gateway (HTTP API)

If using a HTTP API Gateway, Lambda's built-in Test will fail, but you will be able to externally call the function successfully.

- Click Add Trigger
- Select API Gateway in Trigger configuration
- Under API, click Create an API
- Choose HTTP API
- Select the security for the API
- Click Add

#### To Set Up an API Gateway (REST API)

If using a REST API Gateway, you will need to disable the Lambda proxy integration for Lambda-based adapter to function.

- Click Add Trigger
- Select API Gateway in Trigger configuration
- Under API, click Create an API
- Choose REST API
- Select the security for the API
- Click Add
- Click the API Gateway trigger
- Click the name of the trigger (this is a link, a new window opens)
- Click Integration Request
- Uncheck Use Lamba Proxy integration
- Click OK on the two dialogs
- Return to your function
- Remove the API Gateway and Save
- Click Add Trigger and use the same API Gateway
- Select the deployment stage and security
- Click Add

### Install to GCP

- In Functions, create a new function, choose to ZIP upload
- Click Browse and select the `external-adapter.zip` file
- Select a Storage Bucket to keep the zip in
- Function to execute: gcpservice
- Click More, Add variable (repeat for all environment variables)
  - NAME: API_KEY
  - VALUE: Your_API_key
