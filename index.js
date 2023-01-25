require('events').EventEmitter.defaultMaxListeners = 0;

// define require modules
const http = require("http");
const express = require("express");
const createError = require("http-errors");
const cookieParser = require("cookie-parser");
const helmet = require('helmet');
const morgan = require("morgan");
const cors = require("cors");
const bunyan = require('bunyan');
// const logger = require('logger-line-number');
//swagger
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const port = process.env.PORT || 7000;
// const timeout = require('connect-timeout')


// prepare log handler
const logger = bunyan.createLogger({ name: 'via-api-gateway',src:true });
delete logger.fields.hostname;
delete logger.fields.pid;
delete logger.fields.name;
delete logger.level;
delete logger.fields.v;

// allowed origin list
const allowedOrigins = [
  "http://localhost:4200",
  "http://localhost:4201",
  "http://localhost:7000",
  "https://via.mihup.com",
  "https://via-dev.mihup.com",
  "https://via-test.mihup.com",
  "http://k8s-dev-viauigen-da9fd874e2-1826271561.us-west-2.elb.amazonaws.com"
];

// prepare app
const app = express();
app.set("view engine", "html");
app.set("port", port);
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      let msg = "The CORS policy for this site does not allow access from the specified Origin.";
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));
// app.use(morgan("dev"));
morgan.format('dev', '[:date] :method :url :status :res[content-length] - :response-time ms');
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(helmet());
// app.use(timeout('3600000'));

app.get("/health", function(req, res) {
  res.status(200).send('Ok');
})

//preaper swagger definations
const swaggerOptions = {
	swaggerDefinition: {
		info: {
			title: 'APIGW',
			description: 'Public API information',
			contact: {
				name: 'Sumit Kumar'
			},
			servers: [ 'http://localhost:7000','https://via-dev-api.mihup.com','https://via-test-api.mihup.com']
		}
	},
	//['.routes/*.js]
	apis: [ 'index.js', '.routes/v2/*.js' ]
};
//use swaggerJSDoc and swaggerUiExpress to serve these docs
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// import modules
const { authorize } = require("./middleware/authorize");
const helper = require('./helpers/helper');
const authRoutes = require("./routers/V2/auth")(logger);
const authRoutesV3 = require("./routers/V3/auth")(logger);
const pagesRoutes = require("./routers/V2/webmaster/pages")(authorize, logger);
const sectionsRoutes = require("./routers/V2/webmaster/sections")(authorize, logger);
const organizationRoutes = require("./routers/V2/webmaster/organizations")(authorize, logger);
const dataStoreRoutes = require("./routers/V2/webmaster/datastore")(authorize, logger);
const rolesRoutes = require("./routers/V2/user-management/roles")(authorize, logger);
const teamsRoutes = require("./routers/V2/user-management/teams")(authorize, logger);
const usersRoutes = require("./routers/V2/user-management/users")(authorize, logger);

const rolesRoutesV3 = require("./routers/V3/user-management/roles")(authorize, logger);
const teamsRoutesV3 = require("./routers/V3/user-management/teams")(authorize, logger);
const usersRoutesV3 = require("./routers/V3/user-management/users")(authorize, logger);

const featureRoutes = require("./routers/V2/operation-management/feature")(logger)

const reportingRoutes = require("./routers/V2/reporting/report")(authorize,logger);
const internalRoutes = require("./routers/V2/internal-apis")(logger);
const rulesRoutes = require("./routers/V2/operation-management/rules")(authorize, logger);
const momentRoutes = require("./routers/V3/operation-management/rules")(authorize, logger)
const tasksRoutes = require("./routers/V2/operation-management/tasks")(authorize, logger)
const configRoutes = require("./routers/V2/operation-management/configuration")(authorize,logger);

const metadataRoutes = require("./routers/V2/metadata/metadata")(authorize, logger);
const interactionsRoutes = require("./routers/V2/metadata/interactions")(authorize, logger);
const interactionsV3Routes=require("./routers/V3/interactions/interactions")(authorize, logger);
const analyzeRoutes=require("./routers/V3/analyze/analyze")(authorize, logger);
const rtaInteractionsRoutes = require("./routers/V2/metadata/rtainteractions")(authorize, logger);
const qcFormsRoutes = require("./routers/V2/qc-forms/qc-forms")(authorize,logger);
const assignmentRoutes = require("./routers/V2/assignment/assignment")(authorize,logger);
const passwordPolicyRoutes = require("./routers/V2/operation-management/password-policy")(authorize,logger);

//V3 ROUTES
const apiListRoutesV3 = require("./routers/V3/webmaster/apis")(authorize, logger);

