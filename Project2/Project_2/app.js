//
const BlockChainClass = require('./BlockChain.js');
const BlockClass = require('./block.js');

const chain = new BlockChainClass.Blockchain();
chain.getBlockHeight().then((height)=>{console.log ("Current Block Height:",height)});

(function theLoop(i) {
    setTimeout(function () {

        let blockTest = new BlockClass.Block("Test Block - " + (i + 1));
        chain.addBlock(blockTest).then((result) => {
            console.log("Added Block: ",result);
            i++;
            if (i < 10) {
                theLoop(i);
            } else {
                chain.validateBlock(2).then ((result)=>{console.log ("Validate Block Result",result.result,result.height)});
                chain.validateChainBlock(1).then ((result)=>{console.log ("Validate Chain Block Result",result.result,result.height)});
                chain.validateChain().then((resulterrors) => {
                    if (resulterrors.length >0)
                    {
                     console.log("Blockchain Errors " ,resulterrors);
                    } else {
                        console.log("Success zero blockchain errors found.");
                    }
                });
            }
        });
    }, 500);
})(0);