# Accessible Parking

## Development

### Install dependencies
```
npm install
```

### Configuration

Copy `app-config.example.json` to `app-config.json` and set config data, if applicable.

### Run http server

Since this map uses tiles from OpenStreetMap and they require a valid Referer header, which means, also in local development, the web page need to be served via http.

In this repo run
```
npx serve
```
and navigate to the local address in your browser.

### Use pre-commit

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
