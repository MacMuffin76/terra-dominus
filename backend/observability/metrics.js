const client = require('prom-client');
const { getIO } = require('../socket');
const { getQueue, queueNames } = require('../jobs/queueConfig');

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Durée des requêtes HTTP',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5],
});

const httpErrors = new client.Counter({
  name: 'http_requests_errors_total',
  help: 'Nombre total de réponses en erreur',
  labelNames: ['method', 'route', 'status_code'],
});

const queueGauge = new client.Gauge({
  name: 'queue_jobs_total',
  help: 'Jobs dans les files BullMQ par état',
  labelNames: ['queue', 'state'],
});

const activeSocketsGauge = new client.Gauge({
  name: 'socket_active_connections',
  help: 'Nombre de sockets Socket.IO actives',
});

const productionTickDuration = new client.Histogram({
  name: 'production_tick_duration_seconds',
  help: 'Temps de traitement du tick de production',
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5],
});

register.registerMetric(httpDuration);
register.registerMetric(httpErrors);
register.registerMetric(queueGauge);
register.registerMetric(activeSocketsGauge);
register.registerMetric(productionTickDuration);

const metricQueues = Object.values(queueNames);

const updateQueueMetrics = async () => {
  await Promise.all(
    metricQueues.map(async (name) => {
      const queue = getQueue(name);
      const counts = await queue.getJobCounts(
        'waiting',
        'active',
        'delayed',
        'failed',
        'completed',
        'paused',
      );

      Object.entries(counts).forEach(([state, value]) => {
        queueGauge.set({ queue: name, state }, value || 0);
      });
    }),
  );
};

const updateSocketGauge = () => {
  const io = getIO();
  const activeConnections = io ? io.sockets.sockets.size : 0;
  activeSocketsGauge.set(activeConnections);
};

const metricsMiddleware = (req, res, next) => {
  const route = req.route?.path ? `${req.baseUrl}${req.route.path}` : req.path || 'unknown';
  const end = httpDuration.startTimer({ method: req.method, route });

  res.on('finish', () => {
    const labels = { method: req.method, route, status_code: res.statusCode };
    end(labels);

    if (res.statusCode >= 500) {
      httpErrors.inc(labels);
    }
  });

  next();
};

const metricsHandler = async (_req, res) => {
  await updateQueueMetrics();
  updateSocketGauge();

  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
};

const trackProductionTick = async (fn) => {
  const end = productionTickDuration.startTimer();
  try {
    return await fn();
  } finally {
    end();
  }
};

module.exports = { metricsMiddleware, metricsHandler, trackProductionTick };