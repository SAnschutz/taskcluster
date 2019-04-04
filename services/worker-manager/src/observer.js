const Iterate = require('taskcluster-lib-iterate');
const pMap = require('p-map');

/**
 * This simply calculates the number of workers we want for each workertype
 * and makes this available to providers which can provision these workers
 * however they see fit.
 */
class Observer {
  constructor({
    maxIterationTime = 30 * 1000,
    waitTime = 20 * 1000, // Queue only refreshes pending counts ever 20 seconds
    pollingConcurrency = 20,
    provisionerId,
    monitor,
    queue,
    WorkerType,
  }) {

    this.queue = queue;
    this.pollingConcurrency = pollingConcurrency;
    this.provisionerId = provisionerId;
    this.WorkerType = WorkerType;

    this.iterate = new Iterate({
      maxIterationTime,
      waitTime,
      monitor,
      handler: async () => {
        await this.poll();
      },
    });
  }

  /**
   * Start the Provisioner
   */
  async initiate() {
    await new Promise(resolve => {
      this.iterate.once('started', resolve);
      this.iterate.start();
    });
  }

  /**
   * Terminate the Provisioner
   */
  async terminate() {
    await new Promise(resolve => {
      this.iterate.once('stopped', resolve); // TODO: Update this and initiate when #535 lands
      this.iterate.stop();
    });
  }

  /**
   * Run a single observation iteration
   */
  async poll(watchdog) {
    // First get list of all workertypes managed by worker-manager.
    // Then for each one reach out to the queue and find its pending count. Update cache (used by both providers and UI)
    // Then for each one check with the provider to see how many are running. Update cache (used by UI)

    //await this.WorkerType.scan({
    //  handler: async entry => {
    //    const {pendingTasks} = await this.queue.pendingTasks(this.provisionerId, workerType);
    //    await entry.modify(); // TODO: Actually make this set desired number of workers instead
    //  },
    //});
    pMap(['test-worker', 'foo-bar', 'baz'], async workerType => {
      console.log();
    }, {concurrency: this.pollingConcurrency});
  }
}

module.exports = {
  Observer,
};
