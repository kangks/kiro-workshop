---
inclusion: always
---

# Test-Driven Development Standards

This workspace follows a test-driven development approach to complement Kiro's spec-driven workflow.

## Rules

- Before implementing any feature or fixing any bug, write failing tests first.
- Tests must cover the expected behavior described in the spec task before writing implementation code.
- Follow the Red-Green-Refactor cycle:
  1. Red: Write a failing test that defines the desired behavior.
  2. Green: Write the minimal code to make the test pass.
  3. Refactor: Clean up the code while keeping tests green.
- Every spec task should have corresponding test coverage before it is marked complete.
- Run tests after each implementation change to confirm nothing is broken.
- Do not skip writing tests even for small changes.
