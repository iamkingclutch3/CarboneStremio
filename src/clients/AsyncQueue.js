class AsyncQueue {
  constructor(worker, concurrency = 1) {
    this.worker = worker;
    this.concurrency = concurrency;
    this.tasks = [];
    this.active = 0;
  }

  push(task) {
    this.tasks.push(task);
    this.next();
  }

  next() {
    if (this.active >= this.concurrency || !this.tasks.length) return;

    this.active++;
    const task = this.tasks.shift();

    this.worker(task)
      .catch((err) => {
        if (dev > 0) console.error("Queue task error:", err);
      })
      .finally(() => {
        this.active--;
        this.next();
      });
  }

  length() {
    return this.tasks.length;
  }
}

export default AsyncQueue;