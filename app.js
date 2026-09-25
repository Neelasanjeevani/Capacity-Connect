/* ==========================================================================
   CAPACITY CONNECT — single-file build
   No server required. Data is seeded once and kept in localStorage.
   Sections:  1) store  2) helpers  3) auth  4) public pages
              5) learner  6) trainer  7) admin  8) router
   ========================================================================== */

/* ---------------------------------------------------------------- 1) STORE */
const KEY = 'capacity-connect-v1';
let DB = null;

function uid(p){ return p + '-' + Math.random().toString(36).slice(2,8); }
function today(){ return new Date().toISOString().slice(0,10); }
function daysFromNow(n){ const d=new Date(); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); }

function save(){
  try{ localStorage.setItem(KEY, JSON.stringify(DB)); }
  catch(e){ console.warn('Could not save to this browser; changes last for this session only.', e); }
}
function load(){
  try{ const raw = localStorage.getItem(KEY); if(raw){ DB = JSON.parse(raw);
      /* migrate data saved before the OTP / access-control fields existed */
      if(DB.otp === undefined) DB.otp = null;
      if(DB.regOtp === undefined) DB.regOtp = null;
      if(!DB.allowlist) DB.allowlist = DB.users.filter(u=>u.status==='active').map(u=>u.email.toLowerCase());
      if(DB.restrictAccess === undefined) DB.restrictAccess = true;
      if(!DB.loginSecurity) DB.loginSecurity = {};
      if(DB.lastActivity === undefined) DB.lastActivity = null;
      return true; } }
  catch(e){ console.warn('Could not read saved data, reseeding.', e); }
  return false;
}
function resetData(){ localStorage.removeItem(KEY); DB = seed(); save(); }

/* ------------------------------------------------------------ SEED DATA -- */
function seed(){
  const users = [
    { id:'u-admin', name:'Rohit Verma', email:'admin@capacityconnect.org', password:'Kj7$mQ2vXpL9', role:'admin',
      status:'active', title:'Capacity Building Director', dept:'Human Resource Development', joined:'2024-04-11',
      profile:{ phone:'+91 98490 00011', location:'Vijayawada, AP', bio:'Oversees the organisation-wide capacity building programme.',
        qualifications:[], experience:[], interests:[], certificates:[] }, skills:[], expertise:[] },

    { id:'u-trainer', name:'Dr. Anitha Rao', email:'trainer@capacityconnect.org', password:'trainer123', role:'trainer',
      status:'active', title:'Senior Trainer — Digital & Data', dept:'Training Division', joined:'2024-06-02',
      profile:{ phone:'+91 98490 00022', location:'Hyderabad, TS', bio:'15 years teaching digital literacy, data analytics and cyber hygiene to public-sector teams.',
        qualifications:[{q:'Ph.D. Computer Science', i:'University of Hyderabad', y:'2012'},{q:'M.Tech Information Systems', i:'NIT Warangal', y:'2006'}],
        experience:[{r:'Senior Trainer', o:'Capacity Connect', y:'2024 – present'},{r:'Assistant Professor', o:'VIT-AP', y:'2013 – 2024'}],
        interests:['Data literacy','Cyber awareness','Adult learning design'],
        certificates:[{n:'Certified Technical Trainer', b:'CompTIA', y:'2021'}] },
      skills:[{name:'Data Analytics',level:5},{name:'Cybersecurity Awareness',level:4},{name:'Digital Skills',level:5}],
      expertise:['Digital Skills','Data Analytics','Cybersecurity'], rating:4.8 },

    { id:'u-trainer2', name:'Sandeep Menon', email:'sandeep@capacityconnect.org', password:'trainer123', role:'trainer',
      status:'active', title:'Leadership & Behaviour Coach', dept:'Training Division', joined:'2024-08-19',
      profile:{ phone:'+91 98490 00033', location:'Kochi, KL', bio:'Coaches first-time managers on leadership, delegation and team communication.',
        qualifications:[{q:'MBA Human Resources', i:'XLRI Jamshedpur', y:'2010'}],
        experience:[{r:'Leadership Coach', o:'Capacity Connect', y:'2024 – present'},{r:'L&D Manager', o:'Infosys', y:'2011 – 2024'}],
        interests:['Coaching','Public speaking'], certificates:[{n:'ICF Associate Coach', b:'ICF', y:'2019'}] },
      skills:[{name:'Leadership',level:5},{name:'Communication',level:5},{name:'Management',level:4}],
      expertise:['Leadership','Communication','Management'], rating:4.6 },

    { id:'u-learner', name:'Priya Sharma', email:'learner@capacityconnect.org', password:'learner123', role:'trainee',
      status:'active', title:'Junior Programme Officer', dept:'District Administration', joined:'2025-01-15',
      profile:{ phone:'+91 98490 00044', location:'Vijayawada, AP', bio:'Programme officer building digital and analytical skills for field reporting.',
        qualifications:[{q:'B.Tech Electronics', i:'JNTU Kakinada', y:'2022'}],
        experience:[{r:'Junior Programme Officer', o:'District Administration', y:'2023 – present'}],
        interests:['Data visualisation','Public speaking'],
        certificates:[{n:'Digital Skills for the Workplace', b:'Capacity Connect', y:'2026'}] },
      skills:[
        {name:'Communication',level:4,target:5},{name:'Digital Skills',level:4,target:5},
        {name:'Leadership',level:3,target:5},{name:'Data Analytics',level:2,target:4},
        {name:'Management',level:2,target:4},{name:'Cybersecurity Awareness',level:3,target:4}],
      expertise:[] },

    { id:'u-l2', name:'Arjun Nair', email:'arjun@capacityconnect.org', password:'learner123', role:'trainee', status:'active',
      title:'Field Supervisor', dept:'Rural Development', joined:'2025-03-04',
      profile:{phone:'',location:'Guntur, AP',bio:'',qualifications:[],experience:[],interests:[],certificates:[]},
      skills:[{name:'Communication',level:3,target:5},{name:'Digital Skills',level:2,target:4}], expertise:[] },
    { id:'u-l3', name:'Fatima Khan', email:'fatima@capacityconnect.org', password:'learner123', role:'trainee', status:'active',
      title:'Accounts Assistant', dept:'Finance', joined:'2025-05-21',
      profile:{phone:'',location:'Nellore, AP',bio:'',qualifications:[],experience:[],interests:[],certificates:[]},
      skills:[{name:'Digital Skills',level:3,target:5},{name:'Management',level:2,target:4}], expertise:[] },
    { id:'u-l4', name:'Vikram Reddy', email:'vikram@capacityconnect.org', password:'learner123', role:'trainee', status:'pending',
      title:'Assistant Engineer', dept:'Public Works', joined:today(),
      profile:{phone:'',location:'Kurnool, AP',bio:'',qualifications:[],experience:[],interests:[],certificates:[]},
      skills:[], expertise:[] },
    { id:'u-t3', name:'Meera Joshi', email:'meera@capacityconnect.org', password:'trainer123', role:'trainer', status:'pending',
      title:'Project Management Consultant', dept:'External', joined:today(),
      profile:{phone:'',location:'Pune, MH',bio:'PMP-certified consultant applying to run project management cohorts.',
        qualifications:[{q:'PMP', i:'PMI', y:'2018'}],experience:[],interests:[],certificates:[]},
      skills:[{name:'Project Management',level:5}], expertise:['Project Management','Management'], rating:0 }
  ];

  const mod = (t,type,min,s) => ({ id:uid('m'), title:t, type:type, minutes:min, summary:s });

  const courses = [
    { id:'c1', title:'Digital Skills for the Workplace', category:'Digital', level:'Beginner', hours:6, trainerId:'u-trainer',
      status:'published', rating:4.7, created:'2025-07-02',
      summary:'Work confidently with documents, spreadsheets, shared drives and official email.',
      description:'A practical starter course for staff who use office software every day but were never formally trained. You will build a reporting template, clean a small dataset and set up a shared folder structure your team can actually follow.',
      objectives:['Format official documents to a consistent standard','Build formulas and charts in a spreadsheet','Organise and share files securely','Write clear, structured official email'],
      skills:['Digital Skills'],
      modules:[
        mod('Working with official documents','reading',45,'Styles, headers, page numbering and export to PDF.'),
        mod('Spreadsheets for daily reporting','video',60,'Formulas, sorting, filtering and a simple chart.'),
        mod('Shared drives and file discipline','reading',40,'Folder naming, versions, permissions.'),
        mod('Email that gets a reply','video',35,'Subject lines, structure, tone and attachments.'),
        mod('Practice assignment','activity',60,'Build a monthly reporting sheet from raw data.')] },

    { id:'c2', title:'Leadership and Management', category:'Leadership', level:'Intermediate', hours:10, trainerId:'u-trainer2',
      status:'published', rating:4.8, created:'2025-06-18',
      summary:'Move from doing the work yourself to getting good work done through a team.',
      description:'Built for newly promoted supervisors. Covers delegation, feedback, running a review meeting and handling the first difficult conversation with a team member.',
      objectives:['Delegate work without losing control of quality','Give feedback people can act on','Run a short, useful review meeting','Handle conflict early'],
      skills:['Leadership','Management'],
      modules:[
        mod('What changes when you lead','reading',40,'The shift from individual work to team outcomes.'),
        mod('Delegation that works','video',55,'Matching task, person and level of checking.'),
        mod('Feedback conversations','video',50,'A simple structure for praise and correction.'),
        mod('Running review meetings','reading',45,'Agenda, timing, decisions and follow-up.'),
        mod('Difficult conversations','activity',60,'Role-play scenarios with a checklist.')] },

    { id:'c3', title:'Effective Communication', category:'Soft Skills', level:'Beginner', hours:5, trainerId:'u-trainer2',
      status:'published', rating:4.6, created:'2025-08-09',
      summary:'Write and speak so that people understand you the first time.',
      description:'Covers written clarity, presenting to a room, listening properly and communicating across departments. Short modules with practice exercises after each one.',
      objectives:['Write short, clear official communication','Present without reading from slides','Listen actively in meetings','Adapt tone for different audiences'],
      skills:['Communication'],
      modules:[
        mod('Clarity in writing','reading',35,'Plain language, short sentences, one idea per paragraph.'),
        mod('Speaking to a room','video',50,'Structure, pace, nerves and eye contact.'),
        mod('Listening well','reading',30,'Questions, summarising, checking understanding.'),
        mod('Presentation practice','activity',45,'Record a three-minute briefing.')] },

    { id:'c4', title:'Project Management Basics', category:'Management', level:'Intermediate', hours:8, trainerId:'u-trainer',
      status:'published', rating:4.5, created:'2025-09-01',
      summary:'Plan, schedule and track a project from approval to closure.',
      description:'Introduces scope, schedule, budget, risk and stakeholder communication using a single worked example: a district digitisation project you plan end to end.',
      objectives:['Write a scope statement','Build a realistic schedule','Identify and rank risks','Report progress to stakeholders'],
      skills:['Project Management','Management'],
      modules:[
        mod('Scope and objectives','reading',45,'What is in, what is out, and who signs off.'),
        mod('Schedules and milestones','video',55,'Task lists, dependencies and buffers.'),
        mod('Risk and issue tracking','reading',40,'A risk register you will actually update.'),
        mod('Status reporting','video',40,'One page that answers the three usual questions.')] },

    { id:'c5', title:'Cybersecurity Awareness', category:'Digital', level:'Beginner', hours:4, trainerId:'u-trainer',
      status:'published', rating:4.9, created:'2025-10-12',
      summary:'Spot phishing, protect official accounts and handle data safely.',
      description:'Non-technical security training for every staff member. Real examples of phishing mail, password practice, safe handling of citizen data and what to do in the first ten minutes of a suspected breach.',
      objectives:['Recognise phishing and pretexting attempts','Use strong passwords and two-factor login','Handle sensitive records correctly','Report an incident quickly'],
      skills:['Cybersecurity Awareness','Digital Skills'],
      modules:[
        mod('How attacks actually start','reading',35,'Phishing, calls, USB drives and fake portals.'),
        mod('Passwords and two-factor login','video',40,'Password managers and authenticator apps.'),
        mod('Handling sensitive data','reading',45,'Classification, sharing rules and retention.'),
        mod('If something goes wrong','video',30,'The first ten minutes and who to call.')] },

    { id:'c6', title:'Data Analytics Fundamentals', category:'Data', level:'Advanced', hours:12, trainerId:'u-trainer',
      status:'published', rating:4.4, created:'2025-11-20',
      summary:'Turn raw departmental data into charts and decisions people trust.',
      description:'From messy spreadsheets to a clean dashboard. Covers data cleaning, summary statistics, choosing the right chart, and presenting findings without overstating them.',
      objectives:['Clean and validate a raw dataset','Summarise data with the right statistic','Choose an honest chart','Present findings with caveats'],
      skills:['Data Analytics','Digital Skills'],
      modules:[
        mod('What makes data usable','reading',50,'Structure, types, missing values.'),
        mod('Cleaning a real dataset','video',70,'Duplicates, formats, outliers.'),
        mod('Summary statistics','reading',55,'Mean, median, spread and when each misleads.'),
        mod('Charts that tell the truth','video',60,'Chart choice, axes and labelling.'),
        mod('Build a dashboard','activity',90,'Assemble a one-page district dashboard.')] },

    { id:'c7', title:'Grievance Redressal and Citizen Service', category:'Soft Skills', level:'Beginner', hours:5, trainerId:'u-trainer2',
      status:'pending', rating:0, created:today(),
      summary:'Handle citizen complaints with empathy, accuracy and a clear record.',
      description:'Submitted for administrator approval. Covers intake, documentation, escalation routes and closing the loop with the citizen.',
      objectives:['Record a complaint accurately','De-escalate an angry conversation','Escalate through the right channel','Close the loop in writing'],
      skills:['Communication'],
      modules:[ mod('Intake and documentation','reading',40,'Getting the facts right the first time.'),
                mod('De-escalation','video',45,'Tone, pace and acknowledgement.') ] }
  ];

  const enrollments = [
    { id:'e1', userId:'u-learner', courseId:'c1', enrolled:'2026-01-08', done:['0','1','2','3','4'], completed:'2026-02-14' },
    { id:'e2', userId:'u-learner', courseId:'c3', enrolled:'2026-02-20', done:['0','1'], completed:null },
    { id:'e3', userId:'u-learner', courseId:'c5', enrolled:'2026-03-02', done:['0','1','2'], completed:null },
    { id:'e4', userId:'u-learner', courseId:'c6', enrolled:'2026-03-15', done:['0'], completed:null },
    { id:'e5', userId:'u-l2', courseId:'c1', enrolled:'2026-02-02', done:['0','1','2'], completed:null },
    { id:'e6', userId:'u-l2', courseId:'c3', enrolled:'2026-02-11', done:['0','1','2','3'], completed:'2026-03-09' },
    { id:'e7', userId:'u-l3', courseId:'c1', enrolled:'2026-01-19', done:['0'], completed:null },
    { id:'e8', userId:'u-l3', courseId:'c5', enrolled:'2026-03-21', done:['0','1','2','3'], completed:'2026-04-02' },
    { id:'e9', userId:'u-l3', courseId:'c2', enrolled:'2026-04-05', done:[], completed:null }
  ];

  const quizzes = [
    { id:'q1', courseId:'c1', title:'Digital Skills — final assessment', pass:60, deadline:daysFromNow(21), createdBy:'u-trainer',
      questions:[
        {q:'What is the main purpose of capacity building in an organisation?',o:['Training and skill development','Entertainment','Advertising','None of these'],a:0},
        {q:'Which file format keeps an official document’s layout fixed when shared?',o:['.txt','.pdf','.csv','.zip'],a:1},
        {q:'In a spreadsheet, which formula adds the values in cells A1 to A10?',o:['=ADD(A1:A10)','=TOTAL(A1,A10)','=SUM(A1:A10)','=COUNT(A1:A10)'],a:2},
        {q:'Before sharing a folder on a shared drive you should first check:',o:['The folder colour','Who has permission to open it','The number of files','The creation date'],a:1},
        {q:'A clear official email subject line should:',o:['Be left blank','State the topic and any action needed','Be written in capitals','Contain the full message'],a:1}]},
    { id:'q2', courseId:'c5', title:'Cybersecurity Awareness — knowledge check', pass:70, deadline:daysFromNow(10), createdBy:'u-trainer',
      questions:[
        {q:'An email urgently asks you to confirm your password through a link. You should:',o:['Click and enter it quickly','Ignore it and report it to IT','Forward it to colleagues','Reply asking who sent it'],a:1},
        {q:'Two-factor authentication means:',o:['Two passwords','A password plus a second proof such as a code','Logging in twice','Two people approving'],a:1},
        {q:'Citizen records classified as sensitive should be shared:',o:['On personal messaging apps','Through approved official channels only','On a public drive link','By unencrypted email'],a:1},
        {q:'The first thing to do if you suspect your account is compromised:',o:['Wait and watch','Report it and change the password','Delete your mail','Tell nobody'],a:1}]},
    { id:'q3', courseId:'c3', title:'Effective Communication — module quiz', pass:60, deadline:daysFromNow(14), createdBy:'u-trainer2',
      questions:[
        {q:'Active listening mainly involves:',o:['Planning your reply while they speak','Summarising and checking understanding','Taking over the conversation','Staying silent throughout'],a:1},
        {q:'Plain language writing means:',o:['Short words and one idea per sentence','Avoiding all technical terms forever','Writing very briefly regardless of clarity','Using formal jargon'],a:0},
        {q:'When presenting, slides work best when they:',o:['Contain the full script','Support the point being spoken','Are read out word for word','Have no headings'],a:1}]}
  ];

  const attempts = [
    { id:'a1', quizId:'q1', userId:'u-learner', score:5, total:5, percent:100, passed:true, at:'2026-02-14' },
    { id:'a2', quizId:'q3', userId:'u-learner', score:2, total:3, percent:67, passed:true, at:'2026-03-28' },
    { id:'a3', quizId:'q1', userId:'u-l2', score:4, total:5, percent:80, passed:true, at:'2026-02-25' },
    { id:'a4', quizId:'q2', userId:'u-l3', score:3, total:4, percent:75, passed:true, at:'2026-04-02' },
    { id:'a5', quizId:'q3', userId:'u-l2', score:3, total:3, percent:100, passed:true, at:'2026-03-09' }
  ];

  const programs = [
    { id:'p1', title:'Digital Transformation Workshop', date:daysFromNow(12), duration:'2 days, 9:30 – 16:30', trainerId:'u-trainer',
      audience:'Section officers and above', seats:40, registered:['u-l2','u-l3'], mode:'In person — Training Hall A, Vijayawada',
      description:'Hands-on workshop on moving a paper-based process to a digital workflow, from process mapping to rollout and staff training.' },
    { id:'p2', title:'Leadership Development Program', date:daysFromNow(26), duration:'6 weeks, Fridays', trainerId:'u-trainer2',
      audience:'Newly promoted supervisors', seats:25, registered:['u-l3'], mode:'Blended — online + two in-person days',
      description:'A six-week cohort programme with weekly sessions, peer coaching groups and a workplace project presented at the close.' },
    { id:'p3', title:'Communication Skills Training', date:daysFromNow(5), duration:'1 day, 10:00 – 16:00', trainerId:'u-trainer2',
      audience:'All staff', seats:60, registered:[], mode:'Online — live session',
      description:'A single-day intensive on written clarity, meeting participation and presenting to a room.' },
    { id:'p4', title:'Technology Awareness Program', date:'2026-07-18', duration:'3 days', trainerId:'u-trainer',
      audience:'All departments', seats:80, registered:['u-learner','u-l2','u-l3'], mode:'In person — Regional Centre',
      description:'Completed. Covered emerging technology, data protection and safe use of official devices.', done:true }
  ];

  const resources = [
    { id:'r1', title:'Capacity Building Framework 2026', type:'PDF', category:'Guidelines', size:'2.4 MB', by:'u-admin', date:'2026-01-10', courseId:null, desc:'The organisation-wide framework describing competency levels, training entitlements and annual review cycles.' },
    { id:'r2', title:'Spreadsheet Formulas — quick reference', type:'PDF', category:'Study material', size:'640 KB', by:'u-trainer', date:'2026-02-02', courseId:'c1', desc:'One-page reference for the twenty formulas used most often in departmental reporting.' },
    { id:'r3', title:'Recorded lecture — Delegation that works', type:'Video', category:'Recorded lecture', size:'182 MB', by:'u-trainer2', date:'2026-02-18', courseId:'c2', desc:'55-minute recorded session with the delegation matrix worked through on real examples.' },
    { id:'r4', title:'Phishing examples pack', type:'Presentation', category:'Study material', size:'5.1 MB', by:'u-trainer', date:'2026-03-05', courseId:'c5', desc:'Twenty real phishing messages with the warning signs marked up.' },
    { id:'r5', title:'Project status report template', type:'Document', category:'Template', size:'88 KB', by:'u-trainer', date:'2026-03-22', courseId:'c4', desc:'The one-page status format used across district projects.' },
    { id:'r6', title:'Presentation skills handbook', type:'PDF', category:'Study material', size:'1.8 MB', by:'u-trainer2', date:'2026-04-01', courseId:'c3', desc:'Preparation checklist, structure templates and practice exercises.' },
    { id:'r7', title:'Recorded lecture — Cleaning a real dataset', type:'Video', category:'Recorded lecture', size:'240 MB', by:'u-trainer', date:'2026-04-14', courseId:'c6', desc:'Screen-recorded walkthrough of cleaning a messy district dataset.' },
    { id:'r8', title:'Data protection guidelines for staff', type:'PDF', category:'Guidelines', size:'980 KB', by:'u-admin', date:'2026-05-06', courseId:null, desc:'What counts as sensitive data, how to store it and how long to keep it.' }
  ];

  const announcements = [
    { id:'n1', type:'notice', title:'Annual training calendar for 2026–27 is open', body:'Nominations for the next cycle close on the last working day of this month. Speak to your reporting officer before nominating yourself for a programme that needs release time.', at:daysFromNow(-2), by:'u-admin' },
    { id:'n2', type:'achievement', title:'1,240 certificates issued this year', body:'Departments have together completed more than four thousand learning hours. The Rural Development division leads on completion rate at 82 per cent.', at:daysFromNow(-9), by:'u-admin' },
    { id:'n3', type:'content', title:'New course added: Cybersecurity Awareness', body:'A four-hour non-technical course for every staff member. It is now mandatory for anyone handling citizen records.', at:daysFromNow(-16), by:'u-admin' }
  ];

  const posts = [
    { id:'po1', userId:'u-l2', title:'How do you keep a risk register up to date?', at:daysFromNow(-3), tags:['Project Management'],
      body:'We start every project with a risk register and then nobody opens it again until something goes wrong. What actually works in practice — a fixed review slot in the weekly meeting, or something lighter?',
      comments:[{userId:'u-trainer', body:'Ten minutes at the end of the weekly meeting, and only the top five risks. A long register nobody reads is worse than a short one people argue about.', at:daysFromNow(-2)}] },
    { id:'po2', userId:'u-learner', title:'Sharing: the reporting template from Digital Skills', at:daysFromNow(-6), tags:['Digital Skills','Templates'],
      body:'The monthly reporting sheet from module 5 of Digital Skills has cut about two hours a month off my reporting. Happy to walk anyone through the formulas.',
      comments:[{userId:'u-l3', body:'Please do — could you add the version with the auto-summary row?', at:daysFromNow(-5)}] }
  ];

  const feedback = [
    { id:'f1', userId:'u-learner', courseId:'c1', rating:5, comment:'The practice assignment was the useful part. I used the template the same week.', at:'2026-02-15' },
    { id:'f2', userId:'u-l2', courseId:'c3', rating:4, comment:'Good content. The recorded presentation exercise could be longer.', at:'2026-03-10' },
    { id:'f3', userId:'u-l3', courseId:'c5', rating:5, comment:'The phishing examples pack is something I have shared with my whole section.', at:'2026-04-03' }
  ];

  const certificates = [
    { id:'CC-2026-0418', userId:'u-learner', courseId:'c1', date:'2026-02-14' },
    { id:'CC-2026-0502', userId:'u-l2', courseId:'c3', date:'2026-03-09' },
    { id:'CC-2026-0611', userId:'u-l3', courseId:'c5', date:'2026-04-02' }
  ];

  /* access control: only these addresses may sign in while restriction is on */
  const allowlist = ['admin@capacityconnect.org','trainer@capacityconnect.org','sandeep@capacityconnect.org',
    'learner@capacityconnect.org','arjun@capacityconnect.org','fatima@capacityconnect.org'];

  return { users, courses, enrollments, quizzes, attempts, programs, resources,
           announcements, posts, feedback, certificates, session:null,
           otp:null, regOtp:null, allowlist, restrictAccess:true, loginSecurity:{}, lastActivity:null };
}

/* ----------------------------------------------------- 2) SMALL HELPERS -- */
const $ = (s,r=document) => r.querySelector(s);
const esc = s => String(s==null?'':s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const byId = (arr,id) => arr.find(x => x.id === id);
const user = id => byId(DB.users, id) || {name:'Unknown', id:'', role:''};
const course = id => byId(DB.courses, id);
const initials = n => n.split(' ').filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase();
const me = () => DB.session ? byId(DB.users, DB.session) : null;
const fmtDate = d => { if(!d) return '—'; const x=new Date(d); return isNaN(x) ? d :
  x.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}); };
const pct = (a,b) => b ? Math.round(a/b*100) : 0;

function toast(msg){
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(t._t); t._t = setTimeout(()=>t.classList.remove('show'), 2600);
}
function go(hash){ location.hash = hash; }

/* ----------------------------------------------- OTP LOGIN & ACCESS CONTROL
   Login and registration are gated by a 6-digit code that must be entered
   before a session/account is created — see FORMS.login/otp/register/reg-otp.
   -------------------------------------------------------------------------
   EMAIL DELIVERY — fill these three in to send the code to a real inbox
   instead of showing it on the page. Get them from your EmailJS account:
     1. emailjs.com → sign up → Email Services → add Gmail → copy Service ID
     2. Email Templates → create one with a {{to_email}} "To" field and a
        {{otp_code}} placeholder in the body → copy Template ID
     3. Account → General → copy Public Key
   As soon as real values replace the three placeholders below, the site
   automatically starts emailing the code and stops displaying it on screen.
   Until then it shows the code on the verify page so the demo stays usable. */
const EMAILJS_CONFIG = { serviceId:'YOUR_SERVICE_ID', templateId:'YOUR_TEMPLATE_ID', publicKey:'YOUR_PUBLIC_KEY' };
const EMAILJS_READY = [EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, EMAILJS_CONFIG.publicKey]
  .every(v => v && !v.startsWith('YOUR_'));
