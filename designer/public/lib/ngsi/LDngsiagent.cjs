'use strict';

var http = require('http'),
    express = require('express'),
    logger = require('logops'),
    bodyParser = require('body-parser'),
    northboundServer,    
	notifyHandler,
	adminHandler;

function CtxElement2JSONObject(e) {
    var jsonObj = {};
    for (var ctxElement in e ) {
        jsonObj[ctxElement] = e[ctxElement]
    }
    return jsonObj;
}


function ensureType(req, res, next) {
    if (req.is('json')) {
        next();
    } else {
        next(new errors.UnsupportedContentType(req.headers['content-type']));
    }
}

function loadContextRoutes(router) {
    var notifyHandlers = [
            ensureType,
            handleNotify
        ],
		adminHandlers = [
            ensureType,
            handleAdmin
        ];

    router.post('/notifyContext', notifyHandlers);
    router.post('/admin', adminHandlers);		
}
		
function handleError(error, req, res, next) {
    var code = 500;

    logger.debug('Error [%s] handing request: %s', error.name, error.message);

    if (error.code && String(error.code).match(/^[2345]\d\d$/)) {
        code = error.code;
    }

    res.status(code).json({
        name: error.name,
        message: error.message
    });
}

function traceRequest(req, res, next) {
    logger.debug('Request for path [%s] from [%s]', req.path, req.get('host'));

    next();
}

function setNotifyHandler(newHandler) {
    notifyHandler = newHandler;
}

function setAdminHandler(newHandler) {
    adminHandler = newHandler;
}

function readContextElements(body) {
	var ctxObjects = [];
	
	if (body["type"] ==  "Notification") {
            var NotificationData = body["data"]
            var len = NotificationData.length
            for ( var i=0; i < len; i++) {
                var ctxObjEle = NotificationData[i]
		var ctxObj = CtxElement2JSONObject(ctxObjEle)
                ctxObjects.push(ctxObj);
	    }
	}
	return ctxObjects
}

function handleNotify(req, res, next) {
	if (notifyHandler) {
        //logger.debug('Handling notification from [%s]', req.get('host'));		
		var ctxs = readContextElements(req.body);
		notifyHandler(req, ctxs, res);		
        next();
    } else {
        var errorNotFound = new Error({
            message: 'Notification handler not found'
        });
        logger.error('Tried to handle a notification before notification handler was established.');
        next(errorNotFound);
    }
}

function handleAdmin(req, res, next) {
	if (adminHandler) {
        logger.debug('Handling admin from [%s]', req.get('host'));
		
		if( Array.isArray(req.body) ) {
			adminHandler(req, req.body, res);			
		}
		
        next();
    } else {
        var errorNotFound = new Error({
            message: 'admin handler not found'
        });
        logger.error('Tried to handle an admin command before admin handler was established.');
        next(errorNotFound);
    }
}


function start(port, callback) {
    var baseRoot = '/';

    northboundServer = {
        server: null,
        app: express(),
        router: express.Router()
    };

    logger.info('Starting NGSILD Agent listening on port [%s]', port);

    northboundServer.app.set('port', port);
    northboundServer.app.set('host', '0.0.0.0');
    northboundServer.app.use(bodyParser.json());
	
    northboundServer.app.use(baseRoot, northboundServer.router);
	
    loadContextRoutes(northboundServer.router);

    northboundServer.app.use(handleError);

    northboundServer.server = http.createServer(northboundServer.app);
    northboundServer.server.listen(northboundServer.app.get('port'), northboundServer.app.get('host'), callback);
}

function stop() {
    logger.info('Stopping NGSI Agent');

    if (northboundServer) {
        northboundServer.server.close();
    } 
}

exports.start = start;
exports.stop = stop;
exports.setNotifyHandler  = setNotifyHandler;
exports.setAdminHandler  = setAdminHandler;


