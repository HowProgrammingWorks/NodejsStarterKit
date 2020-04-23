# Node.js Starter Kit

## Concept

You can begin development from this starter kit but it is not for production
usage. After your application will be ready you can easely run it in
Metaserverless cloud, an open source cloud platform based on Metarhia technology
stack and Node.js. The purpose of this starter kit is to show simplicity of
basic concepts, give structure and architecture example. All parts of this
implementation are optimized for readability and for understanding, but not for
performance and scalability. So it is good for development and better
understanding. However, for deployment you need to take one of the
implementations proposed in this document. Links will be available soon.

## Feature list

- Serve API with routing, HTTP(S), WS(S)
- Server code live reload with file system watch
- Graceful shutdown and application reload
- Minimum code size and dependencies
- Code sandboxing for security and context isolation
- Multi-threading for CPU utilization and isolation
- Serve multiple ports in threads
- Serve static files with memory cache
- Load balancing for scaling
- Application configuration
- Simple logger and redirection from console
- Database access layer (Postgresql)
- Client persistent sessions
- Unit-tests and API tests example
- Request queue timeout and size
- API parallel execution concurrency
- API method execution timeout

## Usage

- You need node.js v12.5.0 or later (v14 prefered)
- Fork and clone this repository (optionally subscribe to repo changes)
- Run `npm i` to install dependencies and generate RSA certificate
- Remove unneeded dependencies if your project doesn't require them
- Add your license to `LICENSE` file but don't remove starter kit license
- Start your project modifying this starter kit
- Ask questions in https://t.me/nodeua and post issues on
[github](https://github.com/HowProgrammingWorks/NodejsStarterKit/issues)
- Run project: `node server.js` and stop with Ctrl+C

## License

Copyright (c) 2020 How.Programming.Works contributors.
This starter kit is [MIT licensed](./LICENSE).
