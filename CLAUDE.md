# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Business Agent Lab is a course project for building an app with agents. The goal, from `README.md`:

> 대학생이 시간표, 과제, 시험 일정과 개인적인 일상을 기록할 수 있는 다이어리 웹앱

(A diary web app where university students can record their class timetable, assignments, exam schedules, and personal daily life.)

## Current state

- `week-05/`: course exercises (Python).
- `pt-app/`: a separate project, a web prototype of a PT trainer's record app (vanilla JS). Edit `pt-app/src/`, then run `sh pt-app/build.sh` to regenerate `pt-app/index.html`. Test with `node pt-app/test/smoke.js` (Playwright). Member data is the trainer's real notebook records, used with the members' permission; members appear only as surname+00 codes (이00_1, 이00_2, 이00_3, 김00, 정00, 최00). Never put real member names in this repository. See `pt-app/README.md`.

The diary web app itself has no tech stack, build tooling, tests, or source code yet. When the stack is chosen, update this file with the build, lint, and test commands (including how to run a single test) and a short overview of the architecture.

## Language

The README and project goal are written in Korean. Keep user-facing app text consistent with that unless told otherwise.
