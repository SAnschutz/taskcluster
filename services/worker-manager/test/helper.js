const libUrls = require('taskcluster-lib-urls');
const taskcluster = require('taskcluster-client');
const {stickyLoader, Secrets, withEntity, fakeauth} = require('taskcluster-lib-testing');
const builder = require('../src/api');
const data = require('../src/data');
const load = require('../src/main');

exports.rootUrl = 'http://localhost:60409';

exports.load = stickyLoader(load);
exports.load.inject('profile', 'test');
exports.load.inject('process', 'test');

// set up the testing secrets
exports.secrets = new Secrets({
  secretName: 'project/taskcluster/testing/taskcluster-worker-manager',
  secrets: {
    taskcluster: [
      {env: 'TASKCLUSTER_CLIENT_ID', cfg: 'taskcluster.credentials.clientId', name: 'clientId'},
      {env: 'TASKCLUSTER_ACCESS_TOKEN', cfg: 'taskcluster.credentials.accessToken', name: 'accessToken'},
      {env: 'TASKCLUSTER_ROOT_URL', cfg: 'taskcluster.rootUrl', name: 'rootUrl', mock: libUrls.testRootUrl()},
    ],
  },
  load: exports.load,
});

exports.withEntities = (mock, skipping) => {
  withEntity(mock, skipping, exports, 'WorkerType', data.WorkerType);
};

exports.withServer = (mock, skipping) => {
  let webServer;

  suiteSetup(async function() {
    if (skipping()) {
      return;
    }

    await exports.load('cfg');

    exports.load.cfg('taskcluster.rootUrl', exports.rootUrl);
    fakeauth.start({
      'test-client': ['*'],
    }, {rootUrl: exports.rootUrl});

    // Create client for working with API
    exports.WorkerManager = taskcluster.createClient(builder.reference());

    exports.workerManager = new exports.WorkerManager({
      // Ensure that we use global agent, to avoid problems with keepAlive
      // preventing tests from exiting
      agent: require('http').globalAgent,
      rootUrl: exports.rootUrl,
      credentials: {
        clientId: 'test-client',
        accessToken: 'none',
      },
    });

    webServer = await exports.load('server');
  });

  suiteTeardown(async function() {
    if (webServer) {
      await webServer.terminate();
      webServer = null;
    }
  });
};
