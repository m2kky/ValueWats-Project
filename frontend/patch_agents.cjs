const fs = require('fs');

let code = fs.readFileSync('src/pages/Agents.jsx', 'utf8');

// 1. Add availableIntegrations state
code = code.replace(
  'const [availableVariables, setAvailableVariables] = useState([]);',
  'const [availableVariables, setAvailableVariables] = useState([]);\n  const [availableIntegrations, setAvailableIntegrations] = useState([]);'
);

// 2. Fetch Integrations along with other lookups
code = code.replace(
  'const [tagsRes, teamRes, stagesRes, fieldDefsRes] = await Promise.allSettled([',
  'const [tagsRes, teamRes, stagesRes, fieldDefsRes, intRes] = await Promise.allSettled(['
);
code = code.replace(
  "api.get('/contact-fields')",
  "api.get('/contact-fields'),\n            api.get('/integrations')"
);
code = code.replace(
  "if (fieldDefsRes.status === 'fulfilled') {",
  "if (intRes && intRes.status === 'fulfilled') {\n            setAvailableIntegrations(intRes.value.data.integrations || []);\n          }\n\n          if (fieldDefsRes.status === 'fulfilled') {"
);

// 3. Inject Integration Selection UI right under the textarea limit warning
const integrationUI = `}
                  </div>

                  {/* Dynamic Tool Integrations */}
                  <div className="mt-4 space-y-3">
                    {form.instructions?.includes('@GoogleCalendar') && (
                      <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                        <div className="flex justify-between items-center mb-3">
                          <label className="text-sm font-bold text-indigo-400">Google Calendar Access Detected</label>
                        </div>
                        <select
                          className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                          value={form.actionConfig?.google_calendar_create?.integrationId || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setForm(f => ({
                              ...f,
                              actionConfig: {
                                ...f.actionConfig,
                                google_calendar_create: { enabled: !!val, integrationId: val },
                                google_calendar_read: { enabled: !!val, integrationId: val }
                              }
                            }));
                          }}
                        >
                          <option value="">Select an OAuth Connection</option>
                          {availableIntegrations.filter(i => i.type === 'google_oauth').map(i => (
                            <option key={i.id} value={i.id}>{i.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    {form.instructions?.includes('@GoogleDrive') && (
                      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                        <div className="flex justify-between items-center mb-3">
                          <label className="text-sm font-bold text-blue-400">Google Drive Access Detected</label>
                        </div>
                        <select
                          className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                          value={form.actionConfig?.google_drive_upload?.integrationId || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setForm(f => ({
                              ...f,
                              actionConfig: {
                                ...f.actionConfig,
                                google_drive_upload: { enabled: !!val, integrationId: val },
                                google_drive_search: { enabled: !!val, integrationId: val }
                              }
                            }));
                          }}
                        >
                          <option value="">Select an OAuth Connection</option>
                          {availableIntegrations.filter(i => i.type === 'google_oauth').map(i => (
                            <option key={i.id} value={i.id}>{i.name}</option>
                          ))}
                        </select>
                      </div>
                    )}`;

code = code.replace(
  'Instructions exceed the 10,000 character limit.\n                      </p>\n                    )}\n                  </div>\n\n                  {/* Output Actions */}',
  'Instructions exceed the 10,000 character limit.\n                      </p>\n                    )' + integrationUI + '\n\n                  {/* Output Actions */}'
);

fs.writeFileSync('src/pages/Agents.jsx', code);
console.log('patched Agents.jsx successfully');
