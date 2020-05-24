# Node.js Starter Kit

## Concept

You can begin development from this Starter Kit, but it is not for production
usage. The purpose of this Starter Kit is to show simplicity, basic concepts,
give structure and architecture examples. All parts of this implementation are
optimized for readability and understanding, but not for performance and
scalability.
So it is good for development and education. However, for production deployment,
you may need the [Metarhia Starter Kit](https://github.com/metarhia/StarterKit)
(it will be released in the middle of July 2020). After your application is
ready, you can easily run it in the
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
- Simple logger and redirection from a console
- Database access layer (Postgresql)
- Persistent sessions (stored in DB)
- Unit-tests and API tests example
- Request queue with timeout and size
- Execution timeout and error handling
- Layered architecture: core, domain, API, client

## Features to be implemented in the next release

- Load balancing for scaling
- Prototype pollution prevention
- Multiple IDEs support
- Better testing

## Requirements

- Node.js v12.5.0 or later (v14 preferred)
- Linux (tested on Fedora 30, Ubuntu 16, 18, 19 and 20, CentOS 7 and 8)
- Postgresql 9.5 or later (v11.8 preferred)
- OpenSSL v1.1.1 or later
- [certbot](https://github.com/certbot/certbot) (recommended but optional)

## Usage

1. Fork and clone this repository (optionally subscribe to repo changes)
2. Remove unneeded dependencies if your project doesn't require them
3. Run `npm install` to install dependencies and generate certificate
4. Add your license to `LICENSE` file but don't remove starter kit license
5. Start your project by modifying this starter kit
6. Run project with `node server.js` and stop with Ctrl+C

## Help

Ask questions at https://t.me/nodeua and post issues on
[github](https://github.com/HowProgrammingWorks/NodejsStarterKit/issues).

## License

Copyright (c) 2020 How.Programming.Works contributors.
This starter kit is [MIT licensed](./LICENSE).
