import express from 'express';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import responseTime from 'response-time';
import winston from 'winston';
import logger from './lib/logger';
import settings from './lib/settings';
import security from './lib/security';
import { db } from './lib/mongo';
import dashboardWebSocket from './lib/dashboardWebSocket';
import ajaxRouter from './ajaxRouter';
import apiRouter from './apiRouter';
const sessions = require('express-session');
let ms = sessions.MemoryStore;
const app = express();

security.applyMiddleware(app);
app.set('trust proxy', 1);
app.use(helmet());
app.all('*', (req, res, next) => {
	// CORS headers
	res.header(
		'Access-Control-Allow-Origin',
		security.getAccessControlAllowOrigin()
	);
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
	res.header('Access-Control-Allow-Credentials', 'true');
	res.header(
		'Access-Control-Allow-Headers',
		'Origin, X-Requested-With, Content-Type, Accept, Key, Authorization'
	);
	next();
});
app.use(responseTime());
app.use(cookieParser(settings.cookieSecretKey));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(
	sessions({
		name: 'dummystore',
		secret: 'oyaoyaoya',
		resave: true,
		saveUninitialized: true,
		store: new ms()
	})
);

app.use('/ajax', ajaxRouter);
app.use('/api', apiRouter);
app.use(logger.sendResponse);

/* * * * * * ** * * * * * * * * *
	
	HACKATHON WORK STARTS

* * * * * * ** * * * * * * * * */

app.post('/api2/login', (req, res) => {
	if (req.session.userid) {
		res.json({
			auth: 'yes'
		});
		return;
	}

	req.session.userid = 0;
	req.session.timestamp = Date.now();
	res.json({
		auth: 'yes'
	});
});

app.post('/api2/logout', (req, res) => {
	req.session.destroy();
	res.end();
});

/* * * * * * ** * * * * * * * * *
	
	HACKATHON WORK ENDS

* * * * * * ** * * * * * * * * */

const server = app.listen(settings.apiListenPort, () => {
	const serverAddress = server.address();
	winston.info(`API running at http://localhost:${serverAddress.port}`);
});

dashboardWebSocket.listen(server);