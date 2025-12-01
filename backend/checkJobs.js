const { getQueue, queueNames } = require('./jobs/queueConfig');

async function checkJobs() {
  const queue = getQueue(queueNames.CONSTRUCTION);
  
  const jobs = await queue.getJobs(['completed', 'failed', 'active', 'waiting', 'delayed']);
  
  console.log(`\nTotal jobs in construction queue: ${jobs.length}\n`);
  
  for (const job of jobs) {
    const state = await job.getState();
    console.log(`Job ID: ${job.id}`);
    console.log(`  State: ${state}`);
    console.log(`  Data:`, job.data);
    console.log(`  ProcessedOn: ${job.processedOn}`);
    console.log(`  FinishedOn: ${job.finishedOn}`);
    console.log(`  FailedReason: ${job.failedReason || 'N/A'}`);
    console.log('---');
  }
  
  process.exit(0);
}

checkJobs().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
