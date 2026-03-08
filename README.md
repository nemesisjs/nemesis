<p align="center">
  <img src="https://avatars.githubusercontent.com/u/266423123?s=400&u=35dac8e91254a43714fd41f21c00236b0d3ed4b2&v=4" width="300" alt="NemesisJS Logo" />
</p>

<h1 align="center">NemesisJS</h1>

<p align="center">
  A modern, TypeScript first routing and dependency injection framework for building robust HTTP applications.
</p>

<p align="center">
  <a href="https://npmjs.com/package/@nemesisjs/core" target="_blank"><img src="https://img.shields.io/npm/v/@nemesisjs/core.svg" alt="NPM Version" /></a>
  <a href="https://npmjs.com/package/@nemesisjs/core" target="_blank"><img src="https://img.shields.io/npm/l/@nemesisjs/core.svg" alt="Package License" /></a>
  <a href="https://npmjs.com/package/@nemesisjs/core" target="_blank"><img src="https://img.shields.io/npm/dm/@nemesisjs/core.svg" alt="NPM Downloads" /></a>
</p>

<hr/>

This repository serves as the core monorepo for the NemesisJS ecosystem, providing all essential tools and packages.

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
