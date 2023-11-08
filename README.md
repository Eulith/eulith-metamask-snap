## Development
To install the snap:

1. Disable any existing MetaMask browser extension.
2. Install the [MetaMask Flask](https://metamask.io/flask/) extension for development.
3. Run `yarn install && yarn start` in this repo.
4. Open http://localhost:8000 and click 'Connect'.

To update the snap after a code change:

1. Open http://localhost:8000 (running `yarn start` will server this page automatically).
2. Click "Reconnect".

To view console logs:

1. Go to about://extensions in Chrome.
2. Make sure "Developer mode" is toggled in the top right.
3. Click on "MetaMask Flask > Details".
4. Click on "background.html" under "Inspect views".

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