if(EMAILJS_READY && window.emailjs) emailjs.init({ publicKey: EMAILJS_CONFIG.publicKey });

/* -------------------------------------------------------------- BACKEND --
   Set this to your deployed API's URL (see backend/README.md) to switch
   auth, OTP delivery and admin approvals over to the real server — the
   code is then generated, hashed and verified server-side, and a session
   cookie the page's own JavaScript cannot read replaces the local demo
   session. Leave it as-is to keep running the self-contained browser demo. */
const API_BASE = 'YOUR_BACKEND_URL'; // e.g. 'https://capacity-connect-api.onrender.com'
const BACKEND_READY = API_BASE && !API_BASE.startsWith('YOUR_');
async function api(path, opts={}){
  const res = await fetch(API_BASE + path, {
    method: opts.method || 'GET',
    headers: {'Content-Type':'application/json'},
    credentials: 'include',
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  let data = {}; try{ data = await res.json(); }catch(e){}
  if(!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}
/* fold a verified backend user into the local demo records so the rest of
   the app (courses, profile, etc., which still run on local demo data)
   has someone to attach that content to */
function mirrorBackendUser(user){
  let u = DB.users.find(x=>x.id===user.id) || DB.users.find(x=>x.email.toLowerCase()===user.email.toLowerCase());
  if(!u){
    u = { id:user.id, name:user.name, email:user.email, role:user.role, status:'active', title:'', dept:'', joined:today(),
      profile:{phone:'',location:'',bio:'',qualifications:[],experience:[],interests:[],certificates:[]}, skills:[], expertise:[] };
    DB.users.push(u);
  } else { u.name = user.name; u.email = user.email; u.role = user.role; u.status = 'active'; }
  return u;
}

const OTP_TTL_MS   = 5 * 60 * 1000;   // code lifetime
const OTP_RESEND_COOLDOWN_MS = 30 * 1000;
const OTP_MAX_RESENDS   = 3;
const OTP_MAX_ATTEMPTS  = 5;
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_LOCKOUT_MS  = 15 * 60 * 1000;
const SESSION_IDLE_MS   = 30 * 60 * 1000;

function genOtp(){ return String(Math.floor(100000 + Math.random()*900000)); }

function loginAttempt(email, ok){
  const key = email.toLowerCase();
  const rec = DB.loginSecurity[key] || { attempts:0, lockedUntil:0 };
  if(ok){ delete DB.loginSecurity[key]; return; }
  rec.attempts += 1;
  if(rec.attempts >= LOGIN_MAX_ATTEMPTS) rec.lockedUntil = Date.now() + LOGIN_LOCKOUT_MS;
  DB.loginSecurity[key] = rec;
}
function lockoutRemaining(email){
  const rec = DB.loginSecurity[(email||'').toLowerCase()];
  if(!rec || !rec.lockedUntil) return 0;
  return Math.max(0, rec.lockedUntil - Date.now());
}
function isAllowed(email){
  if(!DB.restrictAccess) return true;
  return DB.allowlist.map(e=>e.toLowerCase()).includes((email||'').trim().toLowerCase());
}

/* begin the OTP step for a user who has just supplied a correct password */
function startOtp(u){
  const code = genOtp();
  DB.otp = { userId:u.id, email:u.email, code, expiresAt: Date.now()+OTP_TTL_MS,
             attempts:0, resends:0, lastSent: Date.now(), mode:'pending', deliveryFailed:false };
  save();
  sendOtpEmail(DB.otp, u.email, u.name, code);
}
/* Sends the code to `email` via EmailJS when EMAILJS_CONFIG is filled in;
   otherwise falls back to showing it on the verify screen (see viewOtp /
   viewRegisterOtp), which is the only reason this demo ever displays a code. */
function sendOtpEmail(target, email, name, code){
  if(EMAILJS_READY && window.emailjs){
    target.mode = 'email'; target.deliveryFailed = false; save();
    emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId,
      { to_email: email, to_name: name, otp_code: code })
      .then(()=>{ toast(`Verification code emailed to ${email}`); })
      .catch((err)=>{
        console.warn('EmailJS send failed', err);
        target.deliveryFailed = true; save(); render();
        toast('Could not email the code — showing it here instead');
      });
  } else {
    target.mode = 'demo'; save();
    toast(`Verification code sent to ${email}`);
  }
}
function otpExpired(){ return !DB.otp || Date.now() > DB.otp.expiresAt; }

function touchActivity(){ if(DB.session){ DB.lastActivity = Date.now(); } }
function checkSessionIdle(){
  if(DB.session && DB.lastActivity && (Date.now() - DB.lastActivity > SESSION_IDLE_MS)){
    DB.session = null; DB.lastActivity = null; save();
    return true;
  }
  return false;
}

/* progress of one enrolment, as a percentage of modules finished */
function progressOf(enr){
  const c = course(enr.courseId); if(!c) return 0;
  return pct(enr.done.length, c.modules.length);
}
function enrolmentFor(userId, courseId){
  return DB.enrollments.find(e => e.userId===userId && e.courseId===courseId);
}
function quizFor(courseId){ return DB.quizzes.find(q => q.courseId === courseId); }
function bestAttempt(userId, quizId){
  const list = DB.attempts.filter(a => a.userId===userId && a.quizId===quizId);
  return list.sort((a,b)=>b.percent-a.percent)[0] || null;
}
function certFor(userId, courseId){
  return DB.certificates.find(c => c.userId===userId && c.courseId===courseId);
}
function learningHours(userId){
  return DB.enrollments.filter(e=>e.userId===userId).reduce((sum,e)=>{
    const c = course(e.courseId); if(!c) return sum;
    const mins = e.done.reduce((m,i)=> m + (c.modules[+i] ? c.modules[+i].minutes : 0), 0);
    return sum + mins/60;
  },0);
}

/* bar chart as inline SVG — no chart library needed */
function barChart(data, opts={}){
  const w = 100, h = opts.h || 130, max = Math.max(...data.map(d=>d.value), 1);
  const gap = 2.4, bw = (w - gap*(data.length-1)) / data.length;
  const col = opts.color || 'var(--brand)';
  const bars = data.map((d,i)=>{
    const bh = (d.value/max) * (h-26);
    const x = i*(bw+gap), y = h-20-bh;
    return `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${bw.toFixed(2)}" height="${Math.max(bh,1).toFixed(2)}" rx="1.2" fill="${col}"><title>${esc(d.label)}: ${d.value}</title></rect>
      <text x="${(x+bw/2).toFixed(2)}" y="${h-6}" text-anchor="middle" font-size="4.6" fill="var(--ink-3)">${esc(d.label)}</text>`;
  }).join('');
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h+10}" role="img" aria-label="${esc(opts.alt||'bar chart')}" preserveAspectRatio="none">
    <line x1="0" y1="${h-20}" x2="${w}" y2="${h-20}" stroke="var(--line)" stroke-width=".5"/>${bars}</svg>`;
}
/* horizontal stat rows, used where a bar chart would be overkill */
function rowChart(data, opts={}){
  const max = Math.max(...data.map(d=>d.value),1);
  return `<div class="stack" style="gap:.6rem">` + data.map(d=>`
    <div>
      <div class="row-between small" style="margin-bottom:.22rem"><span>${esc(d.label)}</span>
        <b class="muted">${d.display != null ? esc(d.display) : d.value}</b></div>
      <div class="bar ${opts.green?'green':''}"><i style="width:${(d.value/max*100).toFixed(1)}%"></i></div>
    </div>`).join('') + `</div>`;
}
function donut(percent, label){
  const r=15.9, c=2*Math.PI*r, filled=c*percent/100;
  return `<div style="display:flex;align-items:center;gap:.85rem">
    <svg viewBox="0 0 40 40" width="74" height="74" role="img" aria-label="${percent}% ${esc(label||'')}">
      <circle cx="20" cy="20" r="${r}" fill="none" stroke="var(--line-soft)" stroke-width="6"/>
      <circle cx="20" cy="20" r="${r}" fill="none" stroke="var(--green)" stroke-width="6" stroke-linecap="round"
        stroke-dasharray="${filled.toFixed(2)} ${c.toFixed(2)}" transform="rotate(-90 20 20)"/>
      <text x="20" y="22.5" text-anchor="middle" font-size="9" font-weight="700" fill="var(--ink)">${percent}%</text>
    </svg>
    <div class="small muted">${esc(label||'')}</div></div>`;
}
/* deterministic block pattern standing in for a verification QR code */
function qrBlock(seedText, size=88){
  let h=0; for(const ch of seedText) h = (h*31 + ch.charCodeAt(0)) >>> 0;
  let cells='';
  for(let y=0;y<9;y++) for(let x=0;x<9;x++){
    h = (h*1103515245 + 12345) >>> 0;
    const on = ((h>>7) & 1) || (x<3&&y<3) || (x>5&&y<3) || (x<3&&y>5);
    if(on) cells += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
  }
  return `<svg viewBox="0 0 9 9" width="${size}" height="${size}" role="img" aria-label="Verification code pattern" fill="currentColor">${cells}</svg>`;
}

/* ------------------------------------------------ 3) LAYOUT: HEADER/FOOT */
const PUBLIC_NAV = [
  ['#/home','Home'], ['#/about','About'], ['#/courses','Courses'],
  ['#/programs','Training programs'], ['#/resources','Resources'],
  ['#/community','Knowledge sharing'], ['#/contact','Contact']
];

function header(route){
  const u = me();
  const links = PUBLIC_NAV.map(([h,l]) =>
    `<a href="${h}" class="${route.startsWith(h)?'active':''}">${l}</a>`).join('');
  const right = u
    ? `<div class="nav-cta">
         <a class="btn btn-sm" href="#/${u.role==='admin'?'admin':u.role==='trainer'?'trainer':'dashboard'}">My dashboard</a>
         <button class="btn btn-ghost btn-sm" data-act="logout">Sign out</button>
       </div>`
    : `<div class="nav-cta">
         <a class="btn btn-ghost btn-sm" href="#/login">Log in</a>
         <a class="btn btn-sm" href="#/register">Register</a>
       </div>`;
  return `<header class="site">
    <div class="wrap site-inner">
      <a class="brand" href="#/home">
        <span class="mark">CC</span>
        <span><span class="brand-name">Capacity Connect</span><br><span class="brand-sub">Learning &amp; capacity building</span></span>
      </a>
      <button class="nav-toggle" data-act="nav" aria-label="Open menu" aria-expanded="false">☰ Menu</button>
      <nav class="main" id="mainnav">${links}${right}</nav>
    </div></header>`;
}

function footer(){
  return `<footer style="background:var(--ink); color:#D6E4EE; padding:2.6rem 0 1.6rem; margin-top:auto">
    <div class="wrap">
      <div class="grid g4" style="gap:1.6rem; align-items:start">
        <div>
          <div class="row" style="gap:.55rem; margin-bottom:.5rem">
            <span class="mark">CC</span><b style="font-family:var(--serif); font-size:1.05rem; color:#fff">Capacity Connect</b>
          </div>
          <p class="small" style="color:#9FB9CA; max-width:30ch">A shared platform for training, competency development and knowledge sharing across departments.</p>
        </div>
        <div><h4 style="color:#fff; font-size:.9rem; margin-bottom:.5rem">Learn</h4>
          <div class="stack" style="gap:.3rem">
            <a class="small" style="color:#C7DCE9" href="#/courses">Course catalogue</a>
            <a class="small" style="color:#C7DCE9" href="#/programs">Training programs</a>
            <a class="small" style="color:#C7DCE9" href="#/resources">Resource library</a>
            <a class="small" style="color:#C7DCE9" href="#/community">Knowledge sharing</a></div></div>
        <div><h4 style="color:#fff; font-size:.9rem; margin-bottom:.5rem">Portal</h4>
          <div class="stack" style="gap:.3rem">
            <a class="small" style="color:#C7DCE9" href="#/login">Log in</a>
            <a class="small" style="color:#C7DCE9" href="#/register">Register</a>
            <a class="small" style="color:#C7DCE9" href="#/verify">Verify a certificate</a>
            <a class="small" style="color:#C7DCE9" href="#/about">About the platform</a>
            <a class="small" style="color:#C7DCE9" href="#/guide">Project guide</a></div></div>
        <div><h4 style="color:#fff; font-size:.9rem; margin-bottom:.5rem">Contact</h4>
          <p class="small" style="color:#9FB9CA; margin:0">Training Division<br>Capacity Connect Secretariat<br>Vijayawada, Andhra Pradesh<br>support@capacityconnect.org</p></div>
      </div>
      <hr style="border:0; border-top:1px solid rgba(255,255,255,.14); margin:1.6rem 0 1rem">
      <div class="row-between small" style="color:#8BA6B8">
        <span>Capacity Connect — demonstration build. Sample data only.</span>
        <button class="btn-link" style="color:#8BA6B8" data-act="reset">Reset demo data</button>
      </div>
    </div></footer>`;
}

function shellPage(route, sidebar, body){
  return `<div class="wrap shell">
    <aside class="side">${sidebar}</aside>
    <main id="app">${body}</main></div>`;
}

function sidebar(items, route){
  return items.map(it => it.label
    ? `<div class="side-label">${it.label}</div>`
    : `<a href="${it.href}" class="${route===it.href||route.startsWith(it.href+'/')?'active':''}">${it.icon||''} ${it.text}</a>`
  ).join('');
}

/* ---------------------------------------------------------- 4) PUBLIC -- */
function viewHome(){
  const top = DB.courses.filter(c=>c.status==='published').slice(0,3);
  const upcoming = DB.programs.filter(p=>!p.done).slice(0,3);
  const news = DB.announcements.slice(0,3);
  const totalLearners = DB.users.filter(u=>u.role==='trainee').length;

  return `
  <section style="background:linear-gradient(170deg, var(--brand-soft), var(--canvas) 70%); border-bottom:1px solid var(--line)">
    <div class="wrap" style="padding:clamp(2.6rem,7vw,4.6rem) 0 clamp(2.4rem,6vw,4rem); display:grid; grid-template-columns:repeat(auto-fit,minmax(310px,1fr)); gap:2.4rem; align-items:center">
      <div>
        <span class="tag tag-green" style="margin-bottom:.9rem">Open for 2026–27 nominations</span>
        <h1 style="margin-bottom:.7rem">Empowering people through continuous learning</h1>
        <p style="font-size:1.06rem; color:var(--ink-2); max-width:52ch">A centralised digital platform for capacity building, competency development, training and knowledge sharing across your organisation.</p>
        <div class="row" style="margin-top:1.4rem">
          <a class="btn" href="#/courses">Explore courses</a>
          <a class="btn btn-ghost" href="#/register">Get started</a>
          <a class="btn-link" href="#/guide" style="margin-left:.3rem">Project guide</a>
        </div>
        <p class="small muted" style="margin-top:1.1rem">Demo logins: learner@capacityconnect.org · trainer@capacityconnect.org — password shown on the login page. The administrator account is private.</p>
      </div>
      <div class="card card-lg" style="box-shadow:var(--shadow-lg)">
        <div class="row-between" style="margin-bottom:.9rem">
          <b style="font-family:var(--serif); font-size:1.05rem">A learner's path</b>
          <span class="tag tag-plain">Live example</span>
        </div>
        ${[['Enrol in a course','Digital Skills for the Workplace',100],
           ['Work through modules','5 of 5 modules finished',100],
           ['Pass the assessment','Scored 100% — pass mark 60%',100],
           ['Collect the certificate','CC-2026-0418 issued 14 Feb 2026',100],
           ['Skills profile updates','Digital Skills moved to level 4 of 5',80]]
          .map(([t,s,p],i)=>`
          <div style="display:grid; grid-template-columns:26px 1fr; gap:.7rem; margin-bottom:${i===4?'0':'.85rem'}">
            <div style="width:26px;height:26px;border-radius:50%;background:${p===100?'var(--green)':'var(--brand)'};color:#fff;display:grid;place-items:center;font-size:.78rem;font-weight:700">${i+1}</div>
            <div><div style="font-weight:600; font-size:.93rem">${t}</div>
              <div class="tiny muted" style="margin-bottom:.3rem">${s}</div>
              <div class="bar green"><i style="width:${p}%"></i></div></div>
          </div>`).join('')}
      </div>
    </div>
  </section>

  <section class="band band-alt">
    <div class="wrap">
      <div class="grid g4">
        ${[[DB.courses.filter(c=>c.status==='published').length,'Courses in the catalogue'],
           [totalLearners,'Registered learners'],
           [DB.certificates.length + 1237,'Certificates issued'],
           [DB.programs.length,'Training programs run']]
          .map(([n,l])=>`<div class="kpi"><b>${n}</b><span>${l}</span></div>`).join('')}
      </div>
    </div>
  </section>

  <section class="band"><div class="wrap">
    <div class="grid g2" style="gap:2rem; align-items:start">
      <div>
        <h2>About Capacity Connect</h2>
        <p style="color:var(--ink-2); margin-top:.7rem">Training in most organisations is scattered: nominations arrive by email, attendance sits in a register, and nobody can say what skills the workforce actually has. Capacity Connect puts the whole cycle in one place — catalogue, enrolment, learning material, assessment, certificate and competency record.</p>
        <p style="color:var(--ink-2)">Learners see what to do next. Trainers see who is participating and where people are struggling. Administrators see the numbers they are asked for at review time, without chasing anyone for a spreadsheet.</p>
        <a class="btn btn-ghost" href="#/about">Read more about the platform</a>
      </div>
      <div class="grid" style="gap:.8rem">
        ${[['Competency mapping','Every course is tied to a skill, so completing it updates the learner’s competency profile and shows which trainers can teach that subject.'],
           ['Assessment built in','Subject-wise multiple-choice assessments with deadlines, automatic scoring and a pass mark set by the trainer.'],
           ['Certificates on completion','Issued automatically once modules are finished and the assessment is passed, each with a verifiable certificate ID.'],
           ['Trainer library','Recorded lectures, presentations and study material uploaded by trainers and available to enrolled learners.']]
          .map(([t,d])=>`<div class="card card-flat" style="box-shadow:none"><h3 style="font-size:1rem">${t}</h3><p class="small muted mb0">${d}</p></div>`).join('')}
      </div>
    </div>
  </div></section>

  <section class="band band-alt"><div class="wrap">
    <div class="row-between" style="margin-bottom:1.2rem">
      <div><h2>Popular courses</h2><p class="muted mb0">The courses most enrolled in this quarter.</p></div>
      <a class="btn btn-ghost btn-sm" href="#/courses">View all courses</a>
    </div>
    <div class="grid g3">${top.map(c=>courseCard(c)).join('')}</div>
  </div></section>

  <section class="band"><div class="wrap">
    <div class="row-between" style="margin-bottom:1.2rem">
      <div><h2>Upcoming training programs</h2><p class="muted mb0">Scheduled cohort programmes and workshops.</p></div>
      <a class="btn btn-ghost btn-sm" href="#/programs">All programs</a>
    </div>
    <div class="grid g3">${upcoming.map(p=>programCard(p)).join('')}</div>
  </div></section>

  <section class="band band-alt"><div class="wrap">
    <h2>How it works</h2>
    <p class="muted">Four steps from registration to a recorded competency.</p>
    <div class="grid g4" style="margin-top:1.3rem">
      ${[['Register','Create an account and complete your professional profile. An administrator approves the account and assigns your role.'],
         ['Enrol','Browse the catalogue by category, difficulty or skill, and enrol in the courses your role needs.'],
         ['Learn and assess','Work through modules, download the trainer’s material, then take the subject assessment before its deadline.'],
         ['Certify and track','Pass the assessment to receive a certificate, and watch your competency profile move towards its target level.']]
        .map(([t,d],i)=>`<div class="card">
          <div style="width:30px;height:30px;border-radius:9px;background:var(--brand-soft);color:var(--brand-dk);display:grid;place-items:center;font-weight:700;font-size:.9rem;margin-bottom:.6rem">${i+1}</div>
          <h3 style="font-size:1rem">${t}</h3><p class="small muted mb0">${d}</p></div>`).join('')}
    </div>
  </div></section>

  <section class="band"><div class="wrap">
    <div class="grid g2" style="gap:2rem; align-items:start">
      <div>
        <h2>Notices and achievements</h2>
        <p class="muted">Published by the administration team.</p>
        <div class="stack" style="gap:.8rem; margin-top:1rem">
          ${news.map(n=>`<div class="card">
            <div class="row" style="margin-bottom:.4rem">
              <span class="tag ${n.type==='achievement'?'tag-green':n.type==='content'?'tag-amber':''}">${n.type==='achievement'?'Achievement':n.type==='content'?'New content':'Notice'}</span>
              <span class="tiny muted">${fmtDate(n.at)}</span></div>
            <h3 style="font-size:1rem">${esc(n.title)}</h3>
            <p class="small muted mb0">${esc(n.body)}</p></div>`).join('')}
        </div>
      </div>
      <div>
        <h2>What learners say</h2>
        <p class="muted">Feedback submitted after course completion.</p>
        <div class="stack" style="gap:.8rem; margin-top:1rem">
          ${DB.feedback.slice(0,3).map(f=>{
            const c = course(f.courseId), u = user(f.userId);
            return `<div class="card">
              <div style="color:var(--amber); font-size:.9rem; letter-spacing:.1em">${'★'.repeat(f.rating)}${'☆'.repeat(5-f.rating)}</div>
              <p style="margin:.5rem 0 .7rem; font-family:var(--serif); font-size:1.02rem">${esc(f.comment)}</p>
              <div class="row" style="gap:.6rem"><span class="avatar">${initials(u.name)}</span>
                <span class="small"><b>${esc(u.name)}</b><br><span class="muted tiny">${esc(u.title||'')} · ${esc(c?c.title:'')}</span></span></div>
            </div>`;}).join('')}
        </div>
      </div>
    </div>
  </div></section>

  <section class="band band-alt"><div class="wrap-narrow">
    <h2>Frequently asked questions</h2>
    <div class="stack" style="gap:.6rem; margin-top:1.1rem">
      ${[['Who can register on Capacity Connect?','Any staff member of a participating department. Registration creates a pending account which an administrator approves, and trainers are approved only after their subject expertise is verified.'],
         ['Is there a cost to enrol in a course?','No. All courses and programmes on the portal are funded centrally under the capacity building budget.'],
         ['How is a certificate issued?','Finish every module in the course and pass its assessment. The certificate is generated immediately with a unique ID that anyone can check on the verification page.'],
         ['What happens if I miss an assessment deadline?','The assessment stays open but is marked late in the trainer’s participation report. Speak to the trainer if you need the deadline extended.'],
         ['How does competency mapping work?','Each course is tagged with the skills it develops. Completing it raises your level in those skills, and the same tags are used to match trainers to subjects they are qualified to teach.'],
         ['Can I use the portal on a phone?','Yes. Every page works on phone, tablet and desktop, including assessments and certificate viewing.']]
        .map(([q,a])=>`<details class="card" style="padding:0">
          <summary style="cursor:pointer; padding:.9rem 1.15rem; font-weight:600; list-style:none">${q}</summary>
          <div style="padding:0 1.15rem 1rem"><p class="small muted mb0">${a}</p></div></details>`).join('')}
    </div>
  </div></section>

  <section class="band"><div class="wrap">
    <div class="card card-lg" style="background:var(--ink); border-color:var(--ink); text-align:center; padding:2.6rem 1.4rem">
      <h2 style="color:#fff">Start building your skills profile</h2>
      <p style="color:#B7CEDC; max-width:52ch; margin:.6rem auto 1.4rem">Register once, then enrol, learn, assess and collect certificates in one place.</p>
      <div class="row" style="justify-content:center">
        <a class="btn btn-green" href="#/register">Create an account</a>
        <a class="btn btn-ghost" style="color:#fff; border-color:rgba(255,255,255,.35)" href="#/courses">Browse the catalogue</a>
      </div>
    </div>
  </div></section>`;
}

function courseCard(c, opts={}){
  const t = user(c.trainerId);
  const enrolled = DB.enrollments.filter(e=>e.courseId===c.id).length;
  const u = me();
  const mine = u ? enrolmentFor(u.id, c.id) : null;
  return `<article class="card" style="display:flex; flex-direction:column; gap:.55rem">
    <div class="row" style="gap:.4rem">
      <span class="tag">${esc(c.category)}</span>
      <span class="tag tag-plain">${esc(c.level)}</span>
      ${c.status==='pending' ? '<span class="tag tag-amber">Awaiting approval</span>' : ''}
    </div>
    <h3 style="font-size:1.05rem"><a href="#/course/${c.id}" style="color:inherit">${esc(c.title)}</a></h3>
    <p class="small muted mb0" style="flex:1">${esc(c.summary)}</p>
    <div class="small muted">${esc(t.name)} · ${c.hours} hours · ${enrolled} enrolled${c.rating?` · ★ ${c.rating}`:''}</div>
    ${mine ? `<div><div class="row-between tiny muted" style="margin-bottom:.25rem"><span>Your progress</span><span>${progressOf(mine)}%</span></div>
              <div class="bar green"><i style="width:${progressOf(mine)}%"></i></div></div>` : ''}
    <div class="row" style="gap:.5rem">
      <a class="btn btn-sm ${mine?'btn-ghost':''}" href="#/course/${c.id}">${mine?'Continue':'View course'}</a>
      ${!mine ? `<button class="btn btn-ghost btn-sm" data-act="enrol" data-id="${c.id}">Enrol</button>` : ''}
    </div>
  </article>`;
}

function programCard(p){
  const t = user(p.trainerId);
  const left = p.seats - p.registered.length;
  const u = me();
  const joined = u && p.registered.includes(u.id);
  return `<article class="card" style="display:flex; flex-direction:column; gap:.5rem">
    <div class="row" style="gap:.4rem">
      <span class="tag ${p.done?'tag-plain':'tag-green'}">${p.done?'Completed':'Upcoming'}</span>
      <span class="tiny muted">${fmtDate(p.date)}</span></div>
    <h3 style="font-size:1.04rem">${esc(p.title)}</h3>
    <p class="small muted mb0" style="flex:1">${esc(p.description)}</p>
    <dl class="small" style="margin:0; display:grid; grid-template-columns:auto 1fr; gap:.15rem .6rem">
      <dt class="muted">Duration</dt><dd style="margin:0">${esc(p.duration)}</dd>
      <dt class="muted">Trainer</dt><dd style="margin:0">${esc(t.name)}</dd>
      <dt class="muted">For</dt><dd style="margin:0">${esc(p.audience)}</dd>
      <dt class="muted">Seats</dt><dd style="margin:0">${p.done?'—':`${left} of ${p.seats} available`}</dd>
    </dl>
    ${p.done ? '' : joined
      ? `<button class="btn btn-ghost btn-sm" disabled>You are registered</button>`
      : `<button class="btn btn-sm" data-act="register-prog" data-id="${p.id}">Register for this program</button>`}
  </article>`;
}

function viewAbout(){
  return `<div class="wrap" style="padding:2.4rem 0 3.5rem">
    <div class="wrap-narrow" style="width:100%; padding:0">
      <div class="page-head"><h1>About Capacity Connect</h1>
        <p>One platform for training, competency development and knowledge sharing.</p></div>
      <div class="card card-lg stack">
        <div><h3>Why the platform exists</h3>
          <p class="mb0" style="color:var(--ink-2)">Departments run a great deal of training, but the record of it is scattered across nomination emails, attendance registers and individual spreadsheets. When a posting needs someone with data skills, or an audit asks how many staff completed cyber awareness training, the answer takes weeks to assemble. Capacity Connect holds the whole cycle in one record.</p></div>
        <hr class="divider">
        <div><h3>What each role can do</h3>
          <div class="grid g3" style="margin-top:.7rem">
            ${[['Trainee','Build a professional profile with qualifications, experience, interests, skills and certificates. Enrol in courses, use the trainer library, attempt subject-wise assessments, collect certificates and give feedback.'],
               ['Trainer','Maintain a profile with subject expertise. Create courses and questionnaires with deadlines, upload recorded lectures and study material, and monitor participation and performance.'],
               ['Administrator','Approve users and set roles, approve courses, run programmes, monitor enrolment, certification and assessment statistics, and publish notices and achievements to the home page.']]
              .map(([r,d])=>`<div class="card card-flat" style="box-shadow:none"><h4 style="margin-bottom:.35rem">${r}</h4><p class="small muted mb0">${d}</p></div>`).join('')}
          </div></div>
        <hr class="divider">
        <div><h3>Competency mapping</h3>
          <p style="color:var(--ink-2)">Each course carries skill tags. Those tags do two jobs: they raise a learner's level in the skill when the course is completed, and they identify which trainers are qualified to teach a subject. The administrator's competency map lists every skill alongside the trainers whose declared expertise covers it and how many learners are currently working on it.</p>
          <a class="btn btn-ghost btn-sm mb0" href="#/competency">See the competency framework</a></div>
        <hr class="divider">
        <div><h3>Security and access</h3>
          <p class="mb0" style="color:var(--ink-2)">Accounts are created by email and password, and stay in a pending state until an administrator approves them and confirms the role. Trainers are approved only after subject expertise is verified. Every sign-in also requires a one-time code sent to that email address, and access can be limited to an administrator-managed list of authorised addresses. This build stores data in your browser for demonstration; the same structure maps directly onto a Node.js and MongoDB backend with hashed passwords, server-issued codes and signed sessions.</p></div>
      </div>
    </div></div>`;
}

function viewContact(){
  return `<div class="wrap" style="padding:2.4rem 0 3.5rem">
    <div class="page-head"><h1>Contact the training division</h1>
      <p>For nominations, technical problems with the portal, or proposing a new course.</p></div>
    <div class="grid g2" style="align-items:start">
      <form class="card card-lg" data-form="contact">
        <label class="field"><span>Your name</span><input type="text" name="name" required></label>
        <label class="field"><span>Email</span><input type="email" name="email" required></label>
        <label class="field"><span>Subject</span>
          <select name="subject">
            <option>Course nomination</option><option>Technical problem</option>
            <option>Propose a new course</option><option>Certificate verification</option><option>Other</option>
          </select></label>
        <label class="field"><span>Message</span><textarea name="message" required></textarea></label>
        <button class="btn btn-block" type="submit">Send message</button>
      </form>
      <div class="stack">
        <div class="card"><h3 style="font-size:1rem">Training Division</h3>
          <p class="small muted mb0">Capacity Connect Secretariat<br>Second floor, Administrative Building<br>Vijayawada, Andhra Pradesh 520010</p></div>
        <div class="card"><h3 style="font-size:1rem">Helpdesk</h3>
          <p class="small muted mb0">support@capacityconnect.org<br>0866 000 0000, Monday to Friday, 10:00 – 17:00</p></div>
        <div class="card"><h3 style="font-size:1rem">Verify a certificate</h3>
          <p class="small muted">Employers and departments can confirm a certificate using its printed ID.</p>
          <a class="btn btn-ghost btn-sm" href="#/verify">Open verification</a></div>
      </div>
    </div></div>`;
}

function viewVerify(){
  return `<div class="wrap-narrow" style="padding:2.4rem 0 3.5rem">
    <div class="page-head"><h1>Verify a certificate</h1><p>Enter the certificate ID printed on the document.</p></div>
    <form class="card card-lg" data-form="verify">
      <label class="field"><span>Certificate ID</span>
        <input type="text" name="cid" placeholder="CC-2026-0418" required>
        <span class="hint">Try CC-2026-0418 from the sample data.</span></label>
      <button class="btn" type="submit">Check certificate</button>
    </form>
    <div id="verify-result" style="margin-top:1rem"></div></div>`;
}

/* -------------------------------------------- COURSE CATALOGUE + DETAIL */
let courseFilters = { q:'', category:'All', level:'All', duration:'All', skill:'All' };

function allSkills(){
  const s = new Set();
  DB.courses.forEach(c => (c.skills||[]).forEach(k => s.add(k)));
  return [...s].sort();
}

function viewCourses(){
  const cats = ['All', ...new Set(DB.courses.map(c=>c.category))];
  const f = courseFilters;
  const list = DB.courses.filter(c => c.status==='published').filter(c=>{
    const q = f.q.toLowerCase();
    const hitQ = !q || (c.title+c.summary+c.description+c.category).toLowerCase().includes(q);
    const hitC = f.category==='All' || c.category===f.category;
    const hitL = f.level==='All' || c.level===f.level;
    const hitS = f.skill==='All' || (c.skills||[]).includes(f.skill);
    const hitD = f.duration==='All'
      || (f.duration==='short' && c.hours<=5)
      || (f.duration==='medium' && c.hours>5 && c.hours<=10)
      || (f.duration==='long' && c.hours>10);
    return hitQ && hitC && hitL && hitS && hitD;
  });
  const opt = (v,cur) => `<option value="${esc(v)}" ${cur===v?'selected':''}>${esc(v)}</option>`;
  return `<div class="wrap" style="padding:2.4rem 0 3.5rem">
    <div class="page-head"><h1>Course catalogue</h1>
      <p>${list.length} course${list.length===1?'':'s'} available. Enrol to unlock modules, material and the assessment.</p></div>
    <div class="card" style="margin-bottom:1.2rem">
      <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(165px,1fr)); gap:.7rem">
        <label class="field" style="margin:0"><span>Search</span>
          <input type="search" data-filter="q" value="${esc(f.q)}" placeholder="Title, topic or keyword"></label>
        <label class="field" style="margin:0"><span>Category</span>
          <select data-filter="category">${cats.map(c=>opt(c,f.category)).join('')}</select></label>
        <label class="field" style="margin:0"><span>Difficulty</span>
          <select data-filter="level">${['All','Beginner','Intermediate','Advanced'].map(c=>opt(c,f.level)).join('')}</select></label>
        <label class="field" style="margin:0"><span>Duration</span>
          <select data-filter="duration">
            <option value="All" ${f.duration==='All'?'selected':''}>Any length</option>
            <option value="short" ${f.duration==='short'?'selected':''}>Up to 5 hours</option>
            <option value="medium" ${f.duration==='medium'?'selected':''}>5 to 10 hours</option>
            <option value="long" ${f.duration==='long'?'selected':''}>More than 10 hours</option>
          </select></label>
        <label class="field" style="margin:0"><span>Skill</span>
          <select data-filter="skill">${['All',...allSkills()].map(c=>opt(c,f.skill)).join('')}</select></label>
      </div>
    </div>
    ${list.length ? `<div class="grid g3">${list.map(c=>courseCard(c)).join('')}</div>`
      : `<div class="empty">No course matches those filters. Clear the search box or widen the category.</div>`}
  </div>`;
}

function viewCourse(id){
  const c = course(id);
  if(!c) return `<div class="wrap" style="padding:3rem 0"><div class="empty">That course no longer exists. <a href="#/courses">Back to the catalogue</a></div></div>`;
  const t = user(c.trainerId);
  const u = me();
  const enr = u ? enrolmentFor(u.id, c.id) : null;
  const prog = enr ? progressOf(enr) : 0;
  const quiz = quizFor(c.id);
  const attempt = u && quiz ? bestAttempt(u.id, quiz.id) : null;
  const cert = u ? certFor(u.id, c.id) : null;
  const mats = DB.resources.filter(r => r.courseId === c.id);
  const fb = DB.feedback.filter(f => f.courseId === c.id);
  const enrolledCount = DB.enrollments.filter(e=>e.courseId===c.id).length;

  const moduleList = c.modules.map((m,i)=>{
    const done = enr && enr.done.includes(String(i));
    const icon = m.type==='video' ? '▶' : m.type==='activity' ? '✎' : '☰';
    return `<div class="row-between" style="padding:.75rem .25rem; border-bottom:1px solid var(--line-soft); gap:.8rem">
      <div class="row" style="gap:.7rem; flex:1; min-width:0">
        <span style="width:30px;height:30px;border-radius:8px;background:${done?'var(--green-soft)':'var(--line-soft)'};color:${done?'var(--green)':'var(--ink-3)'};display:grid;place-items:center;font-size:.85rem;flex:none">${done?'✓':icon}</span>
        <div style="min-width:0"><div style="font-weight:600; font-size:.94rem">${i+1}. ${esc(m.title)}</div>
          <div class="tiny muted">${esc(m.summary)} · ${m.minutes} min</div></div>
      </div>
      ${enr ? `<button class="btn btn-sm ${done?'btn-ghost':''}" data-act="toggle-module" data-id="${c.id}" data-i="${i}">${done?'Mark not done':'Mark complete'}</button>`
            : `<span class="tiny muted">Enrol to open</span>`}
    </div>`;
  }).join('');

  return `<div class="wrap" style="padding:2rem 0 3.5rem">
    <div class="crumb"><a href="#/courses">Courses</a> / ${esc(c.title)}</div>
    <div class="grid" style="grid-template-columns:minmax(0,2fr) minmax(280px,1fr); gap:1.4rem; align-items:start">
      <div class="stack">
        <div class="card card-lg">
          <div class="row" style="gap:.4rem; margin-bottom:.6rem">
            <span class="tag">${esc(c.category)}</span><span class="tag tag-plain">${esc(c.level)}</span>
            ${(c.skills||[]).map(s=>`<span class="tag tag-green">${esc(s)}</span>`).join('')}
          </div>
          <h1 style="font-size:clamp(1.5rem,3.4vw,2.1rem)">${esc(c.title)}</h1>
          <p class="muted" style="margin:.4rem 0 1rem">${esc(c.summary)}</p>
          <p style="color:var(--ink-2)">${esc(c.description)}</p>
          <h3 style="margin-top:1.2rem; font-size:1.02rem">What you will be able to do</h3>
          <ul style="margin:.5rem 0 0; padding-left:1.15rem; color:var(--ink-2)">
            ${c.objectives.map(o=>`<li style="margin-bottom:.25rem">${esc(o)}</li>`).join('')}</ul>
        </div>

        <div class="panel">
          <div class="panel-head"><h3>Modules</h3>
            <span class="small muted">${c.modules.length} modules · ${c.hours} hours</span></div>
          <div class="panel-body" style="padding-top:.2rem">${moduleList}</div>
        </div>

        <div class="panel">
          <div class="panel-head"><h3>Learning material</h3><span class="small muted">From the trainer library</span></div>
          <div class="panel-body">
            ${mats.length ? mats.map(r=>resourceRow(r, !!enr)).join('')
              : `<p class="small muted mb0">No material has been uploaded for this course yet.</p>`}
          </div>
        </div>

        <div class="panel">
          <div class="panel-head"><h3>Assessment</h3>
            ${quiz?`<span class="small muted">Pass mark ${quiz.pass}% · due ${fmtDate(quiz.deadline)}</span>`:''}</div>
          <div class="panel-body">
            ${!quiz ? `<p class="small muted mb0">The trainer has not published an assessment for this course yet.</p>`
             : !u ? `<p class="small muted mb0"><a href="#/login">Log in</a> to attempt the assessment.</p>`
             : !enr ? `<p class="small muted mb0">Enrol in the course to attempt the assessment.</p>`
             : `<div class="row-between">
                  <div><b>${esc(quiz.title)}</b>
                    <div class="small muted">${quiz.questions.length} multiple-choice questions${attempt?` · your best score ${attempt.percent}%`:''}</div></div>
                  <a class="btn btn-sm" href="#/quiz/${quiz.id}">${attempt?'Retake assessment':'Start assessment'}</a>
                </div>
                ${attempt ? `<div class="${attempt.passed?'ok':'err'}" style="margin:.9rem 0 0">
                    ${attempt.passed?'Passed':'Not passed yet'} — ${attempt.score} of ${attempt.total} correct on ${fmtDate(attempt.at)}.</div>`:''}`}
          </div>
        </div>

        <div class="panel">
          <div class="panel-head"><h3>Learner feedback</h3>
            ${enr ? `<button class="btn btn-ghost btn-sm" data-act="feedback" data-id="${c.id}">Give feedback</button>`:''}</div>
          <div class="panel-body stack" style="gap:.9rem">
            ${fb.length ? fb.map(f=>`<div>
                <div class="row" style="gap:.5rem"><span class="avatar" style="width:30px;height:30px;font-size:.72rem">${initials(user(f.userId).name)}</span>
                  <b class="small">${esc(user(f.userId).name)}</b>
                  <span style="color:var(--amber); font-size:.8rem">${'★'.repeat(f.rating)}</span>
                  <span class="tiny muted">${fmtDate(f.at)}</span></div>
                <p class="small muted mb0" style="margin-top:.3rem">${esc(f.comment)}</p></div>`).join('')
              : `<p class="small muted mb0">No feedback yet. Learners can rate the course after enrolling.</p>`}
          </div>
        </div>
      </div>

      <div class="stack">
        <div class="card">
          ${enr ? `<div class="row-between small" style="margin-bottom:.3rem"><b>Your progress</b><span>${prog}%</span></div>
                   <div class="bar green bar-lg"><i style="width:${prog}%"></i></div>
                   <p class="tiny muted" style="margin:.5rem 0 1rem">${enr.done.length} of ${c.modules.length} modules complete · enrolled ${fmtDate(enr.enrolled)}</p>
                   ${cert ? `<button class="btn btn-green btn-block" data-act="view-cert" data-id="${cert.id}">View certificate</button>`
                     : `<button class="btn btn-block" data-act="complete-course" data-id="${c.id}">Claim certificate</button>
                        <p class="tiny muted" style="margin:.5rem 0 0">Finish every module and pass the assessment to unlock this.</p>`}`
            : `<h3 style="font-size:1.05rem">Enrol in this course</h3>
               <p class="small muted">Free for all staff. Opens modules, material and the assessment.</p>
               <button class="btn btn-block" data-act="enrol" data-id="${c.id}">Enrol now</button>`}
          <hr class="divider">
          <dl class="small" style="margin:0; display:grid; grid-template-columns:auto 1fr; gap:.35rem .8rem">
            <dt class="muted">Duration</dt><dd style="margin:0">${c.hours} hours</dd>
            <dt class="muted">Level</dt><dd style="margin:0">${esc(c.level)}</dd>
            <dt class="muted">Modules</dt><dd style="margin:0">${c.modules.length}</dd>
            <dt class="muted">Learners</dt><dd style="margin:0">${enrolledCount}</dd>
            <dt class="muted">Rating</dt><dd style="margin:0">${c.rating?`★ ${c.rating} of 5`:'Not yet rated'}</dd>
            <dt class="muted">Certificate</dt><dd style="margin:0">On completion and pass</dd>
          </dl>
        </div>
        <div class="card">
          <h3 style="font-size:1rem">Your trainer</h3>
          <div class="row" style="gap:.7rem; margin:.7rem 0">
            <span class="avatar avatar-lg">${initials(t.name)}</span>
            <div><b>${esc(t.name)}</b><div class="tiny muted">${esc(t.title||'Trainer')}</div>
              ${t.rating?`<div class="tiny muted">★ ${t.rating} trainer rating</div>`:''}</div>
          </div>
          <p class="small muted mb0">${esc(t.profile && t.profile.bio || '')}</p>
          <div class="row" style="gap:.3rem; margin-top:.6rem">${(t.expertise||[]).map(e=>`<span class="tag tag-plain">${esc(e)}</span>`).join('')}</div>
        </div>
      </div>
    </div></div>`;
}

function resourceRow(r, canOpen=true){
  const icon = {PDF:'▤', Video:'▶', Presentation:'▥', Document:'✎'}[r.type] || '▤';
  return `<div class="row-between" style="padding:.6rem 0; border-bottom:1px solid var(--line-soft); gap:.8rem">
    <div class="row" style="gap:.7rem; flex:1; min-width:0">
      <span style="width:34px;height:34px;border-radius:8px;background:var(--brand-soft);color:var(--brand-dk);display:grid;place-items:center;flex:none">${icon}</span>
      <div style="min-width:0"><div style="font-weight:600; font-size:.92rem">${esc(r.title)}</div>
        <div class="tiny muted">${esc(r.type)} · ${esc(r.category)} · ${esc(r.size)} · ${esc(user(r.by).name)} · ${fmtDate(r.date)}</div></div>
    </div>
    ${canOpen ? `<button class="btn btn-ghost btn-sm" data-act="open-resource" data-id="${r.id}">Open</button>`
              : `<span class="tiny muted">Enrol to open</span>`}
  </div>`;
}

/* ------------------------------------------------------ TRAINING PROGRAMS */
function viewPrograms(){
  const up = DB.programs.filter(p=>!p.done), done = DB.programs.filter(p=>p.done);
  return `<div class="wrap" style="padding:2.4rem 0 3.5rem">
    <div class="page-head"><h1>Training programs</h1>
      <p>Scheduled workshops and cohort programmes led by our trainers.</p></div>
    <h3 style="margin-bottom:.8rem">Upcoming</h3>
    <div class="grid g3">${up.map(p=>programCard(p)).join('')}</div>
    <h3 style="margin:2rem 0 .8rem">Completed</h3>
    <div class="grid g3">${done.length?done.map(p=>programCard(p)).join(''):'<div class="empty">No completed programmes yet.</div>'}</div>
  </div>`;
}

/* ------------------------------------------------------ RESOURCE LIBRARY */
let resFilter = { q:'', cat:'All', type:'All' };
function viewResources(){
  const cats = ['All', ...new Set(DB.resources.map(r=>r.category))];
  const types = ['All', ...new Set(DB.resources.map(r=>r.type))];
  const list = DB.resources.filter(r=>{
    const q = resFilter.q.toLowerCase();
    return (!q || (r.title+r.desc).toLowerCase().includes(q))
      && (resFilter.cat==='All' || r.category===resFilter.cat)
      && (resFilter.type==='All' || r.type===resFilter.type);
  });
  return `<div class="wrap" style="padding:2.4rem 0 3.5rem">
    <div class="page-head"><h1>Resource library</h1>
      <p>Recorded lectures, presentations, guidelines and study material uploaded by trainers and administrators.</p></div>
    <div class="card" style="margin-bottom:1.2rem">
      <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:.7rem">
        <label class="field" style="margin:0"><span>Search</span>
          <input type="search" data-rfilter="q" value="${esc(resFilter.q)}" placeholder="Title or description"></label>
        <label class="field" style="margin:0"><span>Category</span>
          <select data-rfilter="cat">${cats.map(c=>`<option ${resFilter.cat===c?'selected':''}>${esc(c)}</option>`).join('')}</select></label>
        <label class="field" style="margin:0"><span>Type</span>
          <select data-rfilter="type">${types.map(c=>`<option ${resFilter.type===c?'selected':''}>${esc(c)}</option>`).join('')}</select></label>
      </div></div>
    ${list.length ? `<div class="grid g3">${list.map(r=>{
      const c = r.courseId ? course(r.courseId) : null;
      return `<article class="card" style="display:flex;flex-direction:column;gap:.5rem">
        <div class="row" style="gap:.4rem"><span class="tag">${esc(r.type)}</span><span class="tag tag-plain">${esc(r.category)}</span></div>
        <h3 style="font-size:1rem">${esc(r.title)}</h3>
        <p class="small muted mb0" style="flex:1">${esc(r.desc)}</p>
        <div class="tiny muted">${esc(user(r.by).name)} · ${fmtDate(r.date)} · ${esc(r.size)}${c?` · ${esc(c.title)}`:''}</div>
        <div class="row" style="gap:.4rem">
          <button class="btn btn-sm" data-act="open-resource" data-id="${r.id}">View</button>
          <button class="btn btn-ghost btn-sm" data-act="open-resource" data-id="${r.id}">Download</button></div>
      </article>`;}).join('')}</div>`
    : `<div class="empty">Nothing matches that search.</div>`}
  </div>`;
}

/* --------------------------------------------------- KNOWLEDGE SHARING -- */
function viewCommunity(){
  const u = me();
  return `<div class="wrap" style="padding:2.4rem 0 3.5rem">
    <div class="page-head"><h1>Knowledge sharing</h1>
      <p>Ask a question, share something that worked, or read the latest announcements.</p></div>
    <div class="grid" style="grid-template-columns:minmax(0,2fr) minmax(260px,1fr); gap:1.4rem; align-items:start">
      <div class="stack">
        ${u ? `<form class="card" data-form="post">
            <label class="field"><span>Title</span><input type="text" name="title" placeholder="What is your question or topic?" required></label>
            <label class="field"><span>Details</span><textarea name="body" required placeholder="Give enough context for someone to answer usefully."></textarea></label>
            <label class="field"><span>Tags</span><input type="text" name="tags" placeholder="Separate with commas — Digital Skills, Reporting"></label>
            <button class="btn" type="submit">Post to the community</button>
          </form>`
          : `<div class="card"><p class="small muted mb0"><a href="#/login">Log in</a> to post a question or reply to a discussion.</p></div>`}
        ${DB.posts.map(p=>{
          const a = user(p.userId);
          return `<article class="card">
            <div class="row" style="gap:.6rem; margin-bottom:.5rem">
              <span class="avatar">${initials(a.name)}</span>
              <div><b class="small">${esc(a.name)}</b><div class="tiny muted">${esc(a.title||'')} · ${fmtDate(p.at)}</div></div>
            </div>
            <h3 style="font-size:1.05rem">${esc(p.title)}</h3>
            <p class="small" style="color:var(--ink-2)">${esc(p.body)}</p>
            <div class="row" style="gap:.3rem; margin-bottom:.6rem">${(p.tags||[]).map(t=>`<span class="tag tag-plain">${esc(t)}</span>`).join('')}</div>
            ${p.comments.length ? `<div style="border-left:2px solid var(--line); padding-left:.85rem; margin-bottom:.7rem" class="stack">
              ${p.comments.map(cm=>`<div><b class="tiny">${esc(user(cm.userId).name)}</b> <span class="tiny muted">${fmtDate(cm.at)}</span>
                <p class="small muted mb0">${esc(cm.body)}</p></div>`).join('')}</div>` : ''}
            ${u ? `<form class="row" data-form="comment" data-id="${p.id}" style="gap:.5rem">
                <input type="text" name="body" placeholder="Write a reply" required style="flex:1">
                <button class="btn btn-sm" type="submit">Reply</button></form>` : ''}
          </article>`;}).join('')}
      </div>
      <div class="stack">
        <div class="panel"><div class="panel-head"><h3>Announcements</h3></div>
          <div class="panel-body stack" style="gap:.9rem">
            ${DB.announcements.map(n=>`<div>
              <span class="tag ${n.type==='achievement'?'tag-green':n.type==='content'?'tag-amber':''}">${n.type==='achievement'?'Achievement':n.type==='content'?'New content':'Notice'}</span>
              <div style="font-weight:600; font-size:.93rem; margin-top:.35rem">${esc(n.title)}</div>
              <p class="tiny muted mb0">${esc(n.body)}</p></div>`).join('')}
          </div></div>
        <div class="card"><h3 style="font-size:1rem">Community guidance</h3>
          <p class="small muted mb0">Keep posts work-related, do not share citizen data or personal records, and mark a reply as useful so others can find it.</p></div>
      </div>
    </div></div>`;
}

/* ------------------------------------------- COMPETENCY FRAMEWORK (open) */
const SKILL_GROUPS = {
  'Technical skills':['Digital Skills','Data Analytics','Cybersecurity Awareness'],
  'Leadership skills':['Leadership'],
  'Communication':['Communication'],
  'Management skills':['Management','Project Management']
};
function viewCompetency(){
  const u = me();
  const rows = Object.entries(SKILL_GROUPS).map(([group, skills])=>{
    return `<div class="card">
      <h3 style="font-size:1.02rem; margin-bottom:.8rem">${group}</h3>
      <div class="stack" style="gap:1rem">
        ${skills.map(s=>{
          const mine = u && (u.skills||[]).find(k=>k.name===s);
          const level = mine ? mine.level : 0, target = mine ? (mine.target||5) : 5;
          const trainers = DB.users.filter(t=>t.role==='trainer' && t.status==='active' && (t.expertise||[]).includes(s));
          const recs = DB.courses.filter(c=>c.status==='published' && (c.skills||[]).includes(s)).slice(0,2);
          return `<div>
            <div class="row-between" style="margin-bottom:.3rem">
              <b class="small">${esc(s)}</b>
              <span class="tiny muted">${u ? `Level ${level} of 5 · target ${target}` : 'Log in to see your level'}</span></div>
            <div class="bar ${level>=target?'green':''}"><i style="width:${level/5*100}%"></i></div>
            <div class="tiny muted" style="margin-top:.4rem">
              ${recs.length?`Recommended: ${recs.map(c=>`<a href="#/course/${c.id}">${esc(c.title)}</a>`).join(', ')}. `:''}
              ${trainers.length?`Trainers: ${trainers.map(t=>esc(t.name)).join(', ')}.`:'No trainer mapped yet.'}
            </div></div>`;}).join('')}
      </div></div>`;
  }).join('');
  return `<div class="wrap" style="padding:2.4rem 0 3.5rem">
    <div class="page-head"><h1>Competency framework</h1>
      <p>Six skill areas, five levels each. Completing a tagged course raises your level; the same tags map trainers to subjects.</p></div>
    <div class="grid g2">${rows}</div>
  </div>`;
}

/* ------------------------------------------------------------ 3) AUTH -- */
function viewLogin(msg){
  return `<div class="wrap-narrow" style="padding:2.6rem 0 4rem">
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(290px,1fr)); gap:1.4rem; align-items:start">
      <form class="card card-lg" data-form="login">
        <h1 style="font-size:1.6rem">Log in</h1>
        <p class="small muted">Use your work email address.</p>
        ${msg?`<div class="err">${esc(msg)}</div>`:''}
        <div id="login-err"></div>
        <label class="field"><span>Email</span><input type="email" name="email" required autocomplete="username"></label>
        <label class="field"><span>Password</span><input type="password" name="password" required autocomplete="current-password"></label>
        <button class="btn btn-block" type="submit">Log in</button>
        <p class="small muted" style="margin:.9rem 0 0">No account yet? <a href="#/register">Register here</a>.</p>
      </form>
      <div class="card">
        <h3 style="font-size:1rem">Demo accounts</h3>
        <p class="small muted">Tap one to fill the form. The administrator account is private and not shown here — see the project guide for how to sign in as administrator.</p>
        <div class="stack" style="gap:.55rem">
          ${[['Trainee','learner@capacityconnect.org','learner123'],
             ['Trainer','trainer@capacityconnect.org','trainer123']]
            .map(([r,e,p])=>`<button class="card card-flat" style="box-shadow:none; text-align:left; cursor:pointer; border-color:var(--line); background:var(--canvas); padding:.7rem .85rem"
                data-act="fill-login" data-email="${e}" data-pass="${p}">
                <b class="small">${r}</b><div class="tiny muted">${e} · ${p}</div></button>`).join('')}
        </div>
      </div>
    </div></div>`;
}

function viewOtp(){
  if(!DB.otp) { go('#/login'); return ''; }
  const expired = otpExpired();
  const remainMs = Math.max(0, DB.otp.expiresAt - Date.now());
  const remainS = Math.ceil(remainMs/1000);
  const u = byId(DB.users, DB.otp.userId);
  const canResend = (Date.now() - DB.otp.lastSent) >= OTP_RESEND_COOLDOWN_MS && DB.otp.resends < OTP_MAX_RESENDS;
  return `<div class="wrap-narrow" style="padding:2.6rem 0 4rem">
    <form class="card card-lg" data-form="otp" style="max-width:420px; margin-inline:auto">
      <h1 style="font-size:1.5rem">Enter your code</h1>
      <p class="small muted">A 6-digit verification code was sent to <b>${esc(u?u.email:DB.otp.email)}</b>. Sign-in is not possible without it.</p>
      <div id="otp-err"></div>
      ${(DB.otp.mode==='email' && !DB.otp.deliveryFailed) ? `
        <div class="ok" style="margin:0">Check your email inbox (and spam folder) for the code.</div>` : `
        <div class="ok" style="font-family:var(--serif); font-size:1.25rem; letter-spacing:.3em; text-align:center">${DB.otp.code}</div>
        <p class="tiny muted">${DB.otp.deliveryFailed ? 'The email could not be sent, so the code is shown here instead.' : 'Demo mode: no email service is configured yet, so the code is shown above instead of being emailed. Fill in EMAILJS_CONFIG near the top of the script to send it for real — see the project guide.'}</p>`}
      ${expired ? `<div class="err">This code has expired. Request a new one to continue.</div>` :
        `<p class="tiny muted">Expires in <span id="otp-countdown" data-until="${DB.otp.expiresAt}">${remainS}</span>s · attempt ${DB.otp.attempts} of ${OTP_MAX_ATTEMPTS}</p>`}
      <label class="field"><span>6-digit code</span>
        <input type="text" name="code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="one-time-code" required
          style="letter-spacing:.5em; text-align:center; font-size:1.2rem" ${expired?'disabled':''}></label>
      <button class="btn btn-block" type="submit" ${expired?'disabled':''}>Verify and continue</button>
      <div class="row-between" style="margin-top:.9rem">
        <button type="button" class="btn btn-ghost btn-sm" data-act="resend-otp" ${canResend?'':'disabled'}>Resend code</button>
        <button type="button" class="btn btn-ghost btn-sm" data-act="cancel-otp">Cancel, start over</button>
      </div>
      ${DB.otp.resends>=OTP_MAX_RESENDS ? `<p class="tiny muted" style="margin-top:.6rem">Resend limit reached. Cancel and log in again for a fresh code.</p>`:''}
    </form></div>`;
}

function viewRegister(){
  return `<div class="wrap-narrow" style="padding:2.6rem 0 4rem">
    <form class="card card-lg" data-form="register">
      <h1 style="font-size:1.6rem">Create your account</h1>
      <p class="small muted">Registration is open to staff of participating departments. New accounts are reviewed by an administrator before the first login.</p>
      <div id="reg-err"></div>
      <div class="grid g2" style="gap:0 1rem">
        <label class="field"><span>Full name</span><input type="text" name="name" required></label>
        <label class="field"><span>Work email</span><input type="email" name="email" required></label>
        <label class="field"><span>Password</span><input type="password" name="password" minlength="6" required>
          <span class="hint">At least 6 characters.</span></label>
        <label class="field"><span>Confirm password</span><input type="password" name="confirm" required></label>
        <label class="field"><span>Designation</span><input type="text" name="title" placeholder="Junior Programme Officer"></label>
        <label class="field"><span>Department</span><input type="text" name="dept" placeholder="Rural Development"></label>
      </div>
      <label class="field"><span>I am registering as</span>
        <select name="role">
          <option value="trainee">Trainee — I want to learn</option>
          <option value="trainer">Trainer — I want to teach</option>
        </select>
        <span class="hint">Trainer accounts are activated once an administrator verifies your subject expertise.</span></label>
      <label class="field" id="exp-field" style="display:none"><span>Subjects you can teach</span>
        <input type="text" name="expertise" placeholder="Leadership, Communication">
        <span class="hint">Separate with commas. Used for competency mapping.</span></label>
      <label class="row small" style="gap:.5rem; align-items:flex-start; margin-bottom:1rem">
        <input type="checkbox" name="terms" required style="width:auto; margin-top:.25rem">
        <span class="muted">I confirm the details above are correct and agree to the portal’s data handling rules.</span></label>
      <button class="btn btn-block" type="submit">Create account</button>
      <p class="small muted" style="margin:.9rem 0 0">Already registered? <a href="#/login">Log in</a>.</p>
    </form></div>`;
}

function viewRegisterOtp(){
  if(!DB.regOtp){ go('#/register'); return ''; }
  const expired = Date.now() > DB.regOtp.expiresAt;
  const remainS = Math.max(0, Math.ceil((DB.regOtp.expiresAt - Date.now())/1000));
  const canResend = (Date.now() - DB.regOtp.lastSent) >= OTP_RESEND_COOLDOWN_MS && DB.regOtp.resends < OTP_MAX_RESENDS;
  return `<div class="wrap-narrow" style="padding:2.6rem 0 4rem">
    <form class="card card-lg" data-form="reg-otp" style="max-width:420px; margin-inline:auto">
      <h1 style="font-size:1.5rem">Verify your email</h1>
      <p class="small muted">A 6-digit code was sent to <b>${esc(DB.regOtp.data.email)}</b>. The account is only created once this is confirmed.</p>
      <div id="reg-otp-err"></div>
      ${(DB.regOtp.mode==='email' && !DB.regOtp.deliveryFailed) ? `
        <div class="ok" style="margin:0">Check your email inbox (and spam folder) for the code.</div>` : `
        <div class="ok" style="font-family:var(--serif); font-size:1.25rem; letter-spacing:.3em; text-align:center">${DB.regOtp.code}</div>
        <p class="tiny muted">${DB.regOtp.deliveryFailed ? 'The email could not be sent, so the code is shown here instead.' : 'Demo mode: no email service is configured yet, so the code is shown above instead of being emailed. Fill in EMAILJS_CONFIG near the top of the script to send it for real.'}</p>`}
      ${expired ? `<div class="err">This code has expired. Request a new one to continue.</div>` :
        `<p class="tiny muted">Expires in <span id="reg-otp-countdown" data-until="${DB.regOtp.expiresAt}">${remainS}</span>s · attempt ${DB.regOtp.attempts} of ${OTP_MAX_ATTEMPTS}</p>`}
      <label class="field"><span>6-digit code</span>
        <input type="text" name="code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="one-time-code" required
          style="letter-spacing:.5em; text-align:center; font-size:1.2rem" ${expired?'disabled':''}></label>
      <button class="btn btn-block" type="submit" ${expired?'disabled':''}>Verify and create account</button>
      <div class="row-between" style="margin-top:.9rem">
        <button type="button" class="btn btn-ghost btn-sm" data-act="resend-reg-otp" ${canResend?'':'disabled'}>Resend code</button>
        <button type="button" class="btn btn-ghost btn-sm" data-act="cancel-reg-otp">Cancel, start over</button>
      </div>
    </form></div>`;
}

/* ------------------------------------------------------- 5) LEARNER -- */
const LEARNER_NAV = route => sidebar([
  {label:'Learning'},
  {href:'#/dashboard', text:'Dashboard', icon:'▦'},
  {href:'#/my-courses', text:'My courses', icon:'▤'},
  {href:'#/my-assessments', text:'Assessments', icon:'✓'},
  {href:'#/my-skills', text:'My skills', icon:'▲'},
  {href:'#/my-certificates', text:'Certificates', icon:'★'},
  {label:'Portal'},
  {href:'#/courses', text:'Course catalogue', icon:'▣'},
  {href:'#/programs', text:'Training programs', icon:'▧'},
  {href:'#/resources', text:'Resource library', icon:'▥'},
  {href:'#/community', text:'Knowledge sharing', icon:'◈'},
  {href:'#/profile', text:'My profile', icon:'◉'}
], route);

function viewDashboard(){
  const u = me();
  const mine = DB.enrollments.filter(e=>e.userId===u.id);
  const completed = mine.filter(e=>e.completed);
  const hours = learningHours(u.id);
  const certs = DB.certificates.filter(c=>c.userId===u.id);
  const inProgress = mine.filter(e=>!e.completed).sort((a,b)=>progressOf(b)-progressOf(a));
  const next = inProgress[0];
  const attempts = DB.attempts.filter(a=>a.userId===u.id).sort((a,b)=>b.at.localeCompare(a.at)).slice(0,4);
  const upcoming = DB.programs.filter(p=>!p.done && p.registered.includes(u.id));
  const enrolledIds = mine.map(e=>e.courseId);
  const recommended = DB.courses.filter(c=>c.status==='published' && !enrolledIds.includes(c.id)).slice(0,3);
  const weekly = [['Wk 1',3],['Wk 2',5],['Wk 3',2],['Wk 4',6],['Wk 5',4],['Wk 6',7],['Wk 7',5],['Wk 8',8]]
    .map(([label,value])=>({label,value}));

  return `<div class="page-head">
      <h1>Welcome back, ${esc(u.name.split(' ')[0])}</h1>
      <p>${next ? `You are ${progressOf(next)}% through ${esc(course(next.courseId).title)}.` : 'Browse the catalogue to start a new course.'}</p>
    </div>
    <div class="grid g4" style="margin-bottom:1.2rem">
      ${[[mine.length,'Enrolled courses'],[completed.length,'Completed courses'],
         [hours.toFixed(1),'Learning hours'],[certs.length,'Certificates']]
        .map(([n,l])=>`<div class="kpi"><b>${n}</b><span>${l}</span></div>`).join('')}
    </div>

    <div class="grid" style="grid-template-columns:minmax(0,2fr) minmax(270px,1fr); gap:1.2rem; align-items:start">
      <div class="stack">
        ${next ? `<div class="panel"><div class="panel-head"><h3>Continue learning</h3>
            <a class="btn btn-sm" href="#/course/${next.courseId}">Resume course</a></div>
          <div class="panel-body">
            <b>${esc(course(next.courseId).title)}</b>
            <p class="small muted" style="margin:.2rem 0 .7rem">Next up: ${esc((course(next.courseId).modules[next.done.length]||{title:'Final review'}).title)}</p>
            <div class="bar green bar-lg"><i style="width:${progressOf(next)}%"></i></div>
            <div class="row-between tiny muted" style="margin-top:.35rem">
              <span>${next.done.length} of ${course(next.courseId).modules.length} modules</span><span>${progressOf(next)}%</span></div>
          </div></div>` : ''}

        <div class="panel"><div class="panel-head"><h3>My courses</h3>
          <a class="btn-link" href="#/my-courses">See all</a></div>
          <div class="panel-body stack" style="gap:.9rem">
            ${mine.length ? mine.slice(0,4).map(e=>{
              const c = course(e.courseId), p = progressOf(e);
              return `<div>
                <div class="row-between" style="margin-bottom:.25rem">
                  <a class="small" style="font-weight:600" href="#/course/${c.id}">${esc(c.title)}</a>
                  <span class="tiny muted">${e.completed?'Completed':p+'%'}</span></div>
                <div class="bar ${e.completed?'green':''}"><i style="width:${p}%"></i></div></div>`;}).join('')
            : `<p class="small muted mb0">You have not enrolled in anything yet. <a href="#/courses">Browse courses</a>.</p>`}
          </div></div>

        <div class="panel"><div class="panel-head"><h3>Recent assessment results</h3>
          <a class="btn-link" href="#/my-assessments">All results</a></div>
          <div class="panel-body">
            ${attempts.length ? `<div class="table-scroll"><table><thead><tr>
              <th>Assessment</th><th>Date</th><th>Score</th><th>Result</th></tr></thead><tbody>
              ${attempts.map(a=>{ const q = byId(DB.quizzes,a.quizId);
                return `<tr><td>${esc(q?q.title:'Assessment')}</td><td class="muted">${fmtDate(a.at)}</td>
                  <td>${a.score}/${a.total} · ${a.percent}%</td>
                  <td><span class="tag ${a.passed?'tag-green':'tag-red'}">${a.passed?'Pass':'Fail'}</span></td></tr>`;}).join('')}
              </tbody></table></div>`
            : `<p class="small muted mb0">No attempts yet. Open a course and take its assessment.</p>`}
          </div></div>

        <div class="panel"><div class="panel-head"><h3>Recommended for you</h3>
          <span class="small muted">Based on your skill targets</span></div>
          <div class="panel-body stack" style="gap:.8rem">
            ${recommended.map(c=>`<div class="row-between" style="gap:.8rem">
              <div><a class="small" style="font-weight:600" href="#/course/${c.id}">${esc(c.title)}</a>
                <div class="tiny muted">${esc(c.category)} · ${c.hours} hours · ${esc(c.level)}</div></div>
              <button class="btn btn-ghost btn-sm" data-act="enrol" data-id="${c.id}">Enrol</button></div>`).join('')}
          </div></div>
      </div>

      <div class="stack">
        <div class="panel"><div class="panel-head"><h3>Learning hours</h3><span class="small muted">Last 8 weeks</span></div>
          <div class="panel-body">${barChart(weekly,{alt:'Learning hours per week'})}</div></div>

        <div class="panel"><div class="panel-head"><h3>My skills</h3><a class="btn-link" href="#/my-skills">Details</a></div>
          <div class="panel-body">
            ${(u.skills||[]).length ? rowChart((u.skills||[]).map(s=>({label:s.name, value:s.level*20, display:(s.level*20)+'%'})))
              : '<p class="small muted mb0">No skills recorded yet.</p>'}
          </div></div>

        <div class="panel"><div class="panel-head"><h3>Upcoming training</h3></div>
          <div class="panel-body stack" style="gap:.8rem">
            ${upcoming.length ? upcoming.map(p=>`<div>
                <b class="small">${esc(p.title)}</b>
                <div class="tiny muted">${fmtDate(p.date)} · ${esc(p.duration)}<br>${esc(p.mode)}</div></div>`).join('')
              : `<p class="small muted mb0">You are not registered for a programme. <a href="#/programs">See what is scheduled</a>.</p>`}
          </div></div>
      </div>
    </div>`;
}

function viewMyCourses(){
  const u = me();
  const mine = DB.enrollments.filter(e=>e.userId===u.id);
  return `<div class="page-head"><h1>My courses</h1><p>Everything you are enrolled in, with progress and assessment status.</p></div>
    ${mine.length ? `<div class="grid g3">${mine.map(e=>{
      const c = course(e.courseId), p = progressOf(e), q = quizFor(c.id);
      const a = q ? bestAttempt(u.id, q.id) : null, cert = certFor(u.id, c.id);
      return `<article class="card" style="display:flex;flex-direction:column;gap:.55rem">
        <div class="row" style="gap:.4rem"><span class="tag">${esc(c.category)}</span>
          ${e.completed?'<span class="tag tag-green">Completed</span>':'<span class="tag tag-amber">In progress</span>'}</div>
        <h3 style="font-size:1.02rem"><a href="#/course/${c.id}" style="color:inherit">${esc(c.title)}</a></h3>
        <div><div class="row-between tiny muted" style="margin-bottom:.25rem"><span>${e.done.length}/${c.modules.length} modules</span><span>${p}%</span></div>
          <div class="bar ${e.completed?'green':''}"><i style="width:${p}%"></i></div></div>
        <div class="tiny muted">${a?`Assessment ${a.percent}% — ${a.passed?'passed':'not passed'}`:'Assessment not attempted'}</div>
        <div class="row" style="gap:.4rem">
          <a class="btn btn-sm" href="#/course/${c.id}">${e.completed?'Review':'Continue'}</a>
          ${cert?`<button class="btn btn-ghost btn-sm" data-act="view-cert" data-id="${cert.id}">Certificate</button>`:''}</div>
      </article>`;}).join('')}</div>`
    : `<div class="empty">You have not enrolled in a course yet. <a href="#/courses">Browse the catalogue</a>.</div>`}`;
}

function viewMyAssessments(){
  const u = me();
  const mine = DB.enrollments.filter(e=>e.userId===u.id).map(e=>e.courseId);
  const quizzes = DB.quizzes.filter(q=>mine.includes(q.courseId));
  const attempts = DB.attempts.filter(a=>a.userId===u.id).sort((a,b)=>b.at.localeCompare(a.at));
  return `<div class="page-head"><h1>Assessments</h1><p>Subject-wise multiple-choice assessments for the courses you are enrolled in.</p></div>
    <div class="panel" style="margin-bottom:1.2rem"><div class="panel-head"><h3>Open to you</h3></div>
      <div class="panel-body stack" style="gap:.9rem">
        ${quizzes.length ? quizzes.map(q=>{
          const c = course(q.courseId), best = bestAttempt(u.id,q.id);
          const late = new Date(q.deadline) < new Date();
          return `<div class="row-between" style="gap:.8rem">
            <div><b class="small">${esc(q.title)}</b>
              <div class="tiny muted">${esc(c.title)} · ${q.questions.length} questions · pass mark ${q.pass}%
                · <span class="${late?'':'muted'}" style="${late?'color:var(--red)':''}">due ${fmtDate(q.deadline)}${late?' (overdue)':''}</span></div>
              ${best?`<div class="tiny" style="color:${best.passed?'var(--green)':'var(--red)'}">Best score ${best.percent}% — ${best.passed?'passed':'not passed'}</div>`:''}</div>
            <a class="btn btn-sm ${best?'btn-ghost':''}" href="#/quiz/${q.id}">${best?'Retake':'Start'}</a></div>`;}).join('')
        : `<p class="small muted mb0">No assessments are open. Enrol in a course to unlock its assessment.</p>`}
      </div></div>
    <div class="panel"><div class="panel-head"><h3>Attempt history</h3></div>
      <div class="panel-body">
        ${attempts.length?`<div class="table-scroll"><table><thead><tr><th>Assessment</th><th>Course</th><th>Date</th><th>Score</th><th>Result</th></tr></thead>
          <tbody>${attempts.map(a=>{const q=byId(DB.quizzes,a.quizId); const c=q?course(q.courseId):null;
            return `<tr><td>${esc(q?q.title:'—')}</td><td class="muted">${esc(c?c.title:'—')}</td><td class="muted">${fmtDate(a.at)}</td>
              <td>${a.score}/${a.total} · ${a.percent}%</td><td><span class="tag ${a.passed?'tag-green':'tag-red'}">${a.passed?'Pass':'Fail'}</span></td></tr>`;}).join('')}
          </tbody></table></div>`:`<p class="small muted mb0">No attempts recorded.</p>`}
      </div></div>`;
}

function viewMySkills(){
  const u = me();
  const skills = u.skills || [];
  return `<div class="page-head"><h1>My skills</h1><p>Your current level against target, updated when you complete a tagged course.</p></div>
    <div class="grid" style="grid-template-columns:minmax(0,2fr) minmax(260px,1fr); gap:1.2rem; align-items:start">
      <div class="panel"><div class="panel-head"><h3>Competency profile</h3>
        <button class="btn btn-ghost btn-sm" data-act="add-skill">Add a skill</button></div>
        <div class="panel-body stack" style="gap:1.2rem">
          ${skills.length ? skills.map(s=>{
            const recs = DB.courses.filter(c=>c.status==='published' && (c.skills||[]).includes(s.name)).slice(0,2);
            const p = Math.round(s.level/5*100), reached = s.level >= (s.target||5);
            return `<div>
              <div class="row-between" style="margin-bottom:.3rem">
                <b class="small">${esc(s.name)}</b>
                <span class="tiny muted">Level ${s.level} of 5 · target ${s.target||5}</span></div>
              <div class="bar ${reached?'green':''} bar-lg"><i style="width:${p}%"></i></div>
              <div class="tiny muted" style="margin-top:.4rem">
                ${reached?'Target reached. ':''}${recs.length?`Recommended: ${recs.map(c=>`<a href="#/course/${c.id}">${esc(c.title)}</a>`).join(', ')}.`:'No course tagged to this skill yet.'}
              </div></div>`;}).join('')
          : `<p class="small muted mb0">No skills recorded. Add one, or complete a course to have it added automatically.</p>`}
        </div></div>
      <div class="stack">
        <div class="panel"><div class="panel-head"><h3>Progress to target</h3></div>
          <div class="panel-body">
            ${donut(skills.length ? Math.round(skills.reduce((s,k)=>s + Math.min(k.level/(k.target||5),1),0)/skills.length*100) : 0,
              'Average progress across your skill targets')}
          </div></div>
        <div class="card"><h3 style="font-size:1rem">How levels move</h3>
          <p class="small muted mb0">Completing a course tagged with a skill raises that skill by one level, up to level 5. Your reporting officer can also set a target level during the annual review.</p></div>
      </div>
    </div>`;
}

function viewMyCertificates(){
  const u = me();
  const certs = DB.certificates.filter(c=>c.userId===u.id);
  return `<div class="page-head"><h1>My certificates</h1><p>Issued automatically when a course is completed and its assessment passed.</p></div>
    ${certs.length ? `<div class="grid g3">${certs.map(c=>{
      const co = course(c.courseId);
      return `<article class="card" style="display:flex;flex-direction:column;gap:.5rem">
        <span class="tag tag-green" style="align-self:flex-start">Issued</span>
        <h3 style="font-size:1.02rem">${esc(co?co.title:'Course')}</h3>
        <div class="tiny muted">Certificate ${esc(c.id)}<br>Completed ${fmtDate(c.date)}</div>
        <div class="row" style="gap:.4rem">
          <button class="btn btn-sm" data-act="view-cert" data-id="${c.id}">View</button>
          <button class="btn btn-ghost btn-sm" data-act="print-cert" data-id="${c.id}">Download</button></div>
      </article>`;}).join('')}</div>`
    : `<div class="empty">No certificates yet. Finish a course and pass its assessment to earn one.</div>`}`;
}

/* ------------------------------------------------------------ PROFILE -- */
function viewProfile(){
  const u = me();
  const p = u.profile || {};
  const list = (arr, render, emptyMsg) => arr && arr.length
    ? `<div class="stack" style="gap:.7rem">${arr.map(render).join('')}</div>`
    : `<p class="small muted mb0">${emptyMsg}</p>`;
  return `<div class="page-head"><h1>My profile</h1><p>Your professional record on the portal. Trainers and administrators can see this.</p></div>
    <div class="grid" style="grid-template-columns:minmax(0,2fr) minmax(260px,1fr); gap:1.2rem; align-items:start">
      <div class="stack">
        <div class="panel"><div class="panel-head"><h3>Basic details</h3>
          <button class="btn btn-ghost btn-sm" data-act="edit-profile">Edit details</button></div>
          <div class="panel-body">
            <div class="row" style="gap:1rem; margin-bottom:1rem">
              <span class="avatar avatar-lg">${initials(u.name)}</span>
              <div><b style="font-size:1.05rem">${esc(u.name)}</b>
                <div class="small muted">${esc(u.title||'—')} · ${esc(u.dept||'—')}</div>
                <div class="row" style="gap:.3rem; margin-top:.35rem">
                  <span class="tag">${u.role==='trainee'?'Trainee':u.role==='trainer'?'Trainer':'Administrator'}</span>
                  <span class="tag ${u.status==='active'?'tag-green':'tag-amber'}">${u.status==='active'?'Approved':'Pending approval'}</span></div></div>
            </div>
            <p class="small" style="color:var(--ink-2)">${esc(p.bio||'No summary added yet.')}</p>
            <dl class="small" style="margin:0; display:grid; grid-template-columns:auto 1fr; gap:.3rem .9rem">
              <dt class="muted">Email</dt><dd style="margin:0">${esc(u.email)}</dd>
              <dt class="muted">Phone</dt><dd style="margin:0">${esc(p.phone||'—')}</dd>
              <dt class="muted">Location</dt><dd style="margin:0">${esc(p.location||'—')}</dd>
              <dt class="muted">Member since</dt><dd style="margin:0">${fmtDate(u.joined)}</dd></dl>
          </div></div>

        <div class="panel"><div class="panel-head"><h3>Qualifications</h3>
          <button class="btn btn-ghost btn-sm" data-act="add-qual">Add</button></div>
          <div class="panel-body">${list(p.qualifications, q=>`<div class="row-between">
            <div><b class="small">${esc(q.q)}</b><div class="tiny muted">${esc(q.i)} · ${esc(q.y)}</div></div>
            <button class="btn-link" style="color:var(--red)" data-act="del-item" data-kind="qualifications" data-v="${esc(q.q)}">Remove</button></div>`,
            'No qualifications added yet.')}</div></div>

        <div class="panel"><div class="panel-head"><h3>Work experience</h3>
          <button class="btn btn-ghost btn-sm" data-act="add-exp">Add</button></div>
          <div class="panel-body">${list(p.experience, e=>`<div class="row-between">
            <div><b class="small">${esc(e.r)}</b><div class="tiny muted">${esc(e.o)} · ${esc(e.y)}</div></div>
            <button class="btn-link" style="color:var(--red)" data-act="del-item" data-kind="experience" data-v="${esc(e.r)}">Remove</button></div>`,
            'No experience added yet.')}</div></div>

        <div class="panel"><div class="panel-head"><h3>Certificates</h3></div>
          <div class="panel-body">${list(p.certificates, c=>`<div>
            <b class="small">${esc(c.n)}</b><div class="tiny muted">${esc(c.b)} · ${esc(c.y)}</div></div>`,
            'Certificates earned on the portal appear under My certificates.')}</div></div>
      </div>

      <div class="stack">
        <div class="panel"><div class="panel-head"><h3>Skills</h3>
          <button class="btn btn-ghost btn-sm" data-act="add-skill">Add</button></div>
          <div class="panel-body">
            ${(u.skills||[]).length ? rowChart(u.skills.map(s=>({label:s.name, value:s.level*20, display:'Level '+s.level})))
              : '<p class="small muted mb0">No skills recorded.</p>'}
          </div></div>
        <div class="panel"><div class="panel-head"><h3>Interests</h3>
          <button class="btn btn-ghost btn-sm" data-act="add-interest">Add</button></div>
          <div class="panel-body">
            ${(p.interests||[]).length ? `<div class="row" style="gap:.35rem">${p.interests.map(i=>`<span class="tag tag-plain">${esc(i)}</span>`).join('')}</div>`
              : '<p class="small muted mb0">No interests listed.</p>'}
          </div></div>
        ${u.role==='trainer'?`<div class="panel"><div class="panel-head"><h3>Subject expertise</h3>
          <button class="btn btn-ghost btn-sm" data-act="edit-expertise">Edit</button></div>
          <div class="panel-body">
            ${(u.expertise||[]).length?`<div class="row" style="gap:.35rem">${u.expertise.map(i=>`<span class="tag">${esc(i)}</span>`).join('')}</div>`
              :'<p class="small muted mb0">Add subjects so administrators can map you to courses.</p>'}
          </div></div>`:''}

        <div class="panel"><div class="panel-head"><h3>Account security</h3></div>
          <div class="panel-body">
            <p class="small" style="color:var(--ink-2)">Change your sign-in email and password. This account also requires a code sent to that email every time you log in — see the login page.</p>
            <div id="sec-err"></div>
            <form class="stack" data-form="security" style="gap:.7rem">
              <label class="field small"><span>Current password</span><input type="password" name="current" autocomplete="current-password" required></label>
              <label class="field small"><span>New email (optional)</span><input type="email" name="newEmail" autocomplete="username" placeholder="${esc(u.email)}"></label>
              <label class="field small"><span>New password (optional)</span><input type="password" name="newPassword" minlength="6" autocomplete="new-password"></label>
              <label class="field small"><span>Confirm new password</span><input type="password" name="confirmPassword" autocomplete="new-password"></label>
              <button class="btn btn-sm" type="submit">Update credentials</button>
            </form>
          </div></div>
      </div>
    </div>`;
}

/* --------------------------------------------------------- QUIZ RUNNER -- */
let quizState = null; // {quizId, idx, answers[], submitted, result}

function viewQuiz(quizId){
  const u = me(), q = byId(DB.quizzes, quizId);
  if(!q) return `<div class="empty">That assessment was removed.</div>`;
  const c = course(q.courseId);
  if(!quizState || quizState.quizId !== quizId)
    quizState = { quizId, idx:0, answers:new Array(q.questions.length).fill(null), submitted:false, result:null };

  if(quizState.submitted){
    const r = quizState.result;
    return `<div class="crumb"><a href="#/course/${c.id}">${esc(c.title)}</a> / Assessment result</div>
      <div class="card card-lg" style="text-align:center; margin-bottom:1.2rem">
        <span class="tag ${r.passed?'tag-green':'tag-red'}">${r.passed?'Passed':'Not passed'}</span>
        <h1 style="margin:.6rem 0 .2rem">${r.percent}%</h1>
        <p class="muted">${r.score} of ${r.total} correct · pass mark ${q.pass}%</p>
        <div class="row" style="justify-content:center">
          <a class="btn" href="#/course/${c.id}">Back to course</a>
          <button class="btn btn-ghost" data-act="retake" data-id="${q.id}">Try again</button>
        </div></div>
      <div class="panel"><div class="panel-head"><h3>Answer review</h3></div>
        <div class="panel-body stack" style="gap:1.1rem">
          ${q.questions.map((item,i)=>{
            const given = quizState.answers[i], ok = given === item.a;
            return `<div>
              <div class="row" style="gap:.5rem; margin-bottom:.35rem">
                <span class="tag ${ok?'tag-green':'tag-red'}">${ok?'Correct':'Incorrect'}</span>
                <b class="small">Question ${i+1}</b></div>
              <p class="small" style="margin:0 0 .4rem; font-weight:600">${esc(item.q)}</p>
              <div class="stack" style="gap:.25rem">
                ${item.o.map((opt,oi)=>{
                  const isAns = oi===item.a, isGiven = oi===given;
                  const bg = isAns ? 'var(--green-soft)' : isGiven ? 'var(--red-soft)' : 'transparent';
                  const col = isAns ? 'var(--green)' : isGiven ? 'var(--red)' : 'var(--ink-2)';
                  return `<div class="small" style="padding:.35rem .6rem; border-radius:7px; background:${bg}; color:${col}">
                    ${String.fromCharCode(65+oi)}. ${esc(opt)}${isAns?' — correct answer':isGiven?' — your answer':''}</div>`;}).join('')}
              </div></div>`;}).join('')}
        </div></div>`;
  }

  const i = quizState.idx, item = q.questions[i];
  const answered = quizState.answers.filter(a=>a!==null).length;
  return `<div class="crumb"><a href="#/course/${c.id}">${esc(c.title)}</a> / ${esc(q.title)}</div>
    <div class="card card-lg" style="max-width:760px">
      <div class="row-between" style="margin-bottom:.7rem">
        <b class="small muted">Question ${i+1} of ${q.questions.length}</b>
        <span class="tiny muted">Pass mark ${q.pass}% · due ${fmtDate(q.deadline)}</span></div>
      <div class="bar" style="margin-bottom:1.2rem"><i style="width:${(i+1)/q.questions.length*100}%"></i></div>
      <h2 style="font-size:1.25rem; margin-bottom:1rem">${esc(item.q)}</h2>
      <div class="stack" style="gap:.5rem">
        ${item.o.map((opt,oi)=>{
          const sel = quizState.answers[i]===oi;
          return `<button class="card" data-act="answer" data-i="${oi}" style="text-align:left; cursor:pointer; display:flex; gap:.7rem; align-items:center; box-shadow:none;
            border-color:${sel?'var(--brand)':'var(--line)'}; background:${sel?'var(--brand-soft)':'var(--paper)'}; padding:.75rem .9rem">
            <span style="width:26px;height:26px;border-radius:50%;flex:none;display:grid;place-items:center;font-size:.8rem;font-weight:700;
              background:${sel?'var(--brand)':'var(--line-soft)'}; color:${sel?'#fff':'var(--ink-2)'}">${String.fromCharCode(65+oi)}</span>
            <span style="font-size:.95rem; color:var(--ink)">${esc(opt)}</span></button>`;}).join('')}
      </div>
      <div class="row-between" style="margin-top:1.4rem">
        <button class="btn btn-ghost btn-sm" data-act="prev-q" ${i===0?'disabled':''}>Previous</button>
        <span class="tiny muted">${answered} of ${q.questions.length} answered</span>
        ${i < q.questions.length-1
          ? `<button class="btn btn-sm" data-act="next-q">Next question</button>`
          : `<button class="btn btn-sm btn-green" data-act="submit-quiz">Submit assessment</button>`}
      </div>
    </div>`;
}

function submitQuiz(){
  const u = me(), q = byId(DB.quizzes, quizState.quizId);
  const score = q.questions.reduce((s,item,i)=> s + (quizState.answers[i]===item.a ? 1 : 0), 0);
  const percent = pct(score, q.questions.length);
  const passed = percent >= q.pass;
  const rec = { id:uid('a'), quizId:q.id, userId:u.id, score, total:q.questions.length, percent, passed, at:today() };
  DB.attempts.push(rec); save();
  quizState.submitted = true; quizState.result = rec;
  render();
  toast(passed ? `Passed with ${percent}%` : `Scored ${percent}% — pass mark is ${q.pass}%`);
}

/* ------------------------------------------------------- 6) TRAINER -- */
const TRAINER_NAV = route => sidebar([
  {label:'Teaching'},
  {href:'#/trainer', text:'Dashboard', icon:'▦'},
  {href:'#/trainer-courses', text:'My courses', icon:'▤'},
  {href:'#/trainer-quizzes', text:'Questionnaires', icon:'✓'},
  {href:'#/trainer-library', text:'Trainer library', icon:'▥'},
  {href:'#/trainer-learners', text:'Learner performance', icon:'◈'},
  {label:'Portal'},
  {href:'#/courses', text:'Course catalogue', icon:'▣'},
  {href:'#/programs', text:'Training programs', icon:'▧'},
  {href:'#/community', text:'Knowledge sharing', icon:'◉'},
  {href:'#/profile', text:'My profile', icon:'◉'}
], route);

function trainerCourses(uid_){ return DB.courses.filter(c=>c.trainerId===uid_); }

function viewTrainerDash(){
  const u = me();
  const mine = trainerCourses(u.id);
  const ids = mine.map(c=>c.id);
  const enr = DB.enrollments.filter(e=>ids.includes(e.courseId));
  const learners = new Set(enr.map(e=>e.userId));
  const qz = DB.quizzes.filter(q=>ids.includes(q.courseId));
  const atts = DB.attempts.filter(a=>qz.some(q=>q.id===a.quizId));
  const avg = atts.length ? Math.round(atts.reduce((s,a)=>s+a.percent,0)/atts.length) : 0;
  const completion = enr.length ? Math.round(enr.filter(e=>e.completed).length/enr.length*100) : 0;

  return `<div class="page-head"><h1>Trainer dashboard</h1>
      <p>${esc(u.name)} · ${esc(u.title||'Trainer')} · ${mine.length} course${mine.length===1?'':'s'} in your name.</p></div>
    <div class="grid g4" style="margin-bottom:1.2rem">
      ${[[mine.length,'Your courses'],[learners.size,'Learners enrolled'],
         [qz.length,'Questionnaires'],[avg+'%','Average assessment score']]
        .map(([n,l])=>`<div class="kpi"><b>${n}</b><span>${l}</span></div>`).join('')}
    </div>
    <div class="grid" style="grid-template-columns:minmax(0,2fr) minmax(260px,1fr); gap:1.2rem; align-items:start">
      <div class="stack">
        <div class="panel"><div class="panel-head"><h3>Course participation</h3>
          <a class="btn btn-sm" href="#/trainer-courses">Manage courses</a></div>
          <div class="panel-body">
            ${mine.length ? `<div class="table-scroll"><table><thead><tr>
              <th>Course</th><th>Status</th><th>Enrolled</th><th>Completed</th><th>Average progress</th></tr></thead><tbody>
              ${mine.map(c=>{
                const e = DB.enrollments.filter(x=>x.courseId===c.id);
                const ap = e.length ? Math.round(e.reduce((s,x)=>s+progressOf(x),0)/e.length) : 0;
                return `<tr><td><a href="#/course/${c.id}">${esc(c.title)}</a></td>
                  <td><span class="tag ${c.status==='published'?'tag-green':'tag-amber'}">${c.status==='published'?'Published':'Pending'}</span></td>
                  <td>${e.length}</td><td>${e.filter(x=>x.completed).length}</td>
                  <td><div class="bar" style="min-width:80px"><i style="width:${ap}%"></i></div><span class="tiny muted">${ap}%</span></td></tr>`;}).join('')}
              </tbody></table></div>`
            : `<p class="small muted mb0">You have no courses yet. <a href="#/trainer-courses">Create your first course</a>.</p>`}
          </div></div>

        <div class="panel"><div class="panel-head"><h3>Recent assessment attempts</h3>
          <a class="btn-link" href="#/trainer-learners">All learners</a></div>
          <div class="panel-body">
            ${atts.length ? `<div class="table-scroll"><table><thead><tr><th>Learner</th><th>Assessment</th><th>Date</th><th>Score</th><th>Result</th></tr></thead>
              <tbody>${atts.slice(-6).reverse().map(a=>{const q=byId(DB.quizzes,a.quizId);
                return `<tr><td>${esc(user(a.userId).name)}</td><td class="muted">${esc(q?q.title:'—')}</td><td class="muted">${fmtDate(a.at)}</td>
                  <td>${a.percent}%</td><td><span class="tag ${a.passed?'tag-green':'tag-red'}">${a.passed?'Pass':'Fail'}</span></td></tr>`;}).join('')}
              </tbody></table></div>` : `<p class="small muted mb0">No attempts yet.</p>`}
          </div></div>
      </div>
      <div class="stack">
        <div class="panel"><div class="panel-head"><h3>Completion rate</h3></div>
          <div class="panel-body">${donut(completion,'of enrolments on your courses are complete')}</div></div>
        <div class="panel"><div class="panel-head"><h3>Quick actions</h3></div>
          <div class="panel-body stack" style="gap:.5rem">
            <button class="btn btn-sm btn-block" data-act="new-course">Create a course</button>
            <button class="btn btn-ghost btn-sm btn-block" data-act="new-quiz">Create a questionnaire</button>
            <button class="btn btn-ghost btn-sm btn-block" data-act="upload-resource">Upload material</button>
            <button class="btn btn-ghost btn-sm btn-block" data-act="new-post">Post an announcement</button>
          </div></div>
        <div class="panel"><div class="panel-head"><h3>Deadlines</h3></div>
          <div class="panel-body stack" style="gap:.7rem">
            ${qz.length ? qz.map(q=>`<div class="row-between">
                <div><b class="tiny">${esc(q.title)}</b><div class="tiny muted">${esc(course(q.courseId).title)}</div></div>
                <span class="tiny ${new Date(q.deadline)<new Date()?'':'muted'}" style="${new Date(q.deadline)<new Date()?'color:var(--red)':''}">${fmtDate(q.deadline)}</span></div>`).join('')
              : `<p class="small muted mb0">No questionnaires yet.</p>`}
          </div></div>
      </div>
    </div>`;
}

function viewTrainerCourses(){
  const u = me(), mine = trainerCourses(u.id);
  return `<div class="page-head row-between"><div><h1>My courses</h1>
      <p>Create, edit and track the courses you deliver.</p></div>
      <button class="btn" data-act="new-course">Create a course</button></div>
    ${mine.length ? `<div class="grid g3">${mine.map(c=>{
      const e = DB.enrollments.filter(x=>x.courseId===c.id);
      return `<article class="card" style="display:flex;flex-direction:column;gap:.5rem">
        <div class="row" style="gap:.4rem"><span class="tag">${esc(c.category)}</span>
          <span class="tag ${c.status==='published'?'tag-green':'tag-amber'}">${c.status==='published'?'Published':'Awaiting approval'}</span></div>
        <h3 style="font-size:1.02rem">${esc(c.title)}</h3>
        <p class="small muted mb0" style="flex:1">${esc(c.summary)}</p>
        <div class="tiny muted">${c.modules.length} modules · ${c.hours} hours · ${e.length} enrolled · ${e.filter(x=>x.completed).length} completed</div>
        <div class="row" style="gap:.4rem">
          <a class="btn btn-sm" href="#/course/${c.id}">Open</a>
          <button class="btn btn-ghost btn-sm" data-act="edit-course" data-id="${c.id}">Edit</button>
          <button class="btn btn-danger btn-sm" data-act="del-course" data-id="${c.id}">Delete</button></div>
      </article>`;}).join('')}</div>`
    : `<div class="empty">You have not created a course yet.</div>`}`;
}

function viewTrainerQuizzes(){
  const u = me(), ids = trainerCourses(u.id).map(c=>c.id);
  const qz = DB.quizzes.filter(q=>ids.includes(q.courseId) || q.createdBy===u.id);
  return `<div class="page-head row-between"><div><h1>Questionnaires</h1>
      <p>Subject-wise multiple-choice assessments with a deadline and pass mark.</p></div>
      <button class="btn" data-act="new-quiz">Create a questionnaire</button></div>
    ${qz.length ? `<div class="stack">${qz.map(q=>{
      const c = course(q.courseId);
      const atts = DB.attempts.filter(a=>a.quizId===q.id);
      const avg = atts.length ? Math.round(atts.reduce((s,a)=>s+a.percent,0)/atts.length) : 0;
      return `<div class="panel"><div class="panel-head">
          <div><h3>${esc(q.title)}</h3><span class="small muted">${esc(c?c.title:'Unassigned')} · ${q.questions.length} questions · pass ${q.pass}% · due ${fmtDate(q.deadline)}</span></div>
          <div class="row" style="gap:.4rem">
            <button class="btn btn-ghost btn-sm" data-act="add-question" data-id="${q.id}">Add question</button>
            <button class="btn btn-danger btn-sm" data-act="del-quiz" data-id="${q.id}">Delete</button></div></div>
        <div class="panel-body">
          <div class="row" style="gap:1.4rem; margin-bottom:.9rem">
            <div><div class="tiny muted">Attempts</div><b>${atts.length}</b></div>
            <div><div class="tiny muted">Average score</div><b>${avg}%</b></div>
            <div><div class="tiny muted">Passed</div><b>${atts.filter(a=>a.passed).length}</b></div></div>
          <details><summary style="cursor:pointer; font-weight:600; font-size:.9rem">Show questions</summary>
            <ol style="margin:.7rem 0 0; padding-left:1.2rem" class="small">
              ${q.questions.map(item=>`<li style="margin-bottom:.4rem">${esc(item.q)}
                <div class="tiny muted">Correct answer: ${String.fromCharCode(65+item.a)}. ${esc(item.o[item.a])}</div></li>`).join('')}
            </ol></details>
        </div></div>`;}).join('')}</div>`
    : `<div class="empty">No questionnaires yet. Create one and attach it to a course.</div>`}`;
}

function viewTrainerLibrary(){
  const u = me();
  const mine = DB.resources.filter(r=>r.by===u.id);
  return `<div class="page-head row-between"><div><h1>Trainer library</h1>
      <p>Recorded lectures, presentations and study material you have uploaded. Enrolled learners can open these.</p></div>
      <button class="btn" data-act="upload-resource">Upload material</button></div>
    <div class="panel"><div class="panel-body">
      ${mine.length ? mine.map(r=>`<div class="row-between" style="padding:.65rem 0; border-bottom:1px solid var(--line-soft); gap:.8rem">
          <div style="min-width:0"><b class="small">${esc(r.title)}</b>
            <div class="tiny muted">${esc(r.type)} · ${esc(r.category)} · ${esc(r.size)} · ${r.courseId?esc(course(r.courseId).title):'General'} · ${fmtDate(r.date)}</div></div>
          <div class="row" style="gap:.4rem">
            <button class="btn btn-ghost btn-sm" data-act="open-resource" data-id="${r.id}">Preview</button>
            <button class="btn btn-danger btn-sm" data-act="del-resource" data-id="${r.id}">Remove</button></div>
        </div>`).join('')
      : `<p class="small muted mb0">Nothing uploaded yet. Material you add appears on the course page and in the resource library.</p>`}
    </div></div>`;
}

function viewTrainerLearners(){
  const u = me(), ids = trainerCourses(u.id).map(c=>c.id);
  const enr = DB.enrollments.filter(e=>ids.includes(e.courseId));
  return `<div class="page-head"><h1>Learner performance</h1>
      <p>Participation and assessment results across your courses.</p></div>
    <div class="panel"><div class="panel-head"><h3>Enrolled learners</h3>
      <span class="small muted">${enr.length} enrolment${enr.length===1?'':'s'}</span></div>
      <div class="panel-body">
        ${enr.length ? `<div class="table-scroll"><table><thead><tr>
          <th>Learner</th><th>Department</th><th>Course</th><th>Progress</th><th>Assessment</th><th>Certificate</th></tr></thead><tbody>
          ${enr.map(e=>{
            const l = user(e.userId), c = course(e.courseId), q = quizFor(c.id);
            const a = q ? bestAttempt(l.id, q.id) : null, cert = certFor(l.id, c.id);
            return `<tr>
              <td><div class="row" style="gap:.5rem"><span class="avatar" style="width:28px;height:28px;font-size:.7rem">${initials(l.name)}</span>${esc(l.name)}</div></td>
              <td class="muted">${esc(l.dept||'—')}</td>
              <td class="muted">${esc(c.title)}</td>
              <td><div class="bar" style="min-width:70px"><i style="width:${progressOf(e)}%"></i></div><span class="tiny muted">${progressOf(e)}%</span></td>
              <td>${a?`<span class="tag ${a.passed?'tag-green':'tag-red'}">${a.percent}%</span>`:'<span class="tiny muted">Not attempted</span>'}</td>
              <td>${cert?`<span class="tag tag-green">Issued</span>`:'<span class="tiny muted">—</span>'}</td></tr>`;}).join('')}
        </tbody></table></div>` : `<p class="small muted mb0">No learners are enrolled in your courses yet.</p>`}
      </div></div>`;
}

/* --------------------------------------------------------- 7) ADMIN -- */
const ADMIN_NAV = route => sidebar([
  {label:'Administration'},
  {href:'#/admin', text:'Dashboard', icon:'▦'},
  {href:'#/admin-users', text:'Users & approvals', icon:'◉'},
  {href:'#/admin-courses', text:'Courses', icon:'▤'},
  {href:'#/admin-programs', text:'Training programs', icon:'▧'},
  {href:'#/admin-resources', text:'Resources', icon:'▥'},
  {href:'#/admin-certificates', text:'Certificates', icon:'★'},
  {href:'#/admin-announcements', text:'Announcements', icon:'◈'},
  {href:'#/admin-competency', text:'Competency mapping', icon:'▲'},
  {href:'#/admin-reports', text:'Reports', icon:'▣'},
  {href:'#/admin-access', text:'Access control', icon:'⛨'},
  {label:'Portal'},
  {href:'#/courses', text:'Course catalogue', icon:'▣'},
  {href:'#/profile', text:'My profile', icon:'◉'}
], route);

function adminStats(){
  const learners = DB.users.filter(u=>u.role==='trainee');
  const active = new Set(DB.enrollments.map(e=>e.userId)).size;
  return {
    users: DB.users.length,
    courses: DB.courses.filter(c=>c.status==='published').length,
    pendingUsers: DB.users.filter(u=>u.status==='pending').length,
    pendingCourses: DB.courses.filter(c=>c.status==='pending').length,
    learners: learners.length,
    active,
    completed: DB.enrollments.filter(e=>e.completed).length,
    certs: DB.certificates.length,
    attempts: DB.attempts.length
  };
}

function viewAdminDash(){
  const s = adminStats();
  const monthly = [['Jan',18],['Feb',26],['Mar',31],['Apr',24],['May',35],['Jun',29],['Jul',41],['Aug',38]]
    .map(([label,value])=>({label,value}));
  const byCourse = DB.courses.filter(c=>c.status==='published').map(c=>{
    const e = DB.enrollments.filter(x=>x.courseId===c.id);
    return { label:c.title, value: e.length ? Math.round(e.filter(x=>x.completed).length/e.length*100) : 0, display: (e.length ? Math.round(e.filter(x=>x.completed).length/e.length*100) : 0)+'%' };
  });
  const partic = DB.programs.map(p=>({label:p.title.split(' ')[0], value:p.registered.length}));
  const perf = [['0–40',1],['41–60',2],['61–80',4],['81–100',6]].map(([label,value])=>({label,value}));

  return `<div class="page-head"><h1>Administrator dashboard</h1>
      <p>Training activity across the organisation.${s.pendingUsers||s.pendingCourses?` <b style="color:var(--amber)">${s.pendingUsers} user${s.pendingUsers===1?'':'s'} and ${s.pendingCourses} course${s.pendingCourses===1?'':'s'} awaiting approval.</b>`:''}</p></div>
    <div class="grid g4" style="margin-bottom:1.2rem">
      ${[[s.users,'Total users'],[s.courses,'Total courses'],[s.active,'Active learners'],
         [s.completed,'Completed trainings'],[s.certs,'Certificates issued']]
        .map(([n,l])=>`<div class="kpi"><b>${n}</b><span>${l}</span></div>`).join('')}
    </div>
    ${(s.pendingUsers||s.pendingCourses) ? `<div class="card" style="border-color:var(--amber); background:var(--amber-soft); margin-bottom:1.2rem">
      <div class="row-between"><div><b>Approvals waiting on you</b>
        <div class="small" style="color:var(--amber)">${s.pendingUsers} account${s.pendingUsers===1?'':'s'} and ${s.pendingCourses} course${s.pendingCourses===1?'':'s'} need a decision.</div></div>
        <div class="row" style="gap:.4rem"><a class="btn btn-sm" href="#/admin-users">Review users</a>
          <a class="btn btn-ghost btn-sm" href="#/admin-courses">Review courses</a></div></div></div>`:''}

    <div class="grid g2" style="margin-bottom:1.2rem">
      <div class="panel"><div class="panel-head"><h3>Monthly enrolments</h3><span class="small muted">This financial year</span></div>
        <div class="panel-body">${barChart(monthly,{alt:'Monthly enrolments'})}</div></div>
      <div class="panel"><div class="panel-head"><h3>Course completion rate</h3></div>
        <div class="panel-body">${rowChart(byCourse,{green:true})}</div></div>
      <div class="panel"><div class="panel-head"><h3>Training participation</h3><span class="small muted">Registrations per programme</span></div>
        <div class="panel-body">${barChart(partic,{color:'var(--green)',alt:'Programme participation'})}</div></div>
      <div class="panel"><div class="panel-head"><h3>Assessment performance</h3><span class="small muted">Attempts by score band</span></div>
        <div class="panel-body">${barChart(perf,{alt:'Assessment score distribution'})}</div></div>
    </div>

    <div class="panel"><div class="panel-head"><h3>Latest activity</h3></div>
      <div class="panel-body table-scroll">
        <table><thead><tr><th>Learner</th><th>Course</th><th>Progress</th><th>Enrolled</th><th>Status</th></tr></thead>
        <tbody>${DB.enrollments.slice(-7).reverse().map(e=>{
          const l = user(e.userId), c = course(e.courseId);
          return `<tr><td>${esc(l.name)}</td><td class="muted">${esc(c?c.title:'—')}</td>
            <td>${progressOf(e)}%</td><td class="muted">${fmtDate(e.enrolled)}</td>
            <td><span class="tag ${e.completed?'tag-green':'tag-plain'}">${e.completed?'Completed':'In progress'}</span></td></tr>`;}).join('')}
        </tbody></table></div></div>`;
}

function viewAdminUsers(){
  const pending = DB.users.filter(u=>u.status==='pending');
  const active = DB.users.filter(u=>u.status!=='pending');
  const roleTag = r => r==='admin'?'<span class="tag">Administrator</span>' : r==='trainer'?'<span class="tag tag-green">Trainer</span>':'<span class="tag tag-plain">Trainee</span>';
  return `<div class="page-head row-between"><div><h1>Users and approvals</h1>
      <p>Approve new accounts, change roles and manage access.</p></div>
      <button class="btn" data-act="new-user">Add a user</button></div>
    <div class="panel" style="margin-bottom:1.2rem"><div class="panel-head"><h3>Awaiting approval</h3>
      <span class="tag ${pending.length?'tag-amber':'tag-plain'}">${pending.length} pending</span></div>
      <div class="panel-body">
        ${pending.length ? `<div class="table-scroll"><table><thead><tr><th>Name</th><th>Email</th><th>Requested role</th><th>Department</th><th>Decision</th></tr></thead>
          <tbody>${pending.map(u=>`<tr>
            <td><b>${esc(u.name)}</b><div class="tiny muted">${esc(u.title||'')}</div></td>
            <td class="muted">${esc(u.email)}</td><td>${roleTag(u.role)}</td><td class="muted">${esc(u.dept||'—')}</td>
            <td><div class="row" style="gap:.35rem">
              <button class="btn btn-sm" data-act="approve-user" data-id="${u.id}">Approve</button>
              <button class="btn btn-danger btn-sm" data-act="reject-user" data-id="${u.id}">Reject</button></div></td></tr>`).join('')}
          </tbody></table></div>` : `<p class="small muted mb0">No accounts are waiting. New registrations appear here.</p>`}
      </div></div>
    <div class="panel"><div class="panel-head"><h3>All users</h3><span class="small muted">${active.length} active</span></div>
      <div class="panel-body table-scroll">
        <table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Joined</th><th>Actions</th></tr></thead>
        <tbody>${active.map(u=>`<tr>
          <td><div class="row" style="gap:.5rem"><span class="avatar" style="width:28px;height:28px;font-size:.7rem">${initials(u.name)}</span>
            <div><b>${esc(u.name)}</b><div class="tiny muted">${esc(u.title||'')}</div></div></div></td>
          <td class="muted">${esc(u.email)}</td>
          <td><select data-act="set-role" data-id="${u.id}" style="padding:.25rem .4rem; font-size:.82rem; width:auto">
            ${['trainee','trainer','admin'].map(r=>`<option value="${r}" ${u.role===r?'selected':''}>${r==='trainee'?'Trainee':r==='trainer'?'Trainer':'Administrator'}</option>`).join('')}</select></td>
          <td class="muted">${esc(u.dept||'—')}</td><td class="muted">${fmtDate(u.joined)}</td>
          <td><button class="btn btn-danger btn-sm" data-act="del-user" data-id="${u.id}">Remove</button></td></tr>`).join('')}
        </tbody></table></div></div>`;
}

function viewAdminAccess(){
  const notListed = DB.users.filter(u => u.status==='active' && !DB.allowlist.includes(u.email.toLowerCase()));
  return `<div class="page-head"><h1>Access control</h1>
      <p>Every login also requires a one-time code sent to the signed-in address (see the login page). This list is a second gate: while restriction is on, only these addresses may complete a login at all.</p></div>
    <div class="card" style="margin-bottom:1.2rem">
      <div class="row-between">
        <div><b>Restrict access to the list below</b>
          <div class="small muted">When off, any active, approved account may sign in (after its code).</div></div>
        <button class="btn ${DB.restrictAccess?'':'btn-ghost'}" data-act="toggle-restrict">${DB.restrictAccess ? 'Restriction is ON' : 'Restriction is OFF'}</button>
      </div></div>
    <div class="panel" style="margin-bottom:1.2rem"><div class="panel-head"><h3>Authorised addresses</h3>
      <span class="tag ${DB.allowlist.length?'tag-green':'tag-plain'}">${DB.allowlist.length} listed</span></div>
      <div class="panel-body">
        <div class="row" style="margin-bottom:.9rem">
          <input type="email" name="new-allow" placeholder="name@capacityconnect.org" style="flex:1; min-width:200px">
          <button class="btn btn-sm" data-act="allow-add">Add</button></div>
        ${DB.allowlist.length ? `<div class="stack" style="gap:.4rem">
          ${DB.allowlist.map(e=>`<div class="row-between card-flat" style="padding:.5rem .8rem; border:1px solid var(--line); border-radius:9px">
            <span class="small">${esc(e)}</span>
            <button class="btn btn-danger btn-sm" data-act="allow-remove" data-email="${esc(e)}">Remove</button></div>`).join('')}
          </div>` : `<p class="small muted mb0">No addresses listed — with restriction on, nobody can sign in.</p>`}
      </div></div>
    ${notListed.length ? `<div class="panel"><div class="panel-head"><h3>Active accounts not yet listed</h3></div>
      <div class="panel-body">
        <div class="stack" style="gap:.4rem">
          ${notListed.map(u=>`<div class="row-between card-flat" style="padding:.5rem .8rem; border:1px solid var(--line); border-radius:9px">
            <div><b class="small">${esc(u.name)}</b><div class="tiny muted">${esc(u.email)}</div></div>
            <button class="btn btn-sm" data-act="allow-add-user" data-email="${esc(u.email)}">Add to list</button></div>`).join('')}
        </div></div></div>` : ''}`;
}

function viewAdminCourses(){
  return `<div class="page-head row-between"><div><h1>Courses</h1>
      <p>Approve submitted courses and manage the catalogue.</p></div>
      <button class="btn" data-act="new-course">Add a course</button></div>
    <div class="panel"><div class="panel-body table-scroll">
      <table><thead><tr><th>Course</th><th>Trainer</th><th>Category</th><th>Enrolled</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>${DB.courses.map(c=>{
        const e = DB.enrollments.filter(x=>x.courseId===c.id).length;
        return `<tr>
          <td><a href="#/course/${c.id}"><b>${esc(c.title)}</b></a><div class="tiny muted">${c.modules.length} modules · ${c.hours} h</div></td>
          <td class="muted">${esc(user(c.trainerId).name)}</td><td class="muted">${esc(c.category)}</td><td>${e}</td>
          <td><span class="tag ${c.status==='published'?'tag-green':'tag-amber'}">${c.status==='published'?'Published':'Pending'}</span></td>
          <td><div class="row" style="gap:.35rem">
            ${c.status==='pending'?`<button class="btn btn-sm" data-act="approve-course" data-id="${c.id}">Approve</button>`
              :`<button class="btn btn-ghost btn-sm" data-act="unpublish-course" data-id="${c.id}">Unpublish</button>`}
            <button class="btn btn-ghost btn-sm" data-act="edit-course" data-id="${c.id}">Edit</button>
            <button class="btn btn-danger btn-sm" data-act="del-course" data-id="${c.id}">Delete</button></div></td></tr>`;}).join('')}
      </tbody></table></div></div>`;
}

function viewAdminPrograms(){
  return `<div class="page-head row-between"><div><h1>Training programs</h1>
      <p>Schedule workshops and cohort programmes, and track registrations.</p></div>
      <button class="btn" data-act="new-program">Add a program</button></div>
    <div class="panel"><div class="panel-body table-scroll">
      <table><thead><tr><th>Program</th><th>Date</th><th>Trainer</th><th>Registered</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>${DB.programs.map(p=>`<tr>
        <td><b>${esc(p.title)}</b><div class="tiny muted">${esc(p.audience)} · ${esc(p.duration)}</div></td>
        <td class="muted">${fmtDate(p.date)}</td><td class="muted">${esc(user(p.trainerId).name)}</td>
        <td>${p.registered.length} of ${p.seats}</td>
        <td><span class="tag ${p.done?'tag-plain':'tag-green'}">${p.done?'Completed':'Upcoming'}</span></td>
        <td><div class="row" style="gap:.35rem">
          ${p.done?'':`<button class="btn btn-ghost btn-sm" data-act="close-program" data-id="${p.id}">Mark completed</button>`}
          <button class="btn btn-danger btn-sm" data-act="del-program" data-id="${p.id}">Delete</button></div></td></tr>`).join('')}
      </tbody></table></div></div>`;
}

function viewAdminResources(){
  return `<div class="page-head row-between"><div><h1>Resources</h1>
      <p>Everything in the shared library, including trainer uploads.</p></div>
      <button class="btn" data-act="upload-resource">Add a resource</button></div>
    <div class="panel"><div class="panel-body table-scroll">
      <table><thead><tr><th>Title</th><th>Type</th><th>Category</th><th>Course</th><th>Uploaded by</th><th>Actions</th></tr></thead>
      <tbody>${DB.resources.map(r=>`<tr>
        <td><b>${esc(r.title)}</b><div class="tiny muted">${esc(r.size)} · ${fmtDate(r.date)}</div></td>
        <td class="muted">${esc(r.type)}</td><td class="muted">${esc(r.category)}</td>
        <td class="muted">${r.courseId?esc(course(r.courseId).title):'General'}</td>
        <td class="muted">${esc(user(r.by).name)}</td>
        <td><button class="btn btn-danger btn-sm" data-act="del-resource" data-id="${r.id}">Remove</button></td></tr>`).join('')}
      </tbody></table></div></div>`;
}

function viewAdminCertificates(){
  return `<div class="page-head"><h1>Certificates</h1>
      <p>Every certificate issued through the portal, with its verification ID.</p></div>
    <div class="panel"><div class="panel-body table-scroll">
      <table><thead><tr><th>Certificate ID</th><th>Learner</th><th>Course</th><th>Issued</th><th>Actions</th></tr></thead>
      <tbody>${DB.certificates.length?DB.certificates.map(c=>`<tr>
        <td><b>${esc(c.id)}</b></td><td>${esc(user(c.userId).name)}</td>
        <td class="muted">${esc(course(c.courseId)?course(c.courseId).title:'—')}</td><td class="muted">${fmtDate(c.date)}</td>
        <td><div class="row" style="gap:.35rem">
          <button class="btn btn-ghost btn-sm" data-act="view-cert" data-id="${c.id}">View</button>
          <button class="btn btn-danger btn-sm" data-act="revoke-cert" data-id="${c.id}">Revoke</button></div></td></tr>`).join('')
        :'<tr><td colspan="5" class="muted">No certificates issued yet.</td></tr>'}
      </tbody></table></div></div>`;
}

function viewAdminAnnouncements(){
  return `<div class="page-head row-between"><div><h1>Announcements</h1>
      <p>Notices, achievements and new content published to the home page.</p></div>
      <button class="btn" data-act="new-announcement">Publish an announcement</button></div>
    <div class="stack">${DB.announcements.map(n=>`<div class="card">
      <div class="row-between" style="margin-bottom:.4rem">
        <div class="row" style="gap:.5rem">
          <span class="tag ${n.type==='achievement'?'tag-green':n.type==='content'?'tag-amber':''}">${n.type==='achievement'?'Achievement':n.type==='content'?'New content':'Notice'}</span>
          <span class="tiny muted">${fmtDate(n.at)} · ${esc(user(n.by).name)}</span></div>
        <button class="btn btn-danger btn-sm" data-act="del-announcement" data-id="${n.id}">Remove</button></div>
      <h3 style="font-size:1.02rem">${esc(n.title)}</h3>
      <p class="small muted mb0">${esc(n.body)}</p></div>`).join('')}</div>`;
}

function viewAdminCompetency(){
  const skills = [...new Set([...allSkills(), ...DB.users.flatMap(u=>u.expertise||[])])].sort();
  return `<div class="page-head"><h1>Competency mapping</h1>
      <p>Which trainers can teach each subject, and how many learners are working on it.</p></div>
    <div class="panel"><div class="panel-body table-scroll">
      <table><thead><tr><th>Skill</th><th>Qualified trainers</th><th>Courses</th><th>Learners working on it</th><th>Coverage</th></tr></thead>
      <tbody>${skills.map(s=>{
        const trainers = DB.users.filter(u=>u.role==='trainer' && u.status==='active' && (u.expertise||[]).includes(s));
        const courses = DB.courses.filter(c=>(c.skills||[]).includes(s));
        const learners = DB.users.filter(u=>u.role==='trainee' && (u.skills||[]).some(k=>k.name===s)).length;
        const cov = trainers.length ? (courses.length ? 'Covered' : 'Trainer, no course') : 'No trainer mapped';
        const tone = trainers.length && courses.length ? 'tag-green' : trainers.length ? 'tag-amber' : 'tag-red';
        return `<tr><td><b>${esc(s)}</b></td>
          <td class="muted">${trainers.length?trainers.map(t=>esc(t.name)).join(', '):'—'}</td>
          <td class="muted">${courses.length?courses.map(c=>esc(c.title)).join(', '):'—'}</td>
          <td>${learners}</td><td><span class="tag ${tone}">${cov}</span></td></tr>`;}).join('')}
      </tbody></table></div></div>
    <div class="card" style="margin-top:1.2rem"><h3 style="font-size:1rem">How to read this</h3>
      <p class="small muted mb0">A skill with no qualified trainer is a gap: either nominate a trainer for certification, or engage an external trainer. A skill with a trainer but no course needs a course built before learners can progress in it.</p></div>`;
}

function viewAdminReports(){
  const s = adminStats();
  const deptRows = [...new Set(DB.users.filter(u=>u.role==='trainee').map(u=>u.dept||'Unassigned'))].map(d=>{
    const us = DB.users.filter(u=>u.role==='trainee' && (u.dept||'Unassigned')===d);
    const ids = us.map(u=>u.id);
    const enr = DB.enrollments.filter(e=>ids.includes(e.userId));
    const rate = enr.length ? Math.round(enr.filter(e=>e.completed).length/enr.length*100) : 0;
    return { label:d, value:rate, display:rate+'%', staff:us.length, enr:enr.length };
  });
  return `<div class="page-head row-between"><div><h1>Reports</h1>
      <p>Summary figures for review meetings and audit.</p></div>
      <button class="btn btn-ghost" data-act="print-page">Print this report</button></div>
    <div class="grid g4" style="margin-bottom:1.2rem">
      ${[[s.learners,'Registered learners'],[DB.enrollments.length,'Total enrolments'],
         [s.attempts,'Assessment attempts'],[s.certs,'Certificates issued']]
        .map(([n,l])=>`<div class="kpi"><b>${n}</b><span>${l}</span></div>`).join('')}
    </div>
    <div class="grid g2">
      <div class="panel"><div class="panel-head"><h3>Completion rate by department</h3></div>
        <div class="panel-body">${deptRows.length?rowChart(deptRows,{green:true}):'<p class="small muted mb0">No data.</p>'}</div></div>
      <div class="panel"><div class="panel-head"><h3>Department detail</h3></div>
        <div class="panel-body table-scroll"><table><thead><tr><th>Department</th><th>Staff</th><th>Enrolments</th><th>Completion</th></tr></thead>
          <tbody>${deptRows.map(d=>`<tr><td>${esc(d.label)}</td><td>${d.staff}</td><td>${d.enr}</td><td>${d.display}</td></tr>`).join('')}
          </tbody></table></div></div>
      <div class="panel"><div class="panel-head"><h3>Course-wise enrolment</h3></div>
        <div class="panel-body">${barChart(DB.courses.filter(c=>c.status==='published').map(c=>({
          label:c.title.split(' ')[0], value:DB.enrollments.filter(e=>e.courseId===c.id).length })),{alt:'Enrolments per course'})}</div></div>
      <div class="panel"><div class="panel-head"><h3>Assessment pass rate</h3></div>
        <div class="panel-body">${donut(DB.attempts.length?Math.round(DB.attempts.filter(a=>a.passed).length/DB.attempts.length*100):0,'of attempts met the pass mark')}</div></div>
    </div>`;
}

/* ----------------------------------------------- MODALS & CERTIFICATES */
function openModal(title, body, opts={}){
  $('#modal-root').innerHTML = `<div class="modal-bg" data-act="close-modal-bg">
    <div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}" style="${opts.wide?'width:min(920px,100%)':''}">
      <div class="modal-head no-print"><h3>${esc(title)}</h3>
        <button class="x" data-act="close-modal" aria-label="Close">×</button></div>
      <div class="modal-body">${body}</div>
    </div></div>`;
  document.body.style.overflow = 'hidden';
  const first = $('#modal-root input, #modal-root select, #modal-root textarea');
  if(first) first.focus();
}
function closeModal(){ $('#modal-root').innerHTML=''; document.body.style.overflow=''; }

function certificateHTML(cert){
  const u = user(cert.userId), c = course(cert.courseId);
  const t = c ? user(c.trainerId) : {name:'Training Division'};
  return `<div id="printable" style="background:#fff; color:#0E2433; border:2px solid #0B5D8F; border-radius:10px; padding:clamp(1.2rem,4vw,2.4rem); position:relative">
    <div style="border:1px solid #BBD4E5; border-radius:6px; padding:clamp(1rem,3vw,2rem); text-align:center">
      <div style="display:flex; align-items:center; justify-content:center; gap:.6rem; margin-bottom:.4rem">
        <span style="width:34px;height:34px;border-radius:9px;background:linear-gradient(150deg,#0B5D8F,#1B7F63);color:#fff;display:grid;place-items:center;font-weight:700;font-size:.85rem">CC</span>
        <b style="font-family:var(--serif); font-size:1.15rem; letter-spacing:-.01em">CAPACITY CONNECT</b>
      </div>
      <div style="font-size:.74rem; letter-spacing:.16em; color:#6A8195; margin-bottom:1.4rem">DIGITAL CAPACITY BUILDING AND LEARNING PORTAL</div>
      <div style="font-family:var(--serif); font-size:clamp(1.4rem,4vw,2rem); font-weight:700; margin-bottom:.2rem">Certificate of Completion</div>
      <p style="color:#3C5466; font-size:.9rem; margin:.4rem 0 1.2rem">This is to certify that</p>
      <div style="font-family:var(--serif); font-size:clamp(1.5rem,4.5vw,2.2rem); font-weight:700; color:#0B5D8F; border-bottom:1px solid #BBD4E5; display:inline-block; padding:0 1.2rem .3rem">${esc(u.name)}</div>
      <p style="color:#3C5466; font-size:.92rem; margin:1.1rem auto 0; max-width:46ch">has successfully completed all modules of the course
        <b>${esc(c?c.title:'—')}</b> and passed the prescribed assessment, on ${fmtDate(cert.date)}.</p>
      <div style="display:flex; justify-content:space-between; align-items:flex-end; gap:1rem; margin-top:2.2rem; flex-wrap:wrap; text-align:left">
        <div style="min-width:150px">
          <div style="border-top:1px solid #0E2433; padding-top:.3rem; font-size:.82rem"><b>${esc(t.name)}</b></div>
          <div style="font-size:.72rem; color:#6A8195">Course trainer</div></div>
        <div style="color:#0B5D8F; text-align:center">${qrBlock(cert.id, 78)}
          <div style="font-size:.66rem; color:#6A8195; margin-top:.25rem">Scan to verify</div></div>
        <div style="min-width:150px">
          <div style="border-top:1px solid #0E2433; padding-top:.3rem; font-size:.82rem"><b>Rohit Verma</b></div>
          <div style="font-size:.72rem; color:#6A8195">Capacity Building Director</div></div>
      </div>
      <div style="margin-top:1.4rem; font-size:.72rem; color:#6A8195">
        Certificate ID <b style="color:#0E2433">${esc(cert.id)}</b> · Verify at capacityconnect.org/verify</div>
    </div></div>
  <div class="row no-print" style="justify-content:flex-end; margin-top:1rem">
    <button class="btn btn-ghost" data-act="close-modal">Close</button>
    <button class="btn" data-act="print-now">Download or print</button></div>`;
}
function showCertificate(certId){
  const cert = DB.certificates.find(c=>c.id===certId);
  if(!cert) return toast('Certificate not found');
  openModal('Certificate', certificateHTML(cert), {wide:true});
}

/* ---------------------------------------------------- FORMS IN MODALS -- */
function courseForm(existing){
  const u = me();
  const trainers = DB.users.filter(x=>x.role==='trainer' && x.status==='active');
  const c = existing || {};
  return `<form data-form="course" data-id="${c.id||''}">
    <div class="grid g2" style="gap:0 1rem">
      <label class="field"><span>Course title</span><input name="title" value="${esc(c.title||'')}" required></label>
      <label class="field"><span>Category</span>
        <select name="category">${['Digital','Leadership','Soft Skills','Management','Data','Compliance']
          .map(x=>`<option ${c.category===x?'selected':''}>${x}</option>`).join('')}</select></label>
      <label class="field"><span>Difficulty</span>
        <select name="level">${['Beginner','Intermediate','Advanced'].map(x=>`<option ${c.level===x?'selected':''}>${x}</option>`).join('')}</select></label>
      <label class="field"><span>Duration in hours</span><input type="number" name="hours" min="1" value="${c.hours||6}" required></label>
    </div>
    ${u.role==='admin'?`<label class="field"><span>Trainer</span><select name="trainerId">
      ${trainers.map(t=>`<option value="${t.id}" ${c.trainerId===t.id?'selected':''}>${esc(t.name)}</option>`).join('')}</select></label>`:''}
    <label class="field"><span>Short summary</span><input name="summary" value="${esc(c.summary||'')}" required
      placeholder="One line shown on the course card"></label>
    <label class="field"><span>Full description</span><textarea name="description" required>${esc(c.description||'')}</textarea></label>
    <label class="field"><span>Learning objectives</span><textarea name="objectives" placeholder="One per line">${esc((c.objectives||[]).join('\n'))}</textarea></label>
    <label class="field"><span>Skills developed</span><input name="skills" value="${esc((c.skills||[]).join(', '))}" placeholder="Digital Skills, Communication">
      <span class="hint">Comma separated. Used for competency mapping and recommendations.</span></label>
    <label class="field"><span>Modules</span><textarea name="modules" placeholder="One per line: Title | minutes | short summary">${esc((c.modules||[]).map(m=>`${m.title} | ${m.minutes} | ${m.summary}`).join('\n'))}</textarea>
      <span class="hint">Format: Title | minutes | summary</span></label>
    <div class="row" style="justify-content:flex-end">
      <button type="button" class="btn btn-ghost" data-act="close-modal">Cancel</button>
      <button class="btn" type="submit">${existing?'Save changes':'Create course'}</button></div>
  </form>`;
}

function quizForm(){
  const u = me();
  const list = u.role==='admin' ? DB.courses : trainerCourses(u.id);
  return `<form data-form="quiz">
    <label class="field"><span>Questionnaire title</span><input name="title" required placeholder="Module 2 — knowledge check"></label>
    <div class="grid g2" style="gap:0 1rem">
      <label class="field"><span>Course</span><select name="courseId" required>
        ${list.map(c=>`<option value="${c.id}">${esc(c.title)}</option>`).join('')}</select></label>
      <label class="field"><span>Pass mark (%)</span><input type="number" name="pass" min="1" max="100" value="60"></label>
    </div>
    <label class="field"><span>Deadline</span><input type="date" name="deadline" value="${daysFromNow(14)}" required></label>
    <fieldset><legend>First question</legend>
      <label class="field"><span>Question</span><input name="q" required placeholder="What is the purpose of capacity building?"></label>
      <div class="grid g2" style="gap:0 1rem">
        <label class="field"><span>Option A</span><input name="o0" required></label>
        <label class="field"><span>Option B</span><input name="o1" required></label>
        <label class="field"><span>Option C</span><input name="o2" required></label>
        <label class="field"><span>Option D</span><input name="o3" required></label>
      </div>
      <label class="field"><span>Correct answer</span><select name="a">
        <option value="0">A</option><option value="1">B</option><option value="2">C</option><option value="3">D</option></select></label>
    </fieldset>
    <p class="small muted">You can add more questions from the questionnaire list after it is created.</p>
    <div class="row" style="justify-content:flex-end">
      <button type="button" class="btn btn-ghost" data-act="close-modal">Cancel</button>
      <button class="btn" type="submit">Create questionnaire</button></div>
  </form>`;
}

function questionForm(quizId){
  return `<form data-form="question" data-id="${quizId}">
    <label class="field"><span>Question</span><input name="q" required></label>
    <div class="grid g2" style="gap:0 1rem">
      <label class="field"><span>Option A</span><input name="o0" required></label>
      <label class="field"><span>Option B</span><input name="o1" required></label>
      <label class="field"><span>Option C</span><input name="o2" required></label>
      <label class="field"><span>Option D</span><input name="o3" required></label></div>
    <label class="field"><span>Correct answer</span><select name="a">
      <option value="0">A</option><option value="1">B</option><option value="2">C</option><option value="3">D</option></select></label>
    <div class="row" style="justify-content:flex-end">
      <button type="button" class="btn btn-ghost" data-act="close-modal">Cancel</button>
      <button class="btn" type="submit">Add question</button></div></form>`;
}

function resourceForm(){
  const u = me();
  const list = u.role==='admin' ? DB.courses : trainerCourses(u.id);
  return `<form data-form="resource">
    <label class="field"><span>Title</span><input name="title" required placeholder="Recorded lecture — delegation"></label>
    <label class="field"><span>Description</span><textarea name="desc" required></textarea></label>
    <div class="grid g2" style="gap:0 1rem">
      <label class="field"><span>Type</span><select name="type">
        ${['PDF','Video','Presentation','Document'].map(x=>`<option>${x}</option>`).join('')}</select></label>
      <label class="field"><span>Category</span><select name="category">
        ${['Recorded lecture','Study material','Presentation','Guidelines','Template'].map(x=>`<option>${x}</option>`).join('')}</select></label>
    </div>
    <label class="field"><span>Attach to course</span><select name="courseId">
      <option value="">General — visible to everyone</option>
      ${list.map(c=>`<option value="${c.id}">${esc(c.title)}</option>`).join('')}</select></label>
    <label class="field"><span>File</span><input type="file" name="file" style="padding:.45rem">
      <span class="hint">This demo records the file name and size only; a live deployment would upload it to storage.</span></label>
    <div class="row" style="justify-content:flex-end">
      <button type="button" class="btn btn-ghost" data-act="close-modal">Cancel</button>
      <button class="btn" type="submit">Upload</button></div></form>`;
}

function programForm(){
  const trainers = DB.users.filter(x=>x.role==='trainer' && x.status==='active');
  return `<form data-form="program">
    <label class="field"><span>Program title</span><input name="title" required></label>
    <label class="field"><span>Description</span><textarea name="description" required></textarea></label>
    <div class="grid g2" style="gap:0 1rem">
      <label class="field"><span>Start date</span><input type="date" name="date" value="${daysFromNow(20)}" required></label>
      <label class="field"><span>Duration</span><input name="duration" placeholder="2 days, 9:30 – 16:30" required></label>
      <label class="field"><span>Trainer</span><select name="trainerId">
        ${trainers.map(t=>`<option value="${t.id}">${esc(t.name)}</option>`).join('')}</select></label>
      <label class="field"><span>Seats</span><input type="number" name="seats" min="1" value="30" required></label>
    </div>
    <label class="field"><span>Target audience</span><input name="audience" placeholder="Section officers and above" required></label>
    <label class="field"><span>Mode and venue</span><input name="mode" placeholder="In person — Training Hall A" required></label>
    <div class="row" style="justify-content:flex-end">
      <button type="button" class="btn btn-ghost" data-act="close-modal">Cancel</button>
      <button class="btn" type="submit">Add program</button></div></form>`;
}

function announcementForm(){
  return `<form data-form="announcement">
    <label class="field"><span>Type</span><select name="type">
      <option value="notice">Notice</option><option value="achievement">Achievement</option>
      <option value="content">New learning content</option></select></label>
    <label class="field"><span>Title</span><input name="title" required></label>
    <label class="field"><span>Message</span><textarea name="body" required></textarea></label>
    <p class="small muted">Published immediately to the home page and the knowledge sharing section.</p>
    <div class="row" style="justify-content:flex-end">
      <button type="button" class="btn btn-ghost" data-act="close-modal">Cancel</button>
      <button class="btn" type="submit">Publish</button></div></form>`;
}

function userForm(){
  return `<form data-form="newuser">
    <div class="grid g2" style="gap:0 1rem">
      <label class="field"><span>Full name</span><input name="name" required></label>
      <label class="field"><span>Email</span><input type="email" name="email" required></label>
      <label class="field"><span>Password</span><input name="password" value="welcome123" required></label>
      <label class="field"><span>Role</span><select name="role">
        <option value="trainee">Trainee</option><option value="trainer">Trainer</option><option value="admin">Administrator</option></select></label>
      <label class="field"><span>Designation</span><input name="title"></label>
      <label class="field"><span>Department</span><input name="dept"></label>
    </div>
    <div class="row" style="justify-content:flex-end">
      <button type="button" class="btn btn-ghost" data-act="close-modal">Cancel</button>
      <button class="btn" type="submit">Create and approve</button></div></form>`;
}

function profileForm(){
  const u = me(), p = u.profile||{};
  return `<form data-form="profile">
    <div class="grid g2" style="gap:0 1rem">
      <label class="field"><span>Full name</span><input name="name" value="${esc(u.name)}" required></label>
      <label class="field"><span>Designation</span><input name="title" value="${esc(u.title||'')}"></label>
      <label class="field"><span>Department</span><input name="dept" value="${esc(u.dept||'')}"></label>
      <label class="field"><span>Phone</span><input name="phone" value="${esc(p.phone||'')}"></label>
      <label class="field"><span>Location</span><input name="location" value="${esc(p.location||'')}"></label>
    </div>
    <label class="field"><span>Professional summary</span><textarea name="bio">${esc(p.bio||'')}</textarea></label>
    <div class="row" style="justify-content:flex-end">
      <button type="button" class="btn btn-ghost" data-act="close-modal">Cancel</button>
      <button class="btn" type="submit">Save profile</button></div></form>`;
}

function feedbackForm(courseId){
  return `<form data-form="feedback" data-id="${courseId}">
    <label class="field"><span>Rating</span><select name="rating">
      ${[5,4,3,2,1].map(n=>`<option value="${n}">${'★'.repeat(n)} — ${n} of 5</option>`).join('')}</select></label>
    <label class="field"><span>What worked, and what would you change?</span>
      <textarea name="comment" required placeholder="Be specific — the trainer reads every comment."></textarea></label>
    <div class="row" style="justify-content:flex-end">
      <button type="button" class="btn btn-ghost" data-act="close-modal">Cancel</button>
      <button class="btn" type="submit">Submit feedback</button></div></form>`;
}

function simpleForm(kind, fields, submitLabel){
  return `<form data-form="${kind}">
    ${fields.map(f=>`<label class="field"><span>${f.label}</span>
      ${f.type==='select'?`<select name="${f.name}">${f.options.map(o=>`<option value="${o.v!==undefined?o.v:o}">${o.t||o}</option>`).join('')}</select>`
        :`<input name="${f.name}" ${f.required===false?'':'required'} placeholder="${f.ph||''}">`}</label>`).join('')}
    <div class="row" style="justify-content:flex-end">
      <button type="button" class="btn btn-ghost" data-act="close-modal">Cancel</button>
      <button class="btn" type="submit">${submitLabel}</button></div></form>`;
}

/* ------------------------------------------------------ ACTION HANDLERS */
function requireLogin(){ if(!me()){ toast('Log in to continue'); go('#/login'); return false; } return true; }

const ACTIONS = {
  nav(){ const n = $('#mainnav'); n.classList.toggle('open');
         $('[data-act="nav"]').setAttribute('aria-expanded', n.classList.contains('open')); },
  logout(){ if(BACKEND_READY) api('/api/auth/logout', {method:'POST'}).catch(()=>{});
    DB.session = null; save(); go('#/home'); render(); toast('Signed out'); },
  reset(){ if(confirm('Reset all demo data to its original state?')){ resetData(); go('#/home'); render(); toast('Demo data restored'); } },
  'close-modal': closeModal,
  'close-modal-bg'(el, ev){ if(ev.target.classList.contains('modal-bg')) closeModal(); },
  'print-now'(){ window.print(); },
  'print-page'(){ window.print(); },
  'fill-login'(el){ const f = document.querySelector('[data-form="login"]');
    f.email.value = el.dataset.email; f.password.value = el.dataset.pass; f.email.focus(); },

  enrol(el){
    if(!requireLogin()) return;
    const u = me(), id = el.dataset.id;
    if(enrolmentFor(u.id, id)){ toast('You are already enrolled'); return; }
    DB.enrollments.push({ id:uid('e'), userId:u.id, courseId:id, enrolled:today(), done:[], completed:null });
    save(); render(); toast('Enrolled — the modules are now open');
  },
  'register-prog'(el){
    if(!requireLogin()) return;
    const p = byId(DB.programs, el.dataset.id), u = me();
    if(p.registered.includes(u.id)) return toast('Already registered');
    if(p.registered.length >= p.seats) return toast('This programme is full');
    p.registered.push(u.id); save(); render(); toast('Registered — details will be emailed to you');
  },
  'toggle-module'(el){
    const u = me(), e = enrolmentFor(u.id, el.dataset.id), i = el.dataset.i;
    if(!e) return;
    e.done = e.done.includes(i) ? e.done.filter(x=>x!==i) : [...e.done, i];
    const c = course(el.dataset.id);
    if(e.done.length < c.modules.length) e.completed = null;
    save(); render();
  },
  'complete-course'(el){
    const u = me(), id = el.dataset.id, c = course(id), e = enrolmentFor(u.id, id);
    if(!e) return toast('Enrol first');
    if(e.done.length < c.modules.length) return toast(`Finish all ${c.modules.length} modules first`);
    const q = quizFor(id);
    if(q){
      const a = bestAttempt(u.id, q.id);
      if(!a) return toast('Take the assessment before claiming the certificate');
      if(!a.passed) return toast(`Pass mark is ${q.pass}% — your best score is ${a.percent}%`);
    }
    e.completed = today();
    const cert = { id:'CC-'+new Date().getFullYear()+'-'+String(Math.floor(Math.random()*9000)+1000), userId:u.id, courseId:id, date:today() };
    DB.certificates.push(cert);
    /* completing a tagged course raises the learner's level in that skill */
    (c.skills||[]).forEach(s=>{
      const k = (u.skills||[]).find(x=>x.name===s);
      if(k){ k.level = Math.min(5, k.level+1); }
      else { u.skills = u.skills||[]; u.skills.push({name:s, level:1, target:5}); }
    });
    (u.profile.certificates = u.profile.certificates||[]).push({n:c.title, b:'Capacity Connect', y:String(new Date().getFullYear())});
    save(); render(); showCertificate(cert.id); toast('Course complete — certificate issued');
  },
  'view-cert'(el){ showCertificate(el.dataset.id); },
  'print-cert'(el){ showCertificate(el.dataset.id); setTimeout(()=>window.print(), 350); },
  'revoke-cert'(el){ if(!confirm('Revoke this certificate?')) return;
    DB.certificates = DB.certificates.filter(c=>c.id!==el.dataset.id); save(); render(); toast('Certificate revoked'); },
  'open-resource'(el){
    const r = byId(DB.resources, el.dataset.id);
    openModal(r.title, `<div class="stack">
      <div class="row" style="gap:.4rem"><span class="tag">${esc(r.type)}</span><span class="tag tag-plain">${esc(r.category)}</span>
        <span class="tiny muted">${esc(r.size)} · uploaded ${fmtDate(r.date)} by ${esc(user(r.by).name)}</span></div>
      <p class="small" style="color:var(--ink-2)">${esc(r.desc)}</p>
      <div style="aspect-ratio:16/9; background:var(--canvas); border:1px dashed var(--line); border-radius:12px; display:grid; place-items:center; text-align:center; padding:1rem">
        <div><div style="font-size:2rem; color:var(--brand)">${r.type==='Video'?'▶':'▤'}</div>
          <p class="small muted mb0" style="max-width:34ch">${r.type==='Video'?'The recorded lecture plays here once a media file is attached.':'The document opens here once a file is attached.'}<br>This demo stores the metadata only.</p></div></div>
      <div class="row" style="justify-content:flex-end"><button class="btn btn-ghost" data-act="close-modal">Close</button></div>
    </div>`);
  },
  feedback(el){ openModal('Course feedback', feedbackForm(el.dataset.id)); },

  /* quiz */
  answer(el){ quizState.answers[quizState.idx] = +el.dataset.i; render(); },
  'next-q'(){ quizState.idx = Math.min(quizState.idx+1, byId(DB.quizzes,quizState.quizId).questions.length-1); render(); },
  'prev-q'(){ quizState.idx = Math.max(0, quizState.idx-1); render(); },
  'submit-quiz'(){
    const q = byId(DB.quizzes, quizState.quizId);
    const missing = quizState.answers.findIndex(a=>a===null);
    if(missing > -1){ quizState.idx = missing; render(); return toast(`Answer question ${missing+1} before submitting`); }
    submitQuiz();
  },
  retake(el){ quizState = null; go('#/quiz/'+el.dataset.id); render(); },

  /* profile items */
  'edit-profile'(){ openModal('Edit profile', profileForm()); },
  'add-qual'(){ openModal('Add a qualification', simpleForm('qual',
    [{label:'Qualification', name:'q', ph:'M.Sc. Statistics'},{label:'Institution', name:'i'},{label:'Year', name:'y'}], 'Add qualification')); },
  'add-exp'(){ openModal('Add work experience', simpleForm('exp',
    [{label:'Role', name:'r', ph:'Programme Officer'},{label:'Organisation', name:'o'},{label:'Period', name:'y', ph:'2021 – present'}], 'Add experience')); },
  'add-interest'(){ openModal('Add an interest', simpleForm('interest', [{label:'Interest', name:'v', ph:'Data visualisation'}], 'Add interest')); },
  'add-skill'(){ openModal('Add a skill', simpleForm('skill', [
      {label:'Skill', name:'name', ph:'Project Management'},
      {label:'Current level', name:'level', type:'select', options:[1,2,3,4,5]},
      {label:'Target level', name:'target', type:'select', options:[5,4,3,2,1]}], 'Add skill')); },
  'edit-expertise'(){ openModal('Subject expertise', simpleForm('expertise',
    [{label:'Subjects you can teach (comma separated)', name:'v', ph:'Leadership, Communication'}], 'Save expertise')); },
  'del-item'(el){
    const u = me(), kind = el.dataset.kind, v = el.dataset.v;
    u.profile[kind] = u.profile[kind].filter(x => (x.q||x.r) !== v);
    save(); render(); toast('Removed');
  },

  /* trainer + admin content */
  'new-course'(){ openModal('Create a course', courseForm()); },
  'edit-course'(el){ openModal('Edit course', courseForm(course(el.dataset.id))); },
  'del-course'(el){ if(!confirm('Delete this course and all its enrolments?')) return;
    const id = el.dataset.id;
    DB.courses = DB.courses.filter(c=>c.id!==id);
    DB.enrollments = DB.enrollments.filter(e=>e.courseId!==id);
    DB.quizzes = DB.quizzes.filter(q=>q.courseId!==id);
    save(); render(); toast('Course deleted'); },
  'approve-course'(el){ course(el.dataset.id).status='published'; save(); render(); toast('Course published'); },
  'unpublish-course'(el){ course(el.dataset.id).status='pending'; save(); render(); toast('Course unpublished'); },
  'new-quiz'(){ openModal('Create a questionnaire', quizForm()); },
  'add-question'(el){ openModal('Add a question', questionForm(el.dataset.id)); },
  'del-quiz'(el){ if(!confirm('Delete this questionnaire?')) return;
    DB.quizzes = DB.quizzes.filter(q=>q.id!==el.dataset.id); save(); render(); toast('Questionnaire deleted'); },
  'upload-resource'(){ openModal('Upload learning material', resourceForm()); },
  'del-resource'(el){ DB.resources = DB.resources.filter(r=>r.id!==el.dataset.id); save(); render(); toast('Resource removed'); },
  'new-post'(){ go('#/community'); },
  'new-program'(){ openModal('Add a training program', programForm()); },
  'close-program'(el){ byId(DB.programs, el.dataset.id).done = true; save(); render(); toast('Programme marked completed'); },
  'del-program'(el){ if(!confirm('Delete this programme?')) return;
    DB.programs = DB.programs.filter(p=>p.id!==el.dataset.id); save(); render(); toast('Programme deleted'); },
  'new-announcement'(){ openModal('Publish an announcement', announcementForm()); },
  'del-announcement'(el){ DB.announcements = DB.announcements.filter(n=>n.id!==el.dataset.id); save(); render(); toast('Announcement removed'); },

  /* user administration */
  'new-user'(){ openModal('Add a user', userForm()); },
  async 'approve-user'(el){ const u = byId(DB.users, el.dataset.id);
    if(BACKEND_READY){
      try{ await api(`/api/admin/users/${u.id}/approve`, {method:'POST'}); }
      catch(err){ return toast(err.message); }
    }
    u.status='active'; save(); render(); toast(`${u.name} approved`); },
  'reject-user'(el){ if(!confirm('Reject and remove this registration?')) return;
    DB.users = DB.users.filter(u=>u.id!==el.dataset.id); save(); render(); toast('Registration rejected'); },
  async 'del-user'(el){ const u = byId(DB.users, el.dataset.id);
    if(u.id === DB.session) return toast('You cannot remove your own account while signed in');
    if(!confirm(`Remove ${u.name}?`)) return;
    if(BACKEND_READY){
      try{ await api(`/api/admin/users/${u.id}`, {method:'DELETE'}); }
      catch(err){ return toast(err.message); }
    }
    DB.users = DB.users.filter(x=>x.id!==u.id);
    DB.enrollments = DB.enrollments.filter(e=>e.userId!==u.id);
    save(); render(); toast('User removed'); },

  /* OTP verification screen */
  async 'resend-otp'(){
    if(!DB.otp) return;
    if(DB.otp.resends >= OTP_MAX_RESENDS) return toast('Resend limit reached — log in again for a fresh code');
    if((Date.now() - DB.otp.lastSent) < OTP_RESEND_COOLDOWN_MS) return;
    if(DB.otp.backend){
      try{
        const r = await api('/api/auth/login/resend', {method:'POST', body:{ticket:DB.otp.ticket}});
        DB.otp.expiresAt = Date.now() + OTP_TTL_MS; DB.otp.attempts = 0; DB.otp.resends += 1; DB.otp.lastSent = Date.now();
        save(); render(); toast(r.message || 'Verification code re-sent');
      }catch(err){ toast(err.message); }
      return;
    }
    const u = byId(DB.users, DB.otp.userId);
    DB.otp.code = genOtp(); DB.otp.expiresAt = Date.now() + OTP_TTL_MS;
    DB.otp.attempts = 0; DB.otp.resends += 1; DB.otp.lastSent = Date.now();
    save(); render(); sendOtpEmail(DB.otp, u.email, u.name, DB.otp.code);
  },
  'cancel-otp'(){ DB.otp = null; save(); go('#/login'); render(); },

  /* registration OTP screen */
  async 'resend-reg-otp'(){
    if(!DB.regOtp) return;
    if(DB.regOtp.resends >= OTP_MAX_RESENDS) return toast('Resend limit reached — register again for a fresh code');
    if((Date.now() - DB.regOtp.lastSent) < OTP_RESEND_COOLDOWN_MS) return;
    if(DB.regOtp.backend){
      try{
        const r = await api('/api/auth/register/resend', {method:'POST', body:{email:DB.regOtp.data.email}});
        DB.regOtp.expiresAt = Date.now() + OTP_TTL_MS; DB.regOtp.attempts = 0; DB.regOtp.resends += 1; DB.regOtp.lastSent = Date.now();
        save(); render(); toast(r.message || 'Verification code re-sent');
      }catch(err){ toast(err.message); }
      return;
    }
    DB.regOtp.code = genOtp(); DB.regOtp.expiresAt = Date.now() + OTP_TTL_MS;
    DB.regOtp.attempts = 0; DB.regOtp.resends += 1; DB.regOtp.lastSent = Date.now();
    save(); render(); sendOtpEmail(DB.regOtp, DB.regOtp.data.email, DB.regOtp.data.name, DB.regOtp.code);
  },
  'cancel-reg-otp'(){ DB.regOtp = null; save(); go('#/register'); render(); },

  /* access control (admin) */
  async 'toggle-restrict'(){
    DB.restrictAccess = !DB.restrictAccess;
    if(BACKEND_READY){
      try{ await api('/api/admin/allowlist', {method:'POST', body:{restrict:DB.restrictAccess}}); }
      catch(err){ DB.restrictAccess = !DB.restrictAccess; return toast(err.message); }
    }
    save(); render();
    toast(DB.restrictAccess ? 'Access restricted to the allowlist' : 'Access restriction turned off'); },
  async 'allow-add'(el){
    const input = el.closest('.row').querySelector('input[name="new-allow"]');
    const email = (input.value||'').trim().toLowerCase();
    if(!email) return;
    if(BACKEND_READY){
      try{ await api('/api/admin/allowlist', {method:'POST', body:{addEmail:email}}); }
      catch(err){ return toast(err.message); }
    }
    if(!DB.allowlist.includes(email)) DB.allowlist.push(email);
    input.value = ''; save(); render(); toast('Address added to the access list'); },
  async 'allow-remove'(el){
    const email = el.dataset.email;
    if(BACKEND_READY){
      try{ await api('/api/admin/allowlist', {method:'POST', body:{removeEmail:email}}); }
      catch(err){ return toast(err.message); }
    }
    DB.allowlist = DB.allowlist.filter(e=>e!==email);
    save(); render(); toast('Address removed from the access list'); },
  async 'allow-add-user'(el){
    const email = el.dataset.email.toLowerCase();
    if(BACKEND_READY){
      try{ await api('/api/admin/allowlist', {method:'POST', body:{addEmail:email}}); }
      catch(err){ return toast(err.message); }
    }
    if(!DB.allowlist.includes(email)) DB.allowlist.push(email);
    save(); render(); toast('Added to the access list'); }
};

document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-act]');
  if(!el) return;
  const fn = ACTIONS[el.dataset.act];
  if(!fn) return;
  /* the modal backdrop wraps everything inside the dialog: only react to the
     backdrop itself, so buttons and form submits inside keep working */
  if(el.dataset.act === 'close-modal-bg' && ev.target !== el) return;
  ev.preventDefault();
  fn(el, ev);
});

document.addEventListener('change', ev => {
  const sel = ev.target.closest('[data-act="set-role"]');
  if(sel){ const u = byId(DB.users, sel.dataset.id); u.role = sel.value; save(); render(); toast(`${u.name} is now a ${sel.value === 'admin' ? 'administrator' : sel.value}`); return; }
  const f = ev.target.closest('[data-filter]');
  if(f){ courseFilters[f.dataset.filter] = f.value; render(); focusBack(f); return; }
  const rf = ev.target.closest('[data-rfilter]');
  if(rf){ resFilter[rf.dataset.rfilter] = rf.value; render(); focusBack(rf); return; }
  const roleSel = ev.target.closest('form[data-form="register"] select[name="role"]');
  if(roleSel){ const box = $('#exp-field'); if(box) box.style.display = roleSel.value === 'trainer' ? 'block' : 'none'; }
});
document.addEventListener('input', ev => {
  const f = ev.target.closest('[data-filter="q"], [data-rfilter="q"]');
  if(!f) return;
  if(f.dataset.filter) courseFilters.q = f.value; else resFilter.q = f.value;
  clearTimeout(window._deb); window._deb = setTimeout(()=>{ render(); focusBack(f); }, 220);
});
function focusBack(el){
  const key = el.dataset.filter ? `[data-filter="${el.dataset.filter}"]` : `[data-rfilter="${el.dataset.rfilter}"]`;
  const next = document.querySelector(key);
  if(next){ next.focus(); try{ const v = next.value; if(next.setSelectionRange) next.setSelectionRange(v.length, v.length); }catch(e){} }
}

/* -------------------------------------------------------- FORM SUBMITS */
const FORMS = {
  async login(d, form){
    const email = d.email.trim();
    const box = $('#login-err');
    if(BACKEND_READY){
      try{
        const r = await api('/api/auth/login', {method:'POST', body:{email, password:d.password}});
        DB.otp = { ticket:r.ticket, email, mode:'email', deliveryFailed:false,
          expiresAt: Date.now()+OTP_TTL_MS, attempts:0, resends:0, lastSent:Date.now(), backend:true };
        save(); go('#/verify-otp'); render();
        toast(r.message || 'Verification code sent to your email');
      }catch(err){ box.innerHTML = `<div class="err">${esc(err.message)}</div>`; }
      return;
    }
    const wait = lockoutRemaining(email);
    if(wait > 0){ box.innerHTML = `<div class="err">Too many failed attempts. Try again in ${Math.ceil(wait/60000)} minute(s).</div>`; return; }
    const u = DB.users.find(x => x.email.toLowerCase() === email.toLowerCase());
    if(!u || u.password !== d.password){
      loginAttempt(email, false); save();
      box.innerHTML = '<div class="err">That email and password do not match an account. Check both and try again.</div>'; return;
    }
    if(u.status === 'pending'){ box.innerHTML = '<div class="err">This account is waiting for administrator approval. You will be notified by email once it is active.</div>'; return; }
    if(!isAllowed(u.email)){ box.innerHTML = '<div class="err">This portal is restricted to authorised members. Your account is not on the access list — contact an administrator.</div>'; return; }
    loginAttempt(email, true);
    startOtp(u);
    go('#/verify-otp');
  },
  async otp(d){
    const box = $('#otp-err');
    if(DB.otp && DB.otp.backend){
      if(otpExpired()){ box.innerHTML = '<div class="err">This code has expired. Request a new one.</div>'; render(); return; }
      try{
        const user = await api('/api/auth/login/verify', {method:'POST', body:{ticket:DB.otp.ticket, code:d.code.trim()}});
        DB.otp = null;
        const u = mirrorBackendUser(user);
        DB.session = u.id; DB.lastActivity = Date.now(); save();
        go(u.role === 'admin' ? '#/admin' : u.role === 'trainer' ? '#/trainer' : '#/dashboard');
        render(); toast(`Welcome back, ${u.name.split(' ')[0]}`);
      }catch(err){
        box.innerHTML = `<div class="err">${esc(err.message)}</div>`;
        if(/again/i.test(err.message)){ DB.otp = null; save(); }
      }
      return;
    }
    if(!DB.otp) { box.innerHTML = '<div class="err">Your session expired. Log in again.</div>'; return; }
    if(otpExpired()){ box.innerHTML = '<div class="err">This code has expired. Request a new one.</div>'; render(); return; }
    if(d.code.trim() !== DB.otp.code){
      DB.otp.attempts += 1;
      if(DB.otp.attempts >= OTP_MAX_ATTEMPTS){
        DB.otp = null; save();
        go('#/login'); render();
        toast('Too many incorrect codes. Log in again.'); return;
      }
      save();
      box.innerHTML = `<div class="err">Incorrect code. ${OTP_MAX_ATTEMPTS - DB.otp.attempts} attempt(s) left.</div>`;
      return;
    }
    const u = byId(DB.users, DB.otp.userId);
    DB.session = u.id; DB.lastActivity = Date.now(); DB.otp = null; save();
    go(u.role === 'admin' ? '#/admin' : u.role === 'trainer' ? '#/trainer' : '#/dashboard');
    render(); toast(`Welcome back, ${u.name.split(' ')[0]}`);
  },
  async register(d){
    const box = $('#reg-err');
    if(d.password !== d.confirm){ box.innerHTML = '<div class="err">The two passwords do not match.</div>'; return; }
    const name = d.name.trim(), email = d.email.trim();
    if(BACKEND_READY){
      try{
        const r = await api('/api/auth/register', {method:'POST',
          body:{ name, email, password:d.password, role:d.role, title:d.title, dept:d.dept }});
        DB.regOtp = { data:{ name, email, role:d.role }, mode:'email', deliveryFailed:false,
          expiresAt: Date.now()+OTP_TTL_MS, attempts:0, resends:0, lastSent:Date.now(), backend:true };
        save(); go('#/verify-register-otp'); render();
        toast(r.message || 'Verification code sent to your email');
      }catch(err){ box.innerHTML = `<div class="err">${esc(err.message)}</div>`; }
      return;
    }
    if(DB.users.some(u=>u.email.toLowerCase()===email.toLowerCase())){
      box.innerHTML = '<div class="err">An account with that email already exists. Log in instead, or use a different address.</div>'; return; }
    /* hold the submitted details and verify the email address with a code
       before any account is actually created */
    const code = genOtp();
    DB.regOtp = { data: { name, email, password:d.password, role:d.role,
        title:d.title, dept:d.dept, expertise:d.expertise||'' },
      code, expiresAt: Date.now()+OTP_TTL_MS, attempts:0, resends:0, lastSent: Date.now(),
      mode:'pending', deliveryFailed:false };
    save();
    sendOtpEmail(DB.regOtp, email, name, code);
    go('#/verify-register-otp');
  },
  async 'reg-otp'(d){
    const box = $('#reg-otp-err');
    if(DB.regOtp && DB.regOtp.backend){
      if(Date.now() > DB.regOtp.expiresAt){ box.innerHTML = '<div class="err">This code has expired. Request a new one.</div>'; render(); return; }
      try{
        await api('/api/auth/register/verify', {method:'POST', body:{email:DB.regOtp.data.email, code:d.code.trim()}});
        const rd = DB.regOtp.data; DB.regOtp = null; save();
        openModal('Registration received', `<div class="stack">
          <div class="ok" style="margin:0">Your email is verified and the account has been created and sent for approval.</div>
          <p class="small" style="color:var(--ink-2)">An administrator reviews new accounts${rd.role==='trainer'?' and verifies subject expertise for trainers':''}. Once approved you can log in with <b>${esc(rd.email)}</b>.</p>
          <div class="row" style="justify-content:flex-end"><button class="btn" data-act="close-modal">Got it</button></div></div>`);
        go('#/login');
      }catch(err){
        box.innerHTML = `<div class="err">${esc(err.message)}</div>`;
        if(/again/i.test(err.message)){ DB.regOtp = null; save(); go('#/register'); render(); }
      }
      return;
    }
    if(!DB.regOtp){ box.innerHTML = '<div class="err">Your session expired. Register again.</div>'; return; }
    if(Date.now() > DB.regOtp.expiresAt){ box.innerHTML = '<div class="err">This code has expired. Request a new one.</div>'; render(); return; }
    if(d.code.trim() !== DB.regOtp.code){
      DB.regOtp.attempts += 1;
      if(DB.regOtp.attempts >= OTP_MAX_ATTEMPTS){
        DB.regOtp = null; save(); go('#/register'); render();
        toast('Too many incorrect codes. Register again.'); return;
      }
      save();
      box.innerHTML = `<div class="err">Incorrect code. ${OTP_MAX_ATTEMPTS - DB.regOtp.attempts} attempt(s) left.</div>`;
      return;
    }
    const rd = DB.regOtp.data;
    const u = { id:uid('u'), name:rd.name, email:rd.email, password:rd.password, role:rd.role,
      status:'pending', title:rd.title, dept:rd.dept, joined:today(),
      profile:{phone:'',location:'',bio:'',qualifications:[],experience:[],interests:[],certificates:[]},
      skills:[], expertise:(rd.expertise||'').split(',').map(s=>s.trim()).filter(Boolean) };
    DB.users.push(u); DB.regOtp = null; save();
    openModal('Registration received', `<div class="stack">
      <div class="ok" style="margin:0">Your email is verified and the account has been created and sent for approval.</div>
      <p class="small" style="color:var(--ink-2)">An administrator reviews new accounts${u.role==='trainer'?' and verifies subject expertise for trainers':''}. Once approved you can log in with <b>${esc(u.email)}</b>.</p>
      <div class="row" style="justify-content:flex-end"><button class="btn" data-act="close-modal">Got it</button></div></div>`);
    go('#/login');
  },
  contact(d, form){ form.reset(); toast('Message sent to the training division'); },
  verify(d){
    const c = DB.certificates.find(x => x.id.toLowerCase() === d.cid.trim().toLowerCase());
    const box = $('#verify-result');
    box.innerHTML = c
      ? `<div class="card"><div class="ok">Valid certificate</div>
          <dl class="small" style="margin:0; display:grid; grid-template-columns:auto 1fr; gap:.3rem .9rem">
            <dt class="muted">Holder</dt><dd style="margin:0"><b>${esc(user(c.userId).name)}</b></dd>
            <dt class="muted">Course</dt><dd style="margin:0">${esc(course(c.courseId)?course(c.courseId).title:'—')}</dd>
            <dt class="muted">Issued</dt><dd style="margin:0">${fmtDate(c.date)}</dd>
            <dt class="muted">Certificate ID</dt><dd style="margin:0">${esc(c.id)}</dd></dl></div>`
      : `<div class="card"><div class="err" style="margin:0">No certificate matches that ID. Check the ID printed on the document, including the year.</div></div>`;
  },
  post(d, form){
    DB.posts.unshift({ id:uid('po'), userId:DB.session, title:d.title, body:d.body, at:today(),
      tags:(d.tags||'').split(',').map(s=>s.trim()).filter(Boolean), comments:[] });
    save(); render(); toast('Posted to the community');
  },
  comment(d, form){
    const p = byId(DB.posts, form.dataset.id);
    p.comments.push({ userId:DB.session, body:d.body, at:today() });
    save(); render(); toast('Reply added');
  },
  feedback(d, form){
    DB.feedback.unshift({ id:uid('f'), userId:DB.session, courseId:form.dataset.id, rating:+d.rating, comment:d.comment, at:today() });
    const c = course(form.dataset.id);
    const all = DB.feedback.filter(f=>f.courseId===c.id);
    c.rating = Math.round(all.reduce((s,f)=>s+f.rating,0)/all.length*10)/10;
    save(); closeModal(); render(); toast('Thank you — feedback sent to the trainer');
  },
  course(d, form){
    const u = me(), id = form.dataset.id;
    const modules = (d.modules||'').split('\n').map(l=>l.trim()).filter(Boolean).map(l=>{
      const [title, minutes, summary] = l.split('|').map(s=>(s||'').trim());
      return { id:uid('m'), title:title||'Module', type:'reading', minutes:+minutes||30, summary:summary||'' };
    });
    const base = {
      title:d.title, category:d.category, level:d.level, hours:+d.hours,
      summary:d.summary, description:d.description,
      objectives:(d.objectives||'').split('\n').map(s=>s.trim()).filter(Boolean),
      skills:(d.skills||'').split(',').map(s=>s.trim()).filter(Boolean),
      modules: modules.length ? modules : [{id:uid('m'), title:'Introduction', type:'reading', minutes:30, summary:'Course overview.'}]
    };
    if(id){ Object.assign(course(id), base); toast('Course updated'); }
    else {
      DB.courses.push(Object.assign({ id:uid('c'), trainerId: d.trainerId || u.id,
        status: u.role==='admin' ? 'published' : 'pending', rating:0, created:today() }, base));
      toast(u.role==='admin' ? 'Course published' : 'Course submitted for administrator approval');
    }
    save(); closeModal(); render();
  },
  quiz(d){
    DB.quizzes.push({ id:uid('q'), courseId:d.courseId, title:d.title, pass:+d.pass, deadline:d.deadline,
      createdBy:DB.session, questions:[{ q:d.q, o:[d.o0,d.o1,d.o2,d.o3], a:+d.a }] });
    save(); closeModal(); render(); toast('Questionnaire created');
  },
  question(d, form){
    byId(DB.quizzes, form.dataset.id).questions.push({ q:d.q, o:[d.o0,d.o1,d.o2,d.o3], a:+d.a });
    save(); closeModal(); render(); toast('Question added');
  },
  resource(d, form){
    const file = form.querySelector('input[type=file]').files[0];
    DB.resources.unshift({ id:uid('r'), title:d.title, desc:d.desc, type:d.type, category:d.category,
      courseId:d.courseId || null, by:DB.session, date:today(),
      size: file ? (file.size>1048576 ? (file.size/1048576).toFixed(1)+' MB' : Math.max(1,Math.round(file.size/1024))+' KB') : '1.2 MB' });
    save(); closeModal(); render(); toast('Material uploaded to the library');
  },
  program(d){
    DB.programs.push({ id:uid('p'), title:d.title, description:d.description, date:d.date, duration:d.duration,
      trainerId:d.trainerId, audience:d.audience, seats:+d.seats, mode:d.mode, registered:[] });
    save(); closeModal(); render(); toast('Programme added');
  },
  announcement(d){
    DB.announcements.unshift({ id:uid('n'), type:d.type, title:d.title, body:d.body, at:today(), by:DB.session });
    save(); closeModal(); render(); toast('Published to the home page');
  },
  newuser(d){
    if(DB.users.some(u=>u.email.toLowerCase()===d.email.toLowerCase())) return toast('That email is already registered');
    DB.users.push({ id:uid('u'), name:d.name, email:d.email, password:d.password, role:d.role, status:'active',
      title:d.title, dept:d.dept, joined:today(),
      profile:{phone:'',location:'',bio:'',qualifications:[],experience:[],interests:[],certificates:[]}, skills:[], expertise:[] });
    save(); closeModal(); render(); toast('User created and approved');
  },
  profile(d){
    const u = me();
    u.name = d.name; u.title = d.title; u.dept = d.dept;
    Object.assign(u.profile, { phone:d.phone, location:d.location, bio:d.bio });
    save(); closeModal(); render(); toast('Profile saved');
  },
  qual(d){ const u = me(); (u.profile.qualifications = u.profile.qualifications||[]).push({q:d.q,i:d.i,y:d.y});
    save(); closeModal(); render(); toast('Qualification added'); },
  exp(d){ const u = me(); (u.profile.experience = u.profile.experience||[]).push({r:d.r,o:d.o,y:d.y});
    save(); closeModal(); render(); toast('Experience added'); },
  interest(d){ const u = me(); (u.profile.interests = u.profile.interests||[]).push(d.v);
    save(); closeModal(); render(); toast('Interest added'); },
  skill(d){ const u = me(); u.skills = u.skills||[];
    const existing = u.skills.find(s=>s.name.toLowerCase()===d.name.toLowerCase());
    if(existing){ existing.level = +d.level; existing.target = +d.target; }
    else u.skills.push({name:d.name, level:+d.level, target:+d.target});
    save(); closeModal(); render(); toast('Skill saved'); },
  expertise(d){ const u = me(); u.expertise = d.v.split(',').map(s=>s.trim()).filter(Boolean);
    save(); closeModal(); render(); toast('Expertise updated'); },
  async security(d, form){
    const box = $('#sec-err');
    const u = me();
    const newEmail = (d.newEmail||'').trim();
    const newPassword = d.newPassword||'';
    if(newPassword && newPassword !== d.confirmPassword){ box.innerHTML = '<div class="err">The new passwords do not match.</div>'; return; }
    if(newPassword && newPassword.length < 6){ box.innerHTML = '<div class="err">New password must be at least 6 characters.</div>'; return; }
    if(!newEmail && !newPassword){ box.innerHTML = '<div class="err">Enter a new email or a new password to update.</div>'; return; }
    if(BACKEND_READY){
      try{
        await api('/api/me/security', {method:'POST', body:{currentPassword:d.current, newEmail:newEmail||undefined, newPassword:newPassword||undefined}});
      }catch(err){ box.innerHTML = `<div class="err">${esc(err.message)}</div>`; return; }
      DB.session = null; save(); form.reset();
      go('#/login'); render();
      toast('Credentials updated — log in again with your new details');
      return;
    }
    if(u.password !== d.current){ box.innerHTML = '<div class="err">Current password is incorrect.</div>'; return; }
    if(newEmail && DB.users.some(x=>x.id!==u.id && x.email.toLowerCase()===newEmail.toLowerCase())){
      box.innerHTML = '<div class="err">Another account already uses that email.</div>'; return; }
    const oldEmail = u.email.toLowerCase();
    if(newEmail) u.email = newEmail;
    if(newPassword) u.password = newPassword;
    /* keep the access allowlist and any lockout record pointed at the current address */
    const idx = DB.allowlist.findIndex(e=>e.toLowerCase()===oldEmail);
    if(idx !== -1) DB.allowlist[idx] = u.email.toLowerCase();
    if(DB.loginSecurity[oldEmail]){ delete DB.loginSecurity[oldEmail]; }
    save(); form.reset(); render();
    toast('Your sign-in credentials were updated');
  }
};

document.addEventListener('submit', ev => {
  const form = ev.target.closest('form[data-form]');
  if(!form) return;
  ev.preventDefault();
  const data = {};
  new FormData(form).forEach((v,k)=>{ data[k] = v; });
  const fn = FORMS[form.dataset.form];
  if(fn) fn(data, form);
});

/* -------------------------------------------- PROJECT / DEMO GUIDE PAGE */
function viewGuide(){
  const step = (n,t,d) => `<div class="row" style="align-items:flex-start; gap:.8rem; margin-bottom:.9rem">
    <span style="width:26px;height:26px;border-radius:8px;background:var(--brand-soft);color:var(--brand-dk);display:grid;place-items:center;font-weight:700;font-size:.8rem;flex:none">${n}</span>
    <div><b class="small">${t}</b><div class="small muted">${d}</div></div></div>`;
  const code = t => `<pre style="background:var(--canvas); border:1px solid var(--line); border-radius:9px; padding:.8rem 1rem; overflow-x:auto; font-size:.82rem; margin:.5rem 0"><code>${esc(t)}</code></pre>`;
  return `<div class="wrap" style="padding:2.4rem 0 3.5rem">
    <div class="page-head"><h1>Project guide</h1>
      <p>How to run this build, demonstrate it, and connect a real backend later.</p></div>
    <div class="grid" style="grid-template-columns:minmax(0,2fr) minmax(280px,1fr); gap:1.4rem; align-items:start">
      <div class="stack">
        <div class="panel"><div class="panel-head"><h3>Run it</h3></div><div class="panel-body">
          <p class="small" style="color:var(--ink-2)">This build is a single HTML file with no dependencies. Open it in a browser and it works, including on a phone. To serve it locally:</p>
          ${code('# any static server works\npython3 -m http.server 8080\n# then open http://localhost:8080/capacity-connect.html')}
          <p class="small muted mb0">All data is seeded on first load and saved in the browser under the key <code>capacity-connect-v1</code>. The Reset demo data link in the footer restores the original sample content.</p>
        </div></div>

        <div class="panel"><div class="panel-head"><h3>Demonstration script</h3>
          <span class="small muted">About six minutes</span></div><div class="panel-body">
          <b class="small">Learner journey</b>
          <div style="margin-top:.7rem">
          ${step(1,'Register','Fill the registration form. The account is created as pending, which shows the approval workflow.')}
          ${step(2,'Log in as the trainee','learner@capacityconnect.org / learner123, then enter the 6-digit code shown on the verify screen (there is no mail server in this build, so it is displayed rather than emailed). The dashboard shows enrolled courses, hours, certificates and skills.')}
          ${step(3,'Explore and enrol','Open the catalogue, filter by category or skill, then enrol in Data Analytics Fundamentals.')}
          ${step(4,'Learn','Open the course, mark modules complete and watch the progress bar move.')}
          ${step(5,'Take the assessment','Open Cybersecurity Awareness, start the assessment, answer with Next and Previous, then submit to see the score and answer review.')}
          ${step(6,'Claim the certificate','Finish every module and pass the assessment, then claim the certificate. It opens with a certificate ID and can be printed or saved as PDF.')}
          ${step(7,'Check the skills profile','My skills shows the level raised by the completed course, with its target and recommended next courses.')}
          </div>
          <hr class="divider">
          <b class="small">Trainer journey</b>
          <div style="margin-top:.7rem">
          ${step(1,'Log in as the trainer','trainer@capacityconnect.org / trainer123.')}
          ${step(2,'Create a course','My courses, then Create a course. It is submitted for administrator approval.')}
          ${step(3,'Create a questionnaire','Add a multiple-choice questionnaire with a deadline and pass mark, then add more questions to it.')}
          ${step(4,'Upload material','Trainer library, then Upload material. It appears on the course page and in the resource library.')}
          ${step(5,'Monitor learners','Learner performance shows progress, assessment scores and certificates per learner.')}
          </div>
          <hr class="divider">
          <b class="small">Administrator journey</b>
          <div style="margin-top:.7rem">
          ${step(1,'Log in as the administrator','Use the private administrator credentials — not shown on this page for security. See "Administrator access" below.')}
          ${step(2,'Approve the pending account','Users and approvals — approve the account registered in step one, and change a role from the dropdown.')}
          ${step(3,'Approve the submitted course','Courses — approve the course the trainer created, and it appears in the public catalogue.')}
          ${step(4,'Publish an announcement','Announcements — publish a notice or achievement and see it on the home page.')}
          ${step(5,'Show the statistics','Dashboard charts and Reports cover enrolments, completion, participation and assessment performance. Competency mapping shows which trainers cover which subjects.')}
          </div>
        </div></div>

        <div class="panel"><div class="panel-head"><h3>Connecting a real backend</h3></div><div class="panel-body">
          <p class="small" style="color:var(--ink-2)">Every read and write goes through the store section at the top of the script, so a server swap touches one layer. A Node.js and Express API with MongoDB maps directly onto the collections already in use:</p>
          ${code('users, courses, enrollments, quizzes, attempts,\nprograms, resources, announcements, posts, feedback, certificates')}
          <p class="small" style="color:var(--ink-2)">Replace <code>save()</code> and <code>load()</code> with fetch calls to <code>/api/&lt;collection&gt;</code>, hash passwords with bcrypt on the server, and issue a signed session cookie or JWT instead of keeping the session id in the browser. Keep role checks on the server as well as in the router.</p>
          <p class="small muted" style="margin-top:.9rem">Login and access control in this build (<code>startOtp</code>, <code>FORMS.otp</code>, <code>DB.allowlist</code>) are demonstration logic only and must move server-side for real use:</p>
          <ul class="small" style="color:var(--ink-2); margin:.3rem 0 0; padding-left:1.2rem">
            <li>Generate and store the OTP server-side (hashed, short-lived), and send it with a real provider — Nodemailer against an SMTP account, or an API such as SendGrid or Amazon SES. Never return the code to the browser, which this demo does only because it has no mail server.</li>
            <li>Verify the code in an API route that checks expiry, attempt count and a per-account/IP rate limit before issuing a session — all logic that currently runs unprotected in client JavaScript here.</li>
            <li>Keep the allowlist and lockout state in the database and enforce it in the same server route, not just in the UI.</li>
          </ul>
          <p class="small muted mb0">Suggested folder structure for the full-stack version:</p>
          ${code('capacity-connect/\n  client/          React or plain HTML front end\n    components/    cards, bars, tables, modals\n    pages/         home, courses, dashboard, admin\n    api.js         all fetch calls\n  server/\n    models/        User, Course, Enrollment, Quiz, Attempt...\n    routes/        auth, courses, quizzes, admin\n    middleware/    auth, role check\n    index.js\n  .env             MONGO_URI, JWT_SECRET, PORT')}
        </div></div>
      </div>

      <div class="stack">
        <div class="card"><h3 style="font-size:1rem">Demo accounts</h3>
          <div class="stack small" style="gap:.5rem; margin-top:.5rem">
            <div><b>Trainee</b><div class="tiny muted">learner@capacityconnect.org · learner123</div></div>
            <div><b>Trainer</b><div class="tiny muted">trainer@capacityconnect.org · trainer123</div></div>
          </div>
          <a class="btn btn-sm btn-block" style="margin-top:.8rem" href="#/login">Go to login</a></div>
        <div class="card"><h3 style="font-size:1rem">Administrator access</h3>
          <p class="small muted mb0">The administrator email and password are not published on any page of this site — they were shared with you separately when this build was set up. After the first login, open <b>Profile → Account security</b> and change both the email and password immediately; the original credentials stop working once you do.</p></div>
        <div class="card"><h3 style="font-size:1rem">Adding content</h3>
          <p class="small muted mb0">Courses: trainer or administrator, Create a course. Modules are entered one per line as <code>Title | minutes | summary</code>.<br><br>Users: administrator, Users and approvals, Add a user.<br><br>Programmes, resources and announcements each have an Add button on their administration page.</p></div>
        <div class="card"><h3 style="font-size:1rem">Deploying</h3>
          <p class="small muted mb0">The front end is static, so it can be hosted on any static host. For the full-stack version, deploy the Express API and point the client's API base URL at it, with MongoDB Atlas as the database.</p></div>
      </div>
    </div></div>`;
}

/* ---------------------------------------------------------- 8) ROUTER */
function render(){
  const raw = location.hash || '#/home';
  const route = raw.split('?')[0];
  const parts = route.replace('#/','').split('/');
  const page = parts[0] || 'home';
  const param = parts[1];
  const u = me();
  let body = '', framed = false, nav = null;

  const needsRole = (roles) => {
    if(!u){ body = viewLogin('Log in to open that page.'); return false; }
    if(!roles.includes(u.role)){ body = `<div class="empty">Your role does not have access to that page. <a href="#/home">Return to the home page</a>.</div>`; framed = true; nav = LEARNER_NAV(route); return false; }
    return true;
  };

  switch(page){
    /* public */
    case 'home': body = viewHome(); break;
    case 'about': body = viewAbout(); break;
    case 'courses': body = viewCourses(); break;
    case 'course': body = viewCourse(param); break;
    case 'programs': body = viewPrograms(); break;
    case 'resources': body = viewResources(); break;
    case 'community': body = viewCommunity(); break;
    case 'competency': body = viewCompetency(); break;
    case 'contact': body = viewContact(); break;
    case 'verify': body = viewVerify(); break;
    case 'guide': body = viewGuide(); break;
    case 'login': if(u){ go('#/dashboard'); body=''; } else { DB.otp = null; body = viewLogin(); } break;
    case 'verify-otp': body = (!u && DB.otp) ? viewOtp() : (go('#/login'), ''); break;
    case 'register': DB.regOtp = null; body = viewRegister(); break;
    case 'verify-register-otp': body = DB.regOtp ? viewRegisterOtp() : (go('#/register'), ''); break;

    /* learner */
    case 'dashboard': if(needsRole(['trainee','trainer','admin'])){ body = viewDashboard(); framed = true; nav = LEARNER_NAV(route); } break;
    case 'my-courses': if(needsRole(['trainee','trainer','admin'])){ body = viewMyCourses(); framed = true; nav = LEARNER_NAV(route); } break;
    case 'my-assessments': if(needsRole(['trainee','trainer','admin'])){ body = viewMyAssessments(); framed = true; nav = LEARNER_NAV(route); } break;
    case 'my-skills': if(needsRole(['trainee','trainer','admin'])){ body = viewMySkills(); framed = true; nav = LEARNER_NAV(route); } break;
    case 'my-certificates': if(needsRole(['trainee','trainer','admin'])){ body = viewMyCertificates(); framed = true; nav = LEARNER_NAV(route); } break;
    case 'profile': if(needsRole(['trainee','trainer','admin'])){ body = viewProfile(); framed = true;
        nav = u.role==='admin' ? ADMIN_NAV(route) : u.role==='trainer' ? TRAINER_NAV(route) : LEARNER_NAV(route); } break;
    case 'quiz': if(needsRole(['trainee','trainer','admin'])){ body = viewQuiz(param); framed = true; nav = LEARNER_NAV(route); } break;

    /* trainer */
    case 'trainer': if(needsRole(['trainer','admin'])){ body = viewTrainerDash(); framed = true; nav = TRAINER_NAV(route); } break;
    case 'trainer-courses': if(needsRole(['trainer','admin'])){ body = viewTrainerCourses(); framed = true; nav = TRAINER_NAV(route); } break;
    case 'trainer-quizzes': if(needsRole(['trainer','admin'])){ body = viewTrainerQuizzes(); framed = true; nav = TRAINER_NAV(route); } break;
    case 'trainer-library': if(needsRole(['trainer','admin'])){ body = viewTrainerLibrary(); framed = true; nav = TRAINER_NAV(route); } break;
    case 'trainer-learners': if(needsRole(['trainer','admin'])){ body = viewTrainerLearners(); framed = true; nav = TRAINER_NAV(route); } break;

    /* admin */
    case 'admin': if(needsRole(['admin'])){ body = viewAdminDash(); framed = true; nav = ADMIN_NAV(route); } break;
    case 'admin-users': if(needsRole(['admin'])){ body = viewAdminUsers(); framed = true; nav = ADMIN_NAV(route); } break;
    case 'admin-courses': if(needsRole(['admin'])){ body = viewAdminCourses(); framed = true; nav = ADMIN_NAV(route); } break;
    case 'admin-programs': if(needsRole(['admin'])){ body = viewAdminPrograms(); framed = true; nav = ADMIN_NAV(route); } break;
    case 'admin-resources': if(needsRole(['admin'])){ body = viewAdminResources(); framed = true; nav = ADMIN_NAV(route); } break;
    case 'admin-certificates': if(needsRole(['admin'])){ body = viewAdminCertificates(); framed = true; nav = ADMIN_NAV(route); } break;
    case 'admin-announcements': if(needsRole(['admin'])){ body = viewAdminAnnouncements(); framed = true; nav = ADMIN_NAV(route); } break;
    case 'admin-competency': if(needsRole(['admin'])){ body = viewAdminCompetency(); framed = true; nav = ADMIN_NAV(route); } break;
    case 'admin-reports': if(needsRole(['admin'])){ body = viewAdminReports(); framed = true; nav = ADMIN_NAV(route); } break;
    case 'admin-access': if(needsRole(['admin'])){ body = viewAdminAccess(); framed = true; nav = ADMIN_NAV(route); } break;

    default: body = `<div class="wrap" style="padding:4rem 0"><div class="empty">
      <h2 style="margin-bottom:.4rem">Page not found</h2>
      <p class="mb0">That address does not exist. <a href="#/home">Go to the home page</a>.</p></div></div>`;
  }

  document.title = 'Capacity Connect — ' + page.replace(/-/g,' ').replace(/\b\w/g, m=>m.toUpperCase());
  $('#root').innerHTML = `<div style="min-height:100vh; display:flex; flex-direction:column">
    ${header(route)}
    ${framed ? shellPage(route, nav, body) : `<main id="app" style="flex:1">${body}</main>`}
    ${footer()}</div>`;
}

window.addEventListener('hashchange', () => {
  const page = (location.hash||'').replace('#/','').split('/')[0];
  if(page !== 'quiz') quizState = null;
  closeModal();
  render();
  window.scrollTo({top:0, behavior:'instant'});
});
document.addEventListener('keydown', e => { if(e.key === 'Escape') closeModal(); });

/* tick the OTP countdown while the verification screen is open, and drop
   an idle session, without forcing a full re-render every second */
setInterval(() => {
  const page = (location.hash||'').replace('#/','').split('/')[0];
  if(page === 'verify-otp' && DB.otp){
    const el = $('#otp-countdown');
    if(el){
      const left = Math.max(0, Math.ceil((DB.otp.expiresAt - Date.now())/1000));
      if(left <= 0){ render(); } else { el.textContent = left; }
    }
  }
  if(page === 'verify-register-otp' && DB.regOtp){
    const el = $('#reg-otp-countdown');
    if(el){
      const left = Math.max(0, Math.ceil((DB.regOtp.expiresAt - Date.now())/1000));
      if(left <= 0){ render(); } else { el.textContent = left; }
    }
  }
  if(DB.session && checkSessionIdle()){ render(); toast('Signed out after 30 minutes of inactivity'); }
}, 1000);
['click','keydown','input'].forEach(evt => document.addEventListener(evt, touchActivity, {passive:true}));

/* ------------------------------------------------------------- START -- */
(function init(){
  if(!load()){ DB = seed(); save(); }
  checkSessionIdle();
  if(!location.hash) location.hash = '#/home';
  render();
})();
