# Accessible Parking

## Development

1. run
  ```
  npm install
  ```
  to install all package dependencies

2. Since this map uses tiles from OpenStreetMap and they require a valid Referer header, which means, also in local development, the web page need to be served via http.

  In this repo run
  ```
  npx serve
  ```
  and navigate to the local address in your browser.

## Initialization of the package

1. install pre-commit, e.g.
  ```
  pip install pre-commit
  brew install pre-commit
  ...
  ```

2. initialize pre-commit
  ```
  pre-commit install
  ```
  Then on each commit, pre-commit runs code checks, fixes css sorting etc. and tests javascript functionality.
