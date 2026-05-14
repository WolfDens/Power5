import { useState } from "react";

export default function SetupScreen({ onComplete }) {
  const [step, setStep] = useState(1);
  const [apiKey, setApiKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState("");

  async function verifyAndSave() {
    const trimmed = apiKey.trim();
    if (!trimmed.startsWith("sk-ant-")) {
      setError("That doesn't look right — Anthropic keys start with sk-ant-");
      return;
    }
    setTesting(true);
    setError("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": trimmed,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 10,
          messages: [{ role: "user", content: "hi" }],
        }),
      });
      if (res.status === 401) {
        setError("Invalid key — double check you copied the full thing.");
        setTesting(false);
        return;
      }
      if (!res.ok && res.status !== 400) {
        setError("Could not connect to Anthropic. Check your internet.");
        setTesting(false);
        return;
      }
      // Key works — save both to localStorage
      localStorage.setItem("power5_api_key", trimmed);
      if (webhookSecret.trim()) {
        localStorage.setItem("power5_webhook_secret", webhookSecret.trim());
      }
      onComplete();
    } catch (e) {
      setError("Connection failed. Check your internet and try again.");
    }
    setTesting(false);
  }

  return (
    <div className="setup-screen">
      <div className="setup-card">
        <div className="setup-logo">POWER<span>5</span></div>
        <div className="setup-tagline">Daily priority system</div>

        <div className="setup-steps-indicator">
          {[1, 2, 3].map(n => (
            <div key={n} className={`setup-step-dot${step >= n ? " active" : ""}${step > n ? " done" : ""}`}>
              {step > n ? <i className="ti ti-check" style={{ fontSize: 10 }} /> : n}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="setup-step">
            <h2 className="setup-title">Welcome to Power5</h2>
            <p className="setup-desc">
              Power5 uses AI to scan your emails and calendar each morning and build your top 5 priorities for the day. It learns your habits over time and keeps you focused.
            </p>
            <div className="setup-feature-list">
              <div className="setup-feature"><i className="ti ti-bolt" /> Morning digest from your Gmail</div>
              <div className="setup-feature"><i className="ti ti-chart-bar" /> Tracks your completion history</div>
              <div className="setup-feature"><i className="ti ti-devices" /> Syncs across phone and computer</div>
              <div className="setup-feature"><i className="ti ti-lock" /> Your data stays private</div>
            </div>
            <p className="setup-cost-note">
              Requires an Anthropic API key (~$5 credit lasts several months at normal usage).
            </p>
            <button className="btn-primary full-width mt-1" onClick={() => setStep(2)}>
              Get started <i className="ti ti-arrow-right" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="setup-step">
            <h2 className="setup-title">Connect the AI</h2>
            <p className="setup-desc">
              Power5 runs on Anthropic's Claude API. You'll need a key — it takes about 2 minutes to get one.
            </p>

            <div className="setup-instructions">
              <div className="setup-instruction-step">
                <div className="setup-instruction-num">1</div>
                <div>Go to <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer">console.anthropic.com/settings/keys</a></div>
              </div>
              <div className="setup-instruction-step">
                <div className="setup-instruction-num">2</div>
                <div>Create an account if needed, then click <strong>Create Key</strong></div>
              </div>
              <div className="setup-instruction-step">
                <div className="setup-instruction-num">3</div>
                <div>Add $5 in credits under <strong>Billing</strong> (lasts months)</div>
              </div>
              <div className="setup-instruction-step">
                <div className="setup-instruction-num">4</div>
                <div>Copy your key and paste it below</div>
              </div>
            </div>

            <label className="setup-label">Anthropic API Key</label>
            <input
              type="password"
              className="edit-input setup-input"
              placeholder="sk-ant-api03-..."
              value={apiKey}
              onChange={e => { setApiKey(e.target.value); setError(""); }}
            />
            {error && <div className="setup-error">{error}</div>}

            <div className="setup-btn-row">
              <button className="btn-ghost" onClick={() => setStep(1)}>Back</button>
              <button
                className="btn-primary"
                onClick={verifyAndSave}
                disabled={!apiKey.trim() || testing}
                style={{ opacity: (!apiKey.trim() || testing) ? 0.5 : 1 }}
              >
                {testing ? "Verifying..." : "Verify & continue"}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="setup-step">
            <h2 className="setup-title">Set up your morning digest</h2>
            <p className="setup-desc">
              The morning digest is what makes Power5 automatic — it reads your Gmail every morning and feeds your Power 5 list. This step connects it.
            </p>

            <div className="setup-instructions">
              <div className="setup-instruction-step">
                <div className="setup-instruction-num">1</div>
                <div>Go to <a href="https://claude.ai/code" target="_blank" rel="noopener noreferrer">claude.ai/code</a> → Routines → New routine → Remote</div>
              </div>
              <div className="setup-instruction-step">
                <div className="setup-instruction-num">2</div>
                <div>Follow the setup guide (link below) to configure your morning digest routine</div>
              </div>
              <div className="setup-instruction-step">
                <div className="setup-instruction-num">3</div>
                <div>Create a webhook secret — any password you choose — and enter it below so Power5 can receive your digest securely</div>
              </div>
            </div>

            <a
              href="https://github.com/WolfDens/Power5/blob/main/SETUP.md"
              target="_blank"
              rel="noopener noreferrer"
              className="setup-guide-link"
            >
              <i className="ti ti-book" /> Full setup guide →
            </a>

            <label className="setup-label" style={{ marginTop: "1rem" }}>
              Webhook Secret <span className="setup-optional">(optional — skip if setting up later)</span>
            </label>
            <input
              type="text"
              className="edit-input setup-input"
              placeholder="e.g. myname2025"
              value={webhookSecret}
              onChange={e => setWebhookSecret(e.target.value)}
            />
            <p className="setup-cost-note">
              You can skip this and add it later. Power5 works without the digest — it'll generate from your typical priorities instead.
            </p>

            <div className="setup-btn-row">
              <button className="btn-ghost" onClick={() => setStep(2)}>Back</button>
              <button className="btn-primary" onClick={() => {
                if (webhookSecret.trim()) localStorage.setItem("power5_webhook_secret", webhookSecret.trim());
                onComplete();
              }}>
                {webhookSecret.trim() ? "Finish setup" : "Skip for now"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
