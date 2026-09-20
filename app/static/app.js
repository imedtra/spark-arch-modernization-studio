/**
 * SPARK Architecture Modernization Studio — Rapid Insights Engine Client
 * Renders full 44-slide DrMigrate / Google Cloud Rapid Insights report parity:
 * 1. 4-Column Estate Overview (Slide 3) + Before/After Resource Right-Sizing (Slide 9) + OS Lifecycle + Network Connections (Slide 42)
 * 2. Pattern Recognition & Technology Domains (Slide 11-20) + Interactive 6R Table + Slide 5 Per-Application Deep-Dive Modal
 * 3. Database Modernization Deep-Dive (Slide 21-27): SQL Server, MySQL, Postgres, DB2, Oracle Sankey Pathways & Cost Matrix
 * 4. Interactive Cost Model Configurator + Scenario 1 (Rehost All) vs Scenario 2 (Selective Modernization) Side-by-Side (Slide 28-35)
 * 5. Dependency Waves (Slide 43), 5-Pillar Google Cloud WAF Audit, and Grounded AI Advisor (Slide 44)
 */

const state = {
  estateId: 'enterprise-reference-estate',
  overrides: {},
  remediatedControls: [],
  extraWorkloads: [],
  costConfig: {
    region: 'me-central1 (Doha, Qatar)',
    prod_payment: '3_year_cud',
    nonprod_hours: 175,
    byol_windows_sql: true,
  },
  assessment: null,
  currentExportFilename: 'deliverable.md',
  currentExportContent: '',
};

const fmtUSD = (val) => '$' + Number(val || 0).toLocaleString('en-US');

const GCP_SERVICE_SUGGESTIONS = {
  Rehost: 'Google Cloud VMware Engine (GCVE) + GCE Gen4 C4 VMs (100 Gbps Shared VPC)',
  Replatform: 'Cloud SQL Enterprise Plus / GKE Autopilot / AlloyDB for PostgreSQL',
  Refactor: 'Cloud Run Serverless Containers + BigQuery Lakehouse + Cloud Armor',
  Replace: 'Managed Microsoft AD + Certificate Authority Service (CAS) + IAP',
  Retain: 'Dedicated Cloud Interconnect + Hybrid Shared VPC',
  Retire: 'Cloud Storage Archive + BigQuery External Coldline Snapshot',
};

document.addEventListener('DOMContentLoaded', () => {
  initBackgroundCustomizer();
  initVertexAICopilot();
  initEventListeners();
  fetchAssessment();
  askAIAdvisor('Why should  the Enterprise Estate combine Google Cloud VMware Engine (GCVE) with native GCE over 100 Gbps Shared VPC?');
});

function initEventListeners() {
  // Estate selector
  const estateSelect = document.getElementById('estate-select');
  estateSelect.addEventListener('change', (e) => {
    state.estateId = e.target.value;
    state.overrides = {};
    state.remediatedControls = [];
    state.extraWorkloads = [];
    fetchAssessment();
  });

  // Tab navigation
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      const targetId = btn.getAttribute('data-tab');
      document.getElementById(targetId).classList.add('active');
    });
  });

  // Cost Model Configuration interactive controls
  const cfgRegion = document.getElementById('cfg-region');
  const cfgProdPayment = document.getElementById('cfg-prod-payment');
  const cfgNonProdHours = document.getElementById('cfg-nonprod-hours');
  const cfgByolToggle = document.getElementById('cfg-byol-toggle');
  const cfgHoursLabel = document.getElementById('cfg-hours-label');

  if (cfgRegion) {
    cfgRegion.addEventListener('change', () => {
      state.costConfig.region = cfgRegion.value;
      fetchAssessment();
    });
  }
  if (cfgProdPayment) {
    cfgProdPayment.addEventListener('change', () => {
      state.costConfig.prod_payment = cfgProdPayment.value;
      fetchAssessment();
    });
  }
  if (cfgNonProdHours) {
    cfgNonProdHours.addEventListener('input', () => {
      const hrs = Number(cfgNonProdHours.value);
      state.costConfig.nonprod_hours = hrs;
      const pct = Math.round((1 - hrs / 730) * 100);
      cfgHoursLabel.textContent = `${hrs} hrs/mo (${pct}% off-peak savings)`;
      fetchAssessment();
    });
  }
  if (cfgByolToggle) {
    cfgByolToggle.addEventListener('change', () => {
      state.costConfig.byol_windows_sql = cfgByolToggle.checked;
      fetchAssessment();
    });
  }

  // Export Markdown & Terraform buttons
  document.getElementById('btn-export-md').addEventListener('click', () => exportDeliverable('markdown'));
  document.getElementById('btn-export-tf').addEventListener('click', () => exportDeliverable('terraform'));

  // Modal close handlers
  document.getElementById('btn-close-modal').addEventListener('click', closeModal);
  document.getElementById('btn-close-app-modal').addEventListener('click', closeAppModal);
  document.getElementById('btn-close-app-footer').addEventListener('click', closeAppModal);

  // Copy & Download
  document.getElementById('btn-copy-code').addEventListener('click', () => {
    navigator.clipboard.writeText(state.currentExportContent);
    const btn = document.getElementById('btn-copy-code');
    btn.textContent = 'Copied to Clipboard!';
    setTimeout(() => { btn.textContent = 'Copy to Clipboard'; }, 2000);
  });

  document.getElementById('btn-download-file').addEventListener('click', () => {
    const blob = new Blob([state.currentExportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = state.currentExportFilename;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Add Workload modal
  const addModal = document.getElementById('modal-add-workload');
  document.getElementById('btn-add-workload').addEventListener('click', () => {
    addModal.classList.remove('hidden');
  });
  document.getElementById('btn-close-add').addEventListener('click', () => {
    addModal.classList.add('hidden');
  });
  document.getElementById('form-add-workload').addEventListener('submit', (e) => {
    e.preventDefault();
    const newWl = {
      id: 'wl-custom-' + Date.now(),
      name: document.getElementById('add-name').value.trim(),
      tier: 'Custom Discovered Workload',
      category: 'compute_containers',
      source_tech: document.getElementById('add-source').value.trim(),
      servers: Number(document.getElementById('add-servers').value),
      vcpu: Number(document.getElementById('add-vcpu').value),
      ram_gb: Number(document.getElementById('add-ram').value),
      storage_tb: 4.0,
      cpu_utilization_p95: 25,
      os: 'RHEL 8 / Windows Server 2019',
      eol_risk: 'Medium',
      criticality: 'High',
      dependencies: [],
      recommended_6r: document.getElementById('add-6r').value,
      target_gcp_service: document.getElementById('add-target').value.trim(),
      target_rationale: 'Custom discovered application onboarded into SPARK Rapid Insights scope.',
      current_annual_cost_usd: Number(document.getElementById('add-cost').value),
      app_stack_eol_count: 1,
      inbound_deps: 2,
      outbound_deps: 1,
    };
    state.extraWorkloads.push(newWl);
    addModal.classList.add('hidden');
    fetchAssessment();
  });

  // AI Advisor Prompt Chips & Input
  document.querySelectorAll('.ai-chip-btn').forEach((chip) => {
    chip.addEventListener('click', () => {
      const q = chip.getAttribute('data-query');
      document.getElementById('ai-query-input').value = q;
      askAIAdvisor(q);
    });
  });

  document.getElementById('btn-ask-ai').addEventListener('click', () => {
    const q = document.getElementById('ai-query-input').value.trim();
    if (q) askAIAdvisor(q);
  });
  document.getElementById('ai-query-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = document.getElementById('ai-query-input').value.trim();
      if (q) askAIAdvisor(q);
    }
  });

  // Customer Data Ingestion Modal
  const ingestModal = document.getElementById('modal-ingest-data');
  const btnIngest = document.getElementById('btn-ingest-data');
  if (btnIngest) {
    btnIngest.addEventListener('click', async () => {
      ingestModal.classList.remove('hidden');
      const textarea = document.getElementById('ingest-csv-text');
      if (!textarea.value.trim()) {
        await loadSampleCSVIntoTextarea();
      }
    });
  }
  document.getElementById('btn-close-ingest')?.addEventListener('click', () => {
    ingestModal.classList.add('hidden');
  });
  document.getElementById('btn-cancel-ingest')?.addEventListener('click', () => {
    ingestModal.classList.add('hidden');
  });
  document.getElementById('btn-load-sample-csv')?.addEventListener('click', loadSampleCSVIntoTextarea);
  document.getElementById('btn-download-sample-csv')?.addEventListener('click', downloadSampleCSVTemplate);

  const fileInput = document.getElementById('ingest-file-input');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        document.getElementById('ingest-csv-text').value = evt.target.result;
      };
      reader.readAsText(file);
    });
  }

  document.getElementById('btn-run-ingestion')?.addEventListener('click', runCustomerIngestion);
  document.getElementById('btn-run-ai-6r-agent')?.addEventListener('click', () => runVertex6RAgent(false));
  document.getElementById('btn-header-ai-6r')?.addEventListener('click', () => runVertex6RAgent(true));
  initPage1FileUpload();
}

