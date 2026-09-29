---
title: QAOA Space Pathfinding
summary: Can a quantum algorithm find a better spacecraft route through an asteroid and debris field than classical planners?
field: Quantum computing · Space
status: In progress
question: How do QAOA's trajectory quality, valid-trajectory rate and cost scale with grid size, time horizon, hazard density and circuit depth, and how big is the gap to classical planners?
updated: 29 Sep 2026
order: 1
stack: [Python, Qiskit, OR-Tools]
phases:
  - { title: Learn the basics and survey prior work, state: done }
  - { title: Problem model and classical baselines, state: now }
  - { title: QAOA solver, state: next }
  - { title: Benchmark study and paper, state: next }
  - { title: Visualizer and polish, state: next }
links:
  - { label: Illustrated primer, href: 'https://cypher-ravi.github.io/qaoa-space-pathfinding/' }
  - { label: Repository, href: 'https://github.com/cypher-ravi/qaoa-space-pathfinding' }
  - { label: Journey log, href: 'https://github.com/cypher-ravi/qaoa-space-pathfinding/blob/main/docs/JOURNEY.md' }
---

## The problem

A spacecraft has to get from a start point to a goal. The route has to do two things at once:

- **Save fuel.** The spacecraft has momentum, so coasting is free, but every change of speed or direction (a burn) costs fuel, measured as Δv.
- **Stay safe.** It must never come near an asteroid or a piece of debris, even though they move.

## How I model it

I use a *state lattice*: a grid of positions and velocities at each time step. From each state the spacecraft either coasts or fires a small burn, which fixes where it will be next. Any state that overlaps a hazard at that moment is removed. A trajectory is a path through this lattice, and the best one is the collision-free path with the lowest total Δv.

This captures momentum (you can't turn instantly) and moving hazards in a single graph, so classical planners and the quantum solver can attack exactly the same problem.

## What gets compared

- **Classical:** Dijkstra and A* over the state lattice, an exact ILP formulation, and simulated annealing on the same QUBO.
- **Quantum:** QAOA in Qiskit on the problem written as a QUBO, with one qubit per (time step, state), run on a simulator. One small run on real IBM hardware is a stretch goal.

For each solver I measure trajectory cost (total Δv), how often the quantum solver returns a valid collision-free trajectory, and how runtime grows with grid size, time steps and the number of hazards.

## What I've learned so far

- QAOA on small routing problems is well studied, and it doesn't beat good classical methods at sizes a simulator can handle. A 2026 comparison topped out at 7 cities and lost to simulated annealing.
- Space work so far uses D-Wave quantum annealing for fuel-optimal trajectories, not gate-based QAOA, and doesn't include obstacle avoidance.
- Quantum path-planning papers use toy grids with static obstacles and no momentum.

That leaves a clear gap: an open, reproducible benchmark of QAOA on a moving hazard field with realistic Δv costs. I expect no quantum advantage at these sizes and will report that honestly. The value is a careful scaling study and a clear view of where the gap is.

## Decisions

**0001 · Reframe the research question.** The project started as "choose the order to visit asteroids" (a travelling-salesman problem), then became a flat grid path. It's now the state-lattice trajectory problem above, because that is what navigating a real debris field needs. The simulator limit of about 25 to 30 qubits keeps quantum scenarios tiny, so a side-by-side visualizer of every solver's path matters as much as the numbers.

## Follow along

The illustrated primer explains every concept from scratch for software engineers: optimization, classical planners, QUBO, qubits, QAOA and what "quantum advantage" really means. The journey log records what I did, learned and decided, with dates.
