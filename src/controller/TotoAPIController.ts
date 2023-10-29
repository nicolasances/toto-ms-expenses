const bodyParser = require("body-parser");
import busboy from 'connect-busboy'
import path from 'path'
import fs from 'fs-extra';
import express, { Express, Request, Response } from 'express'

import { Logger } from '../logger/TotoLogger'
import { TotoControllerConfig } from './model/TotoControllerConfig'
import { LazyValidator, ValidationError, Validator } from './validation/Validator';
import { TotoDelegate } from './model/TotoDelegate';
import { ExecutionContext } from './model/ExecutionContext';
import { SmokeDelegate } from './dlg/SmokeDelegate';
import { TotoRuntimeError } from './model/TotoRuntimeError';

/**
 * This is an API controller to Toto APIs
 * It provides all the methods to create an API and it's methods & paths, to create the documentation automatically, etc.
 * Provides the following default paths:
 * '/'            : this is the default SMOKE (health check) path
 * '/publishes'   : this is the path that can be used to retrieve the list of topics that this API publishes events to
 */
export class TotoAPIController {

    app: Express;
    apiName: string;
    logger: Logger;
    validator: Validator = new LazyValidator();
    config: TotoControllerConfig;

    /**
     * The constructor requires the express app
     * Requires:
     * - apiName              : (mandatory) - the name of the api (e.g. expenses)
     * - config               : (mandatory) - a TotoControllerConfig instance
     */
    constructor(apiName: string, config: TotoControllerConfig) {

        this.app = express();
        this.apiName = apiName;
        this.logger = new Logger(apiName)
        this.config = config;

        config.load().then(() => {

            this.validator = new Validator(config.getProps(), this.logger, config.getCustomAuthVerifier());

        });

        // Initialize the basic Express functionalities
        this.app.use(function (req, res, next) {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-correlation-id, x-msg-id, auth-provider, x-app-version, x-client, x-client-id");
            res.header("Access-Control-Allow-Methods", "OPTIONS, GET, PUT, POST, DELETE");
            next();
        });

        this.app.use(bodyParser.json());
        this.app.use(busboy());
        this.app.use(express.static(path.join(__dirname, 'public')));

        // Add the standard Toto paths
        // Add the basic SMOKE api
        this.path('GET', '/', new SmokeDelegate());

        // Bindings
        this.staticContent = this.staticContent.bind(this);
        this.fileUploadPath = this.fileUploadPath.bind(this);
        this.path = this.path.bind(this);
    }

    /**
     * This method will register the specified path to allow access to the static content in the specified folder
     * e.g. staticContent('/img', '/app/img')
     */
    staticContent(path: string, folder: string) {

        this.app.use(path, express.static(folder));

    }

    /**
     * 
     * @param {string} path the path to which this API is reachable
     * @param {function} delegate the delegate that will handle this call
     * @param {object} options options to configure this path: 
     *  - contentType: (OPT, default null) provide the Content-Type header to the response
     */
    streamGET(path: string, delegate: TotoDelegate, options: any) {

        this.app.route(path).get((req: Request, res: Response, next) => {

            this.validator.validate(req).then((userContext) => {

                this.logger.apiIn(req.headers['x-correlation-id'], 'GET', path);

                const executionContext = new ExecutionContext(this.logger, this.apiName, this.config, String(req.headers['x-correlation-id']), String(req.headers['x-app-version']))

                // Execute the GET
                delegate.do(req, userContext, executionContext).then((stream) => {

                    // Add any additional configured headers
                    if (options && options.contentType) res.header('Content-Type', options.contentType);

                    // stream must be a stream: e.g. var stream = bucket.file('Toast.jpg').createReadStream();
                    res.writeHead(200);

                    stream.on('data', (data: any) => {
                        res.write(data);
                    });

                    stream.on('end', () => {
                        res.end();
                    });
                }, (err) => {
                    // Log
                    this.logger.compute(req.headers['x-correlation-id'], err, 'error');
                    // If the err is a {code: 400, message: '...'}, then it's a validation error
                    if (err != null && err.code == '400') res.status(400).type('application/json').send(err);
                    // Failure
                    else res.status(500).type('application/json').send(err);
                });

            });
        });
    }

