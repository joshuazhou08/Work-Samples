# Grotifer Satellite Project

At Berkeley’s Space Sciences Lab, we are demonstrating controllability of a satellite under a constant steady-state torque from orthogonal rotating booms. These booms enable 3D sensor measurements in space.

**My Contributions**

- Attitude control, actuator/sensor interfaces, logging system, and core algorithms
- Heavy use of Eigen for linear algebra

**Key Points**

- Modular architecture: estimation, control, actuators, sensors, and logging sit behind narrow, well-defined interfaces
- Abstract interfaces: real hardware and simulations swap without touching control logic
- Real-time logging: lock-free ring buffer with a dedicated logging thread to keep control-loop timing deterministic
- Attitude determination math: sun-sensor + inclinometer TRIAD method documented in `/docs`

# CalTutors

This is my side project that I am especially proud of. It is a full tutoring platform powering 100+ students and 40+ tutors with a six-figure annual revenue codebase (Go + Django backend, Next.js frontend).

**Operational Reality**

- Live production system with continuous fixes and improvements under real constraints
- Regular work on billing edge cases, background workers, refactoring, and real-user behavior

**Key Points**

- Organization: folders and modules structured for clarity and scalability
- Clean code & modularity: Go services separate business logic from infrastructure; Django follows models/serializers/views
- Testing: unit and integration coverage for payments, rates, and scheduling
- Database design: relational schema for clients, tutors, sessions, payments, credits, and rates to avoid redundant state
- Billing & tracking: Stripe-backed pipeline with dynamic rates, credit handling, and autopay
- Use of AI: helpful for boilerplate; architecture, design, and core logic are my own

Live at: caltutors.org (deployed on Railway and Vercel)
