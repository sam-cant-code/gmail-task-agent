import React from 'react';
import useTaskStore from '../stores/taskStore';
import useUIStore from '../stores/uiStore';
import useEmailStore from '../stores/emailStore';

const TaskList = () => {
  const tasks = useTaskStore((state) => state.tasks);
  const isExtracting = useTaskStore((state) => state.isLoading);
  const extractTasks = useTaskStore((state) => state.extractTasks);
  const isGlobalLoading = useUIStore((state) => state.isGlobalLoading);
  const fetchEmails = useEmailStore((state) => state.fetchEmails);

  const handleRefresh = async () => {
    const emailData = await fetchEmails();
    if (emailData && emailData.messages.length > 0) {
      await extractTasks(emailData);
    } else {
        useUIStore.getState().setSuccessMessage("Checked your inbox. No new tasks found.");
    }
  };

  if (isGlobalLoading && tasks.length === 0) {
    return (
      <div className="text-center p-8 bg-white shadow-md rounded-lg mt-8">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-gray-600">Scanning your inbox for tasks...</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg mt-8">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">
          Your Tasks {tasks.length > 0 && `(${tasks.length})`}
        </h2>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          disabled={isExtracting}
        >
          {isExtracting ? 'Scanning...' : 'Refresh'}
        </button>
      </div>
      
      {tasks.length === 0 ? (
         <div className="text-center p-12">
           <p className="text-gray-500">No actionable tasks found in your recent emails.</p>
         </div>
      ) : (
        <div className="divide-y divide-gray-200 max-h-[70vh] overflow-y-auto">
          {tasks.map((task, index) => (
            <div key={index} className="p-4 hover:bg-gray-50">
              <p className="font-semibold text-gray-800">{task.description}</p>
              <div className="flex flex-wrap text-sm text-gray-600 mt-2 gap-x-4 gap-y-1">
                {task.dueDate && <span><strong>Due:</strong> {task.dueDate}</span>}
                {task.priority && <span><strong>Priority:</strong> {task.priority}</span>}
                {task.category && <span><strong>Category:</strong> {task.category}</span>}
                {task.assignedTo && <span><strong>Assigned To:</strong> {task.assignedTo}</span>}
              </div>
              <p className="text-xs text-blue-500 mt-1">
                From email: <span className="italic">{task.emailSubject}</span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskList;