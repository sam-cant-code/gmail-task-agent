import React from 'react';
import useTaskStore from '../stores/taskStore';
import useUIStore from '../stores/uiStore';
import useEmailStore from '../stores/emailStore';

const TaskList = () => {
  const tasks = useTaskStore((state) => state.tasks);
  const isExtracting = useTaskStore((state) => state.isLoading);
  const extractTasks = useTaskStore((state) => state.extractTasks);
  const addTaskToCalendar = useTaskStore((state) => state.addTaskToCalendar);
  const isGlobalLoading = useUIStore((state) => state.isGlobalLoading);
  const autoAddTask = useUIStore((state) => state.autoAddTask);
  const toggleAutoAddTask = useUIStore((state) => state.toggleAutoAddTask);
  const fetchEmails = useEmailStore((state) => state.fetchEmails);

  const handleRefresh = async () => {
    const emailData = await fetchEmails();
    if (emailData && emailData.messages.length > 0) {
      await extractTasks(emailData, autoAddTask);
    } else {
      useUIStore.getState().setSuccessMessage("Checked your inbox. No new tasks found.");
    }
  };

  const handleManualAdd = (task) => {
    addTaskToCalendar(task);
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-900/30 text-red-300 border-red-800/50';
      case 'medium': return 'bg-amber-900/30 text-amber-300 border-amber-800/50';
      case 'low': return 'bg-emerald-900/30 text-emerald-300 border-emerald-800/50';
      default: return 'bg-gray-800 text-gray-300 border-gray-700';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      );
      case 'medium': return (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
      default: return null;
    }
  };

  if (isGlobalLoading && tasks.length === 0) {
    return (
      <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-12 text-center">
        <div className="w-14 h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <h3 className="mt-6 text-lg font-semibold text-white">Scanning your inbox</h3>
        <p className="mt-2 text-gray-400">Looking for actionable tasks in your recent emails...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600/20 backdrop-blur rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Your Tasks</h2>
              {tasks.length > 0 && (
                <p className="text-sm text-gray-400">{tasks.length} tasks found</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-300">
                <span>Manual Add</span>
                <button
                    onClick={toggleAutoAddTask}
                    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
                    autoAddTask ? 'bg-blue-600' : 'bg-gray-600'
                    }`}
                >
                    <span
                    className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                        autoAddTask ? 'translate-x-6' : 'translate-x-1'
                    }`}
                    />
                </button>
                <span>Auto Add</span>
            </div>

            <button
              onClick={handleRefresh}
              disabled={isExtracting}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
            >
              <svg className={`w-4 h-4 mr-2 ${isExtracting ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isExtracting ? 'Scanning...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Content */}
      {tasks.length === 0 ? (
        <div className="text-center py-16 px-6">
          <div className="w-20 h-20 bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No tasks found</h3>
          <p className="text-gray-400 max-w-sm mx-auto">
            We haven't found any actionable tasks in your recent emails. Try refreshing or check back later.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-700/50">
          {tasks.map((task, index) => (
            <div 
              key={index} 
              className={`p-4 transition-colors duration-150 group flex justify-between items-start gap-4 ${
                index % 2 !== 0 ? 'bg-white/5' : ''
              } hover:bg-blue-900/40`}
            >
              <div>
                <h3 className="font-semibold text-white text-base leading-tight">
                  {task.description}
                </h3>
                
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs mt-2">
                  {task.priority && (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium border ${getPriorityColor(task.priority)}`}>
                      {getPriorityIcon(task.priority)}
                      <span>{task.priority}</span>
                    </span>
                  )}
                  {task.dueDate && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-900/30 text-blue-300 rounded-md font-medium border border-blue-800/50">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  )}
                  {task.category && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-900/30 text-purple-300 rounded-md font-medium border border-purple-800/50">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      {task.category}
                    </span>
                  )}
                  {task.assignedTo && (
                    <div className="inline-flex items-center gap-1.5 text-gray-400">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="font-medium text-gray-300">{task.assignedTo}</span>
                    </div>
                  )}
                  {task.emailSubject && (
                      <div className="inline-flex items-center gap-1.5 text-blue-400">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="italic">{task.emailSubject}</span>
                    </div>
                  )}
                </div>
              </div>
              
                {!autoAddTask && (
                    <button
                        onClick={() => handleManualAdd(task)}
                        // --- NEW: Disable if creating or already created ---
                        disabled={task.isCreating || task.created}
                        className={`mt-2 inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        task.created
                            ? 'bg-green-500/20 text-green-300 cursor-not-allowed'
                            : task.isCreating
                            ? 'bg-gray-600 text-gray-400 cursor-wait'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                    >
                        {task.created ? (
                          <>
                              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                              Added
                          </>
                        ) : task.isCreating ? (
                          <>
                              <svg className="animate-spin w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Adding...
                          </>
                        ) : (
                          <>
                              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                              Add to Calendar
                          </>
                        )}
                    </button>
                )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskList;