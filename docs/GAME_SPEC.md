# The Last Alibi — Game Specification

## Game

**Working Name:** The Last Alibi

A casual deduction mystery game where players study a short case, inspect clues, compare statements, and identify the person, statement, or timeline detail that cannot be true.

The game should feel like solving a compact detective case in a few minutes.

## Core Idea

Each case presents:

* A short scenario
* 3–5 suspects or people
* Statements or alibis
* Evidence
* A single logically correct answer

The player must identify the contradiction.

## Core Gameplay

Each case follows this loop:

1. Read the case introduction.
2. Review suspects and their statements.
3. Inspect available evidence.
4. Compare timelines, objects, locations, and claims.
5. Select the person or statement that is impossible.
6. Confirm the answer.
7. Reveal the explanation.

Cases should usually take **2–5 minutes**.

## Case Types

Support several mystery structures.

### Liar

Exactly one person is lying.

### Broken Alibi

One person's timeline cannot be true.

### Impossible Evidence

One clue contradicts the rest of the case.

### Who Did It?

Evidence uniquely identifies one suspect.

### Timeline

The player determines which event happened incorrectly or in the wrong order.

### Missing Detail

One statement leaves out a critical fact that exposes the answer.

## Evidence Types

Cases may contain:

* Written statements
* Times
* Locations
* Receipts
* Messages
* Photos represented by illustrations
* Objects
* Weather
* Footprints
* Door/access records
* Phone logs
* Witness statements
* Maps
* Simple diagrams

Avoid requiring obscure real-world knowledge unless the information is provided inside the case.

## Win / Lose Rules

The player wins by selecting the correct conclusion.

Players may make an incorrect guess.

Incorrect guesses:

* reduce score
* may reveal a small hint
* should not permanently block the case

After solving, reveal:

* correct answer
* full reasoning
* key contradiction
* score
* hints used
* time taken

## Scoring

Base score: **1,000 points**

Reduce score for:

* wrong guesses
* hints
* excessive time

Give bonuses for:

* first-try solve
* no hints
* fast solve
* harder cases

Never allow score below zero.

## Difficulty

### Beginner

* 3 suspects
* few clues
* obvious contradiction
* simple timeline

### Easy

* 3–4 suspects
* slightly more clues
* one clear contradiction

### Normal

* 4 suspects
* multiple relevant clues
* some distractors

### Hard

* 4–5 suspects
* more complex timeline
* misleading but valid clues

### Expert

* several interacting clues
* subtle contradiction
* stronger distractors

### Master

* dense but fair cases
* multiple plausible suspects
* solution requires combining several clues

Difficulty must come from deduction, not vague writing.

## Game Modes

### Case Files

Main progression mode.

Cases are grouped into chapters.

Example chapters:

* Small Crimes
* Missing Objects
* Locked Rooms
* False Alibis
* Midnight Cases
* Master Detectives

### Daily Case

One identical mystery for all players each day.

Use:

* date
* fixed seed
* case version

Track:

* score
* completion time
* hints
* first-try solve
* streak

### Endless Cases

Randomly select from unlocked case templates or generated cases.

### Rapid Deduction

Shorter cases with a timer.

Solve as many as possible before time expires.

## Progression

Track:

* XP
* player level
* total cases solved
* first-try solves
* current daily streak
* longest streak
* best Rapid Deduction score
* accuracy
* average solve time
* cases solved by type

Difficulty progression:

**Beginner → Easy → Normal → Hard → Expert → Master**

## Achievements

Include:

* First Case Closed
* Perfect Deduction
* 10 Cases Closed
* 100 Cases Closed
* No Hint Needed
* Seven-Day Streak
* Thirty-Day Streak
* Alibi Breaker
* Timeline Expert
* Evidence Master
* Speed Detective
* Master Case Solved

## Screens

### Home

Show:

* Case Files
* Daily Case
* Endless Cases
* Rapid Deduction
* current streak
* player level
* stats
* settings

### Case Intro

Show:

* title
* location
* short setup
* objective

### Investigation

Main gameplay screen.

Allow the player to inspect:

* suspects
* statements
* evidence
* timeline
* notes

Navigation must be simple.

### Decision

Player chooses:

* suspect
* statement
* clue
* timeline event

depending on case type.

### Results

Show:

* correct answer
* explanation
* contradiction
* score
* XP
* time
* hints used

### Case Archive

Show completed and locked cases.

### Stats

Show player performance.

### Achievements

Show locked and unlocked achievements.

### Settings

Include:

* sound
* music
* haptics
* theme
* reduced motion
* text size
* reset progress
* privacy information

## Case Content System

Cases must be data-driven.

Do not hard-code case logic directly into UI screens.

Each case should define:

* id
* title
* difficulty
* case type
* introduction
* suspects
* statements
* evidence
* timeline if needed
* correct answer
* explanation
* hint sequence
* tags

The game engine should render cases from structured data.

## Case Validation

Every case must have exactly one intended solution.

Validation should check:

* required fields exist
* correct answer exists
* referenced clues exist
* no duplicate IDs
* hint references are valid
* timeline values are valid
* explanation matches the correct answer

For generated cases, validation must also confirm:

* only one valid solution exists
* evidence does not contradict itself accidentally
* distractors remain logically possible
* the answer can be derived from information shown to the player

Reject invalid generated cases.

## Content Strategy

Use two content types.

### Curated Cases

Hand-authored or carefully reviewed cases.

Use these for:

* Journey progression
* major chapter cases
* featured daily cases

### Generated Cases

Use structured templates for replayable modes.

Generated cases must rely on deterministic logic and validation.

Do not use unrestricted AI-generated mysteries during gameplay.

## Seeded Generation

Generated cases must support deterministic seeds.

Use for:

* Daily Case
* Endless
* testing
* bug reproduction

Same:

`seed + version`

must generate the same case.

## Hints

Hints should escalate gradually.

Example:

### Hint 1

Point toward the relevant evidence category.

### Hint 2

Highlight a suspicious statement.

### Hint 3

Point toward the contradiction without revealing the answer.

Hints reduce score.

## Notes Feature

Allow players to mark or highlight:

* suspicious statements
* important evidence
* timeline events

Keep this lightweight.

Do not require typing long notes.

## Offline Support

Core gameplay must work offline.

Store locally:

* progress
* XP
* achievements
* streaks
* completed cases
* unlocked chapters
* settings
* statistics

No account is required.

## Online Features

Do not require a backend initially.

Prepare for later:

* cloud saves
* leaderboards
* shared Daily Case rankings
* remote case packs
* community case submissions

## Monetization

Prepare hooks for:

* rewarded ad for a hint
* limited interstitials between cases
* one-time Remove Ads purchase
* optional future premium case packs

Never interrupt an active investigation with an ad.

## Visual Direction

Style:

**Dark, polished, atmospheric detective mystery.**

Use:

* noir-inspired presentation
* evidence cards
* file folders
* subtle paper textures
* timelines
* suspect portraits or stylized avatars
* dim but readable environments
* restrained animation

The design should feel mysterious, not horror-focused.

## Sound & Haptics

Include:

* evidence tap sounds
* subtle ambient music
* clue discovery sound
* correct solve sound
* incorrect guess sound
* achievement sound
* light haptic feedback

All configurable.

## Accessibility

Support:

* readable text sizes
* strong contrast
* large tap targets
* reduced motion
* clear labels
* responsive layouts
* screen-reader labels where practical

Do not hide essential information inside color alone.

## Daily Challenge

Generate or select one identical case for every player each calendar day.

Requirements:

* same date = same case
* deterministic seed
* works offline when already bundled/generated
* one official score per day
* replay allowed without replacing first official result
* track streak
* track first-try solve
* track time and hints

## Analytics

Track:

* app_opened
* tutorial_started
* tutorial_completed
* case_started
* case_completed
* case_failed
* wrong_guess
* hint_used
* evidence_opened
* suspect_selected
* daily_started
* daily_completed
* rapid_started
* rapid_completed
* achievement_unlocked

Do not collect sensitive personal information.

## Testing

Test:

* case parser
* case validation
* correct answer handling
* hint sequence
* scoring
* persistence
* seeded generation
* daily case selection
* progression
* achievements
* generated case uniqueness
* generated case solvability

## Definition of Done

This is not a prototype.

The game is complete when:

* Case Files works
* Daily Case works
* Endless Cases works
* Rapid Deduction works
* curated cases work
* generated cases work
* case validation works
* hints work
* notes/highlighting works
* progression saves
* achievements work
* stats work
* settings work
* offline play works
* Android build works
* responsive web works
* PWA works
* tests pass
* TypeScript passes
* lint passes
* README explains setup, testing, build, and deployment
* no core functionality remains as placeholders or TODOs