function activateTabById(tabId) {
  document.querySelectorAll('.tab-btn').forEach((b) => {
    const isTarget = b.getAttribute('data-tab') === tabId;
    b.classList.toggle('active', isTarget);
    b.setAttribute('aria-selected', isTarget ? 'true' : 'false');
  });
  document.querySelectorAll('.tab-panel').forEach((p) => {
    p.classList.toggle('active', p.id === tabId);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initPage1FileUpload() {
  const fileInput = document.getElementById('page1-file-input');
  const dropzone = document.getElementById('page1-dropzone');
  const statusEl = document.getElementById('page1-file-status');
  const csvArea = document.getElementById('page1-csv-text');
  const btnDownload = document.getElementById('page1-btn-download-template');
  const btnSample = document.getElementById('page1-btn-load-sample');
  const btnSkip = document.getElementById('page1-btn-skip-to-tab2');
  const btnSubmit = document.getElementById('page1-btn-submit-upload');

  const handleSelectedFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target.result || '';
      if (csvArea) csvArea.value = content;
      const linesCount = content.trim().split(/\r?\n/).filter(Boolean).length;
      if (statusEl) {
        statusEl.innerHTML = `<strong style="color:var(--accent-emerald);">&#9989; Loaded File: <code>${file.name}</code> (${Math.max(0, linesCount - 1)} server rows ready for analysis)</strong>`;
      }
      const nameGuess = file.name.replace(/\.(csv|txt)$/i, '').replace(/[_-]+/g, ' ');
      const clientInput = document.getElementById('page1-client-name');
      if (clientInput && clientInput.value === 'Enterprise Client Assessment' && nameGuess) {
        clientInput.value = nameGuess;
      }
    };
    reader.readAsText(file);
  };

  if (fileInput) {
    fileInput.addEventListener('change', (e) => handleSelectedFile(e.target.files[0]));
  }

  if (dropzone) {
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.style.background = 'var(--bg-elevated)';
    });
    dropzone.addEventListener('dragleave', () => {
      dropzone.style.background = 'var(--bg-canvas)';
    });
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.style.background = 'var(--bg-canvas)';
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleSelectedFile(e.dataTransfer.files[0]);
      }
    });
  }

  if (btnDownload) {
    btnDownload.addEventListener('click', downloadSampleCSVTemplate);
  }

  if (btnSample) {
    btnSample.addEventListener('click', async () => {
      try {
        const res = await fetch('/api/sample-csv');
        const data = await res.json();
        if (csvArea) csvArea.value = data.csv || '';
        if (statusEl) {
          statusEl.innerHTML = `<strong style="color:var(--accent-emerald);">&#9989; Loaded Sample Discovery File: <code>rvtools_50_servers_enterprise_example.csv</code> (50 enterprise servers across 12 applications ready)</strong>`;
        }
      } catch (err) {
        console.error('Failed to load sample CSV on Page 1:', err);
      }
    });
  }

  if (btnSkip) {
    btnSkip.addEventListener('click', () => activateTabById('tab-overview'));
  }

  if (btnSubmit) {
    btnSubmit.addEventListener('click', runPage1CustomerIngestion);
  }
}

async function runPage1CustomerIngestion() {
  const clientName = document.getElementById('page1-client-name')?.value.trim() || 'Enterprise Client Assessment';
  const industry = document.getElementById('page1-industry')?.value.trim() || 'Enterprise & Public Sector';
  const region = document.getElementById('page1-region')?.value || 'me-central1 (Doha, Qatar)';
  const csvText = document.getElementById('page1-csv-text')?.value.trim() || '';
  const btn = document.getElementById('page1-btn-submit-upload');

  if (!csvText) {
    alert('Please load a .CSV or .TXT discovery file (or click "Load Sample Discovery File") before running the assessment.');
    return;
  }

  if (btn) {
    btn.textContent = 'Analyzing Discovery File & Building Tab 2 Report...';
    btn.disabled = true;
  }

  try {
    const res = await fetch('/api/ingest-telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_name: clientName,
        industry: industry,
        region: region,
        csv_text: csvText,
      }),
    });
    const data = await res.json();
    if (data.status === 'ok') {
      const estateSelect = document.getElementById('estate-select');
      if (estateSelect) {
        let opt = Array.from(estateSelect.options).find((o) => o.value === data.estate_id);
        if (!opt) {
          opt = document.createElement('option');
          opt.value = data.estate_id;
          opt.textContent = `${clientName} (Ingested CSV • ${data.assessment.summary_metrics.total_servers} Servers)`;
          estateSelect.appendChild(opt);
        }
        estateSelect.value = data.estate_id;
      }
      state.estateId = data.estate_id;
      state.overrides = (data.ai_6r_agent && data.ai_6r_agent.applied_overrides) ? data.ai_6r_agent.applied_overrides : {};
      state.remediatedControls = [];
      state.extraWorkloads = [];
      state.assessment = data.assessment;

      renderAll(data.assessment);
      if (data.ai_6r_agent) {
        renderAI6RAgentResults(data.ai_6r_agent);
      }
      activateTabById('tab-overview');
      askAIAdvisor(`Summarize the key findings and quick wins for ${clientName}`);
    } else {
      alert('Ingestion Error: ' + (data.message || 'Unknown error'));
    }
  } catch (err) {
    console.error('Page 1 Ingestion failed:', err);
    alert('Failed to process discovery file.');
  } finally {
    if (btn) {
      btn.innerHTML = '&#128640; Analyze Loaded File &amp; Open Customer Report (Tab 2) &rarr;';
      btn.disabled = false;
    }
  }
}

async function runVertex6RAgent(switchTabFirst = false) {
  if (switchTabFirst) {
    activateTabById('tab-domains');
  }
  const btn = document.getElementById('btn-run-ai-6r-agent');
  const headerBtn = document.getElementById('btn-header-ai-6r');
  const badge = document.getElementById('ai-6r-agent-status-badge');
  const resultsBox = document.getElementById('ai-6r-agent-results-box');

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '&#9203; Vertex AI 6R Agent Evaluating Workloads...';
  }
  if (headerBtn) {
    headerBtn.disabled = true;
    headerBtn.innerHTML = '&#9203; Running AI 6R...';
  }
  if (badge) {
    badge.className = 'badge-6r badge-amber';
    badge.innerHTML = '&#9889; Querying live Vertex AI (gemini-2.5-flash Structured Schema)...';
  }
  if (resultsBox) {
    resultsBox.style.display = 'block';
    resultsBox.innerHTML = `<div style="font-size:0.84rem; color:var(--text-secondary);"><em>&#10024; Vertex AI 6R Target Recommender Agent is evaluating all workloads across CPU P95 utilization, OS/DB EOL lifecycle, and BYOL eligibility to prescribe 6R dispositions and Gen4 machine shapes...</em></div>`;
  }

  try {
    const res = await fetch('/api/ai-6r-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        estate_id: state.estateId,
        extra_workloads: state.extraWorkloads,
      }),
    });
    const data = await res.json();
    if (data.status === 'ok') {
      state.overrides = data.applied_overrides || {};
      state.assessment = data.assessment;
      renderAll(data.assessment);
      renderAI6RAgentResults(data);
    }
  } catch (err) {
    console.error('Vertex AI 6R Agent failed:', err);
    if (resultsBox) {
      resultsBox.innerHTML = `<div style="color:var(--accent-rose); font-size:0.84rem;">Error invoking Vertex AI 6R Agent.</div>`;
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '&#10024; Re-Run Vertex AI 6R Target Recommender Agent';
    }
    if (headerBtn) {
      headerBtn.disabled = false;
      headerBtn.innerHTML = '&#129302; Run AI 6R Agent';
    }
  }
}

function renderAI6RAgentResults(agentData) {
  const badge = document.getElementById('ai-6r-agent-status-badge');
  const resultsBox = document.getElementById('ai-6r-agent-results-box');
  if (!resultsBox || !agentData) return;

  if (badge) {
    badge.className = 'badge-6r badge-emerald';
    badge.innerHTML = agentData.live_vertex_ai
      ? `&#128994; Live Vertex AI Applied &bull; ${agentData.model} (${agentData.location})`
      : `&#9989; AI 6R Recommendations Applied (${agentData.recommendations?.length || 0} Workloads)`;
  }

  const recs = agentData.recommendations || [];
  resultsBox.style.display = 'block';
  resultsBox.innerHTML = `
    <div style="background:var(--bg-canvas); border:1px solid var(--border-strong); border-radius:var(--radius-md); padding:0.95rem; margin-bottom:0.85rem;">
      <div style="font-size:0.78rem; font-weight:700; color:var(--accent-blue); margin-bottom:0.3rem;">
        &#129302; ${agentData.agent || 'Vertex AI 6R Target Recommender Agent'} &bull; Executive Strategy Summary:
      </div>
      <div style="font-size:0.84rem; color:var(--text-primary); line-height:1.55;">
        ${agentData.executive_6r_summary || ''}
      </div>
    </div>
    <div class="table-wrapper">
      <table class="studio-table">
        <thead>
          <tr>
            <th>Workload Group</th>
            <th>AI Recommended 6R</th>
            <th>Prescribed Google Cloud Target Service</th>
            <th>Right-Sized Gen4 Machine Shape / SKU</th>
            <th>AI Confidence &amp; Wave</th>
            <th>Vertex AI Technical Rationale</th>
          </tr>
        </thead>
        <tbody>
          ${recs.map((r) => `
            <tr>
              <td>
                <strong>${r.workload_name}</strong>
                <div style="font-size:0.72rem; color:var(--text-secondary);">${r.servers} VMs &bull; ${r.source_tech} (${r.cpu_p95_pct}% CPU P95)</div>
              </td>
              <td><span class="badge-6r badge-${getBadgeColor(r.recommended_6r)}">${r.recommended_6r}</span></td>
              <td style="font-weight:600; color:var(--accent-blue); font-size:0.8rem;">${r.target_gcp_service}</td>
              <td class="mono-cell" style="font-size:0.76rem; color:var(--accent-emerald);">${r.rightsized_sku}</td>
              <td>
                <span class="badge-6r badge-emerald">${r.confidence_pct}% Conf.</span>
                <div style="font-size:0.7rem; color:var(--text-secondary); margin-top:2px;">${r.recommended_wave}</div>
              </td>
              <td style="font-size:0.76rem; color:var(--text-secondary); line-height:1.45;">${r.technical_rationale}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

async function loadSampleCSVIntoTextarea() {
  try {
    const res = await fetch('/api/sample-csv');
    const data = await res.json();
    document.getElementById('ingest-csv-text').value = data.csv || '';
  } catch (err) {
    console.error('Failed to load sample CSV:', err);
  }
}

async function downloadSampleCSVTemplate() {
  try {
    const res = await fetch('/api/sample-csv');
    const data = await res.json();
    const blob = new Blob([data.csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = data.filename || 'customer_rvtools_discovery_sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to download sample CSV:', err);
  }
}

async function runCustomerIngestion() {
  const clientName = document.getElementById('ingest-client-name').value.trim() || 'Enterprise Customer';
  const industry = document.getElementById('ingest-industry').value.trim() || 'Enterprise';
  const region = document.getElementById('ingest-region').value;
  const csvText = document.getElementById('ingest-csv-text').value.trim();
  const btn = document.getElementById('btn-run-ingestion');

  if (!csvText) {
    alert('Please upload a CSV file or load the sample RVTools CSV first.');
    return;
  }

  btn.textContent = 'Parsing Telemetry & Classifying 6R...';
  btn.disabled = true;

  try {
    const res = await fetch('/api/ingest-telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_name: clientName,
        industry: industry,
        region: region,
        csv_text: csvText,
      }),
    });
    const data = await res.json();
    if (data.status === 'ok') {
      // Add to estate dropdown if not already present
      const estateSelect = document.getElementById('estate-select');
      let opt = Array.from(estateSelect.options).find((o) => o.value === data.estate_id);
      if (!opt) {
        opt = document.createElement('option');
        opt.value = data.estate_id;
        opt.textContent = `${clientName} (Ingested CSV • ${data.assessment.summary_metrics.total_servers} Servers)`;
        estateSelect.appendChild(opt);
      }
      estateSelect.value = data.estate_id;
      state.estateId = data.estate_id;
      state.overrides = {};
      state.remediatedControls = [];
      state.extraWorkloads = [];
      state.assessment = data.assessment;

      document.getElementById('modal-ingest-data').classList.add('hidden');
      renderAll(data.assessment);
      activateTabById('tab-overview');
      askAIAdvisor(`Summarize the key findings and quick wins for ${clientName}`);
    } else {
      alert('Ingestion Error: ' + (data.message || 'Unknown error'));
    }
  } catch (err) {
    console.error('Ingestion failed:', err);
    alert('Failed to ingest telemetry.');
  } finally {
    btn.textContent = 'Run Discovery & 6R Classification Engine →';
    btn.disabled = false;
  }
}

