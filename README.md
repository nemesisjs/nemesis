# NemesisJS

NemesisJS is a modern, TypeScript first routing and dependency injection framework for building robust HTTP applications. This repository serves as the core monorepo for the NemesisJS ecosystem, providing essential tools and packages.

## Ecosystem

The NemesisJS ecosystem consists of multiple packages designed to work together seamlessly:

- **@nemesisjs/core**: The heart of the framework, providing routing decorators and the Dependency Injection (DI) container.
- **@nemesisjs/common**: Shared utilities and common types.
- **@nemesisjs/http**: HTTP abstractions, request/response models, and status codes.
- **@nemesisjs/platform-bun**: Bun-specific HTTP implementation and optimizations.
- **@nemesisjs/validation**: A flexible validation module integrating with modern validation libraries like Zod, Valibot, and class-validator.
- **@nemesisjs/cli**: A command-line interface for scaffolding projects and generating code.
- **@nemesisjs/testing**: Utilities for testing NemesisJS applications.

## Getting Started

To get started with NemesisJS, you can use our CLI to generate a new project:

```bash
npm install -g @nemesisjs/cli
nemesis new my-app
```

Or install the packages directly into your Bun project:

```bash
bun add @nemesisjs/core @nemesisjs/common @nemesisjs/platform-bun
```

## Features

- **TypeScript First**: Built with TypeScript from the ground up to ensure strict type safety.
- **Decorator Based Routing**: Clean, semantic routing using `@Get`, `@Post`, `@Put`, `@Delete`, etc.
- **Dependency Injection**: Powerful DI container supporting singleton, transient, and scoped lifetimes.
- **Implicit DI**: Automatic dependency resolution based on TypeScript constructor types without excessive boilerplate.
- **Middleware & Guards**: Comprehensive control flow mechanisms for validation, authentication, and authorization.

## License

MIT
