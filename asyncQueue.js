
/*
 * Module that provides an asynchronous queue for tasks
 */

// Exporting the interface
exports.createQueue = () => new AsyncQueue();


class AsyncQueue {

    constructor () {
        this.queue = [];
    }


    // Adds a task to the queue
    // Task is an object of type { action: func, args: array, callback: func(arg) }
    addTask(task) {

        if (this.queue.length == 0) {
            this.queue.push(task);
            this.invokeTask(task);
        }
        else {
            this.queue.push(task);
        }
    }


    // Invoking the task
    invokeTask(task) {

        if (!task) {
            return;
        }
    
        task.action(...task.args, (err, res) => {
    
            if (task.callback) {
                task.callback(err, res);
            }
    
            // Removing the task from queue
            this.queue.shift();
    
            // Calling the next task in queue
            this.invokeTask(this.queue[0]);
        });
    }
}