const Config = (function () {
  const settings = {
    bootcampName: 'Coding Bootcamp',
    version: '1.0.0',
    passingMark: 50,
    defaultCourse: 'General Programming',
  };

  return {
    get(key) {
      return settings[key];
    },
    setPassingMark(value) {
      const mark = toNumber(value);
      if (!Number.isFinite(mark) || mark < 0 || mark > 100) {
        throw new RangeError('The passing mark must be a number between 0 and 100.');
      }
      settings.passingMark = mark;
      return mark;
    },
  };
})();


// MODULE 4: Functions as values
// Arrow functions can be stored in variables just like numbers or text.
// Turns "72" into 72. Blank text, booleans, null etc. become NaN (invalid).
function toNumber(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') return Number(value);
  return NaN;
}

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const formatAverage = (average) => (average === null ? '-' : average.toFixed(1));
const formatTime = (date) => date.toLocaleTimeString('en-ZA', { hour12: false });

// Student names are typed by a person, so escape them before putting them in HTML.
const escapeHtml = (text) =>
  String(text).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[character]));


// MODULE 4: Generator (function*, yield, .next())
// A generator pauses at every `yield` and remembers where it stopped. Each .next() call resumes it and hands back the next ID.
function* studentIdGenerator(prefix = 'STU', start = 1) {
  let number = start;
  while (true) {
    yield `${prefix}-${String(number).padStart(3, '0')}`;
    number += 1;
  }
}

let idGenerator = studentIdGenerator();


// MODULE 4: Closure
// `count` is private to createProcessingCounter. The returned methods still "remember" it after the outer function has finished, but no other code can reach it.
function createProcessingCounter() {
  let count = 0;

  return {
    increment() {
      count += 1;
      return count;
    },
    value() {
      return count;
    },
    reset() {
      count = 0;
    },
  };
}
const processingCounter = createProcessingCounter();


// STUDENT DATA & LOGIC
let students = [];                    // every registered student
const processingNow = new Set();      // IDs currently waiting on the timer
const PROCESSING_DELAY_MS = 1500;

// Checks a list of marks. Returns clean numbers or throws a clear error.
function validateMarks(marks) {
  return marks.map((mark) => {
    const value = toNumber(mark);
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      throw new RangeError(`"${mark}" is not a valid mark. Marks must be numbers from 0 to 100.`);
    }
    return value;
  });
}

function createStudent(name, course = Config.get('defaultCourse'), ...marks) {
  if (typeof name !== 'string' || name.trim() === '') {
    throw new TypeError('Student name must be text and cannot be empty.');
  }
  if (typeof course !== 'string' || course.trim() === '') {
    throw new TypeError('Course must be text and cannot be empty.');
  }
  return {
    name: name.trim(),
    course: course.trim(),
    marks: validateMarks(marks),
    processed: false,
  };
}

// MODULE 4: Spread syntax
function registerStudent(...details) {
  const draft = createStudent(...details);
  const student = { id: idGenerator.next().value, ...draft };
  students = [...students, student];
  return student;
}

function findStudent(id) {
  return students.find((student) => student.id === String(id).toUpperCase());
}

// Reusable average. Rest parameter again: calculateAverage(70, 80, 90).
// With no marks there is nothing to average, so it returns null.
function calculateAverage(...marks) {
  if (marks.length === 0) return null;
  const total = marks.reduce((sum, mark) => sum + mark, 0);
  return Math.round((total / marks.length) * 10) / 10;
}

// Default parameter: if no pass mark is supplied, use the configured one.
function getStatus(average, passMark = Config.get('passingMark')) {
  if (typeof average !== 'number') return 'N/A';
  return average >= passMark ? 'PASS' : 'FAIL';
}

// Adds the calculated fields to a copy of the student (the original is untouched).
function withResults(student) {
  const average = calculateAverage(...student.marks);
  return { ...student, average, status: getStatus(average) };
}


// ACTIVITY LOG
const activityLog = {
  entries: [],
  count: 0,

  add(type, message) {
    this.count += 1;
    this.entries.push({ n: this.count, time: new Date(), type, message });
    if (this.entries.length > 200) this.entries.shift();
    console.log(`[${type.toUpperCase()}] ${message}`);
    renderActivity();
  },
};

const logInfo = activityLog.add.bind(activityLog, 'info');
const logSuccess = activityLog.add.bind(activityLog, 'success');
const logError = activityLog.add.bind(activityLog, 'error');


