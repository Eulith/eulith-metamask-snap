## Development

To install the snap:

1. Disable any existing MetaMask browser extension.
2. Install the [MetaMask Flask](https://metamask.io/flask/) extension for development.
3. Run `yarn install && yarn start` in this repo.
4. Start a local instance of Eulith backend services.
5. Start a local instance of the Eulith frontend.
6. Open http://localhost:3000/metamask and click 'Install'.

To update the snap after a code change:

1. Uninstall the snap from inside MetaMask Flask.
2. Repeat installation steps above.

To view console logs:

1. Go to about://extensions in Chrome.
2. Make sure "Developer mode" is toggled in the top right.
3. Click on "MetaMask Flask > Details".
4. Click on "background.html" under "Inspect views".

To publish the snap to NPM:

```shell
npm publish
```

To run tests (tests may not work if a server is already running):

```shell
yarn test
```

To run linter:

```shell
yarn lint
```

## Docs

- Tutorial: https://docs.metamask.io/snaps/get-started/quickstart/
- Snap UI: https://docs.metamask.io/snaps/how-to/use-custom-ui/
- Snap JSON-RPC API: https://docs.metamask.io/snaps/reference/rpc-api/
- Snap exports (including `onTransaction`): https://docs.metamask.io/snaps/reference/exports/