    /**
     * Adds a path that support uploading files
     *  - path:     the path as expected by express. E.g. '/upload'
     */
    fileUploadPath(path: string, delegate: TotoDelegate) {

        this.app.route(path).post(async (req, res, next) => {

            this.logger.apiIn(req.headers['x-correlation-id'], 'POST', path);

            // Validating
            const userContext = await this.validator.validate(req);

            var fstream;

            req.pipe(req.busboy);

            req.busboy.on('file', (fieldname, file, filename) => {

                this.logger.compute(req.headers['x-correlation-id'], 'Uploading file ' + filename, 'info');

                // Define the target dir
                let dir = __dirname + '/app-docs';

                // Ensure that the dir exists
                fs.ensureDirSync(dir);

                // Create the file stream
                fstream = fs.createWriteStream(dir + '/' + filename);

                // Pipe the file data to the stream
                file.pipe(fstream);

                // When done, call the delegate
                fstream.on('close', () => {

                    const executionContext = new ExecutionContext(this.logger, this.apiName, this.config, String(req.headers['x-correlation-id']), String(req.headers['x-app-version']))

                    delegate.do({ query: req.query, params: req.params, headers: req.headers, body: { filepath: dir + '/' + filename } }, userContext, executionContext).then((data) => {
                        // Success
                        res.status(200).type('application/json').send(data);

                    }, (err) => {
                        // Log
                        this.logger.compute(req.headers['x-correlation-id'], err, 'error');
                        // If the err is a {code: 400, message: '...'}, then it's a validation error
                        if (err != null && err.code == '400') res.status(400).type('application/json').send(err);
                        // Failure
                        else res.status(500).type('application/json').send(err);
                    });

                });
            });
        });

        // Log the added path
        console.log('[' + this.apiName + '] - Successfully added method ' + 'POST' + ' ' + path);
    }

    /**
     * Add a path to the app.
     * Requires:
     *  - method:   the HTTP method. Can be GET, POST, PUT, DELETE
     *  - path:     the path as expected by express. E.g. '/sessions/:id'
     *  - delegate: the delegate that exposes a do() function. Note that the delegate will always receive the entire req object
     */
    path(method: string, path: string, delegate: TotoDelegate) {

        const handleRequest = async (req: Request, res: Response) => {

            const cid = String(req.headers['x-correlation-id']);

            try {
                
                // Log the fact that a call has been received
                this.logger.apiIn(cid, method, path);

                // Validating
                const userContext = await this.validator.validate(req);

                const executionContext = new ExecutionContext(this.logger, this.apiName, this.config, cid, String(req.headers['x-app-version']))

                // Execute the GET
                const data = await delegate.do(req, userContext, executionContext);

                res.status(200).type('application/json').send(data);

            } catch (error) {

                this.logger.compute(cid, `${error}`, "error")

                if (error instanceof ValidationError || error instanceof TotoRuntimeError) {
                    res.status(error.code).type("application/json").send(error)
                }
                else {
                    console.log(error);
                    res.status(500).type('application/json').send(error);
                }
            }
        }

        if (method == "GET") this.app.get(path, handleRequest);
        else if (method == "POST") this.app.post(path, handleRequest);
        else if (method == "PUT") this.app.put(path, handleRequest);
        else if (method == "DELETE") this.app.delete(path, handleRequest);
        else this.app.get(path, handleRequest);

        // Log the added path
        console.log('[' + this.apiName + '] - Successfully added method ' + method + ' ' + path);
    }

    /**
     * Starts the ExpressJS app by listening on the standard port defined for Toto microservices
     */
    listen() {

        if (!this.validator) {
            console.info("[" + this.apiName + "] - Waiting for the configuration to load...");
            setTimeout(() => { this.listen() }, 300);
            return;
        }

        this.app.listen(8080, () => {
            console.info('[' + this.apiName + '] - Microservice up and running');
        });

    }
}