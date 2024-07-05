API CI:

Front End CI production:

Front End CI staging:

Home page: [ribbon-app-ten.vercel.app](https://ribbon-app-ten.vercel.app)

Staging: [ribbon-app-ten.vercel.app](https://ribbon-app-ten.vercel.app)

Production: [ribbon-app-ten.vercel.app](https://ribbon-app-ten.vercel.app)

## [RibbonProtocol <a href="https://ibb.co/pfpWc5b"><img src="https://i.ibb.co/8rVzqtN/ribbon-app-logo-copy.png" alt="ribbon-app-logo-copy" border="0"></a>](https://ribbon-app.vercel.app)

[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](/LICENSE)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![Contributions welcome](https://img.shields.io/badge/contributions-welcome-orange.svg?style=flat-square)](/contributing.md)

Ribbon Protocol is a universal health coverage rewards and loyalty platform that aims to modify health and wellness behavior through incentivization and rewardable tasks.

The Ribbon App intertwines Universal Basic Income with Universal Health Coverage, utilizing World ID users health & socioeconomic data to enhance global well-being. The protocol rewards users for activities that help assess their wellness and socioeconomic needs, while linking them to equitable UBI and personalized services.

Rewards and Incentives are distributed in points and WLD tokens, on the Optimism Mainnet network which is a Layer 2 network of the Ethereum blockchain.

## Table of Contents

- [Table of Contents](#table-of-contents)
- [Packages](#packages)
- [Requirements](#requirements)
- [Getting Started](#getting-started)
- [Contributing](#contributing)
- [Resources](#resources)

## Packages

This RibbonProtocol App contains JavaScript tools and applications that enables users to earn tokenized universal basic income. The ribbon app consists of three key components right now; this will change in time. These are as follows:

| Name                                                                                           | Description                                                                                                                    |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| [`@ribbonprotocol/api`](https://github.com/RibbonBlockchain/RibbonApp-BackEnd)                 | Backend API built with Typescript and NestJS restful API that handles data capture for users and all system wide interactions. |
| [`@ribbonprotoccol/frontend`](https://github.com/RibbonBlockchain/RibbonApp)                   | Frontend NextJS application that users interact with. [Link](https://ribbon-app-ten.vercel.app)                                    |
| [`@ribbonprotoccol/admin-panel`](https://github.com/RibbonBlockchain/RibbonAdminPanelFrontEnd) | Frontend NextJS application for admin management.                                                                              |

Each section has it's own repository and has it's own readme within the package that explains how to set it up and get running with that specific component.

## Requirements

This project requires `node >=18.0.0`, `npm >=10.x.x` and `pnpm >=8.x.x`. A unix shell is also required.

- [Installing Node](https://docs.npmjs.com/getting-started/installing-node)
- [Installing pnpm](https://pnpm.io/7.x/installation)
- [UNIX Shell (Windows users)](https://docs.microsoft.com/en-us/windows/wsl/install-win10)

## Getting Started

To get started, clone the repo and install its dependencies:

```bash
git clone https://github.com/RibbonBlockchain/RibbonApp-BackEnd.git
cd RibbonApp-BackEnd
pnpm install
```

For development purposes there's a top-level `start:dev` script that will watch and continuously compile all packages concurrently:

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

Open [http://localhost:5000](http://localhost:5000) to access the API.

For next steps, take a look at documentation for the individual package(s) you want to run and/or develop. Each package can be run from the root directory using pnpm or npm.

## Configuration

See `.env.example` file to see the configurations used in this project.

Environment Variables

PORT: Port number the server should listen on (Default is 5000).

Database

A postgress database URL was used to connect to to the server

## Deployment

The app is deployed using [heroku](https://heroku.com/)

## Documentation

To simplify the process of exploring and testing our API, we have created a Postman collection that includes all the endpoints, complete with descriptions, request parameters, and example responses.
You can access the Postman documentation by following this [link](https://www.postman.com/lively-capsule-996856/workspace/ribbon-protocol/collection/11645039-17beb076-c0cf-4af7-b98b-e940738f1747?action=share&creator=11645039).

-  Detailed Endpoints: Each endpoint is documented with detailed descriptions, parameters, and expected responses.
-  Example Requests: Pre-configured example requests to help you quickly understand how to use each endpoint.
-  Environment Setup: Easily configurable environment variables to manage authentication and other settings.


## Contributing

Thanks for your interest in RibbonProtocol App. There are many ways you can contribute. To start, take a few minutes to look over the official guide:

**[Read the "Contributing to RibbonProtocol App" Guide &raquo;](/contributing.md)**

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch.
3. Make your changes and commit them.
4. Push to your fork and submit a pull request.

We happily await your pull requests and/or involvement in our [issues page](https://github.com/RibbonBlockchain/RibbonApp-BackEnd/issues) and hope to see your username on our [list of contributors](https://github.com/RibbonBlockchain/RibbonApp-BackEnd) 🎉🎉🎉

## Resources

To get a full idea of what RibbonProtocol is about, be sure to take a look at these other resources

1. [Website](https://ribbon-app-ten.vercel.app)
2. [Twitter]()
