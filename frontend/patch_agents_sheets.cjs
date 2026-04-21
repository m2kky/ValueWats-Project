const fs = require('fs');
let code = fs.readFileSync('patch_agents.cjs', 'utf8');

// The original script injects: form.instructions?.includes('@GoogleDrive')
// Let's modify the original script text, or just write a new script that injects it directly into Agents.jsx.

let agentsCode = fs.readFileSync('src/pages/Agents.jsx', 'utf8');

const sheetsHtml = `
                    {form.instructions?.includes('@GoogleSheets') && (
                      <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mt-3">
                        <div className="flex justify-between items-center mb-3">
                          <label className="text-sm font-bold text-emerald-400">Google Sheets Access Detected</label>
                        </div>
                        <select
                          className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                          value={form.actionConfig?.google_sheets?.integrationId || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setForm(f => ({
                              ...f,
                              actionConfig: {
                                ...f.actionConfig,
                                google_sheets: { enabled: !!val, integrationId: val }
                              }
                            }));
                          }}
                        >
                          <option value="">Select a Workspace Connection</option>
                          {availableIntegrations.filter(i => i.type === 'google_oauth' || i.type === 'google_sheets').map(i => (
                            <option key={i.id} value={i.id}>{i.name}</option>
                          ))}
                        </select>
                      </div>
                    )}`;

// Insert it right after the Google Drive block. We can just replace: '{form.instructions?.includes('@GoogleDrive') && (' 
// wait, the easiest way is to append right before '                  {/* Output Actions */}'
agentsCode = agentsCode.replace(
  '{/* Output Actions */}',
  sheetsHtml + '\n\n                  {/* Output Actions */}'
);

fs.writeFileSync('src/pages/Agents.jsx', agentsCode);
console.log('injected sheets into Agents.jsx');