// HIGHER-ORDER FUNCTIONS
function filterStudents(list, predicate) {
  const matches = [];
  for (const student of list) {
    if (predicate(student)) matches.push(student);
  }
  return matches;
}

function sortStudents(list, compareFn) {
  return [...list].sort(compareFn);
}

const sortStrategies = {
  id: (a, b) => a.id.localeCompare(b.id),
  name: (a, b) => a.name.localeCompare(b.name),
  average: (a, b) => (b.average ?? -1) - (a.average ?? -1),
};

const statusFilters = {
  all: () => true,
  pass: (student) => student.status === 'PASS',
  fail: (student) => student.status === 'FAIL',
  processed: (student) => student.processed,
  pending: (student) => !student.processed,
};

// ASYNCHRONOUS PROCESSING
function processStudent(student, onComplete) {
  if (typeof onComplete !== 'function') {
    throw new TypeError('processStudent needs a callback function as its second argument.');
  }
  if (!student) {
    onComplete(new Error('Cannot process: that student does not exist.'));
    return;
  }
  if (typeof student !== 'object' || !Array.isArray(student.marks)) {
    onComplete(new Error('Cannot process: invalid student data.'));
    return;
  }
  if (student.marks.length === 0) {
    onComplete(new Error(`Cannot process ${student.name}: no marks have been recorded.`));
    return;
  }
  if (student.processed) {
    onComplete(new Error(`${student.name} has already been processed.`));
    return;
  }

  // Step 1 - start
  logInfo(`Started processing ${describeStudent.call(student)}...`);

  // Step 2 - wait
  setTimeout(() => {
    // Step 3 - complete
    student.processed = true;
    processingCounter.increment();

    // Step 4 - the callback decides what happens next
    onComplete(null, withResults(student));
  }, PROCESSING_DELAY_MS);
}

// UI wrapper: looks the student up, runs processStudent, then reacts in the callback.
function processById(id, onDone = () => {}) {
  const student = findStudent(id);

  if (!student) {
    const error = new Error(`Student "${id}" does not exist.`);
    logError(error.message);
    showToast(error.message, 'error');
    onDone(error);
    return;
  }

  processingNow.add(student.id);

  processStudent(student, (error, result) => {
    processingNow.delete(student.id);

    if (error) {
      logError(error.message);
      showToast(error.message, 'error');
    } else {
      logSuccess(describeStudent.call(result, 'Finished: ') + ` - ${result.status} (average ${formatAverage(result.average)})`);
      showToast(`${result.name} processed: ${result.status}`, 'success');
    }

    renderAll();
    onDone(error, result);
  });

  // If the timer is running, this line executes straight away - BEFORE the "Finished" message.
  if (processingNow.has(student.id)) {
    logInfo('processStudent() called - the program keeps running while it waits.');
    renderAll();
  }
}

// Processes students one after another. Each callback starts the next student.
function processAll() {
  const queue = filterStudents(
    students,
    (student) => !student.processed && student.marks.length > 0 && !processingNow.has(student.id),
  );

  if (queue.length === 0) {
    showToast('Everyone with marks has already been processed.', 'info');
    return;
  }

  logInfo(`Batch started: ${queue.length} student(s) in the queue.`);

  const processNext = (index) => {
    if (index === queue.length) {
      logSuccess('Batch complete.');
      return;
    }
    processById(queue[index].id, () => processNext(index + 1));
  };

  processNext(0);
}

// REPORT
const bootcampReport = {
  title: Config.get('bootcampName'),
  getHeading() {
    return `${this.title} Final Report`;
  },
};

// One function, many students: `this` is whichever student we call it with.
function describeStudent(prefix = '') {
  return `${prefix}${this.id} · ${this.name} (${this.course})`;
}

// One line of the console report; `this` is a student.
function formatReportLine(indent = '', nameWidth = 22) {
  const average = calculateAverage(...this.marks);
  return `${indent}${this.id}  ${this.name.padEnd(nameWidth)}  ${this.course.padEnd(24)}`
    + `avg ${formatAverage(average).padStart(5)}  ${getStatus(average)}`;
}

function generateReport() {
  const rows = students.map(withResults);
  return {
    heading: bootcampReport.getHeading(),
    generatedAt: new Date(),
    passingMark: Config.get('passingMark'),
    rows,
    totals: {
      total: rows.length,
      processed: processingCounter.value(),
      passed: filterStudents(rows, statusFilters.pass).length,
      failed: filterStudents(rows, statusFilters.fail).length,
    },
  };
}