// define api router path
/**
 * @swagger
 * 
 * /v2/auth/token:
 *   post:
 *     description: Use to get auth token
 *     tags:
 *       - auth
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: username
 *         description: The user to validate.
 *         schema:
 *           type: json
 *           required:
 *             - username
 *           properties:
 *             username:
 *               type: string
 *             password:
 *               type: string
 *             type:
 *               type: string
 *     responses:
 *       '200':
 *          description: Successful Request.
 *       '406':
 *          description: Invalid password.
 *       '203':
 *          description: Given email and password do not match.
 *       '500':
 *          description: Something went wrong on server.
 * 
 * /v2/auth/available-access-data:
 *   get:
 * 
 *     tags:
 *       - auth
 *     responses:
 *
 *
 * /v2/auth/verify-and-access-account:
 *   post:
 * 
 *     tags:
 *       - auth 
 *     responses:
 * 
 * /v2/auth/setup-your-account:
 *   put:
 *   
 *     tags:
 *       - auth 
 *     responses:
 * 
 * /v2/auth/forget-password:
 *   post:
 *     
 *     tags:
 *       - auth 
 *     responses:
 * 
 */
app.use("/v2/auth/", authRoutes);
app.use("/v3/auth/", authRoutesV3);
/**
 * @swagger
 *   /v2/page-management/pages/:
 *     get:
 *   
 *       tags:
 *         - pages
 *       responses:
 *     post:
 * 
 *       tags:
 *         - pages
 *       responses:
 */
app.use("/v2/page-management/pages/", pagesRoutes);
app.use("/v3/page-management/pages/", pagesRoutes);
/**
 * @swagger
 *   /v2/page-management/sections/:
 *     get:
 *   
 *       tags:
 *         - sections
 *       responses:
 *     post:
 * 
 *       tags:
 *         - sections
 *       responses:
 */
app.use("/v2/page-management/sections/", sectionsRoutes);
app.use("/v3/page-management/sections/", sectionsRoutes);
/**
 * @swagger
 *   /v2/organizations/:
 *     get:
 *   
 *       tags:
 *         - organizations
 *       responses:
 *     post:
 * 
 *       tags:
 *         - organizations
 *       responses:
 */
app.use("/v2/organizations/", organizationRoutes);
/**
 * @swagger
 *   /v2/datastore/:
 *     get:
 *   
 *       tags:
 *         - data store
 *       responses:
 *     post:
 * 
 *       tags:
 *         - data store
 *       responses:
 */
app.use("/v2/datastore/", dataStoreRoutes);
/**
 * @swagger
 *   /v2/user-management/organizations/:
 *     get:
 *   
 *       tags:
 *         - roles
 *       responses:
 *     post:
 * 
 *       tags:
 *         - roles
 *       responses:
 */
app.use("/v2/user-management/organizations/", rolesRoutes);
app.use("/v3/user-management/organizations/", rolesRoutesV3);
// app.use("/api/v2/user-management/roles", rolesRoutes);
/**
 * @swagger
 *   /v2/user-management/organizations/:
 *     get:
 *   
 *       tags:
 *         - users
 *       responses:
 *     post:
 * 
 *       tags:
 *         - users
 *       responses:
 */
app.use("/v2/user-management/organizations/", usersRoutes);
app.use("/v3/user-management/organizations/", usersRoutesV3);
/**
 * @swagger
 *   /v2/user-management/organizations/:
 *     get:
 *   
 *       tags:
 *         - teams
 *       responses:
 *     post:
 * 
 *       tags:
 *         - teams
 *       responses:
 */

app.use("/v2/user-management/organizations/", teamsRoutes);
app.use("/v3/user-management/organizations/", teamsRoutesV3);

// Operation management - Rules and Tasks APIs
/**
 * @swagger
 *   /v2/operation-management/organizations/:
 *     get:
 *   
 *       tags:
 *         - rules
 *       responses:
 *     post:
 * 
 *       tags:
 *         - rules
 *       responses:
 */
app.use("/v2/operation-management/organizations/", rulesRoutes)
/**
 * @swagger
 *   /v2/operation-management/organizations/:
 *     get:
 *   
 *       tags:
 *         - tasks
 *       responses:
 *     post:
 * 
 *       tags:
 *         - tasks
 *       responses:
 */
app.use("/v2/operation-management/organizations/", tasksRoutes)
/**
 * @swagger
 *   /v2/operation-management/organizations/:
 *     get:
 *   
 *       tags:
 *         - qc form
 *       responses:
 *     post:
 * 
 *       tags:
 *         - qc form
 *       responses:
 */
