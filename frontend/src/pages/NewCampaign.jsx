import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import {
  PaperAirplaneIcon,
  PhotoIcon,
  DevicePhoneMobileIcon,
  UserGroupIcon,
  DocumentArrowUpIcon,
  XMarkIcon,
  CalendarDaysIcon,
  PaperClipIcon,
  BoldIcon,
  ItalicIcon,
  CodeBracketIcon,
  TableCellsIcon,
  TagIcon,
  ClockIcon,
  SparklesIcon,
  MegaphoneIcon
} from '@heroicons/react/24/outline';

export default function NewCampaign() {
  const [instances, setInstances] = useState([]);
  const [segments, setSegments] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    instanceIds: [],
    message: '', // Kept for backward compatibility, will sync with messages[0]
    messages: [''], // Array of message templates
    numbers: '',
    delayMin: 15,
    delayMax: 25,
    instanceSwitchCount: 50,
    messageRotationCount: 1,
    scheduleEnabled: false,
    scheduledAt: '',
    endAt: ''
  });
  const [file, setFile] = useState(null); // CSV contact file
  const [mediaFile, setMediaFile] = useState(null); // Media attachment
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('manual'); // 'manual', 'csv', 'sheet', 'segment'
  const [sheetUrl, setSheetUrl] = useState('');
  const [sheetColumns, setSheetColumns] = useState([]);
  const [phoneColumn, setPhoneColumn] = useState('');
  const [fetchingColumns, setFetchingColumns] = useState(false);
  const [segmentId, setSegmentId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchInstances();
    fetchSegments();
  }, []);

  const fetchSegments = async () => {
    try {
      const response = await api.get('/segments');
      setSegments(response.data);
    } catch (e) {
      console.error('Failed to fetch segments', e);
    }
  };

  const fetchInstances = async () => {
    try {
      const response = await api.get('/instances');
      setInstances(response.data.instances.filter(i => i.status === 'connected'));
    } catch (error) {
      console.error('Failed to fetch instances', error);
    }
  };

  const fetchSheetColumns = async () => {
    if (!sheetUrl) return;
    setFetchingColumns(true);
    setSheetColumns([]);
    setPhoneColumn('');
    try {
      const response = await api.post('/campaigns/preview-sheet', { url: sheetUrl });
      setSheetColumns(response.data.columns);
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to fetch sheet columns. Ensure it is public.');
    } finally {
      setFetchingColumns(false);
    }
  };

  const toggleInstance = (id) => {
    const currentIds = formData.instanceIds;
    if (currentIds.includes(id)) {
      setFormData({ ...formData, instanceIds: currentIds.filter(i => i !== id) });
    } else {
      setFormData({ ...formData, instanceIds: [...currentIds, id] });
    }
  };

  const handleMessageChange = (index, value) => {
    const newMessages = [...formData.messages];
    newMessages[index] = value;
    setFormData({
      ...formData,
      messages: newMessages,
      message: newMessages[0] // Sync primary message
    });
  };

  const addMessageTemplate = () => {
    setFormData({ ...formData, messages: [...formData.messages, ''] });
  };

  const removeMessageTemplate = (index) => {
    if (formData.messages.length > 1) {
      const newMessages = formData.messages.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        messages: newMessages,
        message: newMessages[0]
      });
    }
  };

  const insertFormatting = (index, type) => {
    const textarea = document.getElementById(`message-input-${index}`);
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.messages[index];
    const selectedText = text.substring(start, end);
    let newText = '';

    switch (type) {
      case 'bold': newText = `*${selectedText}*`; break;
      case 'italic': newText = `_${selectedText}_`; break;
      case 'strike': newText = `~${selectedText}~`; break;
      case 'code': newText = `\`\`\`${selectedText}\`\`\``; break;
      default: return;
    }

    const updatedMessage = text.substring(0, start) + newText + text.substring(end);
    handleMessageChange(index, updatedMessage);

    // Restore focus (timeout needed for React re-render)
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + newText.length, start + newText.length);
    }, 0);
  };

  const insertVariable = (index, variable) => {
    const textarea = document.getElementById(`message-input-${index}`);
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.messages[index];
    const newText = `{{${variable}}}`;

    const updatedMessage = text.substring(0, start) + newText + text.substring(end);
    handleMessageChange(index, updatedMessage);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + newText.length, start + newText.length);
    }, 0);
  };

  const formatNumbers = () => {
    if (!formData.numbers) return;

    // Split by newlines, clean each
    const lines = formData.numbers.split('\n');
    const cleaned = lines.map(line => {
      // Remove all non-digits
      let num = line.replace(/[^0-9]/g, '');
      return num;
    }).filter(n => n.length > 0).join('\n'); // Join back

    setFormData({ ...formData, numbers: cleaned });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      data.append('name', formData.name);

      // Append each instance ID
      formData.instanceIds.forEach(id => {
        data.append('instanceIds', id); // Express/Multer handles array of same key
      });

      // Append each message template
      formData.messages.forEach(msg => {
        data.append('messages', msg);
      });

      data.append('message', formData.message); // Legacy support
      data.append('delayMin', formData.delayMin);
      data.append('delayMax', formData.delayMax);
      data.append('instanceSwitchCount', formData.instanceSwitchCount);
      data.append('messageRotationCount', formData.messageRotationCount);

      if (formData.scheduleEnabled && formData.scheduledAt) {
        data.append('scheduledAt', new Date(formData.scheduledAt).toISOString());
      }
      if (formData.endAt) {
        data.append('endAt', new Date(formData.endAt).toISOString());
      }

      if (activeTab === 'manual') {
        data.append('numbers', formData.numbers);
      } else if (activeTab === 'csv' && file) {
        data.append('file', file);
      } else if (activeTab === 'sheet') {
        data.append('googleSheetUrl', sheetUrl);
        data.append('phoneColumn', phoneColumn);
      } else if (activeTab === 'segment' && segmentId) {
        data.append('segmentId', segmentId);
      }

      if (mediaFile) {
        data.append('media', mediaFile);
      }

      await api.post('/campaigns', data);

      navigate('/campaigns');
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-indigo-500/30 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header Section */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <MegaphoneIcon className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white mb-1">Create Campaign</h1>
            <p className="text-sm text-zinc-400 font-medium">Configure and launch a new broadcast.</p>
          </div>
        </div>

        <div className="relative isolate">
          {/* Subtle gradient background for the form */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-indigo-500/5 to-transparent rounded-3xl" aria-hidden="true" />

          <div className="glass-card border border-white/5 bg-zinc-900/40 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-sm">

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Campaign Name */}
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-2">Campaign Name</label>
                <input
                  type="text"
                  required
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-zinc-600"
                  placeholder="e.g. Summer Sale Promo"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Instance Selection (Multi-Select) */}
              <div className="pt-2">
                <label className="block text-sm font-semibold text-zinc-300 mb-2">Select WhatsApp Instances <span className="text-indigo-400 font-mono font-normal ml-1">({formData.instanceIds.length})</span></label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {instances.length === 0 ? (
                    <div className="col-span-2 p-4 bg-rose-500/10 text-rose-400 rounded-xl text-sm border border-rose-500/20 font-medium">
                      No connected instances found. Please connect a WhatsApp number first.
                    </div>
                  ) : (
                    instances.map(instance => (
                      <div
                        key={instance.id}
                        onClick={() => toggleInstance(instance.id)}
                        className={`cursor-pointer rounded-xl p-4 flex items-center gap-4 transition-all ${formData.instanceIds.includes(instance.id)
                          ? 'bg-indigo-500/10 border border-indigo-500/50 shadow-[0_0_15px_-3px_rgba(99,102,241,0.2)]'
                          : 'bg-black/40 border border-white/5 hover:border-white/10'
                          }`}
                      >
                        <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${formData.instanceIds.includes(instance.id) ? 'bg-indigo-500 text-white' : 'bg-transparent border border-white/20'
                          }`}>
                          {formData.instanceIds.includes(instance.id) && (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                          )}
                        </div>
                        <div>
                          <p className={`font-semibold text-sm ${formData.instanceIds.includes(instance.id) ? 'text-indigo-300' : 'text-zinc-200'}`}>{instance.instanceName}</p>
                          <p className={`text-xs font-mono mt-0.5 ${formData.instanceIds.includes(instance.id) ? 'text-indigo-400/70' : 'text-zinc-500'}`}>{instance.phoneNumber}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <p className="mt-2 text-xs text-zinc-500 font-medium flex items-center gap-1.5">
                  <SparklesIcon className="w-3.5 h-3.5 text-indigo-400" />
                  Select multiple instances to distribute the load and reduce ban risk.
                </p>
              </div>

              {/* Instance Rotation Settings (Only show if multiple instances selected) */}
              {formData.instanceIds.length > 1 && (
                <div className="bg-indigo-500/5 rounded-2xl p-5 border border-indigo-500/20 shadow-inner">
                  <label className="block text-sm font-semibold text-indigo-400 mb-2">🔄 Instance Rotation Strategy</label>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-indigo-300 mb-1.5">Switch instance every N messages</label>
                      <input
                        type="number"
                        min="1"
                        className="w-full bg-black/40 border border-indigo-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                        value={formData.instanceSwitchCount}
                        onChange={e => setFormData({ ...formData, instanceSwitchCount: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                    <div className="text-xs text-indigo-400/80 flex-1 sm:pt-6 font-medium">
                      With {formData.instanceIds.length} instances and switch count of {formData.instanceSwitchCount}:
                      <br />
                      Instance 1 sends {formData.instanceSwitchCount} messages, then Instance 2 sends {formData.instanceSwitchCount}, etc.
                    </div>
                  </div>
                </div>
              )}

              {/* Message Templates */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-semibold text-zinc-300">Message Content <span className="text-indigo-400 font-mono font-normal ml-1">({formData.messages.length} Variants)</span></label>
                  <div className="flex gap-2 items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">Unlimited Templates</span>
                    <button
                      type="button"
                      onClick={addMessageTemplate}
                      className="text-sm text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
                    >
                      <span>+ Add Variant</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {formData.messages.map((msg, index) => (
                    <div key={index} className="relative group border border-white/10 bg-black/20 rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-indigo-500/50 focus-within:border-indigo-500/50 transition-all">
                      <div className="flex justify-between items-center bg-zinc-900/80 px-4 py-2.5 border-b border-white/5">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-zinc-400 font-semibold tracking-wide">Variant #{index + 1}</span>
                          {/* Formatting Toolbar */}
                          <div className="h-4 w-px bg-white/10 mx-1"></div>
                          <div className="flex items-center gap-1">
                            <button type="button" onClick={() => insertFormatting(index, 'bold')} className="p-1.5 hover:bg-white/5 rounded-md text-zinc-400 hover:text-white transition-colors" title="Bold"><strong className="font-bold">B</strong></button>
                            <button type="button" onClick={() => insertFormatting(index, 'italic')} className="p-1.5 hover:bg-white/5 rounded-md text-zinc-400 hover:text-white transition-colors" title="Italic"><em className="italic">I</em></button>
                            <button type="button" onClick={() => insertFormatting(index, 'strike')} className="p-1.5 hover:bg-white/5 rounded-md text-zinc-400 hover:text-white transition-colors line-through" title="Strikethrough">S</button>
                            <button type="button" onClick={() => insertFormatting(index, 'code')} className="p-1.5 hover:bg-white/5 rounded-md text-zinc-400 hover:text-white transition-colors font-mono text-xs" title="Monospace">{'<>'}</button>
                          </div>
                        </div>
                        {formData.messages.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMessageTemplate(index)}
                            className="text-xs font-semibold text-rose-500 hover:text-rose-400 transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <textarea
                        id={`message-input-${index}`}
                        required
                        rows={5}
                        className="w-full p-4 bg-transparent border-none text-white focus:ring-0 font-mono text-sm resize-y leading-relaxed placeholder:text-zinc-700"
                        placeholder={index === 0 ? "Hi there! Check out our new offers..." : "Hello! Don't miss our latest deals..."}
                        value={msg}
                        onChange={e => handleMessageChange(index, e.target.value)}
                      />
                    </div>
                  ))}
                </div>

                {/* Media Attachment */}
                <div className="mt-5">
                  <label className="block text-sm font-semibold text-zinc-300 mb-2">Media Attachment <span className="text-zinc-500 font-normal">(Optional)</span></label>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <label className="cursor-pointer inline-flex items-center px-4 py-2.5 border border-white/10 rounded-xl shadow-sm text-sm font-semibold text-white bg-zinc-800 hover:bg-zinc-700 transition-colors">
                      <PaperClipIcon className="-ml-1 mr-2 h-5 w-5 text-zinc-400" />
                      {mediaFile ? 'Change File' : 'Attach File'}
                      <input type="file" className="hidden" onChange={e => setMediaFile(e.target.files[0])} accept="image/*,video/*,application/pdf,.doc,.docx" />
                    </label>
                    {mediaFile && (
                      <div className="flex items-center justify-between sm:justify-start gap-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-4 py-2 rounded-xl text-sm font-medium">
                        <span className="truncate max-w-[200px]">{mediaFile.name}</span>
                        <button type="button" onClick={() => setMediaFile(null)} className="text-indigo-400 hover:text-indigo-200 transition-colors bg-indigo-500/20 p-1 rounded-md">
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-zinc-500 font-medium">Supports Images (JPG, PNG), Videos (MP4), and Documents (PDF).</p>
                </div>

                <p className="mt-4 text-xs text-gray-500">Variables like {`{name}`} coming soon. Add multiple variants to avoid spam detection.</p>
              </div>

              {/* Message Rotation Settings (Only show if multiple templates) */}
              {formData.messages.length > 1 && (
                <div className="bg-purple-500/5 rounded-2xl p-5 border border-purple-500/20 shadow-inner">
                  <label className="block text-sm font-semibold text-purple-400 mb-2">🔀 Message Rotation Strategy</label>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-purple-300 mb-1.5">Switch template every N messages</label>
                      <input
                        type="number"
                        min="1"
                        className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-mono"
                        value={formData.messageRotationCount}
                        onChange={e => setFormData({ ...formData, messageRotationCount: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                    <div className="text-xs text-purple-400/80 flex-1 sm:pt-6 font-medium">
                      With {formData.messages.length} templates and switch count of {formData.messageRotationCount}:
                      <br />
                      Template 1 used for {formData.messageRotationCount} messages, then Template 2, etc. (Round Robin)
                    </div>
                  </div>
                </div>
              )}

              {/* Recipient Source Selection */}
              <div className="pt-2">
                <label className="block text-sm font-semibold text-zinc-300 mb-3">Recipients</label>
                <div className="flex bg-black/40 border border-white/5 rounded-xl p-1 mb-5">
                  <button
                    type="button"
                    onClick={() => setActiveTab('manual')}
                    className={`flex-1 py-2 px-4 text-sm font-semibold rounded-lg transition-all ${activeTab === 'manual'
                      ? 'bg-zinc-800 text-white shadow-md'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                      }`}
                  >
                    Manual Input
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('csv')}
                    className={`flex-1 py-2 px-4 text-sm font-semibold rounded-lg transition-all ${activeTab === 'csv'
                      ? 'bg-zinc-800 text-white shadow-md'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                      }`}
                  >
                    Upload CSV/Excel
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('sheet')}
                    className={`flex-1 py-2 px-4 text-sm font-semibold rounded-lg transition-all ${activeTab === 'sheet'
                      ? 'bg-zinc-800 text-white shadow-md'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                      }`}
                  >
                    Google Sheet
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('segment')}
                    className={`flex-1 py-2 px-4 text-sm font-semibold rounded-lg transition-all ${activeTab === 'segment'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                      }`}
                  >
                    Saved Segment <SparklesIcon className="inline w-3 h-3 ml-1"/>
                  </button>
                </div>

                {activeTab === 'manual' ? (
                  <div className="relative rounded-2xl shadow-sm border border-white/5 bg-black/20 p-1">
                    <div className="absolute top-4 left-4 pointer-events-none">
                      <UserGroupIcon className="h-5 w-5 text-zinc-500" />
                    </div>
                    <textarea
                      required={activeTab === 'manual'}
                      rows={6}
                      className="w-full bg-transparent pl-12 pr-4 py-3 rounded-xl border-none focus:ring-0 focus:outline-none focus:ring-inset text-white font-mono text-sm placeholder:text-zinc-600 resize-y"
                      placeholder={"2010xxxxxxxxx\n012xxxxxxxx"}
                      value={formData.numbers}
                      onChange={e => setFormData({ ...formData, numbers: e.target.value })}
                    />
                    <div className="flex justify-between items-center mt-2 px-3 pb-2">
                      <p className="text-xs text-zinc-500 font-medium">Enter phone numbers (one per line).</p>
                      <button
                        type="button"
                        onClick={formatNumbers}
                        className="text-xs flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold transition-colors bg-indigo-500/10 px-2.5 py-1.5 rounded-lg border border-indigo-500/20"
                      >
                        <SparklesIcon className="w-3.5 h-3.5" />
                        Smart Format (Fix Spaces)
                      </button>
                    </div>
                  </div>
                ) : activeTab === 'csv' ? (
                  <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center bg-black/20 hover:bg-black/40 hover:border-indigo-500/30 transition-all group">
                    {file ? (
                      <div className="inline-flex items-center justify-center gap-3 text-emerald-400 bg-emerald-500/10 px-4 py-3 rounded-xl border border-emerald-500/20 shadow-inner">
                        <DocumentArrowUpIcon className="w-5 h-5" />
                        <span className="text-sm font-semibold tracking-wide">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => setFile(null)}
                          className="p-1 hover:bg-emerald-500/20 rounded-md transition-colors ml-2"
                        >
                          <XMarkIcon className="w-4 h-4 text-emerald-300" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:bg-indigo-500/10 transition-all duration-300">
                          <DocumentArrowUpIcon className="h-8 w-8 text-zinc-400 group-hover:text-indigo-400 transition-colors" />
                        </div>
                        <div className="flex text-sm leading-6 text-zinc-400 justify-center font-medium">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer rounded-md font-semibold text-indigo-400 hover:text-indigo-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 focus-within:ring-offset-zinc-900 transition-colors"
                          >
                            <span>Upload a file</span>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              className="sr-only"
                              accept=".csv, .xlsx, .xls"
                              onChange={(e) => setFile(e.target.files[0])}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-zinc-500 mt-2 font-medium">Supports .csv, .xlsx, .xls (Column 'number' required)</p>
                      </>
                    )}
                  </div>
                ) : activeTab === 'sheet' ? (
                  <div className="space-y-5 bg-black/20 border border-white/5 p-5 rounded-2xl">
                    <div>
                      <label className="block text-sm font-semibold text-zinc-300 mb-2">Google Sheet Public URL</label>
                      <div className="flex gap-3">
                        <input
                          type="url"
                          className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-zinc-600"
                          placeholder="https://docs.google.com/spreadsheets/d/..."
                          value={sheetUrl}
                          onChange={e => setSheetUrl(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={fetchSheetColumns}
                          disabled={fetchingColumns || !sheetUrl}
                          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {fetchingColumns ? 'Fetching...' : 'Fetch Columns'}
                        </button>
                      </div>
                      <p className="text-xs text-zinc-500 mt-2 font-medium">Make sure the sheet is "Everyone with the link"</p>
                    </div>

                    {sheetColumns.length > 0 && (
                      <div className="bg-indigo-500/5 p-5 rounded-xl border border-indigo-500/20">
                        <label className="block text-sm font-semibold text-indigo-300 mb-2">Select Phone Number Column</label>
                        <select
                          className="w-full bg-black/40 border border-indigo-500/30 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all appearance-none"
                          value={phoneColumn}
                          onChange={e => setPhoneColumn(e.target.value)}
                          required={activeTab === 'sheet'}
                        >
                          <option value="" className="bg-zinc-900 text-zinc-400">-- Select Column --</option>
                          {sheetColumns.map(col => (
                            <option key={col} value={col} className="bg-zinc-900 text-white">{col}</option>
                          ))}
                        </select>

                        <div className="mt-5">
                          <label className="block text-xs font-semibold tracking-wide text-zinc-400 mb-3 uppercase">Available Variables <span className="text-zinc-500 font-normal normal-case ml-1">(Click to insert)</span></label>
                          <div className="flex flex-wrap gap-2">
                            {sheetColumns.map(col => (
                              <button
                                key={col}
                                type="button"
                                onClick={() => {
                                  const focusedIndex = 0; // Default to first for now, or track focused input
                                  insertVariable(focusedIndex, col);
                                }}
                                className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 cursor-pointer border border-indigo-500/20 transition-colors"
                              >
                                {`{{${col}}}`}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : activeTab === 'segment' ? (
                  <div className="space-y-5 bg-black/20 border border-indigo-500/10 p-5 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                      <SparklesIcon className="w-32 h-32 text-indigo-500" />
                    </div>
                    <div className="relative z-10">
                      <label className="block text-sm font-semibold text-zinc-300 mb-2">Select a Saved Segment</label>
                      <select
                        className="w-full bg-black/40 border border-indigo-500/30 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all appearance-none"
                        value={segmentId}
                        onChange={e => setSegmentId(e.target.value)}
                        required={activeTab === 'segment'}
                      >
                        <option value="" className="bg-zinc-900 text-zinc-400">-- Choose Segment --</option>
                        {segments.map(seg => (
                          <option key={seg.id} value={seg.id} className="bg-zinc-900 text-white">{seg.name}</option>
                        ))}
                      </select>
                      <p className="text-xs text-zinc-500 mt-2 font-medium">Broadcast your campaign to an already refined audience list. Build segments in the Contacts page.</p>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Delay Configuration - P1 Feature */}
              <div className="bg-black/20 rounded-2xl p-5 border border-white/5">
                <label className="block text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
                  <span className="text-amber-400 text-lg">⏱️</span> Message Delay <span className="text-zinc-500 font-normal text-xs">(Anti-Spam)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div>
                    <label className="flex items-center justify-between text-xs font-medium text-zinc-400 mb-3">
                      Minimum Delay
                      <span className="font-bold text-white bg-white/10 px-2 py-0.5 rounded-md">{formData.delayMin}s</span>
                    </label>
                    <input
                      type="range"
                      min="15"
                      max="60"
                      value={formData.delayMin}
                      onChange={e => setFormData({ ...formData, delayMin: parseInt(e.target.value) })}
                      className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <div className="flex justify-between text-[10px] font-semibold text-zinc-500 mt-2 tracking-wide">
                      <span>15s</span>
                      <span>60s</span>
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center justify-between text-xs font-medium text-zinc-400 mb-3">
                      Maximum Delay
                      <span className="font-bold text-white bg-white/10 px-2 py-0.5 rounded-md">{formData.delayMax}s</span>
                    </label>
                    <input
                      type="range"
                      min="15"
                      max="120"
                      value={formData.delayMax}
                      onChange={e => setFormData({ ...formData, delayMax: parseInt(e.target.value) })}
                      className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <div className="flex justify-between text-[10px] font-semibold text-zinc-500 mt-2 tracking-wide">
                      <span>15s</span>
                      <span>120s</span>
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-xs text-zinc-500 font-medium bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="text-amber-400/80 mr-1 text-sm leading-none">💡</span> Random delay between <strong className="text-zinc-300 mx-1">{formData.delayMin}-{formData.delayMax} seconds</strong> to avoid WhatsApp spam detection.
                </p>
              </div>

              {/* Schedule Campaign */}
              <div className="bg-indigo-500/5 rounded-2xl p-5 border border-indigo-500/20 shadow-inner">
                <div className="flex items-center justify-between mb-4">
                  <label className="flex items-center gap-2 text-sm font-semibold text-indigo-300">
                    <CalendarDaysIcon className="h-5 w-5 opacity-80" />
                    Schedule Campaign
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, scheduleEnabled: !formData.scheduleEnabled, scheduledAt: '', endAt: '' })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-900 ${formData.scheduleEnabled ? 'bg-indigo-500' : 'bg-zinc-700'
                      }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.scheduleEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                  </button>
                </div>
                {formData.scheduleEnabled ? (
                  <div className="space-y-4 pt-1 border-t border-indigo-500/10 mt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Start Time */}
                      <div>
                        <label className="text-xs font-semibold tracking-wide text-indigo-400/80 mb-2 block uppercase">Start Time</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <ClockIcon className="h-4 w-4 text-indigo-500" />
                          </div>
                          <input
                            type="datetime-local"
                            required={formData.scheduleEnabled}
                            min={new Date(Date.now() + 5 * 60000).toISOString().slice(0, 16)}
                            value={formData.scheduledAt}
                            onChange={e => setFormData({ ...formData, scheduledAt: e.target.value })}
                            className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-indigo-500/30 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-white font-mono"
                          />
                        </div>
                      </div>
                      {/* End Time (optional) */}
                      <div>
                        <label className="text-xs font-semibold tracking-wide text-rose-400/80 mb-2 block uppercase">End Time <span className="text-zinc-500 font-normal normal-case">(optional)</span></label>
                        <div className="relative flex items-center gap-2">
                          <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <ClockIcon className="h-4 w-4 text-rose-500/80" />
                            </div>
                            <input
                              type="datetime-local"
                              min={formData.scheduledAt || new Date(Date.now() + 10 * 60000).toISOString().slice(0, 16)}
                              value={formData.endAt}
                              onChange={e => setFormData({ ...formData, endAt: e.target.value })}
                              className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-rose-500/30 rounded-xl focus:ring-1 focus:ring-rose-500 focus:border-rose-500 text-sm text-white font-mono"
                            />
                          </div>
                          {formData.endAt && (
                            <button type="button" onClick={() => setFormData({ ...formData, endAt: '' })} className="p-2.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 rounded-xl transition-colors border border-rose-500/20">
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-indigo-400/80 font-medium bg-indigo-500/5 p-3 rounded-lg flex gap-2">
                      <span className="text-amber-400">💡</span>
                      <span>Campaign launches at start time.{formData.endAt ? ' Unsent messages will be cancelled at end time.' : ' No end time — runs until complete.'}</span>
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-indigo-400/60 font-medium mt-1">Campaign will launch immediately after creation.</p>
                )}
              </div>

              <div className="pt-6 border-t border-white/10 flex justify-end gap-4 mt-2">
                <button
                  type="button"
                  onClick={() => navigate('/campaigns')}
                  className="px-6 py-2.5 border border-white/10 shadow-sm text-sm font-semibold rounded-xl text-zinc-300 bg-white/5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-zinc-500 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center min-w-[180px] px-6 py-2.5 border border-transparent text-sm font-semibold rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5"
                  disabled={loading || formData.instanceIds.length === 0 || (activeTab === 'csv' && !file) || (activeTab === 'sheet' && (!sheetUrl || !phoneColumn)) || (activeTab === 'segment' && !segmentId)}
                  onClick={handleSubmit}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {formData.scheduleEnabled ? 'Scheduling...' : 'Launching...'}
                    </span>
                  ) : (
                    <>
                      {formData.scheduleEnabled ? (
                        <><CalendarDaysIcon className="-ml-1 mr-2 h-5 w-5" />Schedule Campaign</>
                      ) : (
                        <><PaperAirplaneIcon className="-ml-1 mr-2 h-5 w-5" />Launch Campaign</>
                      )}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
