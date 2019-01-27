const BlockChainClass = require('./BlockChain.js');
const BlockClass = require('./Block.js');
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
        this.getBlockByIndex();
        this.postNewBlock();
        this.postInitializeMockData();
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
                                this.blockChain.getBlock(blockIndex).then ((newBlock)=>{
                                    resolve(JSON.stringify(newBlock));
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
            path: '/block',
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
}

/**
 * Exporting the BlockController class
 * @param {*} server 
 */
module.exports = (server) => { return new BlockController(server);}