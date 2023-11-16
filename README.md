# drift-common


### quick start
```
git submodule init
git submoudle update

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