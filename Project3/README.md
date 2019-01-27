# Project 3
## RESTful Web API with HAPIJS Web Service Framework
 
In this project a HAPIJS webservice has been created with the REST APIs for the Private Blockchain.

## Installation Instructions
Open a command windows that has node.js installed.
Copy the project files into a folder.
Run `npm -install` to reload the required components

This will install LevelDb, Crypto-js, HAPI, and HAPI BOOM

After installations completes start the webserver.
Run `node app.js`

## REST API Endpoints
Three endpoints have been created for adding a block, getting a block by height and initializing mock data for testing. CURL examples have been provided.

#### GET block and existing block from the block chain
http://localhost:8000/block/{block height}

`curl -X GET \
  http://localhost:8000/block/{block height} \`


#### POST a new block to the blockchain
http://localhost:8000/block/

`curl -X POST \
  http://localhost:8000/block \
  -H 'Content-Type: application/json' \
  -d '{
      "body": "Testing block with test string data"
}'`


#### POST to initialize the mock data
http://localhost:8000/api/initmockdata/

`curl -X POST http://localhost:8000/api/initmockdata \`


## Steps to follow for testing 
Initialize the mock data

Get block 0 to see the genesis block

Get block 5 to see a mock data block

Add a new block.  Take note of the block height from the response.

Get the newly added block.