async function fetchAssessment() {
  try {
    const res = await fetch('/api/assess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        estate_id: state.estateId,
        overrides: state.overrides,
        remediated_controls: state.remediatedControls,
        extra_workloads: state.extraWorkloads,
        cost_config: state.costConfig,
      }),
    });
    const data = await res.json();
    state.assessment = data;
    renderAll(data);
  } catch (err) {
    console.error('Assessment error:', err);
  }
}

async function askAIAdvisor(queryText) {
  const box = document.getElementById('ai-response-box');
  box.innerHTML = `<div style="color:var(--text-secondary); font-size:0.85rem;">&#10024; Querying live Google Cloud Vertex AI (<code>gemini-2.5-flash</code> in <code>imedtra-arch-modernization</code>) on <em>"${queryText}"</em>...</div>`;
  try {
    const res = await fetch('/api/ai-advisor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        estate_id: state.estateId,
        query: queryText,
        client_assessment: state.assessment,
      }),
    });
    const ans = await res.json();
    const formattedAnswer = (ans.answer || '')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.*?)`/g, '<code style="font-family:var(--font-mono); color:var(--accent-cyan);">$1</code>')
      .replace(/\n/g, '<br>');
    const statusPill = ans.live_vertex_ai
      ? `<span class="badge-6r badge-emerald">&#128994; Live Vertex AI Connected &bull; ${ans.model || 'vertex-ai/gemini-2.5-flash'} (${ans.location || 'europe-west1'})</span>`
      : `<span class="badge-6r badge-amber">&#9889; Grounded Telemetry Engine</span>`;
    box.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.55rem;">
        <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
          <span class="badge-6r badge-cyan">${ans.persona || 'SPARK AI Advisor'}</span>
          ${statusPill}
        </div>
        <span style="font-size:0.75rem; color:#10b981; font-weight:600;">Recommended Action: ${ans.recommended_action || ''}</span>
      </div>
      <h4 style="font-size:0.95rem; font-weight:700; color:var(--text-primary); margin-bottom:0.45rem;">${ans.title}</h4>
      <div style="font-size:0.84rem; color:var(--text-secondary); line-height:1.55;">${formattedAnswer}</div>
    `;
  } catch (err) {
    box.innerHTML = `<div style="color:#f43f5e;">Unable to reach AI Advisor endpoint.</div>`;
  }
}

function renderAll(data) {
  renderBannerAndKPIs(data);
  renderTab1OverviewAndInfra(data);
  renderTab2DomainsAndWorkloads(data);
  renderTab3Databases(data);
  renderTab4ScenariosAndCost(data);
  renderTab5WavesAndWAF(data);
}

/* ============================================================================
 * Header Banner & 4 Executive KPI Cards
 * ========================================================================== */
function renderBannerAndKPIs(data) {
  const est = data.estate;
  const sum = data.summary_metrics;
  const fin = data.financial_business_case;
  const ov = data.estate_overview;
  const ro = data.resource_optimization;
  const scen = data.migration_scenarios;

  document.getElementById('estate-name').textContent = est.name;
  document.getElementById('estate-date').textContent = `Prepared: ${est.prepared_date || 'August 05, 2026'}`;
  document.getElementById('estate-desc').textContent = est.description;
  document.getElementById('estate-env').textContent = `Environment: ${est.environment}`;
  document.getElementById('estate-region').textContent = `Target Region: ${state.costConfig.region || est.default_region}`;
  document.getElementById('estate-compliance').textContent = `Compliance: ${est.compliance_scope.join(', ')}`;

  // KPI 1: Footprint
  document.getElementById('kpi-footprint').textContent = `${sum.total_servers} Virtual Servers`;
  document.getElementById('kpi-footprint-sub').textContent =
    `${sum.total_applications} Applications • ${sum.total_vcpu.toLocaleString()} Cores • ${(sum.total_ram_gb / 1024).toFixed(1)} TB RAM • ${sum.total_storage_tb} TB Storage`;

  // KPI 2: Optimized Run-Rate (use Scenario 2 if available, otherwise financial_business_case)
  if (scen && scen.scenario_2_modernize) {
    const s2 = scen.scenario_2_modernize;
    document.getElementById('kpi-target-cost').textContent = `${fmtUSD(s2.future_annual_usd)} / yr`;
    document.getElementById('kpi-savings-pct').textContent = `-${s2.savings_pct}% Annual TCO`;
    document.getElementById('kpi-cost-sub').textContent =
      `Down from ${fmtUSD(s2.current_annual_usd)}/yr On-Prem Baseline (${fmtUSD(s2.annual_savings_usd)}/yr Savings)`;
  } else {
    document.getElementById('kpi-target-cost').textContent = `${fmtUSD(fin.target_annual_usd)} / yr`;
    document.getElementById('kpi-savings-pct').textContent = `-${fin.savings_pct}% Annual TCO`;
    document.getElementById('kpi-cost-sub').textContent =
      `Down from ${fmtUSD(fin.as_is_annual_usd)}/yr Baseline (${fmtUSD(fin.annual_savings_usd)}/yr Savings)`;
  }

  // KPI 3: Right-Sizing & Zombie Watchlist
  if (ov && ov.utilization_summary) {
    const u = ov.utilization_summary;
    document.getElementById('kpi-zombie-tag').textContent = `${u.zombie_servers_under_5_count} Zombie VMs (<5% CPU)`;
    document.getElementById('kpi-rightsize').textContent = `${u.overprovisioned_under_30_count} Over-provisioned`;
    document.getElementById('kpi-rightsize-sub').textContent =
      `${u.overprovisioned_under_30_pct}% VMs <30% CPU • Cores -${ro ? ro.cores_reduction_pct : 68}% (${u.total_cores} → ${ro ? ro.cores_after : 1150}) • RAM -${ro ? ro.memory_reduction_pct : 80}%`;
  }

  // KPI 4: OS Lifecycle & WAF Score
  if (ov && ov.technology_risk) {
    const tr = ov.technology_risk;
    document.getElementById('kpi-eos-tag').textContent = `${tr.out_of_support_servers} EOS OS Servers (${tr.out_of_support_pct}%)`;
  }
  document.getElementById('kpi-waf-score').textContent = `${data.waf_audit.overall_score_pct}% WAF Score`;

  // Populate Tab 2 AI 6R Summary Banner (#tab2-ai-6r-summary-banner)
  const tab2AiBanner = document.getElementById('tab2-ai-6r-summary-banner');
  if (tab2AiBanner && data.workloads && data.summary_metrics) {
    const dist = data.summary_metrics.treatment_distribution || {};
    const avgConf = Math.round(
      data.workloads.reduce((acc, w) => acc + (w.ai_confidence_pct || 94), 0) / Math.max(1, data.workloads.length)
    );
    const pillsHtml = Object.entries(dist)
      .filter(([_, count]) => count > 0)
      .map(([strat, count]) => `<span class="badge-6r badge-${getBadgeColor(strat)}" style="font-size:0.78rem;">${strat}: <strong>${count}</strong> App Groups</span>`)
      .join(' ');

    tab2AiBanner.style.display = 'block';
    tab2AiBanner.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem;">
        <div>
          <div style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.06em; color:#38bdf8; font-weight:700; margin-bottom:0.25rem;">
            🤖 Vertex AI 6R Migration &amp; Target Architecture Summary • Avg Confidence: ${avgConf}%
          </div>
          <div style="font-size:0.86rem; color:var(--text-primary); line-height:1.5;">
            AI 6R Recommender mapped <strong>${data.workloads.length} application groups (${ov ? ov.total_servers_discovered : 50} servers)</strong> to right-sized Gen4 Google Cloud SKUs (C4/N4, AlloyDB, Cloud SQL Enterprise Plus, GKE Autopilot, GCVE) with <strong>-${fin ? fin.savings_pct : 44}% TCO savings (${fin ? fmtUSD(fin.annual_savings_usd) : '$165K'}/yr)</strong>.
          </div>
          <div style="display:flex; flex-wrap:wrap; gap:0.45rem; margin-top:0.55rem;">
            ${pillsHtml}
          </div>
        </div>
        <div style="display:flex; gap:0.5rem;">
          <button type="button" class="btn btn-primary" onclick="runVertex6RAgent(false)" style="background:linear-gradient(135deg, #0284c7, #2563eb); border:1px solid #38bdf8; font-size:0.78rem; padding:0.45rem 0.85rem;">
            🤖 Re-Verify with Vertex AI 6R Agent
          </button>
        </div>
      </div>
    `;
  }
}

