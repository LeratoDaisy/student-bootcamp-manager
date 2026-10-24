# Student Bootcamp Manager
## Project Description

Student Bootcamp Manager is a browser application for running a small coding bootcamp. It registers students, stores their course and marks, calculates averages, decides PASS or FAIL against a configurable passing mark, generates unique student IDs, processes students with a simulated delay, and produces a final class report.

It was built for JavaScript Essentials 2 – Module 4 to demonstrate advanced JavaScript functions, `this`, generators and asynchronous programming.

## Features

- Register students with a name, course and any number of marks
- Default course when none is supplied
- Automatic unique student IDs (`STU-001`, `STU-002` and so on)
- Average, PASS/FAIL status and a configurable passing mark (default 50)
- Asynchronous student processing with a delay, one at a time or the whole class
- Final report with student details and class totals (total, processed, passed, failed)
- Print the report, or log it to the browser console
- Search, course filter, status filter and sorting on the Students screen
- Dashboard with class average, top performer, highest and lowest marks
- Live activity log that shows the order messages happen in
- Module 4 lab: run each concept live, plus a set of normal and edge-case tests

## Technologies

- HTML5
- CSS3
- JavaScript 
- Browser console

## How to Run

1. Download or clone the project so that `index.html`, `style.css` and `app.js` are in the same folder.
2. Open `index.html` in any modern browser (Chrome, Edge, Firefox or Safari). No server or installation is needed.

Six demo students are loaded at start-up. Use Reset demo data on the Students screen to restore them.

## Challenges

1. **Losing `this` when a method is passed around.** When I stored `activityLog.add` in a variable and called it, `this` was no longer the log object and the call failed.
2. **Making sure messages appear in a sensible order with asynchronous code.** The "Finished" message comes from a timer, so it appears after lines written later in the code, which was confusing at first.
3. **Bad input.** Marks such as `abc`, `150` or an empty list, and a name that was not text, could break the average or the report.

## Solutions

1. I used `bind()` to create `logInfo`, `logSuccess` and `logError`. Each one has `this` fixed to `activityLog` and its message type preset, so they can be called from anywhere, including inside callbacks.
2. I added an activity log that numbers every message in the order it happens, and a lab demo that shows how `setTimeout` lets the rest of the code run first. I can explain why the "processing started" line appears before the "finished" line.
3. I validate input in `createStudent` and `validateMarks`, which throw clear errors, and `calculateAverage` returns `null` when there are no marks so the status becomes `N/A` instead of a wrong answer. The Module 4 lab runs tests for every normal and edge case.

## Project Files

- `index.html` – page structure and screens
- `style.css` – design and layout
- `app.js` – all application logic, commented by concept
