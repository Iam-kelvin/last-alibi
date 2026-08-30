import { assertValidCase } from '@/game/case-validation';
import type {
  CaseAnswer,
  CaseDefinition,
  CaseHint,
  CaseType,
  Difficulty,
  Evidence,
  TimelineEvent,
} from '@/types/game';

interface PersonInput {
  id: string;
  name: string;
  role: string;
  description: string;
  statement: string;
  statementTitle?: string;
}

interface CuratedInput {
  id: string;
  chapterId: string;
  title: string;
  location: string;
  difficulty: Difficulty;
  type: CaseType;
  introduction: string;
  objective: string;
  decisionPrompt: string;
  people: PersonInput[];
  evidence: Evidence[];
  timeline?: TimelineEvent[];
  answer: CaseAnswer;
  explanation: string;
  contradiction: string;
  hints: CaseHint[];
  tags: string[];
  estimatedSeconds?: number;
}

const ACCENTS = ['#B85C52', '#557C78', '#9A7B4F', '#665A8E', '#7B684E'];

function curated(input: CuratedInput): CaseDefinition {
  return assertValidCase({
    id: input.id,
    version: 1,
    source: 'curated',
    title: input.title,
    location: input.location,
    chapterId: input.chapterId,
    difficulty: input.difficulty,
    type: input.type,
    introduction: input.introduction,
    objective: input.objective,
    decisionPrompt: input.decisionPrompt,
    suspects: input.people.map((person, index) => ({
      id: person.id,
      name: person.name,
      role: person.role,
      description: person.description,
      accent: ACCENTS[index % ACCENTS.length]!,
    })),
    statements: input.people.map((person) => ({
      id: `${person.id}-statement`,
      suspectId: person.id,
      title: person.statementTitle ?? `${person.name}'s statement`,
      text: person.statement,
    })),
    evidence: input.evidence,
    timeline: input.timeline ?? [],
    answer: input.answer,
    explanation: input.explanation,
    contradiction: input.contradiction,
    hints: input.hints,
    tags: input.tags,
    estimatedSeconds: input.estimatedSeconds ?? 180,
    solutionCandidateIds: [input.answer.targetId],
  });
}