/* ============================================================================
 * TAB 1: 4-Column Estate Overview (Slide 3) & Infrastructure Findings (Slide 7-9)
 * ========================================================================== */
function renderTab1OverviewAndInfra(data) {
  const ov = data.estate_overview;
  const grid = document.getElementById('overview-4col-grid');

  if (ov) {
    const u = ov.utilization_summary;
    const tr = ov.technology_risk;
    const mod = ov.modernization_summary;

    grid.innerHTML = `
      <!-- Col 1: Servers & Applications -->
      <article class="overview-col-card">
        <div class="overview-col-header">
          <span class="overview-col-title">1. Servers &amp; Applications</span>
          <span class="badge-6r badge-cyan">${ov.mapping_coverage_pct}% Mapped</span>
        </div>
        <div class="overview-stat-big">${ov.servers_total} <span style="font-size:0.9rem; font-weight:500; color:var(--text-secondary);">Servers</span></div>
        <p style="font-size:0.78rem; color:var(--text-secondary); margin-bottom:0.5rem;">
          <strong>${ov.apps_defined} Applications</strong> discovered across ${ov.servers_virtual} Virtual Machines (${ov.power_on} Powered On).
        </p>
        <div class="overview-list">
          ${ov.platform_breakdown.map(p => `
            <div class="overview-list-item">
              <span>${p.os_family}</span>
              <strong>${p.count} VMs (${p.pct}%)</strong>
            </div>
          `).join('')}
        </div>
      </article>

      <!-- Col 2: Utilization & Right-Sizing -->
      <article class="overview-col-card">
        <div class="overview-col-header">
          <span class="overview-col-title">2. Resource Utilization</span>
          <span class="badge-6r badge-amber">${u.overprovisioned_under_30_pct}% &lt;30% CPU</span>
        </div>
        <div class="overview-stat-big cyan-text">${u.total_cores.toLocaleString()} <span style="font-size:0.9rem; font-weight:500; color:var(--text-secondary);">Cores</span></div>
        <p style="font-size:0.78rem; color:var(--text-secondary); margin-bottom:0.5rem;">
          <strong>${u.total_memory_tb} TB RAM</strong> • <strong>${u.total_storage_tb} TB Storage</strong> allocated.
        </p>
        <div class="overview-list">
          <div class="overview-list-item">
            <span>Over-provisioned (&lt;30% CPU)</span>
            <strong class="amber-text">${u.overprovisioned_under_30_count} VMs (${u.overprovisioned_under_30_pct}%)</strong>
          </div>
          <div class="overview-list-item">
            <span>Balanced (30%–70% CPU)</span>
            <strong class="emerald-text">${u.balanced_30_to_70_count} VMs (${u.balanced_30_to_70_pct}%)</strong>
          </div>
          <div class="overview-list-item">
            <span>Zombie Watchlist (&lt;5% CPU)</span>
            <strong style="color:#fb7185;">${u.zombie_servers_under_5_count} VMs (Retire Now)</strong>
          </div>
        </div>
      </article>

      <!-- Col 3: Technology & OS Lifecycle Risk -->
      <article class="overview-col-card">
        <div class="overview-col-header">
          <span class="overview-col-title">3. OS &amp; Tech Lifecycle Risk</span>
          <span class="badge-6r badge-rose">${tr.out_of_support_pct}% EOS OS</span>
        </div>
        <div class="overview-stat-big" style="color:#fb7185;">${tr.out_of_support_servers} <span style="font-size:0.9rem; font-weight:500; color:var(--text-secondary);">EOS VMs</span></div>
        <p style="font-size:0.78rem; color:var(--text-secondary); margin-bottom:0.5rem;">
          <strong>${tr.eol_summary.eol_technologies_count} EOL Tech Products</strong> impacting ${tr.eol_summary.applications_impacted} applications.
        </p>
        <div class="overview-list">
          <div class="overview-list-item">
            <span>Out of Support Now (Win 2008/2012/RHEL7)</span>
            <strong style="color:#fb7185;">${tr.os_timeline.out_of_support_now} VMs</strong>
          </div>
          <div class="overview-list-item">
            <span>Expiring Within 12 Months</span>
            <strong class="amber-text">${tr.os_timeline.expiring_within_12_months} VMs</strong>
          </div>
          <div class="overview-list-item">
            <span>Extended Support (Win 2016/2019/RHEL8)</span>
            <strong>${tr.os_timeline.extended_support} VMs</strong>
          </div>
        </div>
      </article>

      <!-- Col 4: Modernization Opportunities -->
      <article class="overview-col-card">
        <div class="overview-col-header">
          <span class="overview-col-title">4. Modernization Pathways</span>
          <span class="badge-6r badge-emerald">${mod.modernizable_pct}% Cloud-Native Ready</span>
        </div>
        <div class="overview-stat-big emerald-text">187 <span style="font-size:0.9rem; font-weight:500; color:var(--text-secondary);">PaaS Candidates</span></div>
        <p style="font-size:0.78rem; color:var(--text-secondary); margin-bottom:0.5rem;">
          Prime candidates for Cloud Run, GKE Autopilot, Cloud SQL, and AlloyDB:
        </p>
        <div class="overview-list">
          ${mod.opportunities_by_domain.slice(0, 4).map(d => `
            <div class="overview-list-item">
              <span>${d.domain} (${d.count})</span>
              <strong class="cyan-text">${d.target}</strong>
            </div>
          `).join('')}
        </div>
      </article>
    `;
  } else {
    grid.innerHTML = `<div class="card-panel">Estate Overview metrics available in  the Enterprise Estate flagship dataset.</div>`;
  }

  // Render Resource Optimization Before vs After Bars (Slide 9)
  const ro = data.resource_optimization;
  const roContainer = document.getElementById('resource-opt-bars');
  if (ro) {
    document.getElementById('opt-savings-badge').textContent =
      `${ro.rehost_savings_pct}% Rehost Optimization Savings (${fmtUSD(ro.as_is_rehost_annual_usd)} → ${fmtUSD(ro.optimized_rehost_annual_usd)}/yr)`;

    roContainer.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:1rem;">
        <!-- CPU Cores Bar -->
        <div>
          <div style="display:flex; justify-content:space-between; font-size:0.82rem; margin-bottom:0.35rem;">
            <span><strong>Provisioned vCPU Cores:</strong> ${ro.cores_before.toLocaleString()} Before &rarr; <strong class="emerald-text">${ro.cores_after.toLocaleString()} Right-Sized on GCE C4/N4</strong></span>
            <strong class="emerald-text">-${ro.cores_reduction_pct}% Cores Reduction (-${ro.cores_reduced.toLocaleString()} cores)</strong>
          </div>
          <div style="height:12px; background:rgba(255,255,255,0.08); border-radius:999px; overflow:hidden; display:flex;">
            <div style="width:${100 - ro.cores_reduction_pct}%; background:linear-gradient(90deg, #06b6d4, #10b981);"></div>
          </div>
        </div>

        <!-- Memory Bar -->
        <div>
          <div style="display:flex; justify-content:space-between; font-size:0.82rem; margin-bottom:0.35rem;">
            <span><strong>Provisioned Memory (RAM):</strong> ${ro.memory_before_tb} TB Before &rarr; <strong class="emerald-text">${ro.memory_after_tb} TB Right-Sized</strong></span>
            <strong class="emerald-text">-${ro.memory_reduction_pct}% Memory Reduction (-${ro.memory_reduced_tb} TB)</strong>
          </div>
          <div style="height:12px; background:rgba(255,255,255,0.08); border-radius:999px; overflow:hidden; display:flex;">
            <div style="width:${100 - ro.memory_reduction_pct}%; background:linear-gradient(90deg, #10b981, #3b82f6);"></div>
          </div>
        </div>

        <!-- Storage Hyperdisk Upgrade -->
        <div style="padding:0.75rem; background:rgba(6,182,212,0.07); border:1px solid rgba(6,182,212,0.25); border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-size:0.84rem; font-weight:700; color:var(--text-primary);">Storage Architecture Modernization: ${ro.storage_allocated_tb} TB Allocated</div>
            <div style="font-size:0.76rem; color:var(--text-secondary);">Upgraded from legacy VMware SAN/NAS to <strong>${ro.storage_target_type}</strong> with dynamic IOPS/throughput provisioning.</div>
          </div>
          <span class="badge-6r badge-cyan">100% Hyperdisk</span>
        </div>
      </div>
    `;
  }

  // Render OS Versions Support Table (Slide 7-8)
  const osTbody = document.getElementById('os-versions-tbody');
  const osList = data.os_versions_breakdown || [];
  osTbody.innerHTML = osList.map((os) => {
    const badgeClass = os.status === 'Out of Support' ? 'badge-rose' : (os.status === 'In Support' ? 'badge-emerald' : 'badge-amber');
    return `
      <tr>
        <td><strong>${os.version}</strong></td>
        <td class="mono-cell">${os.servers} VMs</td>
        <td><span class="badge-6r ${badgeClass}">${os.status}</span></td>
        <td class="mono-cell">${os.eos_date}</td>
      </tr>
    `;
  }).join('');

  // Render Network Connections Table (Slide 42)
  const netTbody = document.getElementById('network-connections-tbody');
  const netConns = data.network_connections || [];
  netTbody.innerHTML = netConns.map((c) => {
    let riskBadge = `<span class="badge-6r badge-emerald">Standard Private VPC Flow</span>`;
    if (c.risky_port && c.internet_exposed) {
      riskBadge = `<span class="badge-6r badge-rose">CRITICAL: Public RDP Jump Host &rarr; Replace with Cloud IAP</span>`;
    } else if (c.internet_exposed) {
      riskBadge = `<span class="badge-6r badge-cyan">Internet Ingress &rarr; Protect with Cloud Armor L7 WAF</span>`;
    } else if (c.cross_wave) {
      riskBadge = `<span class="badge-6r badge-amber">Cross-Wave Flow &rarr; Requires 100 Gbps GCVE-GCE Shared VPC</span>`;
    }
    return `
      <tr>
        <td><strong>${c.source_vm}</strong></td>
        <td class="mono-cell">${c.source_ip}</td>
        <td><strong>${c.dest_vm}</strong></td>
        <td class="mono-cell">${c.dest_ip}</td>
        <td class="mono-cell">${c.port} / ${c.proto}</td>
        <td class="mono-cell" style="color:#06b6d4;">${c.process}</td>
        <td>${riskBadge}</td>
      </tr>
    `;
  }).join('');
}

/* ============================================================================
 * TAB 2: Pattern Recognition & Technology Domains (Slide 11-20) + 6R Table
 * ========================================================================== */
function renderTab2DomainsAndWorkloads(data) {
  const td = data.technology_domains;
  const domainsGrid = document.getElementById('tech-domains-grid');

  if (td && td.domains) {
    domainsGrid.innerHTML = td.domains.map((dom) => `
      <article class="domain-card">
        <div class="domain-card-header">
          <div>
            <div class="domain-title">${dom.name}</div>
            <div style="font-size:0.74rem; color:var(--text-secondary);">${dom.products_count} Products • ${dom.installations_count} Installs</div>
          </div>
          <span class="badge-6r badge-cyan">${dom.primary_motion}</span>
        </div>
        <div style="font-size:0.76rem; color:#10b981; font-weight:600;">Consolidation: ${dom.consolidation_potential}</div>
        <div style="font-size:0.74rem; color:var(--text-secondary); margin-top:0.25rem;">Discovered Products (Red = EOL):</div>
        <div class="domain-product-tags">
          ${dom.top_products.map(p => `
            <span class="product-tag ${p.eol ? 'eol' : ''}" title="${p.eol ? 'End of Life / Out of Support' : 'Supported'}">
              ${p.name} (${p.installs})
            </span>
          `).join('')}
        </div>
        <div style="margin-top:auto; padding-top:0.55rem; border-top:1px solid rgba(255,255,255,0.06);">
          <div style="font-size:0.72rem; color:var(--text-secondary); margin-bottom:0.3rem;">Prescribed Google Cloud Targets:</div>
          ${dom.top_gcp_targets.map(t => `
            <div style="display:flex; justify-content:space-between; font-size:0.76rem; color:var(--text-primary);">
              <span>&rarr; ${t.service}</span>
              <strong class="cyan-text">${t.candidates} workloads</strong>
            </div>
          `).join('')}
        </div>
      </article>
    `).join('');
  } else {
    domainsGrid.innerHTML = '';
  }

  // Render 6R Treatment Summary Pills
  const dist = data.summary_metrics.treatment_distribution;
  const summaryBar = document.getElementById('treatment-summary-bar');
  summaryBar.innerHTML = Object.entries(dist)
    .filter(([_, count]) => count > 0)
    .map(([strat, count]) => `<span class="badge-6r badge-${getBadgeColor(strat)}">${strat}: ${count} Workload Groups</span>`)
    .join('');

  // Render Interactive 6R Table with Clickable App Name for Slide 5 Modal
  const tbody = document.getElementById('workload-tbody');
  tbody.innerHTML = data.workloads.map((wl) => {
    const eolBadge = wl.eol_risk === 'Critical' || wl.eol_risk === 'High'
      ? `<span class="badge-6r badge-rose">${wl.eol_risk} EOL Risk</span>`
      : `<span class="badge-6r badge-emerald">${wl.eol_risk} Risk</span>`;

    return `
      <tr>
        <td>
          <a href="javascript:void(0)" class="workload-name-link" data-wl-id="${wl.id}" style="color:#06b6d4; font-weight:700; text-decoration:underline; font-size:0.88rem;">
            ${wl.name} &#8599;
          </a>
          <div class="workload-tier">${wl.tier} • Criticality: ${wl.criticality}</div>
        </td>
        <td>
          <div style="font-weight:500; color:var(--text-primary);">${wl.source_tech}</div>
          <div style="font-size:0.74rem; color:var(--text-secondary);">OS: ${wl.os}</div>
        </td>
        <td class="mono-cell">
          <strong>${wl.servers} VMs</strong><br>
          <span style="font-size:0.74rem; color:var(--text-secondary);">${wl.vcpu} vCPU • ${wl.ram_gb} GB RAM</span>
        </td>
        <td>
          <div class="mono-cell">P95 CPU: <strong>${wl.cpu_utilization_p95}%</strong></div>
          <div style="margin-top:0.25rem;">${eolBadge}</div>
        </td>
        <td>
          <select class="table-select wl-6r-select" data-id="${wl.id}">
            ${['Rehost', 'Replatform', 'Refactor', 'Replace', 'Retain', 'Retire'].map((opt) =>
              `<option value="${opt}" ${wl.active_6r === opt ? 'selected' : ''}>${opt}</option>`
            ).join('')}
          </select>
          <div style="margin-top:0.3rem; display:flex; gap:0.3rem; flex-wrap:wrap;">
            <span class="badge-6r badge-cyan" style="font-size:0.68rem;">🤖 ${wl.ai_confidence_pct || 94}% AI Conf.</span>
            <span class="badge-6r badge-indigo" style="font-size:0.68rem;">${wl.recommended_wave || 'Wave 2'}</span>
          </div>
        </td>
        <td>
          <input type="text" class="table-select wl-gcp-input" data-id="${wl.id}" value="${wl.active_gcp_service}" style="width:100%; min-width:220px;">
          <div style="font-size:0.74rem; color:#38bdf8; font-family:'JetBrains Mono', monospace; margin-top:0.28rem;">
            <strong>Right-Sized SKU:</strong> ${wl.rightsized_sku || 'Gen4 c4-standard-8 (Hyperdisk Balanced)'}
          </div>
          <div style="font-size:0.73rem; color:var(--text-secondary); margin-top:0.2rem;">${wl.target_rationale}</div>
        </td>
        <td class="mono-cell">
          <div style="font-size:0.9rem; font-weight:700; color:#10b981;">${fmtUSD(wl.target_annual_cost_usd)}/yr</div>
          <div style="font-size:0.74rem; color:var(--text-secondary);">Save ${fmtUSD(wl.annual_savings_usd)}/yr (-${wl.savings_pct}%)</div>
        </td>
      </tr>
    `;
  }).join('');

  // Bind clickable workload links for Slide 5 Modal
  document.querySelectorAll('.workload-name-link').forEach((link) => {
    link.addEventListener('click', () => {
      const wlId = link.getAttribute('data-wl-id');
      const wl = data.workloads.find((w) => w.id === wlId);
      if (wl) openAppDetailModal(wl);
    });
  });

  // Bind 6R dropdown changes
  document.querySelectorAll('.wl-6r-select').forEach((sel) => {
    sel.addEventListener('change', (e) => {
      const wlId = e.target.getAttribute('data-id');
      const new6R = e.target.value;
      const suggestedGcp = GCP_SERVICE_SUGGESTIONS[new6R] || 'Google Compute Engine';
      state.overrides[wlId] = { recommended_6r: new6R, target_gcp_service: suggestedGcp };
      fetchAssessment();
    });
  });

  document.querySelectorAll('.wl-gcp-input').forEach((inp) => {
    inp.addEventListener('change', (e) => {
      const wlId = e.target.getAttribute('data-id');
      const current6R = state.overrides[wlId]?.recommended_6r ||
        data.workloads.find((w) => w.id === wlId).active_6r;
      state.overrides[wlId] = { recommended_6r: current6R, target_gcp_service: e.target.value };
      fetchAssessment();
    });
  });
}

/* ============================================================================
 * Slide 5 Per-Application Assessment Deep-Dive Modal
 * ========================================================================== */
function openAppDetailModal(wl) {
  const modal = document.getElementById('modal-app-detail');
  document.getElementById('app-modal-tier').textContent = `Slide 5 Application Deep-Dive • ${wl.tier}`;
  document.getElementById('app-modal-title').textContent = wl.name;

  const prodServers = Math.max(1, Math.round(wl.servers * 0.72));
  const nonProdServers = wl.servers - prodServers;
  const rehostCost = Math.round(wl.current_annual_cost_usd * 0.62);
  const paasCost = wl.target_annual_cost_usd;

  const body = document.getElementById('app-modal-body');
  body.innerHTML = `
    <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:0.85rem; margin-bottom:1.25rem;">
      <div class="card-panel" style="padding:0.85rem;">
        <div style="font-size:0.72rem; color:var(--text-secondary); text-transform:uppercase;">Server Environment Split</div>
        <div style="font-size:1.25rem; font-weight:700; color:var(--text-primary); margin-top:0.25rem;">${wl.servers} Total VMs</div>
        <div style="font-size:0.76rem; color:#06b6d4;">${prodServers} Prod • ${nonProdServers} Non-Prod (175h/mo)</div>
      </div>
      <div class="card-panel" style="padding:0.85rem;">
        <div style="font-size:0.72rem; color:var(--text-secondary); text-transform:uppercase;">OS &amp; App Stack EOL Risk</div>
        <div style="font-size:1.25rem; font-weight:700; color:#fb7185; margin-top:0.25rem;">${wl.eol_risk} Risk</div>
        <div style="font-size:0.76rem; color:var(--text-secondary);">${wl.app_stack_eol_count || 2} EOL Software Packages</div>
      </div>
      <div class="card-panel" style="padding:0.85rem;">
        <div style="font-size:0.72rem; color:var(--text-secondary); text-transform:uppercase;">Network Dependencies</div>
        <div style="font-size:1.25rem; font-weight:700; color:var(--text-primary); margin-top:0.25rem;">${wl.inbound_deps || 2} In / ${wl.outbound_deps || 1} Out</div>
        <div style="font-size:0.76rem; color:#10b981;">100 Gbps Shared VPC Ready</div>
      </div>
      <div class="card-panel" style="padding:0.85rem;">
        <div style="font-size:0.72rem; color:var(--text-secondary); text-transform:uppercase;">Prescribed 6R Strategy</div>
        <div style="font-size:1.25rem; font-weight:700; color:#10b981; margin-top:0.25rem;">${wl.active_6r}</div>
        <div style="font-size:0.76rem; color:var(--text-secondary);">Est. Velocity: ${wl.estimated_weeks} Weeks</div>
      </div>
    </div>

    <div class="card-panel" style="margin-bottom:1.25rem;">
      <h4 style="font-size:0.9rem; font-weight:700; color:var(--text-primary); margin-bottom:0.65rem;">3-Way Financial Comparison for ${wl.name} (Slide 5 Model)</h4>
      <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:1rem;">
        <div style="padding:0.85rem; background:rgba(255,255,255,0.03); border-radius:8px; border:1px solid rgba(255,255,255,0.08);">
          <div style="font-size:0.75rem; color:var(--text-secondary);">1. Current On-Premises Baseline</div>
          <div style="font-size:1.35rem; font-weight:700; color:var(--text-primary); margin:0.3rem 0;">${fmtUSD(wl.current_annual_cost_usd)} / yr</div>
          <div style="font-size:0.74rem; color:var(--text-secondary);">Hardware refresh, power, VMware licensing &amp; support</div>
        </div>
        <div style="padding:0.85rem; background:rgba(6,182,212,0.06); border-radius:8px; border:1px solid rgba(6,182,212,0.25);">
          <div style="font-size:0.75rem; color:#06b6d4;">2. IaaS Rehost (Right-Sized + 3-Yr CUD)</div>
          <div style="font-size:1.35rem; font-weight:700; color:#06b6d4; margin:0.3rem 0;">${fmtUSD(rehostCost)} / yr</div>
          <div style="font-size:0.74rem; color:var(--text-secondary);">Lift &amp; shift to GCE C4 / GCVE with right-sized vCPU</div>
        </div>
        <div style="padding:0.85rem; background:rgba(16,185,129,0.08); border-radius:8px; border:1px solid rgba(16,185,129,0.35);">
          <div style="font-size:0.75rem; color:#10b981;">3. Recommended ${wl.active_6r} (${wl.active_gcp_service.split('+')[0]})</div>
          <div style="font-size:1.35rem; font-weight:700; color:#10b981; margin:0.3rem 0;">${fmtUSD(paasCost)} / yr</div>
          <div style="font-size:0.74rem; color:#10b981; font-weight:600;">Saves ${fmtUSD(wl.annual_savings_usd)}/yr (-${wl.savings_pct}%)</div>
        </div>
      </div>
    </div>

    <div class="card-panel">
      <h4 style="font-size:0.9rem; font-weight:700; color:var(--text-primary); margin-bottom:0.45rem;">Architectural Transformation Prescription</h4>
      <p style="font-size:0.84rem; color:var(--text-secondary); line-height:1.55;">
        <strong>Source Footprint:</strong> ${wl.source_tech} running on ${wl.os} (${wl.vcpu} vCPUs, ${wl.ram_gb} GB RAM, ${wl.storage_tb} TB storage at ${wl.cpu_utilization_p95}% P95 CPU utilization).<br><br>
        <strong>Target Google Cloud Architecture:</strong> Migrate to <strong>${wl.active_gcp_service}</strong>. ${wl.target_rationale}
      </p>
    </div>
  `;

  modal.classList.remove('hidden');
}

function closeAppModal() {
  document.getElementById('modal-app-detail').classList.add('hidden');
}

/* ============================================================================
 * TAB 3: Databases Modernization & Sankey Pathways (Slide 21-27)
 * ========================================================================== */
function renderTab3Databases(data) {
  const dbList = data.database_modernization || [];
  const grid = document.getElementById('db-engine-grid');

  if (dbList.length === 0) {
    grid.innerHTML = `<div class="card-panel">Database deep-dive pathways are populated for the flagship  the Enterprise Estate estate.</div>`;
    return;
  }

  grid.innerHTML = dbList.map((db) => `
    <article class="db-engine-card">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <h3 style="font-size:1.05rem; font-weight:700; color:var(--text-primary);">${db.engine} Estate</h3>
          <div style="font-size:0.76rem; color:var(--text-secondary);">${db.servers} Discovered Servers • ${db.unique_versions} Versions</div>
        </div>
        <span class="badge-6r ${db.eol_servers > 0 ? 'badge-rose' : 'badge-emerald'}">
          ${db.eol_servers} EOL Servers
        </span>
      </div>

      <!-- Discovered Versions Table -->
      <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:0.25rem;">Discovered Version Breakdown:</div>
      <div style="display:flex; flex-direction:column; gap:0.35rem;">
        ${db.versions.map(v => `
          <div style="display:flex; justify-content:space-between; font-size:0.78rem; padding:0.3rem 0.5rem; background:rgba(255,255,255,0.02); border-radius:6px;">
            <span>${v.ver}</span>
            <span>
              <strong class="mono-cell">${v.count} VMs</strong> •
              <span style="color:${v.status === 'Out of Support' ? '#fb7185' : '#34d399'};">${v.status} (${v.eos})</span>
            </span>
          </div>
        `).join('')}
      </div>

      <!-- Sankey Modernization Pathways -->
      <div style="font-size:0.75rem; color:#06b6d4; font-weight:600; margin-top:0.35rem;">Prescribed Google Cloud Target Pathways:</div>
      ${db.pathways.map(pw => `
        <div class="db-pathway-bar">
          <div style="display:flex; justify-content:space-between; font-size:0.82rem; font-weight:700; color:var(--text-primary);">
            <span>&rarr; ${pw.target}</span>
            <span class="emerald-text">${pw.share_pct}% of Fleet</span>
          </div>
          <div style="height:6px; background:rgba(255,255,255,0.08); border-radius:999px; overflow:hidden; margin:0.3rem 0;">
            <div style="width:${pw.share_pct}%; height:100%; background:linear-gradient(90deg, #06b6d4, #10b981);"></div>
          </div>
          <div style="font-size:0.74rem; color:var(--text-secondary);">${pw.rationale}</div>
        </div>
      `).join('')}
    </article>
  `).join('');

  // Render Database Cost Matrix Table (Slide 27)
  const matrixTbody = document.getElementById('db-cost-matrix-tbody');
  let totalServers = 0, totalEol = 0, totalComp = 0, totalStor = 0, totalLic = 0, totalAll = 0;

  const rowsHtml = dbList.map((db) => {
    const c = db.cost_breakdown;
    totalServers += db.servers;
    totalEol += db.eol_servers;
    totalComp += c.compute_usd;
    totalStor += c.storage_usd;
    totalLic += c.licensing_usd;
    totalAll += c.total_usd;

    return `
      <tr>
        <td><strong>${db.engine}</strong></td>
        <td class="mono-cell">${db.servers} VMs</td>
        <td class="mono-cell" style="color:${db.eol_servers > 0 ? '#fb7185' : '#94a3b8'}; font-weight:600;">${db.eol_servers} EOL</td>
        <td class="mono-cell">${fmtUSD(c.compute_usd)}</td>
        <td class="mono-cell">${fmtUSD(c.storage_usd)}</td>
        <td class="mono-cell">${fmtUSD(c.licensing_usd)}</td>
        <td class="mono-cell" style="font-weight:700; color:#10b981;">${fmtUSD(c.total_usd)} / yr</td>
      </tr>
    `;
  }).join('');

  const footerRow = `
    <tr style="background:rgba(16,185,129,0.08); border-top:2px solid rgba(16,185,129,0.35);">
      <td><strong>TOTAL DATABASE ESTATE (58 SERVERS)</strong></td>
      <td class="mono-cell"><strong>${totalServers} VMs</strong></td>
      <td class="mono-cell" style="color:#fb7185;"><strong>${totalEol} EOL</strong></td>
      <td class="mono-cell"><strong>${fmtUSD(totalComp)}</strong></td>
      <td class="mono-cell"><strong>${fmtUSD(totalStor)}</strong></td>
      <td class="mono-cell"><strong>${fmtUSD(totalLic)}</strong></td>
      <td class="mono-cell" style="font-size:0.95rem; font-weight:700; color:#10b981;"><strong>${fmtUSD(totalAll)} / yr</strong></td>
    </tr>
  `;
  matrixTbody.innerHTML = rowsHtml + footerRow;
}

/* ============================================================================
 * TAB 4: Interactive Cost Configurator & Scenario 1 vs Scenario 2 (Slide 28-35)
 * ========================================================================== */
function renderTab4ScenariosAndCost(data) {
  const scen = data.migration_scenarios;
  const container = document.getElementById('scenario-comparison-grid');
  document.getElementById('fin-co2-saved').textContent = `${data.financial_business_case.co2_saved_tons} Tons CO2e/yr`;

  if (!scen) {
    container.innerHTML = `<div class="card-panel">Scenario 1 vs Scenario 2 comparison matrix is loaded for the  the Enterprise Estate estate.</div>`;
    return;
  }

  const s1 = scen.scenario_1_rehost;
  const s2 = scen.scenario_2_modernize;

  container.innerHTML = `
    <!-- Scenario 1 Card -->
    <article class="scenario-card">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.65rem;">
        <div>
          <span class="badge-6r badge-cyan">Scenario 1 • Low Complexity</span>
          <h3 style="font-size:1.1rem; font-weight:700; color:var(--text-primary); margin-top:0.35rem;">${s1.name}</h3>
        </div>
        <div style="text-align:right;">
          <div style="font-size:1.45rem; font-weight:700; color:#06b6d4; font-family:var(--font-mono);">${fmtUSD(s1.future_annual_usd)}/yr</div>
          <div style="font-size:0.78rem; color:#10b981; font-weight:600;">Saves ${fmtUSD(s1.annual_savings_usd)}/yr (-${s1.savings_pct}%)</div>
        </div>
      </div>
      <p style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:0.95rem;">${s1.complexity}</p>

      <div class="table-wrapper">
        <table class="studio-table">
          <thead>
            <tr>
              <th>Workload Group</th>
              <th>Configuration &amp; Discount</th>
              <th>Compute</th>
              <th>Storage</th>
              <th>Licensing</th>
              <th>Total Annual</th>
            </tr>
          </thead>
          <tbody>
            ${s1.line_items.map(item => `
              <tr>
                <td><strong>${item.workload}</strong></td>
                <td style="font-size:0.75rem; color:var(--text-secondary);">${item.config}</td>
                <td class="mono-cell">${fmtUSD(item.compute)}</td>
                <td class="mono-cell">${fmtUSD(item.storage)}</td>
                <td class="mono-cell">${fmtUSD(item.licensing)}</td>
                <td class="mono-cell" style="font-weight:700; color:var(--text-primary);">${fmtUSD(item.total)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </article>

    <!-- Scenario 2 Card (Recommended) -->
    <article class="scenario-card recommended">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.65rem;">
        <div>
          <span class="badge-6r badge-emerald">RECOMMENDED • Scenario 2 • Highest ROI</span>
          <h3 style="font-size:1.1rem; font-weight:700; color:var(--text-primary); margin-top:0.35rem;">${s2.name}</h3>
        </div>
        <div style="text-align:right;">
          <div style="font-size:1.45rem; font-weight:700; color:#10b981; font-family:var(--font-mono);">${fmtUSD(s2.future_annual_usd)}/yr</div>
          <div style="font-size:0.78rem; color:#10b981; font-weight:700;">Saves ${fmtUSD(s2.annual_savings_usd)}/yr (-${s2.savings_pct}%)</div>
        </div>
      </div>
      <p style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:0.95rem;">${s2.complexity}</p>

      <div class="table-wrapper">
        <table class="studio-table">
          <thead>
            <tr>
              <th>Workload Group</th>
              <th>Modernized Cloud Native Configuration</th>
              <th>Compute</th>
              <th>Storage</th>
              <th>Licensing</th>
              <th>Total Annual</th>
            </tr>
          </thead>
          <tbody>
            ${s2.line_items.map(item => `
              <tr>
                <td><strong>${item.workload}</strong></td>
                <td style="font-size:0.75rem; color:var(--text-secondary);">${item.config}</td>
                <td class="mono-cell">${fmtUSD(item.compute)}</td>
                <td class="mono-cell">${fmtUSD(item.storage)}</td>
                <td class="mono-cell">${fmtUSD(item.licensing)}</td>
                <td class="mono-cell" style="font-weight:700; color:#10b981;">${fmtUSD(item.total)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </article>
  `;
}

/* ============================================================================
 * TAB 5: Dependency Waves (Slide 43) & 5-Pillar Google Cloud WAF Scorecard
 * ========================================================================== */
function renderTab5WavesAndWAF(data) {
  const wavesContainer = document.getElementById('waves-container');
  wavesContainer.innerHTML = data.waves.map((w) => `
    <article class="wave-card">
      <div class="wave-meta">
        <span class="wave-num">WAVE ${w.wave_number} • ${w.timeline}</span>
        <div class="wave-title">${w.name}</div>
        <p class="wave-focus">${w.focus}</p>
      </div>
      <div class="wave-workloads">
        ${w.workloads.map((wl) => `
          <div class="wave-item-chip">
            <div class="wave-item-name">${wl.name}</div>
            <div class="wave-item-target">${wl.active_6r} &rarr; ${wl.active_gcp_service}</div>
          </div>
        `).join('')}
      </div>
    </article>
  `).join('');

  // Render Target Google Cloud 6R Landing Zone Architecture Blueprint (#tab6-architecture-diagram-box)
  const archBox = document.getElementById('tab6-architecture-diagram-box');
  if (archBox && data.workloads) {
    const by6R = {};
    data.workloads.forEach((wl) => {
      const r = wl.active_6r || 'Replatform';
      if (!by6R[r]) by6R[r] = [];
      by6R[r].push(wl);
    });

    const zoneMeta = {
      'Replatform': { title: 'Managed Database & Compute Zone (Replatform)', icon: '🗄️', color: '#06b6d4', subnet: 'vpc-prod-data-compute (AlloyDB / Cloud SQL Ent+ / Gen4 C4)' },
      'Refactor': { title: 'Cloud-Native Serverless & Kubernetes Zone (Refactor)', icon: '☸️', color: '#10b981', subnet: 'vpc-prod-cloudnative (GKE Autopilot / Cloud Run / PubSub)' },
      'Rehost': { title: 'Dedicated VMware SDDC Zone (Rehost)', icon: '🖧', color: '#6366f1', subnet: 'vpc-prod-gcve (Google Cloud VMware Engine HCX L2)' },
      'Replace': { title: 'Managed Security & SaaS Identity Zone (Replace)', icon: '🛡️', color: '#f59e0b', subnet: 'vpc-shared-security (Managed AD / CAS / Chronicle SecOps)' },
      'Retire': { title: 'Decommission & Coldline Archive Vault (Retire)', icon: '🧊', color: '#f43f5e', subnet: 'gcs-compliance-vault (Cloud Storage Coldline + ILM)' }
    };

    archBox.innerHTML = `
      <div class="panel-header" style="margin-bottom:0.85rem;">
        <div>
          <span class="panel-kicker">Vertex AI 6R Target Architecture Blueprint • Cloud Foundation Fabric</span>
          <h3 style="margin:0.15rem 0 0 0; font-size:1.05rem;">Target Google Cloud Hub-and-Spoke Landing Zone (Mapped by 6R Treatment)</h3>
        </div>
        <span class="badge-6r badge-cyan">Shared VPC + Cloud Armor WAF + KMS</span>
      </div>
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:0.9rem;">
        ${Object.entries(by6R).map(([strat, list]) => {
          const m = zoneMeta[strat] || { title: `${strat} Landing Zone`, icon: '☁️', color: '#38bdf8', subnet: 'vpc-prod-spoke' };
          return `
            <div style="background:rgba(15,23,42,0.65); border:1px solid ${m.color}55; border-top:3px solid ${m.color}; border-radius:10px; padding:0.85rem;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem;">
                <strong style="font-size:0.86rem; color:var(--text-primary);">${m.icon} ${m.title}</strong>
                <span class="badge-6r" style="background:${m.color}22; color:${m.color}; border:1px solid ${m.color}55;">${list.length} Apps</span>
              </div>
              <div style="font-size:0.72rem; font-family:'JetBrains Mono', monospace; color:var(--text-secondary); margin-bottom:0.65rem;">
                Subnet: ${m.subnet}
              </div>
              <div style="display:flex; flex-direction:column; gap:0.45rem;">
                ${list.map((w) => `
                  <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:6px; padding:0.45rem 0.6rem;">
                    <div style="display:flex; justify-content:space-between; font-size:0.79rem; font-weight:700; color:var(--text-primary);">
                      <span>${w.name}</span>
                      <span style="color:#10b981;">${fmtUSD(w.target_annual_cost_usd)}/yr</span>
                    </div>
                    <div style="font-size:0.73rem; color:#38bdf8; margin-top:0.15rem;">&rarr; ${w.active_gcp_service}</div>
                    <div style="font-size:0.69rem; color:var(--text-secondary); font-family:'JetBrains Mono', monospace; margin-top:0.12rem;">SKU: ${w.rightsized_sku || 'Gen4 C4'}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // WAF Scorecard
  const waf = data.waf_audit;
  document.getElementById('waf-overall-badge').textContent = `Overall Compliance: ${waf.overall_score_pct}%`;

  const pillarsGrid = document.getElementById('waf-pillars-grid');
  pillarsGrid.innerHTML = waf.pillars.map((p) => `
    <div class="waf-pillar-card">
      <div class="waf-pillar-name">${p.pillar}</div>
      <div class="waf-pillar-score" style="color:${p.score_pct >= 85 ? '#10b981' : '#f59e0b'}">${p.score_pct}%</div>
    </div>
  `).join('');

  const controlsList = document.getElementById('waf-controls-list');
  controlsList.innerHTML = waf.controls.map((c) => {
    const isPass = c.status === 'PASS';
    return `
      <div class="waf-control-card">
        <div class="waf-control-left">
          <div style="display:flex; align-items:center; gap:0.65rem;">
            <span class="badge-6r ${isPass ? 'badge-emerald' : 'badge-amber'}">${c.status}</span>
            <span class="waf-control-title">${c.title}</span>
            <span style="font-size:0.75rem; color:var(--text-secondary);">(${c.pillar})</span>
          </div>
          <p class="waf-control-desc"><strong>Finding:</strong> ${c.finding}</p>
          <p class="waf-control-desc" style="color:#06b6d4;"><strong>Target Remediation:</strong> ${c.remediation}</p>
        </div>
        <div>
          ${isPass ? `
            <span class="badge-6r badge-emerald">Compliant</span>
          ` : `
            <button class="btn btn-primary btn-remediate" data-id="${c.id}">
              Apply AI Remediation (+${Math.round(c.score_impact * 0.55)}% Score)
            </button>
          `}
        </div>
      </div>
    `;
  }).join('');

  document.querySelectorAll('.btn-remediate').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const ctrlId = e.target.getAttribute('data-id');
      if (!state.remediatedControls.includes(ctrlId)) {
        state.remediatedControls.push(ctrlId);
        fetchAssessment();
      }
    });
  });
}

/* ============================================================================
 * Export Deliverables (Rapid Insights Markdown Report & Terraform IaC)
 * ========================================================================== */
async function exportDeliverable(type) {
  const endpoint = type === 'markdown' ? '/api/export-markdown' : '/api/export-terraform';
  const title = type === 'markdown'
    ? 'Rapid Insights Executive & Technical Assessment Report (Markdown)'
    : 'Google Cloud Foundation Fabric Terraform Blueprint (main.tf)';
  state.currentExportFilename = type === 'markdown'
    ? `${state.estateId}-rapid-insights-report.md`
    : `${state.estateId}-terraform-blueprint.tf`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        estate_id: state.estateId,
        overrides: state.overrides,
        remediated_controls: state.remediatedControls,
        extra_workloads: state.extraWorkloads,
        cost_config: state.costConfig,
      }),
    });
    const data = await res.json();
    state.currentExportContent = data.content;
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-code-content').textContent = data.content;
    document.getElementById('modal-backdrop').classList.remove('hidden');
  } catch (err) {
    console.error('Export failed:', err);
  }
}

