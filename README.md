# drift-common

## quick start

```bash

git submodule init
git submodule update

yarn

cd protocol
yarn
yarn build
cd sdk
yarn
yarn build
npm link
cd ../..

# do this for the packages that requires sdk
npm link @drift-labs/sdk

```
