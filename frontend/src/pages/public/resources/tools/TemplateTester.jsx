import { useMemo, useState } from 'react';
import PublicLayout from '../../../../components/public/PublicLayout';

const sampleVariables = {
  name: 'Sarah',
  order_id: 'A-48291',
  brand: 'Value Chat',
  city: 'Cairo',
  date: 'Friday 7:30 PM',
};

function extractVariables(template) {
  const matches = [...template.matchAll(/{{\s*([a-zA-Z0-9_]+)\s*}}/g)];
  return [...new Set(matches.map((m) => m[1]))];
}

function applyVariables(template, variables) {
  return template.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_, key) => {
    return Object.prototype.hasOwnProperty.call(variables, key) ? variables[key] : `{{${key}}}`;
  });
}

export default function TemplateTester() {
  const [template, setTemplate] = useState(
    'Hi {{name}}, your order {{order_id}} from {{brand}} is out for delivery to {{city}} on {{date}}.'
  );
  const [variablesText, setVariablesText] = useState(JSON.stringify(sampleVariables, null, 2));

  const { parsedVariables, renderedTemplate, issues } = useMemo(() => {
    const vars = extractVariables(template);
    const result = {
      parsedVariables: vars,
      renderedTemplate: template,
      issues: [],
    };

    let parsed = {};
    try {
      parsed = variablesText.trim() ? JSON.parse(variablesText) : {};
    } catch (error) {
      result.issues.push('Variables JSON is invalid. Fix JSON format to preview replacements.');
      return result;
    }

    result.renderedTemplate = applyVariables(template, parsed);

    const missing = vars.filter((v) => !Object.prototype.hasOwnProperty.call(parsed, v));
    if (missing.length > 0) {
      result.issues.push(`Missing variable values: ${missing.join(', ')}`);
    }
    if (template.length > 1024) {
      result.issues.push('Template is long. Try keeping it concise for better readability.');
    }
    if (/{{[^}]*$/.test(template)) {
      result.issues.push('Unclosed variable placeholder detected.');
    }
    return result;
  }, [template, variablesText]);

  return (
    <PublicLayout>
      <div className="pt-32 pb-24 min-h-screen bg-black text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <p className="text-xs uppercase tracking-[0.2em] text-[#e2f300] font-bold mb-3">Free Tool</p>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Template Tester</h1>
            <p className="text-zinc-400 text-lg max-w-3xl">
              Test your message template with variables, catch formatting issues, and preview how the final text looks before sending.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#111113] border border-white/10 rounded-3xl p-6 md:p-8 space-y-5">
              <label className="block">
                <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Template Content</span>
                <textarea
                  rows={7}
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  className="mt-2 w-full rounded-xl bg-black/60 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#e2f300]/50 resize-y"
                />
              </label>

              <label className="block">
                <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Variables (JSON)</span>
                <textarea
                  rows={8}
                  value={variablesText}
                  onChange={(e) => setVariablesText(e.target.value)}
                  className="mt-2 w-full rounded-xl bg-black/60 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#e2f300]/50 font-mono text-sm resize-y"
                />
              </label>

              <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
                <p className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-2">Detected Variables</p>
                {parsedVariables.length === 0 ? (
                  <p className="text-sm text-zinc-500">No placeholders found.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {parsedVariables.map((v) => (
                      <span key={v} className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-[#e2f300]">
                        {`{{${v}}}`}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-[#111113] border border-white/10 rounded-3xl p-6 md:p-8">
                <p className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-4">Live Preview</p>
                <div className="max-w-sm bg-[#1a1a1d] border border-white/10 rounded-2xl p-4">
                  <div className="text-xs text-zinc-500 mb-2">WhatsApp style preview</div>
                  <div className="bg-[#232318] rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed text-white">
                    {renderedTemplate}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-2">Chars: {renderedTemplate.length}</div>
                </div>
              </div>

              <div className="bg-[#111113] border border-white/10 rounded-3xl p-6 md:p-8">
                <p className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-4">Quality Checks</p>
                {issues.length === 0 ? (
                  <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-300">
                    No blocking issues found. Template is ready for testing in real flow.
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {issues.map((issue, idx) => (
                      <li
                        key={idx}
                        className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-sm text-amber-200"
                      >
                        {issue}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