function closeModal() {
  document.getElementById('modal-backdrop').classList.add('hidden');
}

function getBadgeColor(strategy) {
  const map = {
    Rehost: 'amber',
    Replatform: 'cyan',
    Refactor: 'emerald',
    Replace: 'blue',
    Retain: 'slate',
    Retire: 'rose',
  };
  return map[strategy] || 'cyan';
}

/* ============================================================================
 * White / Black Background Toggle (Strictly #ffffff or #000000)
 * ========================================================================== */
function initBackgroundCustomizer() {
  const swatches = document.querySelectorAll('.bg-swatch-btn');
  const rawSaved = (localStorage.getItem('spark_bg_color') || '#ffffff').toLowerCase();
  const savedColor = rawSaved === '#000000' || rawSaved === '#090d14' ? '#000000' : '#ffffff';

  applyCustomBackgroundColor(savedColor);

  swatches.forEach((btn) => {
    const color = (btn.getAttribute('data-bgcolor') || '').toLowerCase();
    btn.classList.toggle('active', color === savedColor);
    btn.addEventListener('click', () => {
      const targetColor = btn.getAttribute('data-bgcolor') === '#000000' ? '#000000' : '#ffffff';
      swatches.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      applyCustomBackgroundColor(targetColor);
    });
  });
}

