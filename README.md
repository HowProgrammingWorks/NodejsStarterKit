# Node.js Starter Kit

## Concept

You can begin development from this Starter Kit but it is not for production
usage. The purpose of this Starter Kit is to show simplicity, basic concepts,
give structure and architecture example. All parts of this implementation are
optimized for readability and for understanding, but not for performance and
scalability.
So it is good for development and education. However, for production deployment
you may need [Metarhia Starter Kit](https://github.com/metarhia/StarterKit)
(it will be released in the middle of July 2020). After your application will be
ready you can easely run it in
[Metaserverless cloud](https://github.com/Metaserverless), an open source cloud
platform based on [Metarhia technology stack](https://github.com/metarhia) and
[Node.js](https://nodejs.org/en/).

## Feature list

- Serve API with auto-routing, HTTP(S), WS(S)
- Server code live reload with file system watch
- Graceful shutdown and application reload
- Minimum code size and dependencies
- Code sandboxing for security, dependency injection and context isolation
- Multi-threading for CPU utilization and isolation
- Serve multiple ports in threads
- Serve static files with memory cache
- Application configuration
- Simple logger and redirection from console
- Database access layer (Postgresql)
- Persistent sessions (stored in DB)
- Unit-tests and API tests example
- Request queue with timeout and size
- Execution timeout and error handling
- Layered architecture: core, domain, api, client

## Features to be implemented in next release

- Load balancing for scaling
- Prototype polution prevention
- Multiple IDEs support
- Better testing

## Usage

- You need node.js v12.5.0 or later (v14 prefered), linux (tested on Fedora 30,
Ubuntu 16, 18, 19 and 20, CentOS 7 and 8), Postgresql 9.5 or later (v11.8
prefered), OpenSSL v1.1.1 or later, certbot (recommended but optional)
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
