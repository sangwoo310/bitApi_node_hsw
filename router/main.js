var CONSTS = require("../const/accetInfoConst"); 

function fnAcceptIPCHK(ip) {
    if(CONSTS.ACCEPT_IP.API1 == ip || 
       CONSTS.ACCEPT_IP.API2 == ip ||
       CONSTS.ACCEPT_IP.API3 == ip ||
       CONSTS.ACCEPT_IP.LAPI1 == ip ||
       CONSTS.ACCEPT_IP.LAPI2 == ip ||
       CONSTS.ACCEPT_IP.LAPI3 == ip ||
       CONSTS.ACCEPT_IP.CME == ip ||
       CONSTS.ACCEPT_IP.LOCAL == ip) {
       return true;
     } else {
       return false;
     }
}

function fnGetIP(req) {
    var IPFromRequest=req.connection.remoteAddress;
    var indexOfColon = IPFromRequest.lastIndexOf(':');
    var ipv4 = IPFromRequest.substring(indexOfColon+1,IPFromRequest.length);
    return ipv4;
}

function fnLogEvent(fnName, parameter, state, result){
  var date = new Date();
  var log = {};

  log.function = fnName;
  log.time = date.toString().substring(0,24);
  log.parameter = parameter;
  log.state = state; //err || success
  log.result = result;
  console.log("%j",log);
}

function fnSendTransactionResult(err,_res,type,param) {
    var msg = "";
            if (err) {
                fnLogEvent(type,param,"error",JSON.stringify(err));
            } else if (_res.error) {
                var code = JSON.stringify(_res.error.code);
                if(code == "-5") {
                    msg = '{"result":"", "code" :"-2", "message":'+JSON.stringify(_res.error)+'}';
                } else if(code == "-6") {
                    msg = '{"result":"", "code" :"1", "message":'+JSON.stringify(_res.error)+'}';
                } else {
                    msg = '{"result":"", "code" :"99", "message":'+JSON.stringify(_res.result)+'}';
                }
                fnLogEvent(type,param,"error",msg);
            } else {
                msg = '{"result":'+JSON.stringify(_res.result)+', "code" :"0", "message":""}';
                fnLogEvent(type,param,"success",msg);
            }
    return msg;
}

function fnCommReturnValue(err,_res,type,param) {
    var msg = "";
            if (err !== null) {
                msg = JSON.stringify(err);
                fnLogEvent(type,param,"error",JSON.stringify(err));
            } else if (_res.error) {
                msg = JSON.stringify(_res.error);
                fnLogEvent(type,param,"error",JSON.stringify(_res.error));
            } else {
                fnLogEvent(type,param,"success",JSON.stringify(_res.result));
            }
    return msg;
}