function applyCustomBackgroundColor(hexColor) {
  const normalized = hexColor === '#000000' ? '#000000' : '#ffffff';
  localStorage.setItem('spark_bg_color', normalized);
  const root = document.documentElement;

  if (normalized === '#ffffff') {
    // White Background Theme
    root.style.setProperty('--bg-canvas', '#ffffff');
    root.style.setProperty('--bg-surface', '#f8fafc');
    root.style.setProperty('--bg-elevated', '#f1f5f9');
    root.style.setProperty('--bg-hover', 'rgba(15, 23, 42, 0.06)');
    root.style.setProperty('--header-bg', 'rgba(255, 255, 255, 0.96)');
    root.style.setProperty('--border-subtle', '#e2e8f0');
    root.style.setProperty('--border-strong', '#cbd5e1');
    root.style.setProperty('--text-primary', '#0f172a');
    root.style.setProperty('--text-secondary', '#334155');
    root.style.setProperty('--text-muted', '#64748b');
  } else {
    // Black Background Theme
    root.style.setProperty('--bg-canvas', '#000000');
    root.style.setProperty('--bg-surface', '#0c111d');
    root.style.setProperty('--bg-elevated', '#161f30');
    root.style.setProperty('--bg-hover', 'rgba(255, 255, 255, 0.08)');
    root.style.setProperty('--header-bg', 'rgba(0, 0, 0, 0.96)');
    root.style.setProperty('--border-subtle', 'rgba(255, 255, 255, 0.12)');
    root.style.setProperty('--border-strong', 'rgba(255, 255, 255, 0.22)');
    root.style.setProperty('--text-primary', '#f8fafc');
    root.style.setProperty('--text-secondary', '#cbd5e1');
    root.style.setProperty('--text-muted', '#94a3b8');
  }
}

