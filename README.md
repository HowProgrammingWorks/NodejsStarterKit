# Node.js Starter Kit

## Concept

You can begin development from this Starter Kit but it is not for production
usage. After your application will be ready you can easely run it in
[Metaserverless cloud](https://github.com/Metaserverless), an open source cloud
platform based on [Metarhia technology stack](https://github.com/metarhia) and
[Node.js](https://nodejs.org/en/). The purpose of this Starter Kit is to show
simplicity of basic concepts, give structure and architecture example. All parts
of this implementation are optimized for readability and for understanding, but
not for performance and scalability. So it is good for development and better
understanding. However, for production deployment you need to take
[Metarhia Starter Kit](https://github.com/metarhia/StarterKit)

## Feature list

- Serve API with routing, HTTP(S), WS(S)
- Server code live reload with file system watch
- Graceful shutdown and application reload
- Minimum code size and dependencies
- Code sandboxing for security and context isolation
- Multi-threading for CPU utilization and isolation
- Serve multiple ports in threads
- Serve static files with memory cache
- Application configuration
- Simple logger and redirection from console
- Database access layer (Postgresql)
- Client persistent sessions
- Unit-tests and API tests example
- Request queue timeout and size
- API parallel execution concurrency
- API method execution timeout

## Features to be implemented in next release

- Load balancing for scaling
- Prototype polution prevention
- Better code isolation

## Usage

- You need node.js v12.5.0 or later (v14 prefered), linux (tested on Fedora 30,
Ubuntu 16 and 18, CentOS 7 and 8)
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
