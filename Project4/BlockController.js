const BlockChainClass = require('./BlockChain.js');
const BlockClass = require('./Block.js');
const MempoolClass = require('./mempool.js');
const Boom = require('boom');

/**
 * Controller Definition to encapsulate routes to work with blocks
 */
class BlockController {

    /**
     * Constructor to create a new BlockController, you need to initialize here all your endpoints
     * @param {*} server 
     */
    constructor(server) {
        this.server = server;
        this.blocks = [];
        this.blockChain = new BlockChainClass.Blockchain();
        this.mempool = new MempoolClass.Mempool ();
        this.getBlockByIndex();
        this.getBlockByHash();
        this.getBlocksByWallet();
        this.postNewBlock();
        this.postStarBlock();
        this.postValidatioRequest();
        this.postInitializeMockData();
        this.postSignatureValidation();
    }

    /**
     * Implement a GET Endpoint to retrieve a block by index, url: "/api/block/:index"
     */
    getBlockByIndex() {
        this.server.route({
            method: 'GET',
            path: '/block/{index}',
            handler: (request, h) => {
                return new Promise ((resolve,reject) => {
                    const blockIndex = request.params.index ?
                        encodeURIComponent(request.params.index) : -1;
                    if (isNaN(blockIndex)) { 
                        reject(Boom.badRequest());
                    } else {
                        this.blockChain.getBlockHeight().then((chainHeight)=>{
                            if (blockIndex <=chainHeight && blockIndex >-1)
                            {
                                this.blockChain.getBlock(blockIndex).then ((block)=>{
                                    resolve(JSON.stringify(block));
                                });
                            } else {
                            reject(Boom.badRequest());
                            }
                        });
                    }
                });
            }
        });
    }
    /**
     * Implement a POST Endpoint to add a new Block, url: "/api/block"
     */
    postNewBlock() {
        this.server.route({
            method: 'POST',
            path: '/api/block',
            handler: (request, h) => {
                return new Promise ((resolve,reject)=>{
                    var ctype = request.headers["content-type"];
                    if (!ctype || ctype.indexOf("application/json") !== 0) {
                        reject (Boom.badRequest("Wrong content-type. Required \"application/json\""));
                    }
                    const blockdata = request.payload.body;
                    if (typeof blockdata === "undefined" || !blockdata || blockdata.trim().length === 0) { 
                        reject(Boom.badRequest("Bad Request expecting {\"data\":\"block body\"}"));
                    } else {
                        this.blockChain.addBlock(new BlockClass.Block(blockdata)).then ((newblock)=>{
                            resolve (JSON.stringify(newblock));
                        });
                    }
                });
            }
        });
    }

    postInitializeMockData() {
        this.server.route({
            method: 'POST',
            path: '/api/initmockdata',
            handler: (request, h) => {
                console.log ("Initializing Mock data");
                return new Promise ((resolve,reject)=>{
                    this.blockChain.getBlockHeight().then((chainHeight)=>{
                        if (chainHeight ===-1)
                        {    
                            this.initializeMockData(0).then (()=>{
                                resolve ("Success loaded mock data");
                            });
                        }
                        else 
                        {
                            resolve ("Initialization Complete", chainHeight);
                        }
                    });
                });
            }
        })
    }

    /**
     * Helper method to inizialized a Mock dataset, start at 0 and adds 10 Blocks to the block chain recursively
     */
    initializeMockData(itemCount) {
        let self = this;
        return new Promise((resolve, reject) => {
                if (itemCount < 10) {
                    const newBlock = new BlockClass.Block(`Test Data #${itemCount}`);
                    self.blockChain.addBlock(newBlock).then(() => {
                        resolve(self.initializeMockData(itemCount + 1).then(() => {
                            resolve ("Success");
                        }));
                    });
                } else {
                    resolve ("Success");
                }

        });
    }