/* ============================================================================
 * Floating Google Cloud Vertex AI Architecture Copilot Widget
 * ========================================================================== */
const vertexChatHistory = [];

function initVertexAICopilot() {
  const fab = document.getElementById('vertex-copilot-fab');
  const drawer = document.getElementById('vertex-copilot-drawer');
  const closeBtn = document.getElementById('btn-close-vertex-drawer');
  const clearBtn = document.getElementById('btn-clear-vertex-chat');
  const form = document.getElementById('vertex-chat-form');
  const input = document.getElementById('vertex-chat-input');
  const messagesEl = document.getElementById('vertex-chat-messages');

  if (!fab || !drawer) return;

  fab.addEventListener('click', () => {
    drawer.classList.toggle('hidden');
    if (!drawer.classList.contains('hidden') && input) {
      input.focus();
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => drawer.classList.add('hidden'));
  }

  if (clearBtn && messagesEl) {
    clearBtn.addEventListener('click', () => {
      vertexChatHistory.length = 0;
      messagesEl.innerHTML = `
        <div class="vertex-chat-bubble assistant">
          <strong>Vertex AI Principal Cloud Architect:</strong><br>
          Conversation reset. Ask me anything about the active estate assessment!
        </div>
      `;
    });
  }

  document.querySelectorAll('.vertex-quick-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const q = chip.getAttribute('data-q');
      if (q) sendVertexCopilotMessage(q);
    });
  });

  if (form && input) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = input.value.trim();
      if (!q) return;
      input.value = '';
      sendVertexCopilotMessage(q);
    });
  }
}

