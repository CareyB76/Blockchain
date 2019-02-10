# Project 4
## Star Notary Service running on HAPIJS Web Service Framework
 
In this project is a HAPIJS webservice has been created with the REST APIs for the Star Notary Service.

## Installation Instructions
Open a command windows that has node.js installed.
Copy the project files into a folder.
Run `npm -install` to reload the required components

This will install bitcoinjs-message, crypto-js, hapi, hapi-boom-decorators, hex2ascii, level database libraries

After installations completes start the webserver.
Run `node app.js`

## REST API Endpoints
Endpoints have been created for managing the star notary service.

## GET Endpoints:

#### GET block and existing block from the block chain
http://localhost:8000/block/[height]

`curl -X GET \
  http://localhost:8000/block/[height] \`


#### GET block by block hash
http://localhost:8000/stars/hash:[Block Hash Here]

`curl -X GET \
  http://localhost:8000/stars/hash:[Block Hash Here] \`

#### GET blocks by Wallet address
Return all the star blocks owned by an wallet address.  Returns array of blocks
http://localhost:8000/stars/address:[Wallet address Here]

`curl -X GET \
  http://localhost:8000/stars/address:[Wallet address Here] \`


## POST Endpoints:

#### Request Validation to add a star to the star notary.  
This is the first step to adding a new star.
Record the message to put into your Electrum message for signing.  
http://localhost:8000/requestvalidation

`curl -X POST \
  http://localhost:8000/requestvalidation \
  -H 'Content-Type: application/json' \
  -d '{
	"address":"your wallet address goes here"
}'`

####Validate your request with your message signature from Electrum wallet.
http://localhost:8000/message-signature/validate

`curl -X POST \
  http://localhost:8000/message-signature/validate \
  -H 'Content-Type: application/json' \
  -d '{
	"address":"wallet address goes here",
	"signature":"signature from electrum message signing"
}'`


#### POST a new Star block to the blockchain
Only after you have successfully complete the previous request and validate steps you can add a star to the notary.
http://localhost:8000/block/

`curl -X POST \
  http://localhost:8000/block \
  -H 'Content-Type: application/json' \
  -d '{
    "address": "Your wallet address here",
    "star": {
                "dec": "69 69 56.9",
                "ra": "16h 29m 1.0s",
                "story": "Bright star in sky"
   }
}'`


#### POST to initialize the mock data
http://localhost:8000/api/initmockdata/

`curl -X POST http://localhost:8000/api/initmockdata \`


## Steps to follow for testing the Star Notary Service.
Required to have Electrum installed with a legacy wallet address available to sign messages

## Testing Steps
Post a validation request with your wallet address
Using the message returned, sign the message with your electrum wallet and record the signature
Post to verify the message signature.  This step must be completed in five minutes.
Post a new Star block.

Record the block hash and height.
Get the Block by hash
Get the Blocks by wallet address
Get the Block by Height