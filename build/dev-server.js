require('./check-versions')();

const config = require('../config');

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = JSON.parse(config.dev.env.NODE_ENV);
}

const open = require('open');
const path = require('path');
const chalk = require('chalk');
const express = require('express');
const webpack = require('webpack');
const proxyMiddleware = require('http-proxy-middleware');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const webpackConfig =
  process.env.NODE_ENV === 'testing' || process.env.NODE_ENV === 'production'
    ? require('./webpack.prod.conf')
    : require('./webpack.dev.conf');

// default port where dev server listens for incoming traffic
const port = process.env.PORT || config.dev.port;
// automatically open browser, if not set will be false
const autoOpenBrowser = !!config.dev.autoOpenBrowser;
// Define HTTP proxies to your custom API backend
// https://github.com/chimurai/http-proxy-middleware
const proxyTable = config.dev.proxyTable;

const app = express();

const compiler = webpack(webpackConfig);

const wdmInstance = webpackDevMiddleware(compiler, {
  publicPath: webpackConfig.output.publicPath,
  quiet: true,
});

const hotMiddleware = webpackHotMiddleware(compiler, {
  log: false,
  heartbeat: 2000,
});

// force page reload when html-webpack-plugin template changes
compiler.hooks.compilation.tap('html-webpack-plugin-after-emit', () => {
  hotMiddleware.publish({
    action: 'reload',
  });
});

// proxy api requests
Object.keys(proxyTable).forEach(context => {
  const options = proxyTable[context];
  if (typeof options === 'string') {
    options = { target: options };
  }
  app.use(proxyMiddleware(options.filter || context, options));
});

// handle fallback for HTML5 history API
app.use(require('connect-history-api-fallback')());

// serve webpack bundle output
app.use(wdmInstance);

// enable hot-reload and state-preserving
// compilation error display
app.use(hotMiddleware);

// serve pure static assets
const staticPath = path.posix.join(config.dev.assetsPublicPath, config.dev.assetsSubDirectory);
app.use(staticPath, express.static('./static'));

module.exports = new Promise(resolve => {
  console.log('> Starting dev server...');
  const server = app.listen(port, err => {
    if (err) {
      console.error(err);
    }

    wdmInstance.waitUntilValid(() => {
      const uri = 'http://localhost:' + port;
      if (autoOpenBrowser && process.env.NODE_ENV !== 'testing') {
        open(uri);
        console.log('> Listening at ' + uri + '\n');
      }
    });
  });

  resolve({
    port,
    close: () => {
      server.close();
    },
  });
});