async function sendVertexCopilotMessage(userText) {
  const messagesEl = document.getElementById('vertex-chat-messages');
  if (!messagesEl) return;

  const userBubble = document.createElement('div');
  userBubble.className = 'vertex-chat-bubble user';
  userBubble.textContent = userText;
  messagesEl.appendChild(userBubble);

  const thinkingBubble = document.createElement('div');
  thinkingBubble.className = 'vertex-chat-bubble assistant';
  thinkingBubble.innerHTML = '<em>&#10024; Vertex AI Agent is analyzing estate telemetry...</em>';
  messagesEl.appendChild(thinkingBubble);
  messagesEl.scrollTop = messagesEl.scrollHeight;

  try {
    const res = await fetch('/api/ai-advisor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        estate_id: state.estateId,
        query: userText,
        history: vertexChatHistory,
        client_assessment: state.assessment,
      }),
    });
    const ans = await res.json();
    vertexChatHistory.push({ role: 'user', content: userText });
    vertexChatHistory.push({ role: 'assistant', content: ans.answer || '' });

    const formatted = (ans.answer || '')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.*?)`/g, '<code style="font-family:var(--font-mono); color:var(--accent-cyan);">$1</code>')
      .replace(/\n/g, '<br>');

    const liveTag = ans.live_vertex_ai
      ? `<span style="display:inline-block; background:rgba(16,185,129,0.14); color:#10b981; border:1px solid rgba(16,185,129,0.35); border-radius:4px; padding:1px 6px; font-size:10px; font-weight:700; margin-left:6px;">&#128994; Live ${ans.model || 'vertex-ai/gemini-2.5-flash'}</span>`
      : `<span style="display:inline-block; background:rgba(245,158,11,0.14); color:#f59e0b; border-radius:4px; padding:1px 6px; font-size:10px; font-weight:700; margin-left:6px;">&#9889; Grounded Fallback</span>`;

    thinkingBubble.innerHTML = `
      <div style="font-size:11px; font-weight:700; color:var(--accent-blue); margin-bottom:5px; display:flex; align-items:center; flex-wrap:wrap; gap:4px;">
        <span>&#10024; ${ans.persona || 'Vertex AI Principal Architect'}</span>
        ${liveTag}
      </div>
      <div style="font-weight:700; margin-bottom:5px; color:var(--text-primary);">${ans.title || ''}</div>
      <div>${formatted}</div>
      ${ans.recommended_action ? `<div style="margin-top:6px; font-size:11px; font-weight:600; color:var(--accent-emerald);">&#10148; ${ans.recommended_action}</div>` : ''}
    `;
  } catch (err) {
    thinkingBubble.innerHTML = `<span style="color:var(--accent-rose);">Error communicating with Vertex AI Agent.</span>`;
  }
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

