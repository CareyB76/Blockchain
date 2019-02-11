
const bitcoinMessage = require('bitcoinjs-message');
const requestsWindowTime = 5*60*1000;

class Mempool {
	constructor(){
		this.validationRequests = {};
		this.validRequests = {};
        this.timeoutRequests = {};
	}

	requestValidation (walletAddress){
        let request = this.validationRequests[walletAddress];
        if (!request)
        {
            this.timeoutRequests[walletAddress]=setTimeout(()=>{
                this.deleteValidationRequest(walletAddress) 
            }, requestsWindowTime);
            request = new ValidationRequest(walletAddress);
            this.validationRequests[walletAddress] = request;
        }
        request.validationWindow = request.ValidationWindow();
        return request;
  	}
	
	validateWalletRequest (walletAddress, signature){
        return new Promise ((resolve, reject) => {
            const request = this.validationRequests[walletAddress];
            if (!request)
            {
                reject(null);
            }
            this.verifyMessageSignature(request.walletAddress,request.message,signature). then ((addressRquestResult)=>{
                const validationResult = {
                    registerStar:addressRquestResult,
                    status : {
                        address:request.walletAddress,
                        requestTimeStamp:request.requestTimeStamp,
                        message:request.message,
                        messageSignature:addressRquestResult,
                        validationWindow:request.ValidationWindow()
                    }
                };
                if (addressRquestResult)		
                {
                    this.validRequests[walletAddress] = validationResult;
                    delete this.validationRequests[walletAddress];
                    delete this.timeoutRequests[walletAddress];
                }
                resolve (validationResult);
            });
        });
    }

    deleteValidationRequest(walletAddress) {
		delete this.validationRequests[walletAddress];
        delete this.validRequests[walletAddress];
        delete this.timeoutRequests[walletAddress];
    }
    
	verifyMessageSignature(address,message,signature) {
        return new Promise ((resolve, reject) => {
			const verified = bitcoinMessage.verify(message, address, signature); 
            resolve (verified);
		});
    }
    
	isValidWalletRequest (walletAddress) {
        let request = this.validRequests[walletAddress];
        if (request) {
            return true;
        }
        return false;
    }

	removeValidWalletRequest(walletAddress){
        delete this.validRequests[walletAddress];
        return (true);
  	}
}

class ValidationRequest {
	constructor(address) {
        this.walletAddress = address;
        this.requestTimeStamp = parseInt(new Date().getTime().toString().slice(0,-3));
		this.message= this.walletAddress.concat(":", this.requestTimeStamp, ":starRegistry"); 
		
    }
    
	ValidationWindow () {
		const elapsed = (new Date().getTime().toString().slice(0,-3)) - this.requestTimeStamp;
		return (requestsWindowTime/1000) - elapsed;
	}
}

module.exports.Mempool = Mempool;