    getBlockByHash() {
        this.server.route({
            method: 'GET',
            path: '/stars/hash:{hash}',
            handler:  (request, h) => {
                return new Promise ((resolve,reject)=>{
                    const hash = request.params.hash;
                    console.log ("Hash to find:" ,hash);
                    if (!hash) { 
                        reject( Boom.badRequest("You must provide the hash parameter"));
                    } else {
                        this.blockChain.getBlockByHash(hash).then ((block) =>{
                            resolve(JSON.stringify(block));            
                        }).catch ((message)=> {reject( Boom.badRequest("Block not found check hash parameter"))});
                    }
                })
            }
        });
    }
    
	getBlocksByWallet() {
        this.server.route({
            method: 'GET',
            path: '/stars/address:{address}',
            handler: (request, h) => {
                return new Promise ((resolve,reject)=>{
                    const address = request.params.address;
                    if (!address) { 
                        return Boom.badRequest("You must provide the wallet address");
                    } else {
                        this.blockChain.getBlocksByWallet(address).then ((blocks)=>{
                            resolve(JSON.stringify(blocks));
                        }).catch ((message)=> {reject( Boom.badRequest("Blocks not found check wallet address parameter"))});
                    }
                });
            }
		});
    }

	isValidStarBlock(block){
		let retVal = false;
		if (block)
		{
			if (block.address && block.address.trim().length>0)
			{
				if (block.star && block.star.story && block.star.story.length>0 )
				{
					if (block.star.ra && block.star.ra.length>0)
					{
						if (block.star.dec && block.star.dec.length>0 )
						{
							retVal = true;
						}
					}
				}
			}
		}
		return retVal;
    }
    
    postStarBlock() {
        this.server.route({
            method: 'POST',
            path: '/block',
            handler: (request, h) => {
                return new Promise ((resolve,reject)=>{
                    var ctype = request.headers["content-type"];
                    if (!ctype || ctype.indexOf("application/json") !== 0) {
                        reject (Boom.badRequest("Wrong content-type. Required \"application/json\""));
                    }
                    const body = request.payload;
                    const address = request.payload.address;
                    if (!this.isValidStarBlock(body)) { 
                        reject (Boom.badRequest("Invalid star"));
                    } else {
                        if (this.mempool.isValidWalletRequest(address))
                        {
                            this.blockChain.addBlock(new BlockClass.Block(body)).then ((result)=>{
                                this.mempool.removeValidWalletRequest(address);
                                resolve(result);
                            });
                        } else {
                            reject(Boom.badRequest("Invalid or expired request"));
                        }
			        }
                });
            }
        })
    }

    postValidatioRequest() {
        this.server.route({
            method: 'POST',
            path: '/requestvalidation',
            handler: (request, h) => {
                return new Promise ((resolve,reject)=>{
                    var ctype = request.headers["content-type"];
                    if (!ctype || ctype.indexOf("application/json") !== 0) {
                        reject (Boom.badRequest("Invalid content type. Please use \"application/json\""));
                    }
                    const address = request.payload.address;
                    if (!address || address.length === 0) {
                        reject(Boom.badRequest("Bad Request expecting {\"address\":\"wallet address\"}")); 
                    } 
                    resolve (JSON.stringify(this.mempool.requestValidation(address)));
                });
            }
        })
    }
    
	postSignatureValidation () {
        this.server.route({
            method: 'POST',
            path: '/message-signature/validate',
            handler: (request, h) => {
                var self = this;
                return new Promise ((resolve,reject)=>{
                    var ctype = request.headers["content-type"];
                    if (!ctype || ctype.indexOf("application/json") !== 0) {
                        reject (Boom.badRequest("Invalid content type. Please use \"application/json\""));
                    }
                    const sig = request.payload.signature;
                    const walletAddress = request.payload.address;
                    
                    if (!walletAddress || walletAddress.length === 0) {
                        reject(Boom.badRequest("Bad Request expecting {\"address\":\"block body\"}")); 
                    } else {
                        console.log ("here here");
                        self.mempool.validateWalletRequest(walletAddress,sig).then ((validationResult)=>{
                            resolve(JSON.stringify(validationResult));
                        });
                    }
                });
            }
        })
	}

}

/**
 * Exporting the BlockController class
 * @param {*} server 
 */
module.exports = (server) => { return new BlockController(server);}