import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';

const JobStatusBoard = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]); // recent technician messages
  const [msgLoading, setMsgLoading] = useState(true);
  const [activeJobMessages, setActiveJobMessages] = useState([]);
  const [showMessagesModal, setShowMessagesModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyJob, setReplyJob] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [messageError, setMessageError] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [toasts, setToasts] = useState([]);

  const API_BASE = import.meta.env.VITE_API_BASE || 'https://progress.pythonanywhere.com/api';

  useEffect(() => {
    fetchJobs();
    fetchRecentMessages();
    const interval = setInterval(() => {
      fetchJobs();
      fetchRecentMessages(false);
    }, 5000); // refresh every 5s for near real-time message updates
    
    // Real-time listener for technician messages
    const handler = (e) => {
      console.log('Received technician message event:', e.detail);
      // Immediately refresh messages when technician sends one
      fetchRecentMessages(false);
      // Optionally refresh jobs if job ID is present
      if (e.detail?.jobId) {
        fetchJobs();
      }
      // Show a visual toast on admin dashboard
      try {
        const m = e.detail?.message || e.detail;
        const toast = {
          id: Date.now(),
          jobId: e.detail?.jobId || m.job || null,
          title: `Message from ${m.sender_name || m.sender?.username || 'Technician'}`,
          body: m.message || m.message_text || '',
        };
        setToasts(prev => [toast, ...prev]);
        // Auto-dismiss after 6 seconds
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toast.id)), 6000);
      } catch (err) {
        console.warn('Failed to show toast:', err);
      }
    };
    window.addEventListener('technician-message-sent', handler);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('technician-message-sent', handler);
    };
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/dashboard/active-jobs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentMessages = async (showSpinner = true) => {
    if (showSpinner) setMsgLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/jobs/messages/recent/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
  const msgs = Array.isArray(data) ? data : [];
  console.log('[JobStatusBoard] fetched recent messages', msgs.map(m => ({ id: m.id, job: m.job, sender: m.sender_name, recipient: m.recipient_name })));
  setMessages(msgs);
      }
    } catch (e) {
      console.error('Error fetching messages:', e);
    } finally {
      if (showSpinner) setMsgLoading(false);
    }
  };

  const openAllMessages = async (job) => {
    setShowMessagesModal(true);
    setActiveJobMessages([]);
    try {
      const token = localStorage.getItem('token');
      // Mark messages read for this job for the current admin when opening
      try {
        await fetch(`${API_BASE}/jobs/${job.id}/messages/mark-read/`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        // refresh recent messages to update UI badges/previews
        fetchRecentMessages(false);
      } catch (mrErr) {
        console.warn('Failed to mark messages read:', mrErr);
      }
      const res = await fetch(`${API_BASE}/jobs/${job.id}/messages/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActiveJobMessages(data);
      }
    } catch (e) {
      console.error('Error loading job messages', e);
    }
  };

  const openReply = (job) => {
  setReplyJob(job);
  setReplyText('');
  setMessageError(null);
  // Try to pre-select the assigned technician as recipient when possible
  const possibleTechId = job?.technician_id || job?.technician?.id || job?.assigned_technician || job?.assigned_technician_id || null;
  setSelectedRecipient(possibleTechId || '');
  setShowReplyModal(true);
  loadRecipients();
  };

  const loadRecipients = async () => {
    try {
      const token = localStorage.getItem('token');
      // Reuse technicians endpoint for potential recipients; in real scenario, would fetch supervisors/admins
      const res = await fetch(`${API_BASE}/jobs/technicians/`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setRecipients(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Error loading recipients', e);
    }
  };

  const sendReply = async () => {
    if (!replyJob || !replyText.trim() || !selectedRecipient) {
      setMessageError('Message and recipient required');
      return;
    }
    setSending(true);
    setMessageError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/jobs/${replyJob.id}/send-message/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ recipient_id: selectedRecipient, message: replyText.trim() })
      });
      if (res.ok) {
        const newMessage = await res.json().catch(() => null);
        setShowReplyModal(false);
        fetchRecentMessages(false);
        // Dispatch an event so the technician client can refresh immediately
        try {
          window.dispatchEvent(new CustomEvent('admin-message-sent', { detail: { message: newMessage, jobId: replyJob?.id || (replyJob && replyJob.id) } }));
        } catch (evErr) {
          console.warn('Could not dispatch admin-message-sent event', evErr);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        setMessageError(err.message || 'Failed to send');
      }
    } catch (e) {
      setMessageError('Network error');
    } finally {
      setSending(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'in-progress': 'bg-accent text-accent-foreground',
      'pending': 'bg-warning text-warning-foreground',
      'completed': 'bg-success text-success-foreground'
    };
    return colors[status] || 'bg-secondary text-secondary-foreground';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'high': 'text-error',
      'medium': 'text-warning',
      'low': 'text-success'
    };
    return colors[priority] || 'text-text-secondary';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'in-progress': 'Clock',
      'pending': 'AlertCircle',
      'completed': 'CheckCircle'
    };
    return icons[status] || 'Circle';
  };

  return (<>
    <div className="bg-surface rounded-lg shadow-card border border-border">
      {/* Toast container (admin) */}
      <div className="fixed top-6 right-6 z-50 space-y-2">
        {toasts.map(t => (
          <div key={t.id} className="bg-surface border border-border shadow-lg rounded-md p-3 w-80 cursor-pointer hover:shadow-md" onClick={() => { if (t.jobId) openAllMessages({ id: t.jobId }); setToasts(prev => prev.filter(x => x.id !== t.id)); }}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-body-medium text-text-primary">{t.title}</div>
                <div className="text-xs text-text-secondary mt-1 line-clamp-2">{t.body}</div>
              </div>
              <button onClick={(ev) => { ev.stopPropagation(); setToasts(prev => prev.filter(x => x.id !== t.id)); }} className="ml-3 text-text-secondary text-sm">✕</button>
            </div>
          </div>
        ))}
      </div>
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-heading-semibold text-text-primary">Messages from Technicians</h2>
          <div className="flex items-center space-x-2">
            <Icon name="RefreshCw" size={16} className="text-text-secondary" />
            <span className="text-sm text-text-secondary">Live Updates</span>
          </div>
        </div>
      </div>
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Icon name="Loader" size={32} className="animate-spin text-accent" />
            <span className="ml-2 text-text-secondary">Loading jobs...</span>
          </div>
        ) : jobs.length > 0 ? (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {jobs.map((job) => {
              const jobMessages = messages.filter(m => m.job === job.id).slice(0,3); // show last 3 per job
              return (
            <div key={job.id} className="border border-border rounded-lg p-4 micro-interaction hover:shadow-md">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`px-2 py-1 rounded-full text-xs font-body-medium ${getStatusColor(job.status)}`}>
                    <div className="flex items-center space-x-1">
                      <Icon name={getStatusIcon(job.status)} size={12} />
                      <span className="capitalize">{job.status.replace('-', ' ')}</span>
                    </div>
                  </div>
                  <span className={`text-xs font-body-medium ${getPriorityColor(job.priority)}`}>
                    {job.priority.toUpperCase()} PRIORITY
                  </span>
                </div>
                <span className="text-sm font-data-normal text-text-secondary">{job.id}</span>
              </div>
              
              <div className="mb-3">
                <h3 className="text-sm font-heading-medium text-text-primary mb-1">{job.vehicle}</h3>
                <p className="text-sm text-text-secondary">Customer: {job.customer}</p>
                <p className="text-sm text-text-secondary">Technician: {job.technician}</p>
              </div>

              <div className="mb-3">
                <div className="flex flex-wrap gap-1">
                  {job.services.map((service, index) => (
                    <span key={index} className="px-2 py-1 bg-background text-text-secondary text-xs rounded">
                      {service}
                    </span>
                  ))}
                </div>
              </div>

              {job.status === 'in-progress' && (
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-text-secondary">Progress</span>
                    <span className="text-xs font-data-normal text-text-primary">{job.progress}%</span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2">
                    <div 
                      className="bg-accent h-2 rounded-full state-transition" 
                      style={{ width: `${job.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Technician Messages Preview */}
              <div className="mb-3">
                <div className="flex items-center mb-1">
                  <Icon name="MessageSquare" size={14} className="text-text-secondary mr-1" />
                  <span className="text-xs uppercase tracking-wide text-text-secondary">Latest Messages</span>
                  {msgLoading && <Icon name="Loader" size={12} className="animate-spin ml-2 text-accent" />}
                </div>
                {jobMessages.length === 0 ? (
                  <p className="text-xs text-text-disabled italic">No messages</p>
                ) : (
                  <ul className="space-y-2">
                    {jobMessages.map(m => (
                      <li key={m.id} className="text-xs border-l-2 border-accent/30 pl-2 py-1 bg-background/50 rounded-r">
                        <div className="flex items-start justify-between">
                          <span className="font-body-medium text-accent">{m.sender_name}</span>
                          <span className="text-text-disabled text-[10px]">
                            {new Date(m.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-text-secondary line-clamp-2 mt-1">{m.message}</p>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex space-x-2 mt-2">
                  <button onClick={() => openAllMessages(job)} className="text-xs text-accent hover:underline">View All</button>
                  <button onClick={() => openReply(job)} className="text-xs text-accent hover:underline">Reply</button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-text-secondary">
                <div className="flex items-center space-x-1">
                  <Icon name="Clock" size={12} />
                  <span>Est. {job.estimatedTime}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="micro-interaction hover:text-text-primary">
                    <Icon name="Eye" size={14} />
                  </button>
                  <button className="micro-interaction hover:text-text-primary">
                    <Icon name="Edit" size={14} />
                  </button>
                </div>
              </div>
            </div>
          );})}
          </div>
        ) : (
          // No active jobs - show recent messages globally so admin can still see technician messages
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <h3 className="text-sm font-heading-medium text-text-primary mb-2">Recent Technician Messages</h3>
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <Icon name="Inbox" size={48} className="mx-auto mb-4 opacity-50 text-text-secondary" />
                <p className="text-lg font-body-medium text-text-secondary">No messages yet</p>
                <p className="text-sm text-text-secondary">Messages will appear here when technicians send them</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {messages.map(m => (
                  <li key={m.id} className="border border-border rounded-lg p-3 flex items-start justify-between">
                    <div>
                      <div className="text-sm font-body-medium text-text-primary">{m.sender_name} {m.job ? <span className="text-xs text-text-secondary">| JOB-{m.job}</span> : null}</div>
                      <div className="text-xs text-text-secondary mt-1 line-clamp-2">{m.message}</div>
                      <div className="text-xs text-text-disabled mt-1">{new Date(m.sent_at).toLocaleString()}</div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      {m.job ? (
                        <button onClick={() => openAllMessages({ id: m.job })} className="text-xs text-accent hover:underline">View Job</button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
    </div>
  </div>
  {showMessagesModal && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-surface rounded-lg w-full max-w-lg p-4 shadow-lg">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-heading-medium">Job Messages</h2>
            <button onClick={() => setShowMessagesModal(false)} className="micro-interaction"><Icon name="X" size={16} /></button>
          </div>
          <div className="h-64 overflow-y-auto space-y-3 pr-2">
            {activeJobMessages.length === 0 ? (
              <p className="text-xs text-text-secondary">No messages.</p>
            ) : activeJobMessages.map(m => (
              <div key={m.id} className="border border-border rounded p-2">
                <div className="flex justify-between text-[10px] text-text-secondary mb-1">
                  <span>{m.sender_name} → {m.recipient_name}</span>
                  <span>{new Date(m.sent_at).toLocaleString()}</span>
                </div>
                <p className="text-xs text-text-primary whitespace-pre-wrap">{m.message}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-end">
            <button onClick={() => setShowMessagesModal(false)} className="px-3 py-1 text-xs rounded bg-background hover:bg-background/70 state-transition">Close</button>
          </div>
        </div>
      </div>
  )}
  {showReplyModal && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-surface rounded-lg w-full max-w-md p-4 shadow-lg">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-heading-medium">Send Message (Job {replyJob?.id})</h2>
            <button onClick={() => setShowReplyModal(false)} className="micro-interaction"><Icon name="X" size={16} /></button>
          </div>
          <div className="space-y-3">
            <div>
              <label htmlFor="replyRecipient" className="block text-[11px] text-text-secondary mb-1">Recipient</label>
              <select id="replyRecipient" name="recipient" value={selectedRecipient} onChange={e=>setSelectedRecipient(e.target.value)} className="w-full bg-background border border-border rounded px-2 py-1 text-xs">
                <option value="">Select recipient</option>
                {recipients.map(r => (
                  <option key={r.id} value={r.id}>{r.name || r.username || r.full_name || r.email}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="replyMessage" className="block text-[11px] text-text-secondary mb-1">Message</label>
              <textarea id="replyMessage" name="message" value={replyText} onChange={e=>setReplyText(e.target.value)} rows={4} className="w-full bg-background border border-border rounded px-2 py-1 text-xs resize-none" placeholder="Type your message" aria-invalid={!!messageError} />
            </div>
            {messageError && <p className="text-xs text-danger-500">{messageError}</p>}
            <div className="flex justify-end space-x-2">
              <button onClick={()=>setShowReplyModal(false)} className="px-3 py-1 text-xs rounded bg-background hover:bg-background/70 state-transition">Cancel</button>
              <button disabled={sending} onClick={sendReply} className="px-3 py-1 text-xs rounded bg-accent text-white flex items-center space-x-1 disabled:opacity-60">
                {sending && <Icon name="Loader" size={12} className="animate-spin" />}
                <span>Send</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
  </>);
};

export default JobStatusBoard;