export const CURATED_CASES: CaseDefinition[] = [
  curated({
    id: 'sc-vanished-violin', chapterId: 'small-crimes', title: 'The Vanished Violin', location: 'Bellweather Music Hall', difficulty: 'Beginner', type: 'Liar',
    introduction: 'A violin disappeared from the greenroom between the final rehearsal and curtain call. Only three people entered the corridor.',
    objective: 'Find the one statement that cannot agree with the records.', decisionPrompt: 'Which statement is false?',
    people: [
      { id: 'marta', name: 'Marta Vale', role: 'Soloist', description: 'Protective of the borrowed instrument.', statement: 'I left my red coat at the desk at 18:40, then went straight onstage. I never returned to the greenroom corridor.' },
      { id: 'owen', name: 'Owen Pike', role: 'Stagehand', description: 'Moved music stands before the show.', statement: 'I carried stands past the greenroom at 18:45. The violin case was still on the chair.' },
      { id: 'lena', name: 'Lena Cho', role: 'Usher', description: 'Managed the lobby coat desk.', statement: 'I stayed at the coat desk until the house lights dimmed at 18:55.' },
    ],
    evidence: [
      { id: 'coat-log', title: 'Coat desk ticket', type: 'record', description: 'Marta checked in a blue coat at 18:40. No red coat was accepted that evening.' },
      { id: 'stage-photo', title: 'Rehearsal photo', type: 'photo', description: 'A 18:44 hallway photo shows the violin case on its chair behind Owen.' },
      { id: 'usher-log', title: 'Lobby rota', type: 'record', description: 'Lena signed the desk sheet at 18:30 and 18:56.' },
    ],
    timeline: [
      { id: 'violin-rehearsal', time: '18:35', title: 'Rehearsal ends', description: 'The violin is placed in its case.' },
      { id: 'violin-photo', time: '18:44', title: 'Hallway photo', description: 'The closed case is visible.' },
      { id: 'violin-missing', time: '18:52', title: 'Case found empty', description: 'The conductor raises the alarm.' },
    ],
    answer: { kind: 'statement', targetId: 'marta-statement', label: "Marta's statement" },
    explanation: "Marta's statement is the lie. The coat record is precise and records a blue coat, while her claim depends on leaving a red coat. Owen's timing is backed by the photo, and Lena's by the signed rota.",
    contradiction: 'Marta described a red coat that the coat desk never received.',
    hints: [
      { id: 'violin-h1', text: 'Compare each statement with a written record.', focusId: 'coat-log' },
      { id: 'violin-h2', text: 'One person gives an unnecessary color detail.', focusId: 'marta-statement' },
      { id: 'violin-h3', text: 'The coat ticket and Marta disagree about the same object.', focusId: 'coat-log' },
    ], tags: ['objects', 'records', 'tutorial'],
  }),
  curated({
    id: 'sc-clockwork-tip', chapterId: 'small-crimes', title: 'The Clockwork Tip Jar', location: 'Copper Cup Cafe', difficulty: 'Beginner', type: 'Broken Alibi',
    introduction: 'The cafe tip jar vanished during a seven-minute kitchen alarm. Three staff members explain where they were.',
    objective: 'Identify the timeline that cannot fit the available minutes.', decisionPrompt: 'Whose alibi is impossible?',
    people: [
      { id: 'nia', name: 'Nia Hart', role: 'Barista', description: 'Closed the front counter.', statement: 'I counted the pastry shelf in the stockroom from 20:01 until the alarm stopped.' },
      { id: 'cal', name: 'Cal Moreno', role: 'Courier', description: 'Arrived with the last milk delivery.', statement: 'At 20:02 I walked to the pharmacy, bought plasters, and was back before 20:08.' },
      { id: 'dev', name: 'Dev Arun', role: 'Cook', description: 'Responded to the kitchen alarm.', statement: 'I reset the kitchen alarm and stayed beside its panel.' },
    ],
    evidence: [
      { id: 'pharmacy-distance', title: 'Street map', type: 'map', description: 'The pharmacy is a six-minute walk from the cafe each way.' },
      { id: 'stock-scan', title: 'Stock scanner', type: 'record', description: 'Nia scanned pastries at 20:02, 20:04, and 20:07.' },
      { id: 'alarm-log', title: 'Alarm panel', type: 'record', description: 'Dev entered his code at 20:01 and 20:08.' },
    ],
    timeline: [
      { id: 'tip-alarm', time: '20:01', title: 'Kitchen alarm begins', description: 'The counter is left unattended.' },
      { id: 'tip-return', time: '20:08', title: 'Alarm cleared', description: 'The team returns to the counter.' },
    ],
    answer: { kind: 'suspect', targetId: 'cal', label: 'Cal Moreno' },
    explanation: 'Cal Moreno cannot walk six minutes each way, make a purchase, and return inside a six-minute window. The scanner and alarm log support the others.',
    contradiction: 'Cal claims a journey of at least twelve walking minutes inside six minutes.',
    hints: [
      { id: 'tip-h1', text: 'Measure the travel, not the purchase.', focusId: 'pharmacy-distance' },
      { id: 'tip-h2', text: "Check Cal's departure and claimed return.", focusId: 'cal-statement' },
      { id: 'tip-h3', text: 'A round trip doubles the map time.', focusId: 'pharmacy-distance' },
    ], tags: ['travel', 'time', 'alibi'], estimatedSeconds: 150,
  }),
  curated({
    id: 'mo-borrowed-brooch', chapterId: 'missing-objects', title: 'The Borrowed Brooch', location: 'Aster Hotel', difficulty: 'Easy', type: 'Impossible Evidence',
    introduction: 'A guest says her antique brooch was stolen after dinner. Most records align, but one submitted clue cannot be genuine.',
    objective: 'Find the evidence item that contradicts the established schedule.', decisionPrompt: 'Which clue is impossible?',
    people: [
      { id: 'iris', name: 'Iris Bell', role: 'Guest', description: 'Reported the missing brooch.', statement: 'I noticed it missing after dessert, just after 22:00.' },
      { id: 'soren', name: 'Soren Reed', role: 'Concierge', description: 'Collected guest valuables.', statement: 'I sealed the valuables box at 21:30 when reception closed.' },
      { id: 'paz', name: 'Paz Dune', role: 'Waiter', description: 'Served the private dinner.', statement: 'Dessert reached the table at 22:03.' },
      { id: 'mina', name: 'Mina Shaw', role: 'Friend', description: 'Found a receipt near the lift.', statement: 'The receipt was lying face up when I found it.' },
    ],
    evidence: [
      { id: 'brooch-box-log', title: 'Valuables box log', type: 'record', description: 'The box was sealed at 21:31 and opened with police present at 22:20.' },
      { id: 'brooch-receipt', title: 'Jeweller receipt', type: 'record', description: 'A receipt claims the hotel jeweller bought the brooch at 21:52.' },
      { id: 'shop-hours', title: 'Hotel directory', type: 'record', description: 'The hotel jeweller closes at 20:00; its register shut at 19:58.' },
      { id: 'dessert-ticket', title: 'Kitchen ticket', type: 'record', description: 'Dessert left the kitchen at 22:01.' },
    ],
    answer: { kind: 'evidence', targetId: 'brooch-receipt', label: 'Jeweller receipt' },
    explanation: 'The Jeweller receipt is fabricated: it is timed nearly two hours after the shop and register closed. The other records can all be true together.',
    contradiction: 'A closed shop could not issue the 21:52 receipt.',
    hints: [
      { id: 'brooch-h1', text: 'Check when each business was able to act.', focusId: 'shop-hours' },
      { id: 'brooch-h2', text: 'One timestamp falls outside operating hours.', focusId: 'brooch-receipt' },
      { id: 'brooch-h3', text: 'Compare the receipt time with the register shutdown.', focusId: 'shop-hours' },
    ], tags: ['receipt', 'objects', 'schedule'], estimatedSeconds: 190,
  }),
  curated({
    id: 'mo-greenhouse-key', chapterId: 'missing-objects', title: 'The Greenhouse Key', location: 'Morrow Botanical House', difficulty: 'Easy', type: 'Missing Detail',
    introduction: 'A brass greenhouse key was taken from a dry office and later found under a fern. Everyone describes their route, but one account omits the trace it should explain.',
    objective: 'Find the person whose account leaves out the decisive detail.', decisionPrompt: 'Whose statement is missing a critical fact?',
    people: [
      { id: 'nora', name: 'Nora Wynn', role: 'Botanist', description: 'Watered the tropical beds.', statement: 'I watered the fern aisle, returned the hose, and went straight to the seed room.' },
      { id: 'eli', name: 'Eli Cross', role: 'Caretaker', description: 'Locked the public doors.', statement: 'I crossed the office once to collect my dry raincoat.' },
      { id: 'tess', name: 'Tess Rami', role: 'Volunteer', description: 'Sorted labels in the archive.', statement: 'I remained in the archive until Nora called me.' },
    ],
    evidence: [
      { id: 'key-soil', title: 'Soil on the key', type: 'object', description: 'The key bears fresh black fern-bed soil and a thumb smear.' },
      { id: 'office-floor', title: 'Office floor', type: 'photo', description: "A single trail of wet soil runs from the fern door to Nora's locker." },
      { id: 'archive-call', title: 'Desk phone log', type: 'record', description: 'Nora called the archive at 17:26; Tess answered.' },
      { id: 'raincoat', title: 'Raincoat', type: 'object', description: "Eli's coat and shoes are dry and carry pale gravel, not black soil." },
    ],
    answer: { kind: 'suspect', targetId: 'nora', label: 'Nora Wynn' },
    explanation: 'Nora Wynn never explains entering the dry office, yet wet fern soil leads from that door to her locker and matches the key. Her route omits the visit that links her to the key.',
    contradiction: "Nora's account skips the office visit recorded by the wet soil trail.",
    hints: [
      { id: 'key-h1', text: 'Follow what moved between rooms.', focusId: 'office-floor' },
      { id: 'key-h2', text: 'One route never mentions the dry office.', focusId: 'nora-statement' },
      { id: 'key-h3', text: 'The soil begins at the fern door and ends at a locker.', focusId: 'office-floor' },
    ], tags: ['soil', 'route', 'omission'],
  }),
  curated({
    id: 'lr-sealed-study', chapterId: 'locked-rooms', title: 'The Sealed Study', location: 'Harrow House', difficulty: 'Normal', type: 'Who Did It?',
    introduction: 'A sealed will disappeared from a study that records every electronic key. Four residents had motives; only one could enter without forcing the lock.',
    objective: 'Use the door and device records to identify the visitor.', decisionPrompt: 'Who entered the study?',
    people: [
      { id: 'leo', name: 'Leo Harrow', role: 'Nephew', description: 'Expected an inheritance change.', statement: 'My card stayed in my wallet. I spent the blackout in the billiard room.' },
      { id: 'ada', name: 'Ada Harrow', role: 'Executor', description: 'Held the spare paper key list.', statement: 'I was on a video call in the library from 21:00 to 21:25.' },
      { id: 'ruth', name: 'Ruth Fen', role: 'Housekeeper', description: 'Closed the upstairs rooms.', statement: 'I locked the study at 20:55 and went down the service stairs.' },
      { id: 'omar', name: 'Omar Venn', role: 'Solicitor', description: 'Drafted the will.', statement: 'I waited in the drawing room for Ada.' },
    ],
    evidence: [
      { id: 'study-access', title: 'Study access log', type: 'record', description: "Leo's card opened the study at 21:12. No exit swipe is required." },
      { id: 'billiard-sensor', title: 'Billiard sensor', type: 'record', description: 'The lights turned off at 21:06 and detected no motion until 21:29.' },
      { id: 'ada-call', title: 'Video call history', type: 'record', description: 'Ada appears continuously on a 24-minute call begun at 21:01.' },
      { id: 'service-camera', title: 'Service camera', type: 'photo', description: 'Ruth descends the service stairs at 20:57.' },
      { id: 'drawing-witness', title: 'Guest statement', type: 'witness', description: 'Two guests spoke with Omar in the drawing room at 21:10 and 21:18.' },
    ],
    timeline: [
      { id: 'study-locked', time: '20:55', title: 'Study locked', description: 'Ruth tests the handle.' },
      { id: 'study-entry', time: '21:12', title: 'Card entry', description: "Leo's assigned card opens the lock." },
      { id: 'study-discovery', time: '21:30', title: 'Will missing', description: 'Ada opens the study with her card.' },
    ],
    answer: { kind: 'suspect', targetId: 'leo', label: 'Leo Harrow' },
    explanation: "Leo Harrow is uniquely identified by his card at 21:12, and the billiard room was dark and empty during his claimed alibi. Every other person's location has independent support.",
    contradiction: "Leo's card opened the study while his claimed room showed no activity.",
    hints: [
      { id: 'study-h1', text: 'Start with the lock, then test the named alibi.', focusId: 'study-access' },
      { id: 'study-h2', text: 'One card owner claims to be in an empty room.', focusId: 'billiard-sensor' },
      { id: 'study-h3', text: "The 21:12 swipe and Leo's alibi cannot both be innocent.", focusId: 'study-entry' },
    ], tags: ['access', 'locked-room', 'devices'], estimatedSeconds: 230,
  }),
  curated({
    id: 'lr-gallery-blackout', chapterId: 'locked-rooms', title: 'Blackout at Gallery Nine', location: 'Gallery Nine', difficulty: 'Normal', type: 'Timeline',
    introduction: 'A miniature painting vanished during a controlled blackout. The security report contains one event placed at a time when its system could not operate.',
    objective: 'Identify the event recorded in the impossible position.', decisionPrompt: 'Which timeline event cannot be correct?',
    people: [
      { id: 'yara', name: 'Yara Moss', role: 'Curator', description: 'Ran the lighting test.', statement: 'I cut the gallery circuit at exactly 19:10 and restored it five minutes later.' },
      { id: 'ben', name: 'Ben Holt', role: 'Guard', description: 'Watched the only public door.', statement: 'The magnetic door stayed locked for the whole test.' },
      { id: 'emi', name: 'Emi Sol', role: 'Technician', description: 'Monitored the backup console.', statement: 'The motion grid has no battery; it rebooted only after power returned.' },
      { id: 'jo', name: 'Jo Pike', role: 'Donor', description: 'Waited in the lit lobby.', statement: 'I heard the reboot chime after the lights came back.' },
    ],
    evidence: [
      { id: 'gallery-circuit', title: 'Circuit controller', type: 'record', description: 'Power off 19:10:00; power restored 19:15:02.' },
      { id: 'grid-manual', title: 'Motion grid manual', type: 'record', description: 'The motion grid has no battery and needs 18 seconds to restart after power returns.' },
      { id: 'door-battery', title: 'Door specification', type: 'record', description: 'The magnetic lock has its own thirty-minute battery.' },
    ],
    timeline: [
      { id: 'gallery-cut', time: '19:10', title: 'Gallery power cut', description: 'Lights and motion grid switch off.' },
      { id: 'gallery-motion', time: '19:13', title: 'Motion grid alert', description: 'Report claims movement beside the miniature.' },
      { id: 'gallery-restore', time: '19:15', title: 'Power restored', description: 'The reboot begins.' },
      { id: 'gallery-ready', time: '19:16', title: 'Motion grid ready', description: 'Console records a successful self-check.' },
    ],
    answer: { kind: 'timeline', targetId: 'gallery-motion', label: 'Motion grid alert' },
    explanation: 'The Motion grid alert at 19:13 cannot exist because the unpowered grid was offline from 19:10 until after its 19:15 reboot. The battery-backed door could remain locked.',
    contradiction: 'The report places a sensor alert inside the period when that sensor had no power.',
    hints: [
      { id: 'gallery-h1', text: 'Separate battery-backed systems from unpowered systems.', focusId: 'grid-manual' },
      { id: 'gallery-h2', text: 'One event claims data from an offline device.', focusId: 'gallery-motion' },
      { id: 'gallery-h3', text: 'The grid could not report movement before 19:15.', focusId: 'gallery-cut' },
    ], tags: ['power', 'timeline', 'sensor'], estimatedSeconds: 220,
  }),
  curated({
    id: 'fa-last-ferry', chapterId: 'false-alibis', title: 'The Last Ferry', location: 'Gannet Pier', difficulty: 'Hard', type: 'Broken Alibi',
    introduction: 'A customs seal was cut at the harbor office at 23:18. Four workers give tight, overlapping alibis around the last ferry.',
    objective: 'Combine the sailing times, walking routes, and scan records.', decisionPrompt: 'Whose alibi breaks?',
    people: [
      { id: 'ines', name: 'Ines Marr', role: 'Ferry clerk', description: 'Closed the west ticket booth.', statement: 'I boarded the 23:05 ferry and stayed aboard until East Quay.' },
      { id: 'quinn', name: 'Quinn Dey', role: 'Dock porter', description: 'Loaded the final freight cage.', statement: 'My 23:09 freight scan was at East Quay, then I walked to the harbor office before 23:18.' },
      { id: 'rao', name: 'Rao Penn', role: 'Inspector', description: 'Signed the intact seal earlier.', statement: 'I was in the north checkpoint with two drivers from 23:00 to 23:25.' },
      { id: 'mae', name: 'Mae Orlo', role: 'Mechanic', description: 'Serviced the ferry engine.', statement: 'I stayed in the engine bay until the ferry docked east.' },
    ],
    evidence: [
      { id: 'ferry-schedule', title: 'Ferry schedule', type: 'record', description: 'The 23:05 departure reaches East Quay at 23:17.' },
      { id: 'freight-scan', title: 'Freight scanner map', type: 'record', description: "Quinn's 23:09 scan came from West Pier, not East Quay." },
      { id: 'walk-map', title: 'Harbor route map', type: 'map', description: 'East Quay to the harbor office takes eleven minutes on foot; West Pier takes four.' },
      { id: 'checkpoint-sheet', title: 'Checkpoint sheet', type: 'record', description: 'Rao and both drivers signed at 23:02 and 23:24.' },
      { id: 'engine-log', title: 'Engine panel', type: 'record', description: "Mae's code adjusted the engine at 23:08 and 23:15." },
    ],
    timeline: [
      { id: 'ferry-leaves', time: '23:05', title: 'Ferry departs west', description: 'Cameras show Ines boarding.' },
      { id: 'seal-scan', time: '23:18', title: 'Seal alarm', description: 'The harbor office records the cut.' },
    ],
    answer: { kind: 'suspect', targetId: 'quinn', label: 'Quinn Dey' },
    explanation: 'Quinn Dey lies about being at East Quay: his 23:09 scan originated at West Pier. From West Pier he had four minutes to reach the office, making his presence possible; his invented East Quay route would not be.',
    contradiction: "Quinn relocates a scanner record to a quay it did not come from.",
    hints: [
      { id: 'ferry-h1', text: 'A timestamp is genuine, but its location is not.', focusId: 'freight-scan' },
      { id: 'ferry-h2', text: "Compare Quinn's words with the scanner map.", focusId: 'quinn-statement' },
      { id: 'ferry-h3', text: 'The scan places Quinn four minutes from the office.', focusId: 'walk-map' },
    ], tags: ['ferry', 'location', 'records'], estimatedSeconds: 260,
  }),
  curated({
    id: 'fa-silent-alarm', chapterId: 'false-alibis', title: 'The Silent Alarm', location: 'Vesper Auction House', difficulty: 'Hard', type: 'Liar',
    introduction: 'A bidder list was photographed while a silent alarm isolated the records room. Exactly one witness lies, and each truthful statement is supported indirectly.',
    objective: 'Test the sensory details against how the alarm actually works.', decisionPrompt: 'Which statement is the lie?',
    people: [
      { id: 'sana', name: 'Sana Veil', role: 'Auctioneer', description: 'Was addressing the main room.', statement: 'The main-room clock read 20:42 when the security shutters lowered.' },
      { id: 'milo', name: 'Milo Gray', role: 'Archivist', description: 'Worked beside the records room.', statement: 'I heard the records-room alarm bell ring, then saw its red light through the glass.' },
      { id: 'faye', name: 'Faye Lin', role: 'Bidder', description: 'Was making a phone payment.', statement: 'My payment call connected just before the shutters dropped.' },
      { id: 'dax', name: 'Dax Cole', role: 'Guard', description: 'Received the alarm on his pager.', statement: 'My pager vibrated at 20:42, and I reached the corridor two minutes later.' },
    ],
    evidence: [
      { id: 'silent-manual', title: 'Alarm manual', type: 'record', description: 'The records alarm has no bell or speaker. It signals by red lamp, pager, and silent control-room alert.' },
      { id: 'shutter-log', title: 'Shutter controller', type: 'record', description: 'Automatic isolation began at 20:42:11.' },
      { id: 'payment-log', title: 'Payment call', type: 'record', description: "Faye's call connected at 20:41:48 and lasted three minutes." },
      { id: 'guard-pager', title: 'Guard pager log', type: 'record', description: "Dax's acknowledgement arrived at 20:42:19." },
    ],
    answer: { kind: 'statement', targetId: 'milo-statement', label: "Milo's statement" },
    explanation: "Milo's statement is the only lie. He could see the red lamp, but he could not hear a bell because the records alarm has no audible hardware. Every other timing matches a record.",
    contradiction: 'Milo claims to hear a device designed with no speaker.',
    hints: [
      { id: 'alarm-h1', text: 'Focus on how each person learned about the alarm.', focusId: 'silent-manual' },
      { id: 'alarm-h2', text: 'One witness describes a sense the device cannot trigger.', focusId: 'milo-statement' },
      { id: 'alarm-h3', text: 'A silent alarm cannot ring a bell.', focusId: 'silent-manual' },
    ], tags: ['alarm', 'sound', 'lie'], estimatedSeconds: 230,
  }),
  curated({
    id: 'mc-rain-at-midnight', chapterId: 'midnight-cases', title: 'Rain at Midnight', location: 'Northlight Station', difficulty: 'Expert', type: 'Impossible Evidence',
    introduction: 'A locked dispatch pouch vanished as a storm crossed the station. One evidence photo was staged at a different time.',
    objective: 'Use weather, surfaces, and station lighting to reject the staged clue.', decisionPrompt: 'Which evidence item is impossible?',
    people: [
      { id: 'aya', name: 'Aya Frost', role: 'Dispatcher', description: 'Last signed the pouch.', statement: 'Rain began while I was logging the 23:48 freight.' },
      { id: 'colm', name: 'Colm Ire', role: 'Driver', description: 'Parked beside platform two.', statement: 'I crossed the yard after midnight; my boots were soaked.' },
      { id: 'ves', name: 'Ves Kade', role: 'Cleaner', description: 'Mopped the waiting room.', statement: 'The platform lamps switched to their blue night setting at 00:00.' },
      { id: 'ren', name: 'Ren Holt', role: 'Photographer', description: 'Submitted a photo of the pouch.', statement: 'I took my platform photo at 00:07, after the rain stopped.' },
    ],
    evidence: [
      { id: 'weather-gauge', title: 'Station rain gauge', type: 'weather', description: 'Rain fell continuously from 23:51 until 00:19.' },
      { id: 'yard-boots', title: "Colm's boots", type: 'object', description: 'Wet grit matches the uncovered yard.' },
      { id: 'night-lamps', title: 'Lamp controller', type: 'record', description: 'Platform lamps changed from amber to blue at 00:00.' },
      { id: 'pouch-photo', title: 'Platform pouch photo', type: 'photo', description: 'Metadata says 00:07. The dry platform glows under amber lamps and casts sharp rain-free shadows.' },
      { id: 'freight-log', title: 'Freight log', type: 'record', description: 'Aya signed at 23:48 and 23:52.' },
    ],
    timeline: [
      { id: 'rain-start', time: '23:51', title: 'Rain begins', description: 'The uncovered platforms get wet.' },
      { id: 'lamp-change', time: '00:00', title: 'Night lamps engage', description: 'Lighting becomes blue.' },
      { id: 'photo-claimed', time: '00:07', title: 'Photo claimed', description: 'Ren submits this capture time.' },
      { id: 'rain-end', time: '00:19', title: 'Rain ends', description: 'Gauge returns to zero.' },
    ],
    answer: { kind: 'evidence', targetId: 'pouch-photo', label: 'Platform pouch photo' },
    explanation: 'The Platform pouch photo cannot be from 00:07: rain was still falling, the platform was wet, and its lamps had already turned blue. The photo shows a dry amber-lit platform.',
    contradiction: 'The photo conflicts independently with both the rain gauge and lamp controller.',
    hints: [
      { id: 'rain-h1', text: 'Test visual evidence against two automatic records.', focusId: 'pouch-photo' },
      { id: 'rain-h2', text: 'At 00:07, consider both weather and light color.', focusId: 'weather-gauge' },
      { id: 'rain-h3', text: 'The platform should be wet and blue-lit.', focusId: 'night-lamps' },
    ], tags: ['weather', 'photo', 'midnight'], estimatedSeconds: 280,
  }),
  curated({
    id: 'mc-last-train', chapterId: 'midnight-cases', title: 'The Last Train North', location: 'Wren Underground', difficulty: 'Expert', type: 'Timeline',
    introduction: 'A courier bag changed hands across two platforms. The station chronology includes one event that violates the fixed train and tunnel sequence.',
    objective: 'Find the event that cannot fit between the gate scans.', decisionPrompt: 'Which timeline event is wrongly placed?',
    people: [
      { id: 'kim', name: 'Kim Orra', role: 'Courier', description: 'Carried the sealed bag in.', statement: 'I entered south gate at 23:54 and boarded the north train.' },
      { id: 'lev', name: 'Lev Snow', role: 'Vendor', description: 'Closed the platform kiosk.', statement: 'I saw Kim on platform south before the 23:57 train arrived.' },
      { id: 'uma', name: 'Uma Day', role: 'Inspector', description: 'Walked the connecting tunnel.', statement: 'The tunnel takes four minutes and locks when the last train departs.' },
      { id: 'bo', name: 'Bo Rusk', role: 'Musician', description: 'Exited by north gate.', statement: 'I used north gate at 00:02, carrying only my violin.' },
    ],
    evidence: [
      { id: 'train-board', title: 'Departure board', type: 'record', description: 'Northbound train: arrives south platform 23:57, arrives north platform 00:01.' },
      { id: 'tunnel-timer', title: 'Tunnel access rule', type: 'record', description: 'Walking between platforms takes at least four minutes. Gate locks engage at 23:58.' },
      { id: 'gate-scans', title: 'Gate scans', type: 'record', description: 'Kim enters south at 23:54; Bo exits north at 00:02.' },
      { id: 'carriage-camera', title: 'Carriage still', type: 'photo', description: 'Kim and the courier bag are aboard at 23:59.' },
    ],
    timeline: [
      { id: 'kim-entry', time: '23:54', title: 'Kim enters south gate', description: 'Courier bag visible.' },
      { id: 'train-arrives', time: '23:57', title: 'Train reaches south platform', description: 'Doors open for forty seconds.' },
      { id: 'bag-tunnel', time: '23:59', title: 'Bag seen in walking tunnel', description: 'Report claims the bag moved on foot toward north.' },
      { id: 'train-north', time: '00:01', title: 'Train reaches north platform', description: 'Passengers alight.' },
      { id: 'bo-exit', time: '00:02', title: 'Bo exits north', description: 'Gate camera records Bo.' },
    ],
    answer: { kind: 'timeline', targetId: 'bag-tunnel', label: 'Bag seen in walking tunnel' },
    explanation: 'The Bag seen in walking tunnel event is impossible: the carriage photo places it on the train at 23:59, and the tunnel had already locked. The train is the only route that reaches north by 00:01.',
    contradiction: 'The same bag cannot be aboard the moving train and in the locked tunnel at 23:59.',
    hints: [
      { id: 'train-h1', text: 'Track the bag, not just its carriers.', focusId: 'carriage-camera' },
      { id: 'train-h2', text: 'One 23:59 event conflicts with a photograph.', focusId: 'bag-tunnel' },
      { id: 'train-h3', text: 'At 23:59 the bag is inside the train.', focusId: 'carriage-camera' },
    ], tags: ['train', 'timeline', 'route'], estimatedSeconds: 290,
  }),
  curated({
    id: 'md-five-minute-window', chapterId: 'master-detectives', title: 'The Five-Minute Window', location: 'Crown Archive', difficulty: 'Master', type: 'Who Did It?',
    introduction: 'A cipher plate vanished from a reading vault during a five-minute systems check. Every suspect has a plausible fragment of an alibi; only one survives all three location records badly enough to act.',
    objective: 'Combine access, elevator, and material traces to identify the thief.', decisionPrompt: 'Who took the cipher plate?',
    people: [
      { id: 'celia', name: 'Celia Roan', role: 'Researcher', description: 'Requested the cipher plate.', statement: 'I was copying shelf B notes at the east desk throughout the check.' },
      { id: 'jon', name: 'Jon Ebb', role: 'Conservator', description: 'Handled the plate that afternoon.', statement: 'I rode the freight elevator down at 16:02 with a crate.' },
      { id: 'farah', name: 'Farah Nix', role: 'Archivist', description: 'Authorized the systems check.', statement: 'I stayed at the control desk watching the vault sensors.' },
      { id: 'wes', name: 'Wes Ord', role: 'Patron', description: 'Used the west reading alcove.', statement: 'I left through the public stair at 16:00 and did not return.' },
      { id: 'tari', name: 'Tari Beck', role: 'Guard', description: 'Patrolled the floor.', statement: 'I passed the vault at 16:03; its door looked shut.' },
    ],
    evidence: [
      { id: 'cipher-window', title: 'Systems check', type: 'record', description: 'Vault item sensors were offline from 16:00 to 16:05; door access remained logged.' },
      { id: 'cipher-door', title: 'Vault door log', type: 'record', description: "Jon's conservator badge opens the vault at 16:01 and the freight lobby at 16:04." },
      { id: 'cipher-elevator', title: 'Freight elevator', type: 'record', description: 'Elevator remained on floor six until called at 16:06. It could not carry Jon at 16:02.' },
      { id: 'cipher-dust', title: 'Crate lining', type: 'object', description: "Jon's crate contains violet velvet fibers matching the cipher plate tray." },
      { id: 'cipher-desk', title: 'Desk autosave', type: 'record', description: "Celia's scans saved at 16:01, 16:03, and 16:05 from the east desk." },
      { id: 'cipher-control', title: 'Control capture', type: 'photo', description: 'Farah remains visible at the console for the full check.' },
      { id: 'cipher-stair', title: 'Stair counter', type: 'record', description: 'Wes exits at 16:00; the stair records no return.' },
    ],
    timeline: [
      { id: 'cipher-offline', time: '16:00', title: 'Item sensors offline', description: 'The planned check begins.' },
      { id: 'cipher-entry', time: '16:01', title: 'Vault opens', description: "Jon's badge is accepted." },
      { id: 'cipher-patrol', time: '16:03', title: 'Guard passes vault', description: 'Door appears closed.' },
      { id: 'cipher-lobby', time: '16:04', title: 'Freight lobby opens', description: "Jon's badge is accepted again." },
      { id: 'cipher-online', time: '16:05', title: 'Item sensors online', description: 'The plate is reported missing.' },
    ],
    answer: { kind: 'suspect', targetId: 'jon', label: 'Jon Ebb' },
    explanation: 'Jon Ebb is the only possible thief. His badge crosses the vault-to-freight route inside the blind window, the elevator disproves his claimed descent, and his crate carries fibers from the plate tray.',
    contradiction: "Jon's elevator alibi is impossible, while his badge and crate link him directly to the plate.",
    hints: [
      { id: 'cipher-h1', text: 'Find an alibi disproved by a machine independent of the door.', focusId: 'cipher-elevator' },
      { id: 'cipher-h2', text: 'One badge crosses both ends of the removal route.', focusId: 'cipher-door' },
      { id: 'cipher-h3', text: 'Jon could not ride the elevator, and his crate touched the tray.', focusId: 'cipher-dust' },
    ], tags: ['access', 'fibers', 'master'], estimatedSeconds: 300,
  }),
  curated({
    id: 'md-observatory-silence', chapterId: 'master-detectives', title: 'The Observatory Silence', location: 'Halcyon Observatory', difficulty: 'Master', type: 'Missing Detail',
    introduction: 'A glass stellar map cracked during a remote observation. Five experts give accurate-sounding accounts, but one omits a required action that left two independent traces.',
    objective: 'Identify the account whose omission reveals the answer.', decisionPrompt: 'Whose account hides the critical action?',
    people: [
      { id: 'eira', name: 'Eira Moon', role: 'Director', description: 'Authorized the observation.', statement: 'I stayed in the control room approving each telescope command.' },
      { id: 'sol', name: 'Sol Kent', role: 'Optics lead', description: 'Calibrated the map projector.', statement: 'I finished calibration at 22:36, put away my tools, and went to the south balcony.' },
      { id: 'marc', name: 'Marc Vey', role: 'Engineer', description: 'Monitored the dome motors.', statement: 'I reset motor two at 22:40 and remained in the plant room.' },
      { id: 'lu', name: 'Lu Sen', role: 'Observer', description: 'Logged the sky conditions.', statement: 'I recorded cloud cover from the east console every two minutes.' },
      { id: 'orin', name: 'Orin Page', role: 'Guest', description: 'Watched through the public window.', statement: 'I never entered the sealed instrument floor.' },
    ],
    evidence: [
      { id: 'obs-command', title: 'Control commands', type: 'record', description: "Eira's approvals appear every minute from 22:35 to 22:44." },
      { id: 'obs-projector', title: 'Projector safety rule', type: 'record', description: 'After calibration, the map requires a physical lens cap before the dome rotates.' },
      { id: 'obs-cap', title: 'Lens cap', type: 'object', description: "The cap is found beside Sol's tool cabinet, dusted with fresh glass powder." },
      { id: 'obs-balcony', title: 'Balcony pressure pad', type: 'record', description: 'No one steps onto the south balcony between 22:30 and 22:48.' },
      { id: 'obs-motor', title: 'Motor console', type: 'record', description: "Marc's reset and presence checks run from 22:39 to 22:45." },
      { id: 'obs-cloud', title: 'Sky log', type: 'record', description: "Lu's east-console entries occur at 22:36, 22:38, 22:40, 22:42, and 22:44." },
      { id: 'obs-guest', title: 'Instrument door', type: 'record', description: "Orin's guest badge never opens the sealed floor." },
    ],
    timeline: [
      { id: 'obs-calibration', time: '22:36', title: 'Calibration completes', description: 'The projector remains uncapped.' },
      { id: 'obs-rotation', time: '22:41', title: 'Dome rotates', description: 'The exposed glass map cracks.' },
      { id: 'obs-alarm', time: '22:42', title: 'Optics alarm', description: 'Staff are notified.' },
    ],
    answer: { kind: 'suspect', targetId: 'sol', label: 'Sol Kent' },
    explanation: 'Sol Kent omits the required lens-cap step and falsely claims the south balcony, which recorded no visitor. The glass-dusted cap beside his cabinet shows he handled it only after the exposed map cracked.',
    contradiction: "Sol omits capping the lens and names a destination that recorded nobody.",
    hints: [
      { id: 'obs-h1', text: 'Look for a required step, not merely a stated location.', focusId: 'obs-projector' },
      { id: 'obs-h2', text: "Sol's route and shutdown procedure are both incomplete.", focusId: 'sol-statement' },
      { id: 'obs-h3', text: 'The cap should have been fitted before rotation, but carries crack dust.', focusId: 'obs-cap' },
    ], tags: ['omission', 'procedure', 'master'], estimatedSeconds: 300,
  }),
];

export const CURATED_CASE_MAP = Object.fromEntries(
  CURATED_CASES.map((caseFile) => [caseFile.id, caseFile]),
) as Record<string, CaseDefinition>;