function printReportToConsole() {
  const report = generateReport();
  const { total, processed, passed, failed } = report.totals;
  const rule = '='.repeat(78);

  console.log(`\n${rule}\n${report.heading}\n${rule}`);
  report.rows.forEach((row) => {
    console.log(formatReportLine.apply(row, ['  ', 22]));   // apply: array of arguments
  });
  console.log('-'.repeat(78));
  console.log(`  Total students: ${total}   Processed: ${processed}   Passed: ${passed}   Failed: ${failed}`);

  logInfo('Report printed to the browser console (press F12 to view it).');
  showToast('Report printed to the console. Press F12 to view it.', 'info');
}


// SCREENS - turning data into what you see
const viewNames = ['dashboard', 'register', 'students', 'report', 'activity', 'lab'];

function showView(requested) {
  const name = viewNames.includes(requested) ? requested : 'dashboard';
  $$('.view').forEach((view) => { view.hidden = view.id !== `view-${name}`; });
  $$('.nav-link').forEach((link) => {
    if (link.dataset.view === name) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  window.scrollTo(0, 0);
  if (name === 'activity') scrollLogToBottom();
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  $('#toast-stack').append(toast);
  setTimeout(() => toast.remove(), 3600);
}

const statusBadge = (status) =>
  `<span class="badge badge-${status === 'N/A' ? 'na' : status.toLowerCase()}">${status}</span>`;

const marksChips = (marks) =>
  marks.length
    ? `<div class="chips">${marks.map((mark) => `<span class="chip">${mark}</span>`).join('')}</div>`
    : '<span class="muted">No marks</span>';

function renderAll() {
  refreshCourseOptions();
  renderSidebar();
  renderDashboard();
  renderStudents();
  renderReport();
  renderActivity();
}

function renderSidebar() {
  $('#nav-count').textContent = students.length;
  $('#side-passmark').textContent = `${Config.get('passingMark')}%`;
  const passMarkInput = $('#passmark-input');
  if (document.activeElement !== passMarkInput) passMarkInput.value = Config.get('passingMark');
}

function renderDashboard() {
  const { totals } = generateReport();
  $('#stat-total').textContent = totals.total;
  $('#stat-processed').textContent = totals.processed;
  $('#stat-passed').textContent = totals.passed;
  $('#stat-failed').textContent = totals.failed;

  const percent = totals.total ? (totals.processed / totals.total) * 100 : 0;
  $('#progress-fill').style.width = `${percent}%`;
  $('#progress-label').textContent = `${totals.processed} of ${totals.total} students processed`;

  const rows = students.map(withResults);
  const averages = rows.map((row) => row.average).filter((average) => average !== null);
  const allMarks = students.flatMap((student) => student.marks);
  const top = sortStudents(rows.filter((row) => row.average !== null), sortStrategies.average)[0];

  $('#insight-average').textContent = averages.length ? `${formatAverage(calculateAverage(...averages))}%` : '-';
  $('#insight-top').textContent = top ? `${top.name} (${formatAverage(top.average)})` : '-';
  $('#insight-high').textContent = allMarks.length ? Math.max(...allMarks) : '-';
  $('#insight-low').textContent = allMarks.length ? Math.min(...allMarks) : '-';
}

// Course dropdown (filter) and course suggestions (register form) come from the data.
function refreshCourseOptions() {
  const courses = [...new Set(students.map((student) => student.course))].sort();
  const current = $('#course-filter').value;

  $('#course-filter').innerHTML = [
    '<option value="all">All courses</option>',
    ...courses.map((course) => `<option value="${escapeHtml(course)}">${escapeHtml(course)}</option>`),
  ].join('');
  $('#course-filter').value = courses.includes(current) ? current : 'all';

  $('#course-options').innerHTML = courses
    .map((course) => `<option value="${escapeHtml(course)}"></option>`)
    .join('');
}

function getVisibleStudents() {
  const search = $('#student-search').value.trim().toLowerCase();
  const course = $('#course-filter').value;
  const status = $('#status-filter').value;

  const matches = (student) =>
    (!search || student.name.toLowerCase().includes(search) || student.id.toLowerCase().includes(search))
    && (course === 'all' || student.course === course)
    && statusFilters[status](student);

  const rows = filterStudents(students.map(withResults), matches);
  return sortStudents(rows, sortStrategies[$('#sort-select').value]);
}

function processingCell(row) {
  if (processingNow.has(row.id)) return '<span class="state state-busy"><i class="spinner"></i>Processing...</span>';
  if (row.processed) return '<span class="state state-done">Done</span>';
  if (row.marks.length === 0) return '<span class="state state-muted">Needs marks</span>';
  return `<button class="btn btn-small" type="button" data-process="${row.id}">Process</button>`;
}

function renderStudents() {
  const rows = getVisibleStudents();
  $('#result-count').textContent = `Showing ${rows.length} of ${students.length} students`;

  $('#students-body').innerHTML = rows.length
    ? rows.map((row) => `
        <tr>
          <td class="id">${row.id}</td>
          <td class="name">${escapeHtml(row.name)}</td>
          <td>${escapeHtml(row.course)}</td>
          <td>${marksChips(row.marks)}</td>
          <td class="num">${formatAverage(row.average)}</td>
          <td>${statusBadge(row.status)}</td>
          <td>${processingCell(row)}</td>
        </tr>`).join('')
    : `<tr><td class="empty-row" colspan="7">${students.length
        ? 'No students match these filters. Clear the search or choose "All".'
        : 'No students yet. Register your first student to get started.'}</td></tr>`;
}

function renderReport() {
  const report = generateReport();
  const { total, processed, passed, failed } = report.totals;

  $('#report-heading').textContent = report.heading;
  $('#report-meta').textContent =
    `Generated ${report.generatedAt.toLocaleString('en-ZA')}. Passing mark: ${report.passingMark}%.`;

  const summary = [
    [total, 'Total students'],
    [processed, 'Students processed'],
    [passed, 'Students who passed'],
    [failed, 'Students who failed'],
  ];
  $('#report-summary').innerHTML = summary
    .map(([value, label]) => `<div class="sum"><span class="sum-value">${value}</span><span class="sum-label">${label}</span></div>`)
    .join('');

  $('#report-body').innerHTML = report.rows.length
    ? report.rows.map((row) => `
        <tr>
          <td class="id">${row.id}</td>
          <td class="name">${escapeHtml(row.name)}</td>
          <td>${escapeHtml(row.course)}</td>
          <td>${row.marks.length ? row.marks.join(', ') : '<span class="muted">No marks</span>'}</td>
          <td class="num">${formatAverage(row.average)}</td>
          <td>${statusBadge(row.status)}</td>
        </tr>`).join('')
    : '<tr><td class="empty-row" colspan="6">There are no students to report on yet.</td></tr>';
}

function activityItemHtml(entry) {
  return `<li class="activity-item activity-${entry.type}">
    <span class="activity-n">${entry.n}</span>
    <time>${formatTime(entry.time)}</time>
    <span class="activity-msg">${escapeHtml(entry.message)}</span>
  </li>`;
}

function renderActivity() {
  const emptyItem = '<li class="empty">Nothing has happened yet.</li>';
  const full = $('#activity-list');
  const stickToBottom = full.scrollHeight - full.scrollTop - full.clientHeight < 40;

  full.innerHTML = activityLog.entries.length ? activityLog.entries.map(activityItemHtml).join('') : emptyItem;
  $('#recent-activity').innerHTML = activityLog.entries.length
    ? activityLog.entries.slice(-5).map(activityItemHtml).join('')
    : emptyItem;

  if (stickToBottom) scrollLogToBottom();
}

function scrollLogToBottom() {
  const full = $('#activity-list');
  full.scrollTop = full.scrollHeight;
}


// MODULE 4 LAB & EDGE-CASE TESTS
// A closure that keeps the lines for one output box private.
function createOutputWriter(element) {
  let lines = [];
  return {
    write(line) {
      lines = [...lines, line];
      element.textContent = lines.join('\n');
    },
    clear() {
      lines = [];
      element.textContent = '';
    },
  };
}

const demoIds = studentIdGenerator('DEMO');   // separate generator so real IDs are not used up

// Functions as values: each demo is stored in an object and picked by its name.
const demos = {
  closure(out) {
    out.clear();
    out.write(`processingCounter.value()  ->  ${processingCounter.value()}`);
    out.write(`processingCounter.count    ->  ${processingCounter.count}`);
    out.write('The count is private inside the closure, so it cannot be read or changed directly.');
  },

  iife(out) {
    out.clear();
    out.write(`Config.get('bootcampName')  ->  ${Config.get('bootcampName')}`);
    out.write(`Config.get('passingMark')   ->  ${Config.get('passingMark')}`);
    out.write(`Config.settings             ->  ${Config.settings}`);
    out.write('The settings object is hidden inside the IIFE. Only get() and setPassingMark() can reach it.');
  },

  generator(out) {
    const result = demoIds.next();
    out.write(`next()  ->  { value: '${result.value}', done: ${result.done} }`);
  },

  context(out) {
    out.clear();
    const sample = students[0];
    if (!sample) {
      out.write('Register a student first, then run this again.');
      return;
    }

    out.write(`this      ->  ${bootcampReport.getHeading()}`);
    out.write(`call()    ->  ${describeStudent.call(sample, 'Student: ')}`);
    out.write(`apply()   ->  ${formatReportLine.apply(sample, ['', 14]).trim()}`);

    const boundDescribe = describeStudent.bind(sample, 'Bound: ');
    out.write(`bind()    ->  ${boundDescribe()}`);

    // Pulling a method off its object loses `this`:
    const detached = bootcampReport.getHeading;
    try {
      detached();
    } catch (error) {
      out.write(`Detached method fails: ${error.message}`);
    }
    out.write(`Fixed with bind: ${detached.bind(bootcampReport)()}`);
  },

  async(out) {
    out.clear();
    out.write('1. The demo starts (runs first, synchronously).');
    setTimeout(() => out.write('4. The 1.5 second timer fires (runs last).'), PROCESSING_DELAY_MS);
    setTimeout(() => out.write('3. Even a 0 ms timer waits until the current code has finished.'), 0);
    out.write('2. The last line of the demo runs right away. JavaScript did not wait for the timers.');
  },
};

// Helpers for the tests below.
const expectThrow = (action, ErrorType) => {
  try {
    action();
    return { pass: false, detail: 'No error was thrown.' };
  } catch (error) {
    return { pass: error instanceof ErrorType, detail: `${error.name}: ${error.message}` };
  }
};

// processStudent reports bad input through its callback straight away, so we can capture it.
const captureProcessError = (input) => {
  let received = null;
  processStudent(input, (error) => { received = error; });
  return received;
};

const testCases = [
  {
    label: 'Student passes (marks 70, 80)',
    run: () => {
      const average = calculateAverage(70, 80);
      return { pass: getStatus(average) === 'PASS', detail: `Average ${average} -> ${getStatus(average)}` };
    },
  },
  {
    label: 'Student fails (marks 30, 40)',
    run: () => {
      const average = calculateAverage(30, 40);
      return { pass: getStatus(average) === 'FAIL', detail: `Average ${average} -> ${getStatus(average)}` };
    },
  },
  {
    label: 'Student has multiple marks (60, 70, 80, 90)',
    run: () => {
      const average = calculateAverage(60, 70, 80, 90);
      return { pass: average === 75, detail: `Average ${average}` };
    },
  },
  {
    label: 'Student receives the default course',
    run: () => {
      const student = createStudent('Test Student');
      return { pass: student.course === Config.get('defaultCourse'), detail: `Course: ${student.course}` };
    },
  },
  {
    label: 'Student has no marks',
    run: () => {
      const average = calculateAverage();
      return { pass: average === null && getStatus(average) === 'N/A', detail: `Average ${average}, status ${getStatus(average)}` };
    },
  },
  {
    label: 'Student has only one mark (65)',
    run: () => {
      const average = calculateAverage(65);
      return { pass: average === 65 && getStatus(average) === 'PASS', detail: `Average ${average} -> ${getStatus(average)}` };
    },
  },
  {
    label: 'A mark is invalid ("abc")',
    run: () => expectThrow(() => createStudent('Test', 'Course', 70, 'abc'), RangeError),
  },
  {
    label: 'A mark is out of range (150)',
    run: () => expectThrow(() => createStudent('Test', 'Course', 150), RangeError),
  },
  {
    label: 'Wrong data type (name is the number 123)',
    run: () => expectThrow(() => createStudent(123), TypeError),
  },
  {
    label: 'Student does not exist (STU-999)',
    run: () => {
      const found = findStudent('STU-999');
      const error = captureProcessError(found);
      return { pass: found === undefined && error instanceof Error, detail: error ? error.message : 'No error reported.' };
    },
  },
  {
    label: 'Processing receives invalid data',
    run: () => {
      const error = captureProcessError('not a student');
      return { pass: error instanceof Error, detail: error ? error.message : 'No error reported.' };
    },
  },
];

function runTests() {
  const results = testCases.map((test) => ({ label: test.label, ...test.run() }));
  const passedCount = filterStudents(results, (result) => result.pass).length;

  $('#test-results').innerHTML = results.map((result) => `
      <li class="test test-${result.pass ? 'pass' : 'fail'}">
        <span class="test-flag">${result.pass ? 'Passed' : 'Failed'}</span>
        <div><strong>${escapeHtml(result.label)}</strong><span class="detail">${escapeHtml(result.detail)}</span></div>
      </li>`).join('')
    + `<li class="tests-summary">${passedCount} of ${results.length} checks passed.</li>`;

  logInfo(`Edge-case tests finished: ${passedCount} of ${results.length} passed.`);
}


// START-UP
const demoStudents = [
  ['Thandiswa Mazwayi', 'Web Development', 78, 85, 91],
  ['Sibusiso Dlamini', 'Data Analytics', 45, 52, 48],
  ['Princess Nkuna', 'UI/UX Design', 66, 72, 69, 74],
  ['Lerato Ramatsoku', undefined, 58],                    // undefined -> default course
  ['Khumo Qomoyi', 'Cyber Security', 35, 42, 50, 38],
  ['Nkosiyabo Mkhize', 'Web Development', 92, 81, 77, 95, 88],
];

function loadDemoStudents() {
  demoStudents.forEach(([name, course, ...marks]) => registerStudent(name, course, ...marks));
  logInfo(`Loaded ${demoStudents.length} demo students.`);
}

function resetDemoData() {
  if (processingNow.size > 0) {
    showToast('Wait for processing to finish, then try again.', 'error');
    return;
  }
  if (!window.confirm('Replace all students and activity with the demo data?')) return;

  students = [];
  idGenerator = studentIdGenerator();
  processingCounter.reset();
  activityLog.entries.length = 0;
  loadDemoStudents();
  renderAll();
  showToast('Demo data restored.', 'success');
}

function handleRegisterSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const errorBox = $('#form-error');
  errorBox.textContent = '';

  const name = $('#reg-name').value;
  const course = $('#reg-course').value.trim() || undefined;   // blank -> default parameter applies
  const rawMarks = $('#reg-marks').value.split(/[\s,;]+/).filter(Boolean);

  try {
    const student = registerStudent(name, course, ...rawMarks);
    logSuccess(describeStudent.call(student, 'Registered: '));
    showToast(`${student.name} registered as ${student.id}.`, 'success');
    form.reset();
    $('#reg-name').focus();
    renderAll();
  } catch (error) {
    errorBox.textContent = error.message;
    logError(`Registration failed - ${error.message}`);
  }
}

function handlePassMarkSubmit(event) {
  event.preventDefault();
  try {
    const mark = Config.setPassingMark($('#passmark-input').value);
    logSuccess(`Passing mark changed to ${mark}%.`);
    showToast(`Passing mark is now ${mark}%.`, 'success');
    renderAll();
  } catch (error) {
    showToast(error.message, 'error');
    renderSidebar();
  }
}

function init() {
  $('#side-version').textContent = Config.get('version');

  // Navigation
  window.addEventListener('hashchange', () => showView(location.hash.slice(1)));

  // Forms and buttons
  $('#register-form').addEventListener('submit', handleRegisterSubmit);
  $('#passmark-form').addEventListener('submit', handlePassMarkSubmit);
  $('#register-form').addEventListener('reset', () => { $('#form-error').textContent = ''; });
  $$('[data-action="process-all"]').forEach((button) => button.addEventListener('click', processAll));
  $('#btn-reset').addEventListener('click', resetDemoData);
  $('#btn-print').addEventListener('click', () => window.print());
  $('#btn-console').addEventListener('click', printReportToConsole);
  $('#btn-clear-log').addEventListener('click', () => { activityLog.entries.length = 0; renderActivity(); });
  $('#btn-run-tests').addEventListener('click', runTests);

  // Students table: one listener handles every "Process" button (event delegation)
  $('#students-body').addEventListener('click', (event) => {
    const button = event.target.closest('[data-process]');
    if (button) processById(button.dataset.process);
  });

  // Search, filters and sorting
  ['#student-search', '#course-filter', '#status-filter', '#sort-select']
    .forEach((selector) => $(selector).addEventListener('input', renderStudents));

  // Lab demos: each button's data-demo names a function stored in the `demos` object
  $$('[data-demo]').forEach((button) => {
    const name = button.dataset.demo;
    const out = createOutputWriter($(`#out-${name}`));
    button.addEventListener('click', () => demos[name](out));
  });

  loadDemoStudents();
  showView(location.hash.slice(1));
  renderAll();
}

init();
