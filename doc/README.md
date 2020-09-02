# Application documentation
## Structure descrpition 
* api - Folder for API, all functions async
* cert - Folder with auto signed certificate for https/wss
  * generate.ext - extension for generate.sh
  * generate.sh - script file to generate certificate(openssl required)
* config - Folder for configs, currently for server, database
* db - PostgreSQL folder with structure, basic data, simple installation file.
* doc - Documentation fodler
* domain - Utility functions folder
* lib - Core folder
  * [application.js](https://github.com/HowProgrammingWorks/NodejsStarterKit/blob/master/lib/application.js) - Create Sanboxes with given context, loadFiles and  watch static & api folders,
  * [auth.js](https://github.com/HowProgrammingWorks/NodejsStarterKit/blob/master/lib/auth.js) - Works with session, cookies, user authification with PostgreSQL
  * [client.js](https://github.com/HowProgrammingWorks/NodejsStarterKit/blob/master/lib/client.js) - Serve static, handle message which comes from websocket
  * [common.js](https://github.com/HowProgrammingWorks/NodejsStarterKit/blob/master/lib/common.js) - Common functions in separated module
  * [config.js](https://github.com/HowProgrammingWorks/NodejsStarterKit/blob/master/lib/config.js) - Load configs using sandboxes
  * [database.js](https://github.com/HowProgrammingWorks/NodejsStarterKit/blob/master/lib/database.js) - Interface to work with PostgreSQL
  * [dependencies.js](https://github.com/HowProgrammingWorks/NodejsStarterKit/blob/master/lib/dependencies.js) - Load all useful modules from Node.js and add them to api
  * [logger.js](https://github.com/HowProgrammingWorks/NodejsStarterKit/blob/master/lib/logger.js) - Logger which handles all system and error messages, write logs
  * [security.js](https://github.com/HowProgrammingWorks/NodejsStarterKit/blob/master/lib/security.js) - Secure and validate password with Node.js crypto
  * [semaphore.js](https://github.com/HowProgrammingWorks/NodejsStarterKit/blob/master/lib/semaphore.js) - Semaphore implementation for rpc 
  * [server.js](https://github.com/HowProgrammingWorks/NodejsStarterKit/blob/master/lib/server.js) - http/s ws/s server implementation
  * [worker.js](https://github.com/HowProgrammingWorks/NodejsStarterKit/blob/master/lib/worker.js) - Thread which start all processes
* log - Folder for logs from Logger
* static - Console app from Metarhia
* test - Folder for Unit-tests
* tmp - Folder for temporary files
* server.js - Launch project using <code>node server.js</code>

## Additional
Comments which describes files in lib folder to clarify code
