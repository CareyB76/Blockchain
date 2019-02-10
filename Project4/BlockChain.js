/* ===== Level Database ====================================
|  Learn more:   |
|  =========================================================*/
const level = require('level');
const blockChainDB = './chaindata';
const db = level(blockChainDB);
const hex2ascii = require('hex2ascii');
/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/
const SHA256 = require('crypto-js/sha256');
const BlockClass = require('./Block.js');

class Blockchain{
  addBlock(block) {
    let self = this;
    return new Promise(function (resolve, reject) {
        block.time = new Date().getTime().toString().slice(0, -3);
        self.getBlockHeight().then((currentHeight) => {
            if (currentHeight ===-1)
            {
               self.addGenesisBlock().then (()=>{
                 self.addBlock(block).then ((newBlock)=>{resolve(newBlock)});
               });
            }
            block.height = currentHeight + 1;
            self.getBlock(currentHeight).then((previousBlock) => {
                block.previousBlockHash = previousBlock.hash;
                block.hash = SHA256(JSON.stringify(block)).toString();
            }).then(function () {
                if (block.body.star && block.body.star.story)
                {
                    block.body.star.story = new Buffer.from(block.body.star.story).toString('hex');
                }
                const blockjson = JSON.stringify(block).toString();
                db.put(block.height, blockjson, function (err) {
                if (err) {
                    reject(err);
                }
                resolve(block);
              });
            });
        });
    });
  }

  addGenesisBlock ()
  {
    return new Promise (function (resolve,reject) {
      const gensisblock = new BlockClass.Block("First block in the chain - Genesis block")
      gensisblock.height = 0;
      gensisblock.hash = SHA256(JSON.stringify(gensisblock)).toString();
      const blockString = JSON.stringify(gensisblock).toString();
      db.put(0, blockString, function (err) {
        if (err) {
            reject(err);
        }
        resolve(gensisblock);
      });
    });
  }

  getBlockHeight() {
    let returnHeight = -1;
    return new Promise(function (resolve, reject) {
        db.createReadStream()
          .on('data', function (data) 
          {
              const block = JSON.parse(data.value);
              if (returnHeight < block.height) 
              {
                returnHeight = block.height;
              }
          })
          .on('error', function (err) 
          {
              reject(err);
          })
          .on('close', function () 
          {
              resolve(returnHeight);
          });
    })
  }

  getBlock(height){
    return new Promise(function (resolve, reject) {
        db.createReadStream()
          .on('data', function (data) 
          {
              const block = JSON.parse(data.value);
              if (height == block.height) 
              {
                if (block.body.star && block.body.star.story)
                {
                    block.body.star.storyDecoded = hex2ascii(block.body.star.story);
                }
                resolve (block);
              }
          })
          .on('error', function (err) 
          {
              reject(err);
          })
    })  
  }

  getBlockByHash(hash){
    return new Promise(function (resolve, reject) {
      db.createReadStream()
        .on('data', function (data) 
        {
            const block = JSON.parse(data.value);
            if (hash == block.hash) 
            {
              if (block.body.star && block.body.star.story)
              {
                  block.body.star.storyDecoded = hex2ascii(block.body.star.story);
              }
              resolve(block);
            }
        })
        .on('error', function (err) 
        {
            reject (err);
        })
        .on('close', function (err) 
        {
            reject ("Not found");
        })
    });
  }

  getBlocksByWallet(walletAddress){
    return new Promise ((resolve,reject)=>{
      let retBlocks = [];
      db.createReadStream()
        .on('data', function (data) 
        {
            const block = JSON.parse(data.value);
            if (walletAddress == block.body.address) 
            {
              if (block.body.star && block.body.star.story)
              {
                  block.body.star.storyDecoded = hex2ascii(block.body.star.story);
              }
              retBlocks.push(block);
            }
        })
        .on('error', function (err) 
        {
            reject (err);
        })
        .on('close', function () {
          resolve (retBlocks);
      });
    });
  }

  validateBlock(height) {
      return new Promise((resolve, reject) => {
          this.getBlock(height).then((block) => {
              const currentHash = block.hash;
              block.hash = '';  //Remove so not included in the hashing
              const newHash = SHA256(JSON.stringify(block)).toString();
              const result = currentHash === newHash;
              const retVal = {
                              height:height,
                              result:result
                            };
              resolve(retVal);
          })
      });
  }

  validateChainBlock(height) {
    let self = this;
    var retval = {height:height, result:false}; //default to false;
    return new Promise((resolve, reject) => {
        this.getBlock(height).then((block) => {
            if (height == 0)
            {   
                if (block.previousBlockHash =="")
                {
                  //correct for genesis block.  The previous block hash is empty
                  retval = {height:height,result:true};
                } 
                resolve (retval);
            }
            else 
            {
              this.getBlock(height-1).then((prevblock) => {
                if (prevblock.hash == block.previousBlockHash)
                {
                  //correct the current block previous hash is equal to the previous block hash
                  retval = {height:height, result:true};
                }
                resolve (retval);
              });
            }
        })
    });
}

  validateChain(){
    let errorsLog = [];
    let self = this;
    return new Promise ((resolve,reject)=>{
      self.getBlockHeight().then ((currentHeight) => 
      {
        let promisesblocks = [];
        let promisesblockchain = [];
        for (var i = currentHeight; i>=0; i--) {
          promisesblocks.push (self.validateBlock(i));
          promisesblockchain.push (self.validateChainBlock(i));
        }

        Promise.all(promisesblocks).then ((values) =>{
          values.forEach(function(element) {
            console.log("Block Hash Validation at height", element.height, element.result?"is valid":"is not valid");
            if (!element.result)
            {
              errorsLog.push (element);
            }
          });
        });
        Promise.all(promisesblockchain).then ((values) =>{
          values.forEach(function(element) {
            console.log("Block Chain Validation at height", element.height, element.result?"is valid":"is not valid");
            if (!element.result)
            {
              errorsLog.push (element);
            }
          });
          resolve (errorsLog);
        });
      });
    });
  }
}
module.exports.Blockchain = Blockchain;