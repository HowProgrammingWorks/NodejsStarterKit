# Node.js Starter Kit

## Concept

You can begin development from this Starter Kit, but it is not for production
usage. The purpose of this Starter Kit is to show simplicity, basic concepts,
give structure and architecture examples. All parts of this implementation are
optimized for readability and understanding, but not for performance and
scalability.

So it is good for development and education. However, for production deployment,
you may need the [Metarhia Example App](https://github.com/metarhia/Example) an
open-source application server on the top of [Node.js](https://nodejs.org/en/).

## Feature list

- Pure node.js and framework-agnostic approach
- Minimum code size and dependencies
- Layered architecture: core, domain, API, client
- Protocol-agnostic API with auto-routing, HTTP(S), WS(S)
- Graceful shutdown
- Code sandboxing for security, dependency injection and context isolation
- Serve multiple ports
- Serve static files with memory cache
- Application configuration
- Simple logger
- Database access layer (Postgresql)
- Persistent sessions
- Unit-tests and API tests example
- Request queue with timeout and size
- Execution timeout and error handling

## Requirements

- Node.js v16 or later
- Linux (tested on Fedora, Ubuntu, and CentOS)
- Postgresql 9.5 or later (v12 preferred)
- OpenSSL v1.1.1 or later
- [certbot](https://github.com/certbot/certbot) (recommended but optional)

## Usage

1. Fork and clone this repository (optionally subscribe to repo changes)
2. Remove unneeded dependencies if your project doesn't require them
3. Run `npm ci --production` to install dependencies and generate certificate
4. Add your license to `LICENSE` file but don't remove starter kit license
5. Start your project by modifying this starter kit
6. Run project with `node server.js` and stop with Ctrl+C

## Help

Ask questions at https://t.me/nodeua and post issues on
[github](https://github.com/HowProgrammingWorks/NodejsStarterKit/issues).

## License

Copyright (c) 2020-2022 How.Programming.Works contributors.
This starter kit is [MIT licensed](./LICENSE).