app.use("/v2/operation-management/organizations/", qcFormsRoutes);

/**
 * @swagger
 *   /v2/configuration-management/organizations/:
 *     get:
 *   
 *       tags:
 *         - config
 *       responses:
 *     post:
 * 
 *       tags:
 *         - config
 *       responses:
 */

app.use("/v2/configuration-management/organizations/", configRoutes) /// v2/configuration-management/organizations/
/**
 * @swagger
 *   /v2/operation-management/feature:
 *     get:
 *   
 *       tags:
 *         - features
 *       responses:
 */

app.use("/v2/configuration-management/organizations/", configRoutes) /// v2/configuration-management/organizations/
app.use("/v2/configuration-management/organizations/", passwordPolicyRoutes) /// v2/configuration-management/organizations/
app.use("/v2/operation-management/feature", featureRoutes)

// Reporting endpoints
/**
 * @swagger
 *   /v2/reporting-management/organizations/:
 *     get:
 *   
 *       tags:
 *         - reports
 *       responses:
 *     post:
 * 
 *       tags:
 *         - reports
 *       responses:
 */
app.use("/v2/reporting-management/organizations/", reportingRoutes)/// /v2/reporting-management/organizations/:orgId/reports/:reportId/audio-evaluation-detail
// Reporting endpoints
/**
 * @swagger
 *   /v2/reporting-management/organizations/:
 *     get:
 *   
 *       tags:
 *         - assignments
 *       responses:
 */
app.use("/v2/reporting-management/organizations/", assignmentRoutes);
/**
 * @swagger
 *   /internal/v2/reporting-management/organizations/:
 *     get:
 *   
 *       tags:
 *         - internal report
 *       responses:
 */
app.use("/internal/v2/reporting-management/organizations/", internalRoutes);

// metadata api endpoints
/**
 * @swagger
 *   /v2/access-management/organizations/:
 *     post:
 * 
 *       tags:
 *         - metadata
 *       responses:
 */
app.use("/v2/access-management/organizations/", metadataRoutes) //v2/access-management/organizations/
/**
 * @swagger
 *   /v2/organizations/:
 *     post:
 * 
 *       tags:
 *         - interactions
 *       responses:
 */
app.use("/v2/organizations/", interactionsRoutes) //cannot change path as clients are using it. in future "v2/access-management/organizations/" will be used

app.use("/v2/organizations/", rtaInteractionsRoutes);
app.use("/v3/operation-management/organizations/", momentRoutes);
app.use("/v3/organizations/", interactionsV3Routes);
app.use("/v3/organizations/", analyzeRoutes);

// app.use('/test-encrypt',async function (req, res) {
//   const argon2 = require('argon2');
//   CryptoJS = require("crypto-js");
//   let rand = require('csprng');
 
//   const salt=rand(160, 16);
//   const saltBuf = Buffer.from(salt, "hex");

// try {
//   const options = {
//     timeCost: 2,
//     salt: saltBuf,
//     type: argon2.argon2i,
//     memoryCost: 15360,
//     parallelism: 1,
//     hashLength: 64,
//   };
//   const hash = await argon2.hash(req.body.password,options);
//   res.json({password:req.body.password,hash})
// } catch (err) {
//   console.log("ERRRRRRRRROOOOOOOOOOOOORRRRRRRRR")
//   res.end(err)
// }
// });

// app.use('/test-decrypt',async function (req, res) {
//   const hash=req.body.hash;
//   const argon2 = require('argon2');
// try {
//   if (await argon2.verify(hash, req.body.password)) {
//     console.log(req.body.password,hash)
//     res.json({password:req.body.password,hash,matched:true})
//   } else {
//     res.json({password:req.body.password,hash,matched:false})
//   }
// } catch (err) {
//   console.log("ERRRRRRRRROOOOOOOOOOOOORRRRRRRRR")
//   res.end(err)
// }
// });

//V3 ROUTEES
app.use("/v3/page-management/apis", apiListRoutesV3);

app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.json({ error: true, message: err.message });
});

app.use(function (err, req, res, next) {
  res.status(err.status || 504);
  res.json({ error: true, message: err.message, key: "test"});
});



process.on('uncaughtException', function (err) {
  console.trace('****** Caught exception: ******' + err);
  // console.error('****** Caught exception: ******', err.stack || err);
  //err = new Error().stack
  //console.log('****** Caught exception: ******', err);
});

// finalize app setup
const server = http.createServer(app);
server.listen(port);
server.timeout = 3600000;
// server.headersTimeout = 3600000;
console.log("Serving project at port", port);
// export
module.exports = server;