module.exports = function(app, fs)
{
    app.get('/getIP', function(req,res) {
         if(!fnAcceptIPCHK(fnGetIP(req)) ) {
            fnLogEvent("getIP","","disconnct",fnAcceptIPCHK(fnGetIP(req)));
            res.end("비정상적인 접근입니다.");
        } else {
            fnLogEvent("getIP","","connect",fnAcceptIPCHK(fnGetIP(req)));
            res.end("정상적인 접근입니다.");
        }
     });

     //__dirname 은 현재 모듈의 위치를 나타냅니다.
     //router 모듈은 router 폴더에 들어있으니, data 폴더에 접근하려면
     ///../ 를 앞부분에 붙여서 먼저 상위폴더로 접근해야합니다
    app.get('/newAccount/:account', function(req, res){
        if(!Boolean(fnAcceptIPCHK(fnGetIP(req)))) {
            res.end(JSON.stringify("비정상적인 접근입니다.")); 
	    return true;
        }

        var config = require('../config');
        var bitcoin_rpc = require('node-bitcoin-rpc')
        bitcoin_rpc.init(config.host, config.port, config.user, config.pass)
        var _account = req.params.account;
	
	var param = {};
        param.account = _account;

        bitcoin_rpc.call('getnewaddress', [_account], function (err, _res) {
            res.end(fnCommReturnValue(err,_res,'newAccount',param)); 
        });
    });

    app.get('/getBalance/:account', function(req, res){
        if(!fnAcceptIPCHK(fnGetIP(req))) {
            res.end(JSON.stringify("비정상적인 접근입니다."));
	    return true;
        }
        var config = require('../config');
               
        var bitcoin_rpc = require('node-bitcoin-rpc')
        bitcoin_rpc.init(config.host, config.port, config.user, config.pass)
        var _account = req.params.account;

	var param = {};
        param.account = _account;

        if(_account == 'main') {
            bitcoin_rpc.call('getbalance', [""], function (err, _res) {
                res.end(fnCommReturnValue(err,_res,'main balance',param)); 

            });
        } else {
             bitcoin_rpc.call('getbalance', [_account], function (err, _res) {
                res.end(fnCommReturnValue(err,_res,'balance',param));
            });
        } 
    });

    app.get('/listtransactions/:account', function(req, res){
        if(!fnAcceptIPCHK(fnGetIP(req))) {
            res.end(JSON.stringify("비정상적인 접근입니다."));	
	    return true;
        }
        var config = require('../config');

        var bitcoin_rpc = require('node-bitcoin-rpc')
        bitcoin_rpc.init(config.host, config.port, config.user, config.pass)
        var _account = req.params.account;

	var param = {};
        param.account = _account;

        if(_account == 'main') {
            bitcoin_rpc.call('listtransactions', [""], function (err, _res) {
                res.end(fnCommReturnValue(err,_res,'listtransactions',param));
            });
        } else {
            bitcoin_rpc.call('listtransactions', [_account], function (err, _res) {
                res.end(fnCommReturnValue(err,_res,'listtransactions',param));
            });
        }
    });


    app.post('/coinmove', function(req, res){
        if(!fnAcceptIPCHK(fnGetIP(req))) {
            res.end(JSON.stringify("비정상적인 접근입니다."));
	    return true;
        }
        var _from = req.body["from"];
        var _to = req.body["to"];
        var _amt = req.body["amt"];
        
        var config = require('../config');
 
	var param = {};
        param.account = _account;       

        var bitcoin_rpc = require('node-bitcoin-rpc')
        bitcoin_rpc.init(config.host, config.port, config.user, config.pass)
       
        if(_to == 'main') {
            bitcoin_rpc.call('move', [_from,"",parseFloat(_amt)], function (err, _res) {
                res.end(fnCommReturnValue(err,_res,'move',param));
            });
        } else {
            bitcoin_rpc.call('move', [_from,_to,parseFloat(_amt)], function (err, _res) {
                res.end(fnCommReturnValue(err,_res,'move',param));
            });
        } 

    });

    app.post('/sendTransaction', function(req, res){
        if(!fnAcceptIPCHK(fnGetIP(req))) {
            res.end(JSON.stringify("비정상적인 접근입니다."));
	    return true;
        }
        var _from = req.body.from;
        var _to = req.body["to"];
        var _amt = req.body["amt"];

	var param = {};
        param.account = _account; 

        var config = require('../config');

        var bitcoin_rpc = require('node-bitcoin-rpc')
        bitcoin_rpc.init(config.host, config.port, config.user, config.pass)
        if(_from == "main") {
            bitcoin_rpc.call('sendfrom', ["",_to,parseFloat(_amt)], function (err, _res) {
                res.end(fnSendTransactionResult(err,_res,'sendTransaction',param));        
            });
        } else {
            bitcoin_rpc.call('sendfrom', [_from,_to,parseFloat(_amt)], function (err, _res) {
                res.end(fnSendTransactionResult(err,_res,'sendTransaction',param));
            });
        }
    });
    
    
}
